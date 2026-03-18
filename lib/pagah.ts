export async function enviarParaPagah(venda: {
  compradorNome: string;
  compradorTel?: string;
  compradorEmail: string;
  compradorCpf?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cep?: string;
  cidade?: string;
  estado?: string;
  produtoId: string;
  nomePlano?: string;
  produto?: { nome: string; descricao?: string };
  valor: number;
  metodoPagamento: string;
  createdAt: string | Date;
  id: string;
}) {
  try {
    const body = {
      integration: true,
      name: venda.compradorNome,
      phone: (venda.compradorTel || '').replace(/\D/g, ''),
      email: venda.compradorEmail,
      document: (venda.compradorCpf || '').replace(/\D/g, ''),
      address: venda.rua || '',
      number: venda.numero || 'SN',
      district: venda.bairro || '',
      zipcode: (venda.cep || '').replace(/\D/g, ''),
      city: venda.cidade || '',
      state: venda.estado || '',
      product_id: venda.produtoId,
      product_uuid: venda.produtoId,
      product_name: venda.nomePlano || venda.produto?.nome || '',
      product_description: venda.produto?.descricao || venda.nomePlano || '',
      payment_method: 'credit_card',
      status: 'paid',
      date: new Date(venda.createdAt).toISOString().replace('T', ' ').substring(0, 19),
      amount: venda.valor,
      quantity: 1,
      installments: 1,
      order_code: venda.id,
    };

    const res = await fetch('https://app.pagah.com/api/webhook/call/hrxsh-ZNq07-0GmXq-Neocq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    console.log('Pagah enviado:', JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Erro ao enviar para Pagah:', error);
  }
}