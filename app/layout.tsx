import type { Metadata } from "next";
import { Geist } from "next/font/google";
import localFont from "next/font/local"; // Voeg deze import toe
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Navbar from "@/components/navbar";
import { Suspense } from "react";

// Bestaande Google Font
const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

// Jouw nieuwe F1 Font
const f1Font = localFont({
  src: [
    {
      path: "./fonts/formula1-regular.ttf", // Controleer of de bestandsnaam klopt!
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/formula1-bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-f1", // CSS variabele om in Tailwind te gebruiken
});

export const metadata: Metadata = {
  title: "F1 Max to the Max | Poule",
  description: "De ultieme F1 voorspellingsapp",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" suppressHydrationWarning>
      {/* We voegen hier beide font-variabelen toe aan de body */}
      <body 
        className={`${geistSans.variable} ${f1Font.variable} font-sans bg-[#0f111a] text-white antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Suspense fallback={<div className="h-16 bg-[#15151e] w-full animate-pulse" />}>
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