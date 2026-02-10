(function() {
  console.log('🔍 Script fb-pixel.js carregado');
  
  const pathname = window.location.pathname;
  console.log('Pathname:', pathname);
  
  // Detectar se é checkout PAD ou checkout normal
  let produtoId = null;
  
  // Checkout PAD: /pad/criar?produtoId=xxx
  if (pathname.includes('/pad/criar')) {
    const params = new URLSearchParams(window.location.search);
    produtoId = params.get('produtoId');
    console.log('📦 Checkout PAD - ProdutoId:', produtoId);
  }
  
  // Checkout Normal: já injeta o pixel via useEffect na página
  // Não precisa fazer nada aqui, o pixel já foi injetado
  if (pathname.includes('/checkout/')) {
    console.log('✅ Checkout normal - Pixel será injetado via useEffect');
    return;
  }
  
  // Se não tem produtoId e não é checkout normal, sair
  if (!produtoId) {
    console.log('ℹ️ Nenhum produtoId detectado');
    return;
  }
  
  // Carregar pixel para checkout PAD
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