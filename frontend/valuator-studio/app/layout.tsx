import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TerraFusion Valuator Pro Studio",
  description: "Professional Real Estate Property Valuation Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
