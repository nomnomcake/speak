import type { Metadata } from "next";
import { Outfit, Silkscreen, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { CookieNotice } from "@/components/CookieNotice";

/**
 * Typography system.
 *  - Outfit     — UI and prose. Geometric sans matching the reference's
 *                 smooth double-storey letterforms.
 *  - Silkscreen — pixel micro-labels only (HUD readouts, eyebrows). Never
 *                 used for body copy; it stops being legible below ~10px.
 *  - Geist Mono — numerics, timers, tabular data.
 */

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Speak — Speaking Simulator",
  description:
    "Train how fast you can learn, synthesise, and communicate a complex idea.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${silkscreen.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MotionProvider>
          {children}
          <CookieNotice />
        </MotionProvider>
      </body>
    </html>
  );
}