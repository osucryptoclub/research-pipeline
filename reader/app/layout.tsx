import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Research Pipeline",
  description: "Daily archive of trusted crypto sources for the Crypto Club Research cohort",
};

// Serif for headlines and item titles. next/font downloads it at build time and serves
// it from our own domain, so readers' browsers never call Google.
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", display: "swap" });

// Runs before first paint so a saved theme doesn't flash the wrong colors.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={serif.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
