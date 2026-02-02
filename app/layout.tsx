import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finora - Pagamentos que fluem",
  description: "Sistema de Gateway de Pagamentos",
  icons: {
    icon: '/favicon.ico',
  }
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