"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      router.replace("/login");
      return;
    }

    void (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace("/login");
          return;
        }
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      router.replace(session ? "/" : "/login");
    })();
  }, [router]);

  return (
    <div className="choreo-loading">
      <div className="choreo-loading-inner">
        <BrandLogo size="loading" />
      </div>
    </div>
  );
}
