import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'seu-secret-super-seguro';

function verificarToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

async function processarSplitPagamento(
  vendaId: string,
  valor: number,
  metodoPagamento: string,
  vendedorId: string,
  afiliacaoId?: string
) {
  try {
    // Taxas padrão caso não tenha plano personalizado
    let taxaPercentual = 0;
    if (metodoPagamento === 'PIX') {
      taxaPercentual = 3.99;
    } else if (metodoPagamento === 'CARTAO') {
      taxaPercentual = 4.99;
    } else if (metodoPagamento === 'BOLETO') {
      taxaPercentual = 3.49;
    }

    const valorTaxa = (valor * taxaPercentual) / 100;
    let valorVendedor = valor - valorTaxa;
    let valorAfiliado = 0;

    if (afiliacaoId) {
      const afiliacao = await prisma.afiliacao.findUnique({
        where: { id: afiliacaoId }
      });

      if (afiliacao) {
        valorAfiliado = (valor * afiliacao.comissao) / 100;
        valorVendedor -= valorAfiliado;

        await prisma.transacao.create({
          data: {
            tipo: 'COMISSAO',
            valor: valorAfiliado,
            status: 'PENDENTE',
            userId: afiliacao.afiliadoId,
            vendaId
          }
        });
      }
    }

    await prisma.transacao.create({
      data: {
        tipo: 'VENDA',
        valor: valorVendedor,
        status: 'PENDENTE',
        userId: vendedorId,
        vendaId
      }
    });

    await prisma.transacao.create({
      data: {
        tipo: 'TAXA',
        valor: valorTaxa,
        status: 'APROVADO',
        userId: vendedorId,
        vendaId
      }
    });

  } catch (error) {
    console.error('Erro ao processar split:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      produtoId,
      valor,
      metodoPagamento,
      compradorNome,
      compradorEmail,
      compradorCpf,
      compradorTel,
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      status = 'PENDENTE'
    } = body;

    const produto = await prisma.produto.findUnique({
      where: { id: produtoId }
    });

    if (!produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    let afiliacaoId: string | undefined;
    const refCode = request.cookies.get('ref_code')?.value;
    
    if (refCode) {
      const afiliacao = await prisma.afiliacao.findUnique({
        where: { codigo: refCode }
      });
      
      if (afiliacao && afiliacao.status === 'ATIVO') {
        afiliacaoId = afiliacao.id;
      }
    }

    const venda = await prisma.venda.create({
      data: {
        produtoId,
        vendedorId: produto.userId,
        valor: parseFloat(valor),
        metodoPagamento,
        compradorNome,
        compradorEmail,
        compradorCpf,
        compradorTel,
        cep,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        status
      }
    });

    if (status === 'APROVADO') {
      await processarSplitPagamento(venda.id, parseFloat(valor), metodoPagamento, produto.userId, afiliacaoId);
    }

    const campanhaCode = request.cookies.get('campanha_code')?.value;
    if (campanhaCode) {
      try {
        await prisma.campanha.updateMany({
          where: {
            linkCampanha: {
              contains: `camp=${campanhaCode}`
            }
          },
          data: {
            conversoes: {
              increment: 1
            }
          }
        });
      } catch (error) {
        console.error('Erro ao registrar conversão de campanha:', error);
      }
    }

    const afiliadoCode = request.cookies.get('afiliado_code')?.value;
    if (afiliadoCode) {
      try {
        const afiliacao = await prisma.afiliacao.update({
          where: { codigo: afiliadoCode },
          data: {
            conversoes: {
              increment: 1
            }
          }
        });

        const valorComissao = venda.valor * (afiliacao.comissao / 100);
        await prisma.comissao.create({
          data: {
            valor: valorComissao,
            percentual: afiliacao.comissao,
            status: 'PENDENTE',
            vendaId: venda.id,
            afiliadoId: afiliacao.afiliadoId
          }
        });
      } catch (error) {
        console.error('Erro ao registrar conversão de afiliado:', error);
      }
    }

    if (refCode) {
      const afiliacao = await prisma.afiliacao.findUnique({
        where: { codigo: refCode }
      });
      
      if (afiliacao && afiliacao.status === 'ATIVO') {
        await prisma.afiliacao.update({
          where: { codigo: refCode },
          data: {
            conversoes: {
              increment: 1
            }
          }
        });

        const valorComissao = (parseFloat(valor) * afiliacao.comissao) / 100;
        
        await prisma.comissao.create({
          data: {
            vendaId: venda.id,
            afiliadoId: afiliacao.afiliadoId,
            valor: valorComissao,
            percentual: afiliacao.comissao,
            status: 'PENDENTE'
          }
        });
      }
    }

    return NextResponse.json({ venda, message: 'Venda criada!' });

  } catch (error) {
    console.error('Erro ao criar venda:', error);
    return NextResponse.json({ error: 'Erro ao criar venda' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = verificarToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar usuário para verificar se é admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Verificar parâmetro para ver todas as vendas (somente ADMIN)
    const { searchParams } = new URL(request.url);
    const verTodas = searchParams.get('todas') === 'true';

    // Se for admin E solicitou ver todas, mostra tudo
    // Caso contrário, mostra apenas suas vendas
    const vendas = await prisma.venda.findMany({
      where: (user?.role === 'ADMIN' && verTodas) ? {} : { vendedorId: userId },
      include: {
        produto: {
          select: {
            nome: true
          }
        },
         transacoes: {
          select: {
            valor: true
          }
        },
        _count: false
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ 
      success: true, 
      vendas,
      isAdmin: user?.role === 'ADMIN',
      mostrandoTodas: (user?.role === 'ADMIN' && verTodas)
    });
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    return NextResponse.json({ error: 'Erro ao buscar vendas' }, { status: 500 });
  }
}