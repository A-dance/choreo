"use client";

import { useProfile } from "@/context/ProfileContext";
import { getStrings } from "@/lib/uiStrings";

const DOTS = [
  { id: "AO", color: "#a855f7", x: 28, y: 22 },
  { id: "SO", color: "#22d3ee", x: 50, y: 18 },
  { id: "KE", color: "#4ade80", x: 72, y: 28 },
  { id: "RI", color: "#f472b6", x: 38, y: 48 },
  { id: "HA", color: "#fb923c", x: 58, y: 52 },
  { id: "YU", color: "#60a5fa", x: 72, y: 62 },
] as const;

export function LoginStagePreview() {
  const { language } = useProfile();
  const UI = getStrings(language);

  return (
    <div className="login-stage-wrap">
      <p className="login-stage-label login-stage-label-top">UPSTAGE</p>
      <div className="login-stage-grid" aria-hidden>
        {DOTS.map((dot) => (
          <span
            key={dot.id}
            className="login-stage-dot"
            style={{
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              background: dot.color,
              boxShadow: `0 0 18px ${dot.color}88`,
            }}
          >
            {dot.id}
          </span>
        ))}
      </div>
      <p className="login-stage-label login-stage-label-bottom">AUDIENCE</p>
      <p className="login-stage-hint">{UI.loginStageHint}</p>
    </div>
  );
}
