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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const params = new URLSearchParams(window.location.search);
                const produtoId = params.get('produtoId');
                if (!produtoId || !window.location.pathname.includes('/pad/criar')) return;
                
                fetch('/api/pixels?produtoId=' + produtoId)
                  .then(r => r.json())
                  .then(data => {
                    if (data.pixels && data.pixels[0] && data.pixels[0].plataforma === 'FACEBOOK') {
                      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
                      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
                      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
                      (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
                      fbq('init', data.pixels[0].pixelId);
                      fbq('track', 'PageView');
                      console.log('📊 Facebook Pixel carregado:', data.pixels[0].pixelId);
                    }
                  })
                  .catch(e => console.error('Erro pixel:', e));
              })();
            `
          }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
