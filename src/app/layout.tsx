import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Hlasování — Společně pro Josefov",
  description: "Interní hlasování sdružení Společně pro Josefov.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <body className={`${geistSans.variable} bg-surface antialiased`}>
        {children}
      </body>
    </html>
  );
}
