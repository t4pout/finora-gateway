import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finora - Pagamentos que fluem",
  description: "Sistema de Gateway de Pagamentos",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const tema = localStorage.getItem('finora-tema');
            if (tema === 'dark') document.documentElement.classList.add('dark');
          } catch (e) {}
        ` }} />
        <script dangerouslySetInnerHTML={{ __html: `
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                colors: {
                  finoradark: {
                    bg: '#0a0714',
                    card: '#120e20',
                    card2: '#1a1530',
                    border: '#2a2350',
                    glow: '#8b7bf5',
                    text: '#f0edff',
                    textmuted: '#8b83b8',
                  }
                }
              }
            }
          }
        ` }} />
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="/fb-pixel.js" defer></script>
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}