import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "16TypeTalk — 16 MBTI Zihniyle Sorununu Tartış",
  description: "MBTI bazlı 16 karakter perspektifinden kararlarınızı değerlendirin. Kişilik tipi karakterleriyle karar destek platformu.",
  keywords: ["MBTI", "karar destek", "kişilik tipleri", "16TypeTalk", "danışma"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
