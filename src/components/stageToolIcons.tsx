export function StageMoveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 4.5 6 17.5 9.5 14 12.5 19.5 14.5 18 11.5 12.5 16 12.5 6 4.5Z"
      />
    </svg>
  );
}

export function StageArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 19 19 5M19 5h-7M19 5v7"
      />
    </svg>
  );
}

export function StageMarkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        d="M8 8l8 8M16 8l-8 8"
      />
    </svg>
  );
}

function BallpointPenGraphic() {
  return (
    <g transform="rotate(45 12 12)">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.7 5.4A2.3 2.3 0 0 1 14.3 5.4L14.3 15.8L12.2 18.5L9.7 15.8L9.7 5.4"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        d="M9.5 15.8h4.8"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        d="M10 10h4.2"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        d="M10 11.6h4.2"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        d="M14.3 6.6h2.8"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        d="M14.3 6.1v3.4"
      />
    </g>
  );
}

export function StagePenIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <BallpointPenGraphic />
    </svg>
  );
}

export function StageDrawToggleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
      <BallpointPenGraphic />
    </svg>
  );
}
