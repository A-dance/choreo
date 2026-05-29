import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CHOREO — ダンス配置",
  description: "振付フォーメーション編集ツール",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
