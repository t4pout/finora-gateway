(function() {
  console.log('🔍 Script fb-pixel.js carregado');
  
  const params = new URLSearchParams(window.location.search);
  const produtoId = params.get('produtoId');
  
  console.log('ProdutoId:', produtoId);
  console.log('Pathname:', window.location.pathname);
  
  if (!produtoId || !window.location.pathname.includes('/pad/criar')) {
    console.log('❌ Não é página de checkout PAD ou sem produtoId');
    return;
  }
  
  fetch('/api/pixels?produtoId=' + produtoId)
    .then(r => r.json())
    .then(data => {
      console.log('📡 Pixels retornados:', data);
      
      if (data.pixels && data.pixels[0] && data.pixels[0].plataforma === 'FACEBOOK') {
        const pixel = data.pixels[0];
        console.log('✅ Pixel Facebook encontrado:', pixel.pixelId);
        
        // Carregar Facebook Pixel
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
        (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
        
        fbq('init', pixel.pixelId);
        fbq('track', 'PageView');
        
        console.log('📊 Facebook Pixel carregado:', pixel.pixelId);
      } else {
        console.log('❌ Nenhum pixel Facebook encontrado');
      }
    })
    .catch(e => console.error('❌ Erro ao carregar pixel:', e));
})();