import { Archivo, Inter } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "TradeBridge Bangladesh — Verified B2B Export Marketplace",
  description:
    "Find verified Bangladeshi suppliers and export-ready products, post buy requirements, and trade globally with verification and trade support at every step.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
