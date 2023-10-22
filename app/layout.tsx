import "./globals.css";
import { Inter } from "next/font/google";
import { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kurumai",
  description: "A Proof of Concept Assistant Demonstrating AI's Capabilities and the Simplicity in Implementation",
  // Needed to make media queries in the chrome phone emulator work
  viewport: "width=device-width, initial-scale=1.0"
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
