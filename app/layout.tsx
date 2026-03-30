import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "魔法使公會菇菇看板",
  description: "魔法使公會菇菇看板",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="h-full">
      <body className="min-h-full bg-green-50">{children}</body>
    </html>
  );
}
