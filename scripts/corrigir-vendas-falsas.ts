import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function corrigirVendasFalsas() {
  console.log('🔄 Corrigindo vendas marcadas como PAGAS incorretamente...');
  
  // Buscar vendas PAGAS que NÃO têm transação confirmada no PaggPix
  const vendas = await prisma.venda.findMany({
    where: {
      status: 'PAGO',
      pixId: { not: null }
    }
  });

  console.log(`📊 Verificando ${vendas.length} vendas...`);

  let corrigidas = 0;

  for (const venda of vendas) {
    console.log(`\n🔍 Verificando venda ${venda.id.substring(0,8)}...`);
    
    try {
      // Verificar no PaggPix
      const response = await fetch(`https://public-api.paggpix.com/payments/${venda.pixId}/verify`, {
        headers: {
          'Authorization': `Bearer ${process.env.PAGGPIX_TOKEN}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        const estaPago = data.paid || data.status === 'PAID' || data.status === 'paid';
        
        if (!estaPago) {
          // Venda marcada como paga mas não está paga
          console.log(`  ⚠️ Venda NÃO foi paga! Corrigindo...`);
          
          // Voltar para PENDENTE
          await prisma.venda.update({
            where: { id: venda.id },
            data: { status: 'PENDENTE' }
          });

          // Deletar registros da carteira
          await prisma.carteira.deleteMany({
            where: { vendaId: venda.id }
          });

          corrigidas++;
          console.log(`  ✅ Corrigido!`);
        } else {
          console.log(`  ✅ Venda OK - realmente foi paga`);
        }
      }
    } catch (error) {
      console.log(`  ⚠️ Erro ao verificar: ${error}`);
    }
  }

  console.log(`\n🎉 ${corrigidas} vendas corrigidas!`);
  await prisma.$disconnect();
}

corrigirVendasFalsas().catch(console.error);