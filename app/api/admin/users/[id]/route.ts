import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sua-chave-secreta-super-segura';

function verificarAdmin(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role?: string };
    return decoded.userId;
  } catch { return null; }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = verificarAdmin(request);
    if (!adminId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, nome: true, email: true, telefone: true, cpf: true,
        role: true, status: true, telegramBotToken: true, telegramChatId: true,
        createdAt: true, verificado: true, statusVerificacao: true,
        planoTaxa: { select: { id: true, nome: true } },
        _count: { select: { produtos: true, vendas: true } }
      }
    });
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = verificarAdmin(request);
    if (!adminId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    const { id } = await params;
    const { nome, email, telefone, cpf, role, status, telegramBotToken, telegramChatId } = await request.json();
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(email && { email }),
        ...(telefone !== undefined && { telefone }),
        ...(cpf !== undefined && { cpf }),
        ...(role && { role }),
        ...(status && { status }),
        ...(telegramBotToken !== undefined && { telegramBotToken }),
        ...(telegramChatId !== undefined && { telegramChatId }),
      }
    });
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = verificarAdmin(request);
    if (!adminId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    const { id } = await params;
    if (id === adminId) return NextResponse.json({ error: 'Você não pode excluir sua própria conta' }, { status: 400 });

    await prisma.webhookLog.deleteMany({ where: { webhook: { userId: id } } });
    await prisma.webhook.deleteMany({ where: { userId: id } });
    await prisma.postbackLog.deleteMany({ where: { postback: { userId: id } } });
    await prisma.postback.deleteMany({ where: { userId: id } });
    await prisma.integracaoBling.deleteMany({ where: { userId: id } });
    await prisma.carrinhoAbandonado.deleteMany({ where: { vendedorId: id } });
    await prisma.pedidoPAD.deleteMany({ where: { vendedorId: id } });
    await prisma.carteira.deleteMany({ where: { usuarioId: id } });
    await prisma.transacao.deleteMany({ where: { userId: id } });
    await prisma.saque.deleteMany({ where: { userId: id } });
    await prisma.comissao.deleteMany({ where: { afiliadoId: id } });
    await prisma.afiliacao.deleteMany({ where: { afiliadoId: id } });
    await prisma.solicitacaoAfiliacao.deleteMany({ where: { afiliadoId: id } });
    await prisma.orderBump.deleteMany({ where: { userId: id } });
    await prisma.linkUTM.deleteMany({ where: { userId: id } });
    await prisma.despesa.deleteMany({ where: { userId: id } });
    await prisma.documento.deleteMany({ where: { userId: id } });
    await prisma.contaBancaria.deleteMany({ where: { userId: id } });
    await prisma.integracaoAnuncio.deleteMany({ where: { userId: id } });
    await prisma.coProdutorProduto.deleteMany({ where: { usuarioId: id } });

    const produtos = await prisma.produto.findMany({ where: { userId: id }, select: { id: true } });
    const produtoIds = produtos.map(p => p.id);

    if (produtoIds.length > 0) {
      const planos = await prisma.planoOferta.findMany({ where: { produtoId: { in: produtoIds } }, select: { id: true } });
      const planoIds = planos.map(p => p.id);
      if (planoIds.length > 0) {
        await prisma.planoOrderBump.deleteMany({ where: { planoId: { in: planoIds } } });
      }
      await prisma.planoOferta.deleteMany({ where: { produtoId: { in: produtoIds } } });
      await prisma.pixelConversao.deleteMany({ where: { produtoId: { in: produtoIds } } });
      await prisma.campanha.deleteMany({ where: { produtoId: { in: produtoIds } } });
      await prisma.paginaOferta.deleteMany({ where: { produtoId: { in: produtoIds } } });
      await prisma.coProdutorProduto.deleteMany({ where: { produtoId: { in: produtoIds } } });

      const vendas = await prisma.venda.findMany({ where: { produtoId: { in: produtoIds } }, select: { id: true } });
      const vendaIds = vendas.map(v => v.id);
      if (vendaIds.length > 0) {
        await prisma.carteira.deleteMany({ where: { vendaId: { in: vendaIds } } });
        await prisma.transacao.deleteMany({ where: { vendaId: { in: vendaIds } } });
        await prisma.comissao.deleteMany({ where: { vendaId: { in: vendaIds } } });
      }
      await prisma.venda.deleteMany({ where: { produtoId: { in: produtoIds } } });
      await prisma.produto.deleteMany({ where: { userId: id } });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}