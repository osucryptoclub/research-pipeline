import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Research Pipeline",
  description: "Daily archive of trusted crypto sources for the Crypto Club Research cohort",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
