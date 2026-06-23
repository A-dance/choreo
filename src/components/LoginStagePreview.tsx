"use client";

import { StageFloor } from "@/components/StageFloor";
import { COLORS } from "@/lib/constants";

const MEMBER_COUNT = 5;
const DOT_PX = 26;

function memberPosition(index: number, total: number) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return {
    x: 50 + Math.cos(angle) * 28,
    y: 50 + Math.sin(angle) * 18,
  };
}

const PREVIEW_MEMBERS = Array.from({ length: MEMBER_COUNT }, (_, index) => {
  const id = index + 1;
  const pos = memberPosition(index, MEMBER_COUNT);
  return {
    id,
    name: String(id),
    color: COLORS[index % COLORS.length],
    x: pos.x,
    y: pos.y,
  };
});

export function LoginStagePreview() {
  return (
    <div className="login-stage-preview" aria-hidden>
      <div className="login-stage-con">
        <StageFloor halfW={4} depth={5} />
        <div className="s-lbl back">B A C K</div>
        <div className="s-lbl front">A U D I E N C E</div>
        {PREVIEW_MEMBERS.map((member) => (
          <div
            key={member.id}
            className="m-dot login-stage-dot"
            style={{
              ["--dot-color" as string]: member.color,
              left: `${member.x}%`,
              top: `${member.y}%`,
              width: DOT_PX,
              height: DOT_PX,
              fontSize: 11,
            }}
          >
            {member.name}
          </div>
        ))}
      </div>
    </div>
  );
}
