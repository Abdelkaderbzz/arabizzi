import type { Metadata } from "next";
import { DM_Sans, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/language-context";
import { HistoryProvider } from "@/contexts/history-context";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arabic Converter",
  description: "Convert Tunisian Arabic text between Latin and Arabic scripts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${notoArabic.variable}`}>
      <body className="font-[family-name:var(--font-sans)]">
        <LanguageProvider>
          <HistoryProvider>{children}</HistoryProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
