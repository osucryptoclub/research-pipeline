import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Research Pipeline",
  description: "Daily archive of trusted crypto sources for the Crypto Club Research cohort",
};

// Runs before first paint so a saved theme doesn't flash the wrong colors.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
