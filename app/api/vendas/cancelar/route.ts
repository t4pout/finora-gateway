import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura-2026-finora';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Apenas admins podem cancelar vendas' }, { status: 403 });
    }

    const { vendaId, motivo } = await request.json();
    if (!vendaId) return NextResponse.json({ error: 'vendaId obrigatório' }, { status: 400 });

    const venda = await prisma.venda.findUnique({ where: { id: vendaId } });
    if (!venda) return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 });

    if (venda.status === 'CANCELADO') {
      return NextResponse.json({ error: 'Venda já cancelada' }, { status: 400 });
    }

    // Cancelar venda
    await prisma.venda.update({
      where: { id: vendaId },
      data: { status: 'CANCELADO' }
    });

    // Remover saldo da carteira se venda estava PAGA
    if (venda.status === 'PAGO') {
      // Estornar carteira do vendedor
      const carteiras = await prisma.carteira.findMany({
        where: { vendaId, tipo: { in: ['VENDA', 'CREDITO'] } }
      });

      for (const carteira of carteiras) {
        await prisma.carteira.update({
          where: { id: carteira.id },
          data: { status: 'CANCELADO' }
        });

        // Criar lançamento de débito para estornar
        await prisma.carteira.create({
          data: {
            usuarioId: carteira.usuarioId,
            vendaId,
            tipo: 'DEBITO',
            valor: carteira.valor,
            descricao: `Estorno venda #${vendaId.substring(0, 8)} - ${motivo || 'Cancelado pelo admin'}`,
            status: 'APROVADO'
          }
        });
      }

      // Cancelar comissões de afiliados
      await prisma.comissao.updateMany({
        where: { vendaId, status: { in: ['PENDENTE', 'APROVADO'] } },
        data: { status: 'CANCELADO' }
      });

      // Estornar carteira de afiliados
      const carteiraAfiliados = await prisma.carteira.findMany({
        where: { vendaId, tipo: 'CREDITO' }
      });

      for (const c of carteiraAfiliados) {
        await prisma.carteira.update({
          where: { id: c.id },
          data: { status: 'CANCELADO' }
        });
      }
    }

    console.log(`✅ Venda ${vendaId} cancelada pelo admin ${user.nome}`);
    return NextResponse.json({ success: true, message: 'Venda cancelada com sucesso' });

  } catch (error: any) {
    console.error('Erro ao cancelar venda:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}