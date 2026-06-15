interface BrandLogoProps {
  className?: string;
  size?: "header" | "loading";
}

const VIEW_WIDTH = 176;
const VIEW_HEIGHT = 64;
const BAMIRI_X = 62;
const SHARE_X = 172;
const ICON_SCALE = 0.58;

export function BrandLogo({ className = "", size = "header" }: BrandLogoProps) {
  const height = size === "loading" ? 48 : 34;
  const width = Math.round((height * VIEW_WIDTH) / VIEW_HEIGHT);

  return (
    <svg
      className={"brand-logo" + (className ? ` ${className}` : "")}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      width={width}
      height={height}
      aria-label="SHARE bamiri"
      role="img"
    >
      <g transform={`translate(0, 3) scale(${ICON_SCALE})`}>
        <rect width="100" height="100" rx="22" fill="#534AB7" />
        <line
          x1="28"
          y1="28"
          x2="72"
          y2="72"
          stroke="white"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <line
          x1="72"
          y1="28"
          x2="28"
          y2="72"
          stroke="white"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <circle cx="28" cy="28" r="10" fill="#FAC775" />
        <circle cx="72" cy="28" r="10" fill="#FAC775" />
        <circle cx="72" cy="72" r="10" fill="#FAC775" />
        <circle cx="28" cy="72" r="10" fill="#FAC775" />
      </g>
      <text
        x={SHARE_X}
        y="22"
        textAnchor="end"
        fontFamily="var(--font-latin), -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif"
        fontSize="12"
        fontWeight="500"
        letterSpacing="3.2"
        fill="#534AB7"
      >
        SHARE
      </text>
      <text
        x={BAMIRI_X}
        y="56"
        fontFamily="var(--font-latin), -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif"
        fontSize="36"
        fontWeight="500"
        letterSpacing="-1.02"
        fill="var(--text)"
      >
        bamiri
      </text>
    </svg>
  );
}
