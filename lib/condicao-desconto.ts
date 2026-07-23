export interface CondicaoDesconto {
  tipo: 'PERCENTUAL_UNIDADE' | 'VALOR_FIXO_UNIDADE' | 'LOTE_FAIXAS';
  percentualUnidade?: number;
  valorFixoUnidade?: number;
  faixas?: { quantidadeMinima: number; percentual: number }[];
}

// Calcula o valor total do produto (preço x quantidade) aplicando a condição de desconto configurada.
// SEMPRE deve ser chamado no servidor - nunca confiar em valor calculado pelo navegador.
export function calcularValorComCondicao(precoBase: number, quantidade: number, condicao: any): number {
  const qtd = Math.max(1, Number(quantidade) || 1);

  if (!condicao || !condicao.tipo || qtd <= 1) {
    return precoBase * qtd;
  }

  if (condicao.tipo === 'PERCENTUAL_UNIDADE') {
    const percentual = Math.min(100, Math.max(0, Number(condicao.percentualUnidade) || 0));
    const precoAdicional = precoBase * (1 - percentual / 100);
    return precoBase + (qtd - 1) * precoAdicional;
  }

  if (condicao.tipo === 'VALOR_FIXO_UNIDADE') {
    const valorFixo = Math.max(0, Number(condicao.valorFixoUnidade) || precoBase);
    return precoBase + (qtd - 1) * valorFixo;
  }

  if (condicao.tipo === 'LOTE_FAIXAS' && Array.isArray(condicao.faixas) && condicao.faixas.length > 0) {
    const valorTotal = precoBase * qtd;
    const faixasValidas = condicao.faixas
      .filter((f: any) => qtd >= Number(f.quantidadeMinima))
      .sort((a: any, b: any) => Number(b.quantidadeMinima) - Number(a.quantidadeMinima));
    if (faixasValidas.length > 0) {
      const percentual = Math.min(100, Math.max(0, Number(faixasValidas[0].percentual) || 0));
      return valorTotal * (1 - percentual / 100);
    }
    return valorTotal;
  }

  return precoBase * qtd;
}