import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ShellChrome } from "@/components/shell/ShellChrome";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "TerraFusion Professional OS | Commercial Appraisal Suite",
  description:
    "TerraFusion Professional OS — commercial fee appraisal operating environment. Three Approaches to Value, USPAP-aware workflow, governed AI drafting.",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <ShellChrome>{children}</ShellChrome>
      </body>
    </html>
  );
}
