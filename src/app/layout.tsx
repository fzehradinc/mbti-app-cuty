import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "İç Meclis — Sorununu 16 Farklı Zihinle Tartış",
  description: "Kişilik tipi karakterleriyle karar destek platformu. MBTI bazlı 16 karakter perspektifinden kararlarınızı değerlendirin.",
  keywords: ["MBTI", "karar destek", "kişilik tipleri", "iç meclis", "danışma"],
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
