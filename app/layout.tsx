import "./globals.css";
import { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kurumai",
  description: "A Proof of Concept Assistant Demonstrating AI's Capabilities and the Simplicity in Implementation",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode
  }) {
  return (
    <html lang="en">
      <body className={inter.className + " h-screen"}>
        {children}
      </body>
    </html>
  );
}
