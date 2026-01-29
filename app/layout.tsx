import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finora Gateway",
  description: "Sistema de Gateway de Pagamentos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="/fb-pixel.js" defer></script>
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}