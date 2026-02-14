import type { Metadata } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const fontSansLatin = Inter({
  subsets: ["latin"],
  variable: "--font-sans-latin",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  fallback: ["Segoe UI", "Arial", "sans-serif"]
});

const fontSansZh = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-sans-zh",
  weight: ["400", "500", "700"],
  display: "swap",
  fallback: ["PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "sans-serif"]
});

export const metadata: Metadata = {
  title: "Guru Game",
  description: "Official website for Guru Game products and tools",
  metadataBase: new URL(process.env.WEB_BASE_URL ?? "http://localhost:3000")
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fontSansLatin.variable} ${fontSansZh.variable}`}>
        {children}
      </body>
    </html>
  );
}
