import type { Metadata } from "next";
import { Geist, Inria_Serif } from "next/font/google";
import "./globals.css";
import { ScrollGradient } from "@/components/ScrollGradient";
import { AppProviders } from "@/components/AppProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const inriaSerif = Inria_Serif({
  variable: "--font-inria-serif",
  weight: ["300", "400", "700"],
  style: ["italic", "normal"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DGO - Premium OTT Platform",
  description: "Experience the next generation of video entertainment.",
  icons: {
    icon: "/ios-icon.png",
    apple: "/ios-icon.png",
    shortcut: "/ios-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${inriaSerif.variable} antialiased`}
      >
        <ScrollGradient />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}


