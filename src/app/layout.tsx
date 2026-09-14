import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Amiri, Noto_Nastaliq_Urdu } from "next/font/google";
import { school } from "@/lib/config/school";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display", axes: ["opsz"] });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const quran = Amiri({ subsets: ["arabic"], weight: ["400"], variable: "--font-quran" });
const urdu = Noto_Nastaliq_Urdu({ subsets: ["arabic"], weight: ["400", "500"], variable: "--font-urdu" });

export const metadata: Metadata = {
  title: { default: `${school.productName} · ${school.schoolName}`, template: `%s · ${school.productName}` },
  description: `${school.productName}: the AI-powered school operating system for ${school.schoolName}. ${school.productTagline}`,
};

export const viewport: Viewport = { themeColor: school.theme.accent, width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${sans.variable} ${quran.variable} ${urdu.variable}`}>
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) add data-* attributes to body before React hydrates. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
