/**
 * علامة شبكة ضفاف الإعلامية — أمواجٌ نهرية متناقصة توحي بالضفاف،
 * بلون الثيم الفيروزي الهادئ لتنسجم مع هوية سَكِينَة دون إزعاج.
 */
export function DheffafMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M5 12.5 Q 11 5.5 16 12.5 T 27 12.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M7 19 Q 12 13.5 16 19 T 25 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M9.5 25 Q 13 20.5 16 25 T 22.5 25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}
