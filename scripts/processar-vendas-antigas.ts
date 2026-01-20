import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function processarVendasAntigas() {
  console.log('🔄 Buscando vendas pagas sem processamento financeiro...');
  
  const vendasPagas = await prisma.venda.findMany({
    where: {
      status: 'PAGO'
    },
    include: {
      produto: true
    }
  });

  console.log(`📊 Encontradas ${vendasPagas.length} vendas PAGAS`);

  // Filtrar apenas vendas sem registro na carteira
  const vendasSemCarteira = [];
  
  for (const venda of vendasPagas) {
    const carteiraExiste = await prisma.carteira.findFirst({
      where: { vendaId: venda.id }
    });
    
    if (!carteiraExiste) {
      vendasSemCarteira.push(venda);
    }
  }

  console.log(`💰 ${vendasSemCarteira.length} vendas precisam ser processadas`);

  for (const venda of vendasSemCarteira) {
    console.log(`\n💰 Processando venda ${venda.id.substring(0,8)}...`);
    
    const valorTotal = venda.valor;
    const taxaPlataforma = 5; // Taxa padrão
    const valorTaxa = (valorTotal * taxaPlataforma) / 100;
    const valorLiquido = valorTotal - valorTaxa;

    // Registrar taxa
    await prisma.carteira.create({
      data: {
        usuarioId: venda.vendedorId,
        vendaId: venda.id,
        tipo: 'TAXA_PLATAFORMA',
        valor: -valorTaxa,
        descricao: `Taxa de ${taxaPlataforma}% sobre venda #${venda.id.substring(0,8)}`,
        status: 'CONFIRMADO'
      }
    });
    console.log(`  💳 Taxa: -R$ ${valorTaxa.toFixed(2)}`);

    // Registrar valor líquido
    await prisma.carteira.create({
      data: {
        usuarioId: venda.vendedorId,
        vendaId: venda.id,
        tipo: 'VENDA',
        valor: valorLiquido,
        descricao: `Venda #${venda.id.substring(0,8)} - ${venda.produto.nome}`,
        status: 'CONFIRMADO'
      }
    });
    console.log(`  ✅ Líquido: +R$ ${valorLiquido.toFixed(2)}`);
  }

  console.log(`\n🎉 ${vendasSemCarteira.length} vendas processadas!`);
  await prisma.$disconnect();
}

processarVendasAntigas().catch(console.error);