"use client";

import { ChoreoErrorBoundary } from "@/components/ChoreoErrorBoundary";
import { MyPageScreen } from "@/components/MyPageScreen";
import { ChoreoProvider } from "@/context/ChoreoContext";

export default function MyPage() {
  return (
    <ChoreoErrorBoundary>
      <ChoreoProvider>
        <MyPageScreen />
      </ChoreoProvider>
    </ChoreoErrorBoundary>
  );
}
