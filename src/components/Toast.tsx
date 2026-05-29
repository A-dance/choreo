"use client";

import { useChoreo } from "@/context/ChoreoContext";

export function Toast() {
  const { toast } = useChoreo();
  return (
    <div className={"toast" + (toast ? " show" : "")} role="status">
      {toast ?? ""}
    </div>
  );
}
