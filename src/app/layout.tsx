// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/leaflet.css"; // Import Leaflet styles
import "../styles/hunting-map.css"; // Import Map styles 
import { ModalProvider } from '@/components/modals/ModalSystem'
import Navigation from "@/components/Navigation";
import NotificationToast from '@/components/ui/NotificationToast'

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Caswell County Yacht Club",
  description: "Hunting club management system for tracking hunts, maintenance, and camp activities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${geistMono.variable} antialiased`}
      >
        <ModalProvider>
          <Navigation />
          {children}
        </ModalProvider>
        {/* WIP Notification Toast - Non-layout-affecting overlay */}
        <NotificationToast 
          message="🔧 System under development"
          showInProduction={true}
          autoHideDuration={10000}
          className="top-20"
        />
      </body>
    </html>
  );
}
