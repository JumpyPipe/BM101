import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function daysAgo(d: number, hour = 9) {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function main() {
  await prisma.chatMessage.deleteMany();
  await prisma.insight.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.growthLog.deleteMany();
  await prisma.diaperLog.deleteMany();
  await prisma.sleepLog.deleteMany();
  await prisma.feedingLog.deleteMany();
  await prisma.baby.deleteMany();
  await prisma.caregiver.deleteMany();

  const baby = await prisma.baby.create({
    data: {
      name: "Aanya",
      dob: daysAgo(140),
      sex: "FEMALE",
      notes: "First baby. No known allergies.",
    },
  });

  await prisma.caregiver.createMany({
    data: [
      { name: "Akash", role: "Parent" },
      { name: "Partner", role: "Parent" },
      { name: "Grandma", role: "Family" },
    ],
  });

  await prisma.feedingLog.createMany({
    data: [
      { babyId: baby.id, type: "BOTTLE", amountMl: 120, startedAt: hoursAgo(1) },
      { babyId: baby.id, type: "BREAST", side: "LEFT", durationMin: 15, startedAt: hoursAgo(4) },
      { babyId: baby.id, type: "BREAST", side: "RIGHT", durationMin: 12, startedAt: hoursAgo(7) },
      { babyId: baby.id, type: "BOTTLE", amountMl: 100, startedAt: hoursAgo(10) },
      { babyId: baby.id, type: "SOLID", amountMl: 40, startedAt: hoursAgo(13), note: "Pureed sweet potato" },
      { babyId: baby.id, type: "BOTTLE", amountMl: 110, startedAt: hoursAgo(22) },
      { babyId: baby.id, type: "BREAST", side: "BOTH", durationMin: 20, startedAt: hoursAgo(28) },
    ],
  });

  await prisma.sleepLog.createMany({
    data: [
      { babyId: baby.id, type: "NAP", startedAt: hoursAgo(3), endedAt: hoursAgo(2) },
      { babyId: baby.id, type: "NIGHT", startedAt: hoursAgo(20), endedAt: hoursAgo(11) },
      { babyId: baby.id, type: "NAP", startedAt: hoursAgo(27), endedAt: hoursAgo(25.5) },
      { babyId: baby.id, type: "NIGHT", startedAt: hoursAgo(44), endedAt: hoursAgo(34) },
    ],
  });

  await prisma.diaperLog.createMany({
    data: [
      { babyId: baby.id, type: "WET", occurredAt: hoursAgo(0.5) },
      { babyId: baby.id, type: "DIRTY", occurredAt: hoursAgo(5) },
      { babyId: baby.id, type: "WET", occurredAt: hoursAgo(9) },
      { babyId: baby.id, type: "MIXED", occurredAt: hoursAgo(15) },
      { babyId: baby.id, type: "WET", occurredAt: hoursAgo(21) },
    ],
  });

  await prisma.growthLog.createMany({
    data: [
      { babyId: baby.id, measuredAt: daysAgo(120), weightKg: 4.2, heightCm: 52, headCm: 36.5 },
      { babyId: baby.id, measuredAt: daysAgo(90), weightKg: 5.1, heightCm: 55, headCm: 38 },
      { babyId: baby.id, measuredAt: daysAgo(60), weightKg: 5.9, heightCm: 58, headCm: 39.5 },
      { babyId: baby.id, measuredAt: daysAgo(30), weightKg: 6.5, heightCm: 61, headCm: 40.5 },
      { babyId: baby.id, measuredAt: daysAgo(2), weightKg: 7.1, heightCm: 63, headCm: 41.5 },
    ],
  });

  await prisma.milestone.createMany({
    data: [
      { babyId: baby.id, occurredAt: daysAgo(100), category: "Motor", title: "Rolled over" },
      { babyId: baby.id, occurredAt: daysAgo(60), category: "Social", title: "First real smile" },
      { babyId: baby.id, occurredAt: daysAgo(10), category: "Motor", title: "Sat up unassisted" },
    ],
  });

  console.log(`Seeded baby ${baby.name} (${baby.id}) with sample logs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
