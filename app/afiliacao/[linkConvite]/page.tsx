'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Package, DollarSign, FileText, AlertCircle } from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  imagem: string;
  comissaoPadrao: number;
  detalhesAfiliacao: string;
  regrasAfiliacao: string;
  aprovacaoAutomatica: boolean;
  user: {
    nome: string;
  };
}

export default function SolicitarAfiliacaoPage() {
  const params = useParams();
  const router = useRouter();
  const linkConvite = params.linkConvite as string;
  
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    carregarProduto();
  }, [linkConvite]);

  const carregarProduto = async () => {
    try {
      const response = await fetch(`/api/afiliacao/${linkConvite}`);
      
      if (!response.ok) {
        const data = await response.json();
        setErro(data.error || 'Link inválido');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setProduto(data.produto);
    } catch (error) {
      setErro('Erro ao carregar informações');
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Você precisa estar logado! Redirecionando...');
      router.push(`/auth/login?redirect=/afiliacao/${linkConvite}`);
      return;
    }

    setEnviando(true);

    try {
      const response = await fetch('/api/solicitacoes-afiliacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          produtoId: produto?.id,
          mensagem
        })
      });

      if (response.ok) {
        setSucesso(true);
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao solicitar');
      }
    } catch (error) {
      alert('Erro ao solicitar afiliação');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle size={64} className="mx-auto text-red-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Inválido</h1>
          <p className="text-gray-600 mb-6">{erro}</p>
          <a href="/" className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition inline-block">
            Voltar para Home
          </a>
        </div>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <CheckCircle size={64} className="mx-auto text-green-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {produto?.aprovacaoAutomatica ? 'Parabéns! 🎉' : 'Solicitação Enviada!'}
          </h1>
          <p className="text-gray-600 mb-6">
            {produto?.aprovacaoAutomatica 
              ? 'Sua afiliação foi aprovada automaticamente! Acesse seu painel para obter seu link de afiliado.'
              : 'Sua solicitação foi enviada ao produtor. Você receberá uma notificação quando for aprovada.'}
          </p>
          <a href="/dashboard" className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition inline-block">
            Ir para Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Programa de Afiliados</h1>
            <p className="text-purple-200">Seja um parceiro e ganhe comissões!</p>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="grid md:grid-cols-2">
              <div className="p-8">
                {produto?.imagem ? (
                  <img src={produto.imagem} alt={produto.nome} className="w-full h-64 object-cover rounded-xl mb-6" />
                ) : (
                  <div className="w-full h-64 bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl flex items-center justify-center mb-6">
                    <Package size={64} className="text-white" />
                  </div>
                )}

                <h2 className="text-2xl font-bold text-gray-900 mb-2">{produto?.nome}</h2>
                <p className="text-gray-600 mb-4">{produto?.descricao}</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <div className="text-sm text-purple-600 mb-1">Comissão</div>
                    <div className="text-2xl font-bold text-purple-600">{produto?.comissaoPadrao}%</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl">
                    <div className="text-sm text-green-600 mb-1">Preço</div>
                    <div className="text-2xl font-bold text-green-600">R$ {produto?.preco.toFixed(2).replace('.', ',')}</div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl mb-4">
                  <div className="text-sm font-semibold text-blue-900 mb-1">💰 Ganhe por Venda</div>
                  <div className="text-xl font-bold text-blue-600">
                    R$ {((produto?.preco || 0) * (produto?.comissaoPadrao || 0) / 100).toFixed(2).replace('.', ',')}
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <div className="font-semibold mb-1">Produtor:</div>
                  <div>{produto?.user.nome}</div>
                </div>
              </div>

              <div className="p-8 bg-gray-50">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Solicitar Afiliação</h3>

                {produto?.detalhesAfiliacao && (
                  <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText size={20} className="text-purple-600" />
                      <div className="font-semibold text-gray-900">Sobre o Programa</div>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{produto.detalhesAfiliacao}</p>
                  </div>
                )}

                {produto?.regrasAfiliacao && (
                  <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle size={20} className="text-yellow-600" />
                      <div className="font-semibold text-yellow-900">Regras e Observações</div>
                    </div>
                    <p className="text-sm text-yellow-700 whitespace-pre-wrap">{produto.regrasAfiliacao}</p>
                  </div>
                )}

                <form onSubmit={handleSolicitar}>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Mensagem (opcional)
                    </label>
                    <textarea
                      rows={4}
                      value={mensagem}
                      onChange={(e) => setMensagem(e.target.value)}
                      placeholder="Conte um pouco sobre você e por que quer se tornar afiliado..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enviando ? 'Enviando...' : produto?.aprovacaoAutomatica ? '🚀 Ativar Afiliação' : '📤 Solicitar Afiliação'}
                  </button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    {produto?.aprovacaoAutomatica 
                      ? 'Sua afiliação será aprovada automaticamente!'
                      : 'Sua solicitação será analisada pelo produtor.'}
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
