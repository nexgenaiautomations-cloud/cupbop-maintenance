import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { PwaRegister } from "@/components/pwa/pwa-register";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Cupbop Maintenance Command Center",
  description: "Preventive maintenance and work order tracking for Cupbop locations.",
  manifest: "/manifest.webmanifest",
  applicationName: "Cupbop Maintenance",
  appleWebApp: {
    capable: true,
    title: "Cupbop Maint",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#e11d2a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
