import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guru GEO Wiki",
  description: "GEO canonical knowledge base for Guru products",
  metadataBase: new URL(process.env.WEB_BASE_URL ?? "http://localhost:3000")
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
