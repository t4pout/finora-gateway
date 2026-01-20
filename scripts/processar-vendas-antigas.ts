import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function processarVendasAntigas() {
  console.log('🔄 Processando vendas antigas...\n');

  // Buscar todas as vendas PAGAS que NÃO têm registro na carteira
  const vendas = await prisma.venda.findMany({
    where: {
      status: 'PAGO',
      carteiras: {
        none: {} // vendas que não têm nenhum registro na carteira
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  console.log(`📊 Encontradas ${vendas.length} vendas sem registro na carteira\n`);

  let processadas = 0;

  for (const venda of vendas) {
    console.log(`\n💳 Processando venda ${venda.id.substring(0, 8)}...`);
    console.log(`   Valor: R$ ${venda.valor.toFixed(2)}`);
    console.log(`   Vendedor: ${venda.vendedorId.substring(0, 8)}`);

    // Calcular taxa (5%)
    const taxa = venda.valor * 0.05;
    const valorLiquido = venda.valor - taxa;

    try {
      // Criar registros na carteira
      await prisma.carteira.createMany({
        data: [
          {
            usuarioId: venda.vendedorId,
            vendaId: venda.id,
            tipo: 'TAXA_PLATAFORMA',
            valor: -taxa,
            status: 'APROVADO',
            descricao: `Taxa de plataforma (5%) - Venda #${venda.id.substring(0, 8)}`
          },
          {
            usuarioId: venda.vendedorId,
            vendaId: venda.id,
            tipo: 'VENDA',
            valor: valorLiquido,
            status: 'APROVADO',
            descricao: `Venda - ${venda.compradorNome}`
          }
        ]
      });

      processadas++;
      console.log(`   ✅ Taxa: -R$ ${taxa.toFixed(2)}`);
      console.log(`   ✅ Líquido: +R$ ${valorLiquido.toFixed(2)}`);

    } catch (error) {
      console.error(`   ❌ Erro ao processar venda: ${error}`);
    }
  }

  console.log(`\n\n🎉 ${processadas} vendas processadas com sucesso!`);

  // Mostrar resumo do saldo por usuário
  console.log('\n📊 RESUMO DE SALDOS:\n');

  const usuarios = await prisma.user.findMany({
    where: {
      carteiras: {
        some: {}
      }
    },
    include: {
      carteiras: {
        where: { status: 'APROVADO' }
      }
    }
  });

  for (const usuario of usuarios) {
    const saldo = usuario.carteiras.reduce((acc, c) => acc + c.valor, 0);
    console.log(`👤 ${usuario.nome}`);
    console.log(`   Saldo: R$ ${saldo.toFixed(2)}`);
    console.log(`   Transações: ${usuario.carteiras.length}\n`);
  }

  await prisma.$disconnect();
}

processarVendasAntigas().catch(console.error);