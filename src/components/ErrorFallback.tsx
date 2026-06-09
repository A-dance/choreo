"use client";

interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
}

export function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <div className="choreo-loading">
      <div style={{ textAlign: "center", maxWidth: 420, padding: 24 }}>
        <span className="logo">◈ CHOREO</span>
        <p style={{ marginTop: 16, color: "var(--text2)", fontSize: 13 }}>
          読み込み中に問題が発生しました。
        </p>
        <p
          style={{
            marginTop: 8,
            color: "var(--ac2)",
            fontSize: 11,
            wordBreak: "break-all",
          }}
        >
          {error.message}
        </p>
        <button
          type="button"
          className="dialog-btn primary"
          style={{ marginTop: 16 }}
          onClick={reset}
        >
          再読み込み
        </button>
      </div>
    </div>
  );
}
