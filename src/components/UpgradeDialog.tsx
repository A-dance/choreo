"use client";

import Link from "next/link";
import { StripeSubscribeButton } from "@/components/StripeSubscribeButton";
import { useProfile } from "@/context/ProfileContext";
import {
  FREE_PROJECT_LIMIT,
  PRO_MONTHLY_PRICE_YEN,
} from "@/lib/subscription";
import { getStrings } from "@/lib/uiStrings";

interface UpgradeDialogProps {
  onClose: () => void;
}

export function UpgradeDialog({ onClose }: UpgradeDialogProps) {
  const { language } = useProfile();
  const UI = getStrings(language);

  return (
    <div className="dialog-overlay" onClick={onClose} role="presentation">
      <div
        className="dialog-panel upgrade-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-title"
      >
        <h2 id="upgrade-title" className="dialog-title">
          {UI.upgradeTitle}
        </h2>
        <p className="dialog-desc">{UI.upgradeDesc(FREE_PROJECT_LIMIT)}</p>

        <div className="upgrade-plan-card">
          <p className="upgrade-plan-name">Pro</p>
          <p className="upgrade-plan-price">
            {UI.upgradePrice(PRO_MONTHLY_PRICE_YEN)}
          </p>
        </div>

        <p className="upgrade-note">{UI.upgradeNote}</p>

        <div className="dialog-actions upgrade-dialog-actions">
          <button type="button" className="dialog-btn secondary" onClick={onClose}>
            {UI.close}
          </button>
          <StripeSubscribeButton variant="primary" />
          <Link href="/mypage" className="dialog-btn secondary upgrade-mypage-link">
            {UI.upgradeGoMyPage}
          </Link>
        </div>
      </div>
    </div>
  );
}
