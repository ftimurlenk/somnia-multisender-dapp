import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 1. Providers bileşenini import ettiğinizden emin olun
import { Providers } from "./providers"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Somnia STT Multisender",
  description: "Native STT token sending application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 2. children'ı Providers ile sarmaladığınızdan emin olun */}
        <b><Providers>{children}</Providers></b>
      </body>
    </html>
  );
}