// Simple line-art icons (24×24, inherit currentColor). Hand-picked per life
// event so the interface reads as designed rather than emoji-decorated.

const PATHS = {
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </>
  ),
  home: (
    <>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v10h12V10" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  rings: (
    <>
      <circle cx="9" cy="14" r="5" />
      <circle cx="15" cy="14" r="5" />
      <path d="M9 9l1.5-3h3L15 9" />
    </>
  ),
  child: (
    <>
      <circle cx="12" cy="6" r="2.5" />
      <path d="M12 8.5v6" />
      <path d="M8 11h8" />
      <path d="M9 21l3-4 3 4" />
    </>
  ),
  health: (
    <>
      <path d="M3 12h4l2-5 3 10 2-5h7" />
    </>
  ),
  switch: (
    <>
      <path d="M4 8h13l-3-3" />
      <path d="M20 16H7l3 3" />
    </>
  ),
  palm: (
    <>
      <path d="M12 22V11" />
      <path d="M12 11c-3-3-7-2-8 1 3-1 5 0 6 2" />
      <path d="M12 11c3-3 7-2 8 1-3-1-5 0-6 2" />
      <path d="M12 11c0-4 2-6 5-7-1 3-1 5-2 7" />
      <circle cx="12" cy="10" r="1" />
    </>
  ),
  building: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
      <path d="M10 21v-3h4v3" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 4v5h-5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15V4" />
      <path d="M8 8l4-4 4 4" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </>
  ),
  file: (
    <>
      <path d="M6 2h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
      <path d="M14 2v5h5" />
    </>
  ),
  check: <path d="M4 12l5 5L20 6" />,
}

export default function Icon({ name, size = 24, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name] ?? null}
    </svg>
  )
}
