"use client";

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
        <button
          type="button"
          className="dialog-close-btn"
          onClick={onClose}
          aria-label={UI.close}
        >
          ×
        </button>
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
          <StripeSubscribeButton variant="primary" />
        </div>
      </div>
    </div>
  );
}
