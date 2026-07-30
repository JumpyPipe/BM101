/**
 * The Snug brand mark — a crescent moon. Hand-drawn as two overlapping
 * circles (a white disc, then a cutout circle painted in the same color as
 * whatever sits behind it) rather than a font glyph or a library icon, so it
 * renders identically everywhere (favicon, PWA icon, in-app header) without
 * depending on a specific icon set.
 */
export function SnugMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M15.5 3.5c-4.8 0.7-8.5 4.8-8.5 9.8 0 5.5 4.5 10 10 10 3.2 0 6-1.5 7.9-3.8-1 0.4-2.1 0.6-3.2 0.6-5 0-9-4-9-9 0-3 1.4-5.6 3.6-7.3-0.3-0.1-0.5-0.2-0.8-0.3z"
        fill="currentColor"
      />
      <circle cx="18.5" cy="6" r="1" fill="currentColor" />
      <circle cx="20.5" cy="9.5" r="0.6" fill="currentColor" />
    </svg>
  );
}
