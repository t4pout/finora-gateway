// Dispara conversão de Purchase para Google Ads via Measurement Protocol
export async function dispararGoogleConversao({
  conversionId,
  valor,
  vendaId,
  email
}: {
  conversionId: string;
  valor: number;
  vendaId: string;
  email: string;
}) {
  try {
    // conversionId formato: "AW-123456789/AbCdEfGhIjK"
    // Separar em gTag ID e conversion label
    const partes = conversionId.split('/');
    if (partes.length !== 2) {
      console.error('❌ Google conversionId inválido. Formato esperado: AW-XXXXXXXXX/LABEL');
      return;
    }

    const [gtagId, conversionLabel] = partes;

    const payload = {
      client_id: vendaId, // identificador único da sessão/venda
      events: [
        {
          name: 'purchase',
          params: {
            transaction_id: vendaId,
            value: valor,
            currency: 'BRL',
            send_to: conversionId
          }
        }
      ],
      user_data: {
        email_address: email
      }
    };

    // Google Ads Conversion via gtag Measurement Protocol
    const measurementId = gtagId.replace('AW-', '');
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${gtagId}&api_secret=${conversionLabel}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log(`✅ Google Conversão disparada | Status: ${response.status} | Venda: ${vendaId}`);
  } catch (error) {
    console.error('❌ Erro ao disparar conversão Google:', error);
  }
}