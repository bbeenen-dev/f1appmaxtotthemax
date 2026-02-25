export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Navbar from "@/components/navbar"; // Nu écht met de hoofdletter N
import { Suspense } from "react";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "F1 Max to the Max | Poule",
  description: "De ultieme F1 voorspellingsapp voor vrienden",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className={`${geistSans.className} bg-[#0f111a] text-white antialiased`}>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="dark" 
          enableSystem={false}
        >
          {/* De Suspense boundary hier is essentieel voor Next.js 16. 
            Het zorgt ervoor dat de auth-check in de Navbar de rest van de 
            pagina-opbouw niet blokkeert tijdens de build.
          */}
          <Suspense fallback={<div className="h-16 bg-[#15151e] animate-pulse w-full" />}>
            <Navbar />
          </Suspense>
          
          <main className="min-h-screen">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}