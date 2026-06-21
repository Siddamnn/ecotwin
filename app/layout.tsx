import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AmbientBackground } from "@/components/layout/AmbientBackground";
import { AppShell } from "@/components/layout/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EcoTwin — Understand, track & shrink your carbon footprint",
  description:
    "Build a living twin of your lifestyle, simulate high-impact changes, and turn them into quests that make cutting your carbon footprint genuinely fun.",
};

export const viewport: Viewport = {
  themeColor: "#05100b",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AmbientBackground />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
