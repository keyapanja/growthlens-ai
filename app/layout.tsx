import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "GrowthLens AI",
  description: "AI-powered website growth reports with performance, SEO, and conversion insights."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
