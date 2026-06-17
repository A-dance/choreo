"use client";

import { useCallback, useEffect, useState } from "react";
import { StripeSubscribeButton } from "@/components/StripeSubscribeButton";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import {
  fetchSubscriptionDetails,
  type SubscriptionDetailsResponse,
} from "@/lib/stripeCheckoutClient";
import { PRO_MONTHLY_PRICE_YEN } from "@/lib/subscription";
import { formatSubscriptionDate } from "@/lib/stripeSubscriptionInfo";
import { getStrings } from "@/lib/uiStrings";

interface MyPagePlanSectionProps {
  checkoutNotice: string | null;
  portalNotice: string | null;
}

export function MyPagePlanSection({
  checkoutNotice,
  portalNotice,
}: MyPagePlanSectionProps) {
  const { session } = useAuth();
  const { language, plan, refreshPlan } = useProfile();
  const UI = getStrings(language);
  const [details, setDetails] = useState<SubscriptionDetailsResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const loadDetails = useCallback(async () => {
    const token = session?.access_token;
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchSubscriptionDetails(token);
      setDetails(data);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (!session?.access_token) return;
    void refreshPlan();
    void loadDetails();
  }, [session?.access_token, refreshPlan, loadDetails]);

  const isPro = plan === "pro";
  const periodStart = details?.currentPeriodStart;
  const periodEnd = details?.currentPeriodEnd;
  const cancelAtPeriodEnd = details?.cancelAtPeriodEnd ?? false;

  return (
    <section
      className={"mypage-section mypage-plan-section" + (isPro ? " is-pro" : "")}
      aria-label={UI.myPagePlan}
    >
      <h2 className="mypage-section-title">{UI.myPagePlan}</h2>

      {isPro ? (
        <div className="mypage-pro-card">
          <div className="mypage-pro-card-head">
            <span className="mypage-pro-badge">{UI.myPageProModeBadge}</span>
            <p className="mypage-pro-title">{UI.myPagePlanProActive}</p>
          </div>

          {loading ? (
            <p className="mypage-pro-meta">{UI.myPageSubscriptionLoading}</p>
          ) : periodStart && periodEnd ? (
            <div className="mypage-pro-period">
              <p className="mypage-pro-period-label">{UI.myPageSubscriptionPeriod}</p>
              <p className="mypage-pro-period-value">
                {UI.myPageSubscriptionPeriodRange(
                  formatSubscriptionDate(periodStart, language),
                  formatSubscriptionDate(periodEnd, language),
                )}
              </p>
              {cancelAtPeriodEnd && periodEnd ? (
                <div className="mypage-pro-period-note">
                  {UI.myPageSubscriptionEndsOn(
                    formatSubscriptionDate(periodEnd, language),
                  ).map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              ) : (
                <p className="mypage-pro-renew-note">
                  {UI.myPageSubscriptionRenewsOn(
                    formatSubscriptionDate(periodEnd, language),
                  )}
                </p>
              )}
            </div>
          ) : null}

          <p className="mypage-pro-manage-hint">{UI.myPageManageSubscriptionHint}</p>

          <div className="mypage-pro-actions">
            <StripeSubscribeButton variant="primary" manage className="mypage-subscribe-btn" />
          </div>
        </div>
      ) : (
        <>
          <p className="mypage-plan-current">
            {UI.myPagePlanFree}
            <span className="mypage-plan-badge mypage-plan-badge-free">
              {UI.myPageFreeBadge}
            </span>
          </p>
          <div className="mypage-upgrade-card">
            <p className="mypage-upgrade-title">{UI.myPageUpgradeTitle}</p>
            <p className="mypage-upgrade-desc">{UI.myPageUpgradeDesc}</p>
            <p className="mypage-upgrade-price">
              {UI.upgradePrice(PRO_MONTHLY_PRICE_YEN)}
            </p>
            <StripeSubscribeButton variant="primary" className="mypage-subscribe-btn" />
          </div>
        </>
      )}

      {checkoutNotice ? (
        <p className="mypage-checkout-notice" role="status">
          {checkoutNotice}
        </p>
      ) : null}
      {portalNotice ? (
        <p className="mypage-checkout-notice" role="status">
          {portalNotice}
        </p>
      ) : null}
    </section>
  );
}
