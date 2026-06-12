import type { Metadata } from "next";
import { Space_Grotesk, Zen_Kaku_Gothic_New } from "next/font/google";
import { ProfileProvider } from "@/context/ProfileContext";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-latin",
});

const zenKaku = Zen_Kaku_Gothic_New({
  weight: ["400", "500", "700", "900"],
  preload: false,
  variable: "--font-jp",
});

export const metadata: Metadata = {
  title: "CHOREO — Formation Editor",
  description: "Dance formation layout and playback tool",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${zenKaku.variable}`}>
      <body>
        <ProfileProvider>{children}</ProfileProvider>
      </body>
    </html>
  );
}
