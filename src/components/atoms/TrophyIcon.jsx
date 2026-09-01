export default function TrophyIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4a3.5 3.5 0 0 0 3.5 3.5" />
      <path d="M17 5h3a3.5 3.5 0 0 1-3.5 3.5" />
      <path d="M12 13v3" />
      <path d="M9 20h6" />
      <path d="M9.5 17h5l.5 3H9l.5-3Z" />
    </svg>
  )
}
