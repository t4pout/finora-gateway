// Helper para obter token PicPay com cache (token expira em 5min)
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

export async function getPicPayToken(): Promise<string> {
  const now = Date.now();
  
  // Se token ainda válido (com 30s de margem), retorna o cache
  if (cachedToken && now < tokenExpiresAt - 30000) {
    return cachedToken;
  }

  const response = await fetch('https://checkout-api.picpay.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.PICPAY_CLIENT_ID,
      client_secret: process.env.PICPAY_CLIENT_SECRET
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Erro ao obter token PicPay: ${err}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in || 300) * 1000;

  console.log('🔑 Token PicPay obtido, expira em:', new Date(tokenExpiresAt).toISOString());
  return cachedToken!;
}