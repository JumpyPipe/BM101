// End-to-end smoke test: walks every page, exercises every form, and flags
// 404s, error boundaries, and console/page errors. Run against a local dev
// server pointed at a disposable database — this creates and deletes real
// records.
//
// Usage: BASE_URL=http://localhost:3000 node scripts/qa-smoke-test.mjs
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
}

async function checkForErrorPage(page, label) {
  const bodyText = await page.locator("body").innerText();
  if (/^404/m.test(bodyText) || bodyText.includes("This page could not be found")) {
    record(`${label}: no 404`, false, "hit a 404 page");
    return false;
  }
  if (bodyText.includes("Application error") || bodyText.includes("Server Error")) {
    record(`${label}: no error boundary`, false, "hit an error boundary");
    return false;
  }
  return true;
}

async function main() {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium",
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`${page.url()} :: ${msg.text()}`);
  });
  page.on("pageerror", (err) => consoleErrors.push(`${page.url()} :: ${err.message}`));

  // --- 0. Sign in first — every other route is behind auth now. Claim a login
  // if this is a fresh/unclaimed database, otherwise sign in with it. ---
  await page.goto(`${BASE_URL}/setup`, { waitUntil: "load" });
  const onSetup = page.url().endsWith("/setup");
  if (onSetup && (await page.locator("select#caregiverId").count()) > 0) {
    await page.selectOption("select#caregiverId", { index: 1 });
    await page.fill("#email", "qa-smoke-test@example.com");
    await page.fill("#password", "qa-smoke-test-password");
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/`, { timeout: 10000 });
    record("auth: claim login via /setup", true);
  } else {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "load" });
    await page.fill("#email", "qa-smoke-test@example.com");
    await page.fill("#password", "qa-smoke-test-password");
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/`, { timeout: 10000 });
    record("auth: sign in via /login", true);
  }

  // --- 1. Every nav destination loads without a 404/error, no loading spinner stuck ---
  const navPages = [
    "/", "/feeding", "/sleep", "/diaper", "/growth", "/milestones",
    "/assistant", "/more", "/babies",
  ];
  for (const path of navPages) {
    await page.goto(`${BASE_URL}${path}`, { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(400);
    const ok = await checkForErrorPage(page, `nav ${path}`);
    if (ok) record(`nav ${path}`, true);
  }

  // --- 2. Bottom nav clicks (real click-through, not direct navigation) ---
  await page.goto(`${BASE_URL}/`, { waitUntil: "load" });
  const bottomNav = page.locator("nav").last();
  for (const label of ["Feeding", "Sleep", "Assistant", "More", "Home"]) {
    await bottomNav.getByRole("link", { name: label, exact: true }).click();
    await page.waitForTimeout(400);
    await checkForErrorPage(page, `bottom-nav click ${label}`);
  }
  record("bottom nav click-through", true);

  // --- 3. Add a baby — full guided flow, including the optional caregiver step ---
  await page.goto(`${BASE_URL}/babies/new`, { waitUntil: "load" });
  await page.fill('input[name="name"]', "QA Test Baby");
  await page.fill('input[name="dob"]', "2026-01-01");
  await page.locator("main form button[type=\"submit\"]").click();
  await page.waitForTimeout(1500);
  const onCaregiverStep = (await page.locator("text=is all set!").count()) > 0;
  record("add-baby step 1 -> step 2 transition", onCaregiverStep, onCaregiverStep ? "" : "did not land on caregiver step");
  if (onCaregiverStep) {
    const skipOk = await checkForErrorPage(page, "add-baby step 2 (before skip)");
    if (skipOk) {
      await page.getByRole("link", { name: "Skip for now" }).click();
      await page.waitForTimeout(1500);
      await checkForErrorPage(page, "add-baby skip -> dashboard");
      const onDashboard = (await page.locator("text=QA Test Baby").count()) > 0;
      record("add-baby skip lands on dashboard with new baby active", onDashboard);
    }
  }

  // --- 4. Add a caregiver directly (the bug that was reported) ---
  await page.goto(`${BASE_URL}/caregivers/new`, { waitUntil: "load" });
  await page.fill('input[name="name"]', "QA Test Caregiver");
  await page.locator("main form button[type=\"submit\"]").click();
  await page.waitForTimeout(1500);
  const caregiverOk = await checkForErrorPage(page, "add caregiver -> redirect target");
  if (caregiverOk) {
    const landedOnBabies = page.url().endsWith("/babies");
    const caregiverListed = (await page.locator("text=QA Test Caregiver").count()) > 0;
    record("add caregiver redirects to /babies and shows up", landedOnBabies && caregiverListed,
      `url=${page.url()} listed=${caregiverListed}`);
  }

  // --- 5. Log a feeding, sleep, diaper, growth, milestone — one full loop each ---
  const trackerForms = [
    { path: "/feeding", fills: {}, submit: "Log feeding" },
    { path: "/sleep", fills: {}, submit: "Log sleep" },
    { path: "/diaper", fills: {}, submit: "Log diaper" },
    { path: "/growth", fills: { weightKg: "5.2" }, submit: "Log measurement" },
    { path: "/milestones", fills: { title: "QA smiled" }, submit: "Log milestone" },
  ];
  for (const { path, fills, submit } of trackerForms) {
    await page.goto(`${BASE_URL}${path}`, { waitUntil: "load" });
    for (const [field, value] of Object.entries(fills)) {
      await page.fill(`[name="${field}"]`, value);
    }
    await page.getByRole("button", { name: submit }).click();
    await page.waitForTimeout(1000);
    await checkForErrorPage(page, `submit ${path}`);
    record(`submit ${path} form`, true);
  }

  // --- 6. Quick note (free text -> parse) — expect graceful AI-not-configured message, not a crash ---
  await page.goto(`${BASE_URL}/`, { waitUntil: "load" });
  await page.fill('input[placeholder="What happened?"]', "wet diaper just now");
  await page.click('button:has-text("Log it")');
  await page.waitForTimeout(3000);
  const quickNoteBody = await page.locator("body").innerText();
  record("quick note fails gracefully (no crash) when AI unconfigured",
    !quickNoteBody.includes("Application error"), "");

  // --- 7. Edit and delete flows ---
  await page.goto(`${BASE_URL}/babies`, { waitUntil: "load" });
  const editLinks = await page.getByRole("link", { name: "Edit" }).all();
  if (editLinks.length > 0) {
    await editLinks[0].click();
    await page.waitForLoadState("load");
    await checkForErrorPage(page, "baby edit page");
    record("baby edit page loads", true);
  }

  console.log(`\n${consoleErrors.length} console/page errors captured:`);
  consoleErrors.slice(0, 20).forEach((e) => console.log("  " + e));

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`);
  if (failed.length > 0) {
    console.log("Failures:");
    failed.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
    process.exit(1);
  }
}

main();
