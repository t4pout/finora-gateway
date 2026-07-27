import { NextRequest, NextResponse } from 'next/server';
import { HttpsProxyAgent } from 'https-proxy-agent';

const APPMAX_API = 'https://app.appmax.com.br/api/v3';
const APPMAX_TOKEN = process.env.APPMAX_ACCESS_TOKEN;
const FIXIE_URL = process.env.FIXIE_URL || '';
const appmaxAgent = FIXIE_URL ? new HttpsProxyAgent(FIXIE_URL) : undefined;

export async function GET(request: NextRequest) {
  try {
    const res = await fetch(APPMAX_API + '/customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Origin': 'https://finorapayments.com',
        'Referer': 'https://finorapayments.com/'
      },
      body: JSON.stringify({
        'access-token': APPMAX_TOKEN,
        firstname: 'Teste',
        lastname: 'Conexao',
        email: 'teste.conexao@finorapayments.com',
        telephone: '11999999999',
        postcode: '01310100',
        address_street: 'Av Paulista',
        address_street_number: '1000',
        address_street_complement: '',
        address_street_district: 'Bela Vista',
        address_city: 'Sao Paulo',
        address_state: 'SP',
        ip: '127.0.0.1'
      }),
      ...(appmaxAgent && { agent: appmaxAgent } as any)
    });

    const texto = await res.text();
    return NextResponse.json({
      status: res.status,
      ok: res.ok,
      resposta: texto,
      fixieConfigurado: !!FIXIE_URL
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}