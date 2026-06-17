"use client";

import { useChoreo } from "@/context/ChoreoContext";
import styles from "./Toast.module.css";

export function Toast() {
  const { toast } = useChoreo();
  const visible = Boolean(toast);

  return (
    <div className={styles.root} role="status" aria-live="polite" aria-atomic="true">
      <div className={styles.panel + (visible ? ` ${styles.panelVisible}` : "")}>
        <span className={styles.accent} aria-hidden />
        <span className={styles.message}>{toast ?? ""}</span>
      </div>
    </div>
  );
}
