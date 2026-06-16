"use client";

import { ChoreoErrorBoundary } from "@/components/ChoreoErrorBoundary";
import { AuthGate } from "@/components/AuthGate";
import { MyPageScreen } from "@/components/MyPageScreen";
import { ChoreoProvider } from "@/context/ChoreoContext";

export default function MyPage() {
  return (
    <ChoreoErrorBoundary>
      <AuthGate>
        <ChoreoProvider>
          <MyPageScreen />
        </ChoreoProvider>
      </AuthGate>
    </ChoreoErrorBoundary>
  );
}
