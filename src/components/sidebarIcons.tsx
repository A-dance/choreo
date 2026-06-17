export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <circle
        cx="11"
        cy="11"
        r="6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        d="M15.5 15.5 19 19"
      />
    </svg>
  );
}

export function StarIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
        d="M12 4.8 14.2 9.5l5.1.7-3.7 3.6.9 5.1L12 16.8 7.5 19l.9-5.1-3.7-3.6 5.1-.7L12 4.8Z"
      />
    </svg>
  );
}

export function FolderIcon({ open = false }: { open?: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden focusable="false">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinejoin="round"
          d="M4.5 8.5V18a1.5 1.5 0 0 0 1.5 1.5h12A1.5 1.5 0 0 0 19.5 18V9.5H11l-1.8-2H6A1.5 1.5 0 0 0 4.5 8.5Z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
        d="M4.5 7.5A1.5 1.5 0 0 1 6 6h4.2l1.8 2H18a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V7.5Z"
      />
    </svg>
  );
}

export function FolderPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
        d="M4.5 7.5A1.5 1.5 0 0 1 6 6h4.2l1.8 2H18a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V7.5Z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        d="M12 10.5v5M9.5 13h5"
      />
    </svg>
  );
}

export function ChevronIcon({ direction }: { direction: "down" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        d={direction === "down" ? "M7.5 10 12 14.5 16.5 10" : "M10 7.5 14.5 12 10 16.5"}
      />
    </svg>
  );
}

export function ProjectIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
        d="M7.5 5.5h9A1.5 1.5 0 0 1 18 7v11.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 18.5V7a1.5 1.5 0 0 1 1.5-1.5Z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        d="M9 9.5h6M9 12.5h6M9 15.5h4"
      />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.5 7.5V6a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 6v1.5M6 7.5h12M9 10.5v6.5M12 10.5v6.5M15 10.5v6.5M8 19.5h8a1.5 1.5 0 0 0 1.5-1.5V7.5H6.5V18a1.5 1.5 0 0 0 1.5 1.5Z"
      />
    </svg>
  );
}
