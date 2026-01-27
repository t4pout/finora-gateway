'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Package, DollarSign, Users, LogOut, ShoppingBag, ArrowLeft, Edit, Trash2, Plus, Copy, Megaphone, Check, Wallet, Shield, BarChart3, Zap } from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  tipo: string;
  preco: number;
  comissao: number;
  imagem: string;
  status: string;
  publicoParaAfiliados: boolean;
  estoque?: number;
}

interface Campanha {
  id: string;
  nome: string;
  plataforma: string;
  linkCampanha: string;
  status: string;
  cliques: number;
  conversoes: number;
  pixelId?: string;
}

interface PaginaOferta {
  id: string;
  nome: string;
  link: string;
  testeAB: boolean;
  distribuicao: number;
  visualizacoes: number;
  conversoes: number;
}

interface User {
  nome: string;
  role?: string;
}

export default function DetalhesProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [abaSelecionada, setAbaSelecionada] = useState('detalhes');
  const [produto, setProduto] = useState<Produto | null>(null);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [paginasOfertas, setPaginasOfertas] = useState<PaginaOferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [produtoId, setProdutoId] = useState<string>('');
  const [criandoCampanha, setCriandoCampanha] = useState(false);
  const [criandoPagina, setCriandoPagina] = useState(false);
  const [configAfiliacao, setConfigAfiliacao] = useState({
    aceitaAfiliados: true,
    aprovacaoAutomatica: false,
    comissaoPadrao: 30,
    detalhesAfiliacao: '',
    regrasAfiliacao: '',
    linkConvite: ''
  });
  const [copiado, setCopiado] = useState(false);
  const [formCampanha, setFormCampanha] = useState({
    nome: '',
    plataforma: 'FACEBOOK',
    paginaOfertaId: '',
    testeAB: false,
    paginaAlternativaId: '',
    distribuicao: 50,
    pixelId: '',
    accessToken: '',
    eventToken: '',
    conversionId: ''
  });
  const [formPagina, setFormPagina] = useState({ nome: '', link: '' });
  const [configCheckout, setConfigCheckout] = useState({
    checkoutBanner: '',
    checkoutLogoSuperior: '',
    checkoutLogoInferior: '',
    checkoutCorPrimaria: '#9333ea',
    checkoutCorSecundaria: '#a855f7',
    checkoutCronometro: false,
    checkoutTempoMinutos: 15,
    checkoutMensagemUrgencia: '',
    checkoutProvaSocial: false,
    checkoutIntervaloPop: 8,
    checkoutProvaSocialGenero: 'AMBOS',
    checkoutAceitaPix: true,
    checkoutAceitaCartao: true,
    checkoutAceitaBoleto: true,
    checkoutMetodoPreferencial: 'PIX',
    checkoutCpfObrigatorio: true,
    checkoutTelObrigatorio: true,
    checkoutPedirEndereco: true
  });
const [planos, setPlanos] = useState<any[]>([]);
  const [modalPlano, setModalPlano] = useState<{ aberto: boolean; plano: any }>({ aberto: false, plano: null });
  const [modalConfig, setModalConfig] = useState<{ aberto: boolean; planoId: string | null }>({ aberto: false, planoId: null });
  const [configPlano, setConfigPlano] = useState({
    checkoutBanner: '',
    checkoutLogoSuperior: '',
    checkoutLogoInferior: '',
    checkoutCorPrimaria: '#9333ea',
    checkoutCorSecundaria: '#a855f7',
    checkoutCronometro: false,
    checkoutTempoMinutos: 15,
    checkoutMensagemUrgencia: '',
    checkoutProvaSocial: false,
    checkoutIntervaloPop: 8,
    checkoutProvaSocialGenero: 'AMBOS',
    checkoutAceitaPix: true,
    checkoutAceitaCartao: true,
    checkoutAceitaBoleto: true,
    checkoutMetodoPreferencial: 'PIX',
    checkoutCpfObrigatorio: true,
    checkoutTelObrigatorio: true,
    checkoutPedirEndereco: true
  });

  useEffect(() => {
    if (modalConfig.aberto && modalConfig.planoId) {
      carregarConfigPlano(modalConfig.planoId);
    }
  }, [modalConfig]);

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setProdutoId(resolvedParams.id);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (!produtoId) return;
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    if (userData) setUser(JSON.parse(userData));
    carregarDados();
    carregarConfigAfiliacao();
    carregarConfigCheckout();
    carregarPlanos();
  }, [produtoId, router]);

  const carregarDados = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const res1 = await fetch(`/api/produtos/${produtoId}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res1.ok) {
        const data = await res1.json();
        setProduto(data.produto);
      }
    } catch (e) { console.error(e); }
    
    try {
      const res2 = await fetch(`/api/campanhas?produtoId=${produtoId}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res2.ok) {
        const data = await res2.json();
        setCampanhas(data.campanhas || []);
      }
    } catch (e) { console.error(e); }
    
    try {
      const res3 = await fetch(`/api/paginas-ofertas?produtoId=${produtoId}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res3.ok) {
        const data = await res3.json();
        setPaginasOfertas(data.paginas || []);
      }
    } catch (e) { console.error(e); }
    
    setLoading(false);
  };

  const carregarConfigAfiliacao = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/produtos/${produtoId}/afiliacao`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.produto) {
          setConfigAfiliacao(data.produto);
        }
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };
const carregarPlanos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/planos?produtoId=${produtoId}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (response.ok) {
        const data = await response.json();
        setPlanos(data.planos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const salvarConfigAfiliacao = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/produtos/${produtoId}/afiliacao`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(configAfiliacao)
      });
      if (response.ok) {
        alert('Configurações salvas!');
        carregarConfigAfiliacao();
      }
    } catch (error) {
      alert('Erro ao salvar');
    }
  };

  const carregarConfigCheckout = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/produtos/${produtoId}/checkout-config`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfigCheckout(data.config);
        }
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const salvarConfigCheckout = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/produtos/${produtoId}/checkout-config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(configCheckout)
      });
      if (response.ok) {
        alert('✅ Configurações do checkout salvas!');
        carregarConfigCheckout();
      } else {
        alert('❌ Erro ao salvar');
      }
    } catch (error) {
      alert('❌ Erro ao salvar');
    }
  };

  const copiarLinkAfiliacao = () => {
    const link = `${window.location.origin}/afiliacao/${configAfiliacao.linkConvite}`;
    navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const togglePublico = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/produtos/${produtoId}/toggle-publico`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ publicoParaAfiliados: !produto?.publicoParaAfiliados })
      });
      carregarDados();
    } catch (e) { alert('Erro'); }
  };

  const handleExcluirProduto = async () => {
    if (!confirm('Excluir produto?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/produtos/${produtoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        alert('Excluído!');
        router.push('/dashboard/produtos');
      }
    } catch (e) { alert('Erro'); }
  };

  const handleCriarPagina = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/paginas-ofertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ ...formPagina, produtoId })
      });
      alert('Criada!');
      setCriandoPagina(false);
      setFormPagina({ nome: '', link: '' });
      carregarDados();
    } catch (e) { alert('Erro'); }
  };

  const handleExcluirPagina = async (id: string) => {
    if (!confirm('Excluir?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/paginas-ofertas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      alert('Excluída!');
      carregarDados();
    } catch (e) { alert('Erro'); }
  };

  const ativarTesteAB = async (paginaId: string, versaoOriginalId: string, distribuicao: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/paginas-ofertas/teste-ab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ paginaId, versaoOriginalId, distribuicao })
      });
      alert('Teste ativado!');
      carregarDados();
    } catch (e) { alert('Erro'); }
  };

  const handleCriarCampanha = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/campanhas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ ...formCampanha, produtoId })
      });
      alert('Criada!');
      setCriandoCampanha(false);
      setFormCampanha({ 
        nome: '', 
        plataforma: 'FACEBOOK', 
        paginaOfertaId: '',
        testeAB: false,
        paginaAlternativaId: '',
        distribuicao: 50, 
        pixelId: '', 
        accessToken: '', 
        eventToken: '', 
        conversionId: '' 
      });
      carregarDados();
    } catch (e) { alert('Erro'); }
  };

  const handleExcluirCampanha = async (id: string) => {
    if (!confirm('Excluir?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/campanhas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      alert('Excluída!');
      carregarDados();
    } catch (e) { alert('Erro'); }
  };

  const copiarLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert('Copiado!');
  };
const handleSalvarPlano = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const data = {
      nome: formData.get('nome'),
      descricao: formData.get('descricao'),
      preco: formData.get('preco'),
      ativo: formData.get('ativo') === 'on',
      produtoId
    };

    try {
      const token = localStorage.getItem('token');
      
      if (modalPlano.plano) {
        await fetch(`/api/planos/${modalPlano.plano.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(data)
        });
        alert('Plano atualizado!');
      } else {
        await fetch('/api/planos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(data)
        });
        alert('Plano criado!');
      }
      
      setModalPlano({ aberto: false, plano: null });
      carregarPlanos();
    } catch (error) {
      alert('Erro ao salvar plano');
    }
  };

  const handleExcluirPlano = async (id: string) => {
    if (!confirm('Excluir este plano?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/planos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      alert('Plano excluído!');
      carregarPlanos();
    } catch (error) {
      alert('Erro ao excluir plano');
    }
  };

  const handleUploadCheckout = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'banner' | 'logoSuperior' | 'logoInferior') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        if (tipo === 'banner') setConfigPlano({...configPlano, checkoutBanner: data.url});
        if (tipo === 'logoSuperior') setConfigPlano({...configPlano, checkoutLogoSuperior: data.url});
        if (tipo === 'logoInferior') setConfigPlano({...configPlano, checkoutLogoInferior: data.url});
        alert(`Upload realizado!`);
      }
    } catch (error) {
      alert('Erro ao fazer upload');
    }
  };

  const carregarConfigPlano = async (planoId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/planos/${planoId}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.plano) {
          setConfigPlano({
            checkoutBanner: data.plano.checkoutBanner || '',
            checkoutLogoSuperior: data.plano.checkoutLogoSuperior || '',
            checkoutLogoInferior: data.plano.checkoutLogoInferior || '',
            checkoutCorPrimaria: data.plano.checkoutCorPrimaria || '#9333ea',
            checkoutCorSecundaria: data.plano.checkoutCorSecundaria || '#a855f7',
            checkoutCronometro: data.plano.checkoutCronometro || false,
            checkoutTempoMinutos: data.plano.checkoutTempoMinutos || 15,
            checkoutMensagemUrgencia: data.plano.checkoutMensagemUrgencia || '',
            checkoutProvaSocial: data.plano.checkoutProvaSocial || false,
            checkoutIntervaloPop: data.plano.checkoutIntervaloPop || 8,
            checkoutProvaSocialGenero: data.plano.checkoutProvaSocialGenero || 'AMBOS', 
            checkoutAceitaPix: data.plano.checkoutAceitaPix ?? true,
            checkoutAceitaCartao: data.plano.checkoutAceitaCartao ?? true,
            checkoutAceitaBoleto: data.plano.checkoutAceitaBoleto ?? true,
            checkoutMetodoPreferencial: data.plano.checkoutMetodoPreferencial || 'PIX',
            checkoutCpfObrigatorio: data.plano.checkoutCpfObrigatorio ?? true,
            checkoutTelObrigatorio: data.plano.checkoutTelObrigatorio ?? true,
            checkoutPedirEndereco: data.plano.checkoutPedirEndereco ?? true
          });
        }
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleSalvarConfigPlano = async () => {
    if (!modalConfig.planoId) return;
    
    try {
      console.log('🔍 Salvando configPlano:', configPlano);
console.log('🔍 Gênero selecionado:', configPlano.checkoutProvaSocialGenero);
      const token = localStorage.getItem('token');
      await fetch(`/api/planos/${modalConfig.planoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(configPlano)
      });
      alert('✅ Configurações salvas!');
      setModalConfig({ aberto: false, planoId: null });
    } catch (error) {
      alert('❌ Erro ao salvar');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-purple-600 text-xl">Carregando...</div></div>;
  if (!produto) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-900">Não encontrado</div></div>;

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl"></div>
            <div>
              <div className="text-xl font-bold text-gray-900">Finora</div>
              <div className="text-xs text-gray-500">Pagamentos que fluem</div>
            </div>
          </div>
        </div>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-bold text-lg">{user?.nome.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{user?.nome}</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/dashboard"><div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"><Home size={20} /><span>Página Inicial</span></div></Link>
          <Link href="/dashboard/produtos"><div className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-purple-50 text-purple-600 font-semibold"><Package size={20} /><span>Produtos</span></div></Link>
          <Link href="/dashboard/vendas"><div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"><DollarSign size={20} /><span>Vendas</span></div></Link>
          <Link href="/dashboard/carteira"><div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"><Wallet size={20} /><span>Carteira</span></div></Link>
          <Link href="/dashboard/afiliados"><div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"><Users size={20} /><span>Afiliados</span></div></Link>
          <Link href="/dashboard/mercado"><div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"><ShoppingBag size={20} /><span>Mercado</span></div></Link>
          <Link href="/dashboard/relatorios"><div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"><BarChart3 size={20} /><span>Relatórios</span></div></Link>
          <Link href="/dashboard/testes-ab"><div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"><Zap size={20} /><span>Testes A/B</span></div></Link>
          <div className="border-t border-gray-200 my-4"></div>
          <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 font-medium transition"><LogOut size={20} /><span>Sair</span></button>
        </nav>

        {user?.role === 'ADMIN' && (
          <div className="p-4 border-t border-gray-200">
            <Link href="/dashboard/admin"><div className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"><Shield size={20} /><span>Administrativo</span></div></Link>
          </div>
        )}

        <div className="p-4 border-t border-gray-200"><div className="text-xs text-gray-500 text-center">© 2026 Finora</div></div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/produtos"><button className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition"><ArrowLeft size={20} /><span>Voltar</span></button></Link>
            <div><h1 className="text-2xl font-bold text-gray-900">{produto.nome}</h1></div>
          </div>
        </header>

        <div className="bg-white border-b border-gray-200">
          <div className="px-8">
            <div className="flex space-x-8">
              <button onClick={() => setAbaSelecionada('detalhes')} className={`py-4 px-2 border-b-2 font-semibold transition ${abaSelecionada === 'detalhes' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>📦 Detalhes</button>
              <button onClick={() => setAbaSelecionada('afiliacao')} className={`py-4 px-2 border-b-2 font-semibold transition ${abaSelecionada === 'afiliacao' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>🤝 Afiliação</button>
              <button onClick={() => setAbaSelecionada('paginas')} className={`py-4 px-2 border-b-2 font-semibold transition ${abaSelecionada === 'paginas' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>📄 Páginas</button>
              <button onClick={() => setAbaSelecionada('campanhas')} className={`py-4 px-2 border-b-2 font-semibold transition ${abaSelecionada === 'campanhas' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>📢 Campanhas</button>
              <button onClick={() => setAbaSelecionada('checkout')} className={`py-4 px-2 border-b-2 font-semibold transition ${abaSelecionada === 'checkout' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>🎨 Checkout</button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {abaSelecionada === 'detalhes' && (
            <>
              <div className="bg-white rounded-xl border border-gray-200 mb-8 p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    {produto.imagem ? <img src={produto.imagem} alt={produto.nome} className="w-full h-64 object-cover rounded-xl" /> : <div className="w-full h-64 bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl flex items-center justify-center"><Package size={64} className="text-white" /></div>}
                  </div>
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-3xl font-bold text-gray-900">{produto.nome}</h2>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${produto.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{produto.status}</span>
                    </div>
                    <p className="text-gray-600 mb-6">{produto.descricao}</p>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div><div className="text-sm text-gray-500">Preço</div><div className="text-2xl font-bold text-purple-600">R$ {produto.preco.toFixed(2).replace('.', ',')}</div></div>
                      <div><div className="text-sm text-gray-500">Comissão</div><div className="text-2xl font-bold text-gray-900">{produto.comissao}%</div></div>
                      <div><div className="text-sm text-gray-500">Tipo</div><div className="text-lg font-semibold text-gray-900">{produto.tipo}</div></div>
                      {produto.tipo === 'FISICO' && <div><div className="text-sm text-gray-500">Estoque</div><div className="text-lg font-semibold text-gray-900">{produto.estoque || 0}</div></div>}
                    </div>
                    <div className="flex items-center space-x-2 mb-6">
                      <input type="checkbox" checked={produto.publicoParaAfiliados} onChange={togglePublico} className="w-4 h-4 cursor-pointer" />
                      <span className="text-sm text-gray-600 cursor-pointer" onClick={togglePublico}>Público para afiliados</span>
                    </div>
                    <div className="flex gap-3">
                      <Link href={`/dashboard/produtos/${produto.id}`} className="flex-1"><button className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center space-x-2"><Edit size={20} /><span>Editar</span></button></Link>
                      <button onClick={handleExcluirProduto} className="px-6 py-3 border-2 border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition flex items-center space-x-2"><Trash2 size={20} /><span>Excluir</span></button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {abaSelecionada === 'afiliacao' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">⚙️ Configurações de Afiliação</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-gray-900">Aceitar Afiliados</div>
                      <div className="text-sm text-gray-600">Permitir que outros promovam seu produto</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={configAfiliacao.aceitaAfiliados} onChange={(e) => setConfigAfiliacao({...configAfiliacao, aceitaAfiliados: e.target.checked})} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {configAfiliacao.aceitaAfiliados && (
                    <>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-semibold text-gray-900">Aprovação Automática</div>
                          <div className="text-sm text-gray-600">Aceitar afiliados automaticamente sem revisão</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={configAfiliacao.aprovacaoAutomatica} onChange={(e) => setConfigAfiliacao({...configAfiliacao, aprovacaoAutomatica: e.target.checked})} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Comissão Padrão (%)</label>
                        <input type="number" min="0" max="100" value={configAfiliacao.comissaoPadrao} onChange={(e) => setConfigAfiliacao({...configAfiliacao, comissaoPadrao: parseFloat(e.target.value)})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Detalhes do Programa</label>
                        <textarea rows={4} value={configAfiliacao.detalhesAfiliacao} onChange={(e) => setConfigAfiliacao({...configAfiliacao, detalhesAfiliacao: e.target.value})} placeholder="Descreva os benefícios e vantagens de ser afiliado..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"></textarea>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Regras e Observações</label>
                        <textarea rows={4} value={configAfiliacao.regrasAfiliacao} onChange={(e) => setConfigAfiliacao({...configAfiliacao, regrasAfiliacao: e.target.value})} placeholder="Ex: Proibido spam, promessas falsas, etc..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"></textarea>
                      </div>

                      {configAfiliacao.linkConvite && (
                        <div className="p-6 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-purple-900">🔗 Link de Convite</div>
                            <button onClick={copiarLinkAfiliacao} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                              {copiado ? <Check size={16} /> : <Copy size={16} />}
                              <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
                            </button>
                          </div>
                          <div className="text-sm text-purple-700 break-all font-mono">
                            {`${typeof window !== 'undefined' ? window.location.origin : ''}/afiliacao/${configAfiliacao.linkConvite}`}
                          </div>
                        </div>
                      )}

                      <button onClick={salvarConfigAfiliacao} className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">
                        Salvar Configurações
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {abaSelecionada === 'paginas' && (
            <div>
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">📄 Páginas de Ofertas</h3>
                  <button onClick={() => setCriandoPagina(!criandoPagina)} className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center space-x-2"><Plus size={20} /><span>Nova</span></button>
                </div>
                {criandoPagina && (
                  <form onSubmit={handleCriarPagina} className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <input type="text" value={formPagina.nome} onChange={(e) => setFormPagina({...formPagina, nome: e.target.value})} placeholder="Nome" required className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900" />
                      <input type="url" value={formPagina.link} onChange={(e) => setFormPagina({...formPagina, link: e.target.value})} placeholder="https://..." required className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900" />
                    </div>
                    <button type="submit" className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">Adicionar</button>
                  </form>
                )}
                {paginasOfertas.length === 0 ? <div className="text-center py-12"><Package size={64} className="mx-auto text-gray-300 mb-4" /><p className="text-gray-600">Nenhuma página</p></div> : (
                  <div className="space-y-3">
                    {paginasOfertas.map((pag) => (
                      <div key={pag.id} className="p-4 border border-gray-200 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex-1"><h4 className="text-lg font-bold text-gray-900">{pag.nome}</h4><a href={pag.link} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-600 hover:underline">{pag.link}</a></div>
                          <div className="flex gap-2">
                            {!pag.testeAB && paginasOfertas.length > 1 && <button onClick={() => { const outra = paginasOfertas.find(p => p.id !== pag.id); if (outra) { const d = prompt('Distribuição (0-100):', '50'); if (d) ativarTesteAB(pag.id, outra.id, parseInt(d)); }}} className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm font-semibold">Testar A/B</button>}
                            {pag.testeAB && <div className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">🧪 {pag.distribuicao}% • {pag.visualizacoes}v • {pag.conversoes}c</div>}
                            <button onClick={() => handleExcluirPagina(pag.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {abaSelecionada === 'campanhas' && (
            <div>
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3"><Megaphone size={24} className="text-purple-600" /><h3 className="text-2xl font-bold text-gray-900">Campanhas</h3></div>
                  <button onClick={() => setCriandoCampanha(!criandoCampanha)} className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center space-x-2"><Plus size={20} /><span>Nova</span></button>
                </div>
                {criandoCampanha && (
                  <form onSubmit={handleCriarCampanha} className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="mb-4">
                      <select value={formCampanha.paginaOfertaId} onChange={(e) => setFormCampanha({...formCampanha, paginaOfertaId: e.target.value})} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900">
                        <option value="">Selecione página</option>
                        {paginasOfertas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={formCampanha.testeAB} onChange={(e) => setFormCampanha({...formCampanha, testeAB: e.target.checked})} className="w-4 h-4" />
                        <span className="text-sm font-semibold text-gray-900">Ativar Teste A/B</span>
                      </label>
                    </div>
                    {formCampanha.testeAB && (
                      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="grid md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Página Alternativa *</label>
                            <select value={formCampanha.paginaAlternativaId} onChange={(e) => setFormCampanha({...formCampanha, paginaAlternativaId: e.target.value})} required={formCampanha.testeAB} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900">
                              <option value="">Selecione outra página</option>
                              {paginasOfertas.filter(p => p.id !== formCampanha.paginaOfertaId).map((pagina) => (
                                <option key={pagina.id} value={pagina.id}>{pagina.nome}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">% Tráfego Página Principal</label>
                            <input type="number" min="0" max="100" value={formCampanha.distribuicao} onChange={(e) => setFormCampanha({...formCampanha, distribuicao: parseInt(e.target.value) || 50})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900" />
                            <p className="text-xs text-gray-500 mt-1">Página alternativa receberá {100 - formCampanha.distribuicao}%</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <input type="text" value={formCampanha.nome} onChange={(e) => setFormCampanha({...formCampanha, nome: e.target.value})} placeholder="Nome" required className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900" />
                      <select value={formCampanha.plataforma} onChange={(e) => setFormCampanha({...formCampanha, plataforma: e.target.value})} className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900">
                        <option value="FACEBOOK">Facebook</option>
                        <option value="GOOGLE">Google</option>
                        <option value="TIKTOK">TikTok</option>
                        <option value="KWAI">Kwai</option>
                      </select>
                    </div>
                    {formCampanha.plataforma === 'FACEBOOK' && <div className="grid md:grid-cols-2 gap-4 mb-4"><input type="text" value={formCampanha.pixelId || ""} onChange={(e) => setFormCampanha({...formCampanha, pixelId: e.target.value})} placeholder="Pixel ID" className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900" /><input type="text" value={formCampanha.accessToken || ""} onChange={(e) => setFormCampanha({...formCampanha, accessToken: e.target.value})} placeholder="Access Token" className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900" /></div>}
                    {formCampanha.plataforma === 'GOOGLE' && <input type="text" value={formCampanha.conversionId || ""} onChange={(e) => setFormCampanha({...formCampanha, conversionId: e.target.value})} placeholder="Conversion ID" className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900 mb-4" />}
                    {formCampanha.plataforma === 'TIKTOK' && <div className="grid md:grid-cols-2 gap-4 mb-4"><input type="text" value={formCampanha.pixelId || ""} onChange={(e) => setFormCampanha({...formCampanha, pixelId: e.target.value})} placeholder="Pixel ID" className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900" /><input type="text" value={formCampanha.eventToken || ""} onChange={(e) => setFormCampanha({...formCampanha, eventToken: e.target.value})} placeholder="Event Token" className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900" /></div>}
                    {formCampanha.plataforma === 'KWAI' && <input type="text" value={formCampanha.pixelId || ""} onChange={(e) => setFormCampanha({...formCampanha, pixelId: e.target.value})} placeholder="Pixel ID" className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900 mb-4" />}
                    <button type="submit" className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">Criar</button>
                  </form>
                )}
                {campanhas.length === 0 ? <div className="text-center py-12"><Megaphone size={64} className="mx-auto text-gray-300 mb-4" /><p className="text-gray-600">Nenhuma campanha</p></div> : (
                  <div className="space-y-4">
                    {campanhas.map((c) => (
                      <div key={c.id} className="p-6 border border-gray-200 rounded-xl">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-bold text-gray-900">{c.nome}</h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">{c.plataforma}</span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${c.status === 'ATIVO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{c.status}</span>
                        </div>
                        <div className="flex items-center space-x-2 mb-3">
                          <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-mono text-gray-900">{c.linkCampanha}</code>
                          <button onClick={() => copiarLink(c.linkCampanha)} className="px-3 py-2 bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition"><Copy size={16} /></button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div>Cliques: <span className="font-semibold text-gray-900">{c.cliques}</span></div>
                            <div>Conversões: <span className="font-semibold text-green-600">{c.conversoes}</span></div>
                          </div>
                          <button onClick={() => handleExcluirCampanha(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {abaSelecionada === 'checkout' && (
            <div className="max-w-6xl mx-auto">
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">🎨 Checkout & Planos</h2>
                    <p className="text-gray-600">Crie planos com checkouts personalizados</p>
                  </div>
                  <button onClick={() => setModalPlano({ aberto: true, plano: null })} className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center space-x-2">
                    <Plus size={20} />
                    <span>Criar Plano</span>
                  </button>
                </div>

                {planos.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-xl">
                    <Package size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum plano criado</h3>
                    <p className="text-gray-600 mb-6">Crie diferentes planos com checkouts personalizados</p>
                    <button onClick={() => setModalPlano({ aberto: true, plano: null })} className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">
                      Criar Primeiro Plano
                    </button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {planos.map((plano) => (
                      <div key={plano.id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-400 transition">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{plano.nome}</h3>
                            {plano.descricao && <p className="text-sm text-gray-600 mb-2">{plano.descricao}</p>}
                            <div className="text-2xl font-bold text-purple-600">
                              R$ {plano.preco.toFixed(2).replace('.', ',')}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${plano.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {plano.ativo ? 'ATIVO' : 'INATIVO'}
                          </span>
                        </div>

                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">Link do Checkout</div>
                          <div className="flex items-center space-x-2">
                            <code className="flex-1 text-xs text-gray-900 truncate font-mono">
                              /checkout/{plano.linkUnico}
                            </code>
                            <button onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/checkout/${plano.linkUnico}`);
                              alert('Link copiado!');
                            }} className="p-2 hover:bg-gray-200 rounded transition">
                              <Copy size={16} className="text-gray-600" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
  <div className="flex gap-2">
    <button onClick={() => setModalConfig({ aberto: true, planoId: plano.id })} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-semibold">
      ⚙️ Configurar
    </button>
    <button onClick={() => setModalPlano({ aberto: true, plano })} className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
      <Edit size={16} />
    </button>
    <button onClick={() => handleExcluirPlano(plano.id)} className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition">
      <Trash2 size={16} />
    </button>
  </div>
  <button 
  onClick={() => {
    // Criar link do checkout PAD para este plano específico
    const link = `${window.location.origin}/pad/checkout-plano/${plano.id}`;
    navigator.clipboard.writeText(link);
    alert(`✅ Link do Checkout PAD copiado!\n\n${link}\n\nVocê pode usar este link para criar pedidos PAD com o valor de R$ ${plano.preco.toFixed(2)}`);
  }} 
  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold"
>
  💳 Copiar Link Checkout PAD
</button>
</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* MODAL CRIAR/EDITAR PLANO */}
              {modalPlano.aberto && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setModalPlano({ aberto: false, plano: null })}>
                  <div className="bg-white rounded-2xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      {modalPlano.plano ? 'Editar Plano' : 'Criar Novo Plano'}
                    </h3>
                    <form onSubmit={handleSalvarPlano} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Nome do Plano *</label>
                        <input type="text" defaultValue={modalPlano.plano?.nome} name="nome" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" placeholder="Ex: Plano Básico" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Descrição</label>
                        <textarea rows={3} defaultValue={modalPlano.plano?.descricao} name="descricao" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" placeholder="Opcional"></textarea>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Preço *</label>
                        <input type="number" step="0.01" defaultValue={modalPlano.plano?.preco} name="preco" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" placeholder="0.00" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked={modalPlano.plano?.ativo ?? true} name="ativo" className="w-4 h-4" />
                        <span className="text-sm text-gray-700">Plano ativo</span>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setModalPlano({ aberto: false, plano: null })} className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition">
                          Cancelar
                        </button>
                        <button type="submit" className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">
                          {modalPlano.plano ? 'Salvar' : 'Criar'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL CONFIGURAR CHECKOUT */}
              {modalConfig.aberto && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setModalConfig({ aberto: false, planoId: null })}>
                  <div className="bg-white rounded-2xl p-8 max-w-4xl w-full my-8" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">⚙️ Configurar Checkout do Plano</h3>
                    
                    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                      <div className="space-y-4">
                        <h4 className="font-bold text-gray-900">🎨 Imagens</h4>
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Banner</label>
                          <input type="file" accept="image/*" onChange={(e) => handleUploadCheckout(e, 'banner')} className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer" />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Logo Superior</label>
                            <input type="file" accept="image/*" onChange={(e) => handleUploadCheckout(e, 'logoSuperior')} className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Logo Inferior</label>
                            <input type="file" accept="image/*" onChange={(e) => handleUploadCheckout(e, 'logoInferior')} className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer" />
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Cor Primária</label>
                          <input type="color" value={configPlano.checkoutCorPrimaria} onChange={(e) => setConfigPlano({...configPlano, checkoutCorPrimaria: e.target.value})} className="w-full h-12 rounded-lg cursor-pointer" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">Cor Secundária</label>
                          <input type="color" value={configPlano.checkoutCorSecundaria} onChange={(e) => setConfigPlano({...configPlano, checkoutCorSecundaria: e.target.value})} className="w-full h-12 rounded-lg cursor-pointer" />
                        </div>
                      </div>
<div className="pt-4 border-t">
                        <h4 className="font-bold text-gray-900 mb-4">⏰ Cronômetro de Urgência</h4>
                        <div className="space-y-4">
                          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                            <div>
                              <div className="font-semibold text-gray-900">Ativar Cronômetro</div>
                              <div className="text-sm text-gray-600">Cria senso de urgência no checkout</div>
                            </div>
                            <input type="checkbox" checked={configPlano.checkoutCronometro} onChange={(e) => setConfigPlano({...configPlano, checkoutCronometro: e.target.checked})} className="w-5 h-5" />
                          </label>
                          {configPlano.checkoutCronometro && (
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Tempo (minutos)</label>
                                <input type="number" min="1" value={configPlano.checkoutTempoMinutos} onChange={(e) => setConfigPlano({...configPlano, checkoutTempoMinutos: parseInt(e.target.value)})} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900" />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Mensagem</label>
                                <input type="text" value={configPlano.checkoutMensagemUrgencia} onChange={(e) => setConfigPlano({...configPlano, checkoutMensagemUrgencia: e.target.value})} placeholder="Oferta expira em..." className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <h4 className="font-bold text-gray-900 mb-4">👥 Prova Social (Pop-ups)</h4>
                        <div className="space-y-4">
                          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                            <div>
                              <div className="font-semibold text-gray-900">Ativar Pop-ups de Compra</div>
                              <div className="text-sm text-gray-600">Ex: "João acabou de comprar..."</div>
                            </div>
                            <input type="checkbox" checked={configPlano.checkoutProvaSocial} onChange={(e) => setConfigPlano({...configPlano, checkoutProvaSocial: e.target.checked})} className="w-5 h-5" />
                          </label>
                          {configPlano.checkoutProvaSocial && (
                            <>
                              <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Intervalo (segundos)</label>
                                <input type="number" min="3" value={configPlano.checkoutIntervaloPop} onChange={(e) => setConfigPlano({...configPlano, checkoutIntervaloPop: parseInt(e.target.value)})} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900" />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Gênero dos Compradores</label>
                                <select value={configPlano.checkoutProvaSocialGenero} onChange={(e) => setConfigPlano({...configPlano, checkoutProvaSocialGenero: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900">
                                  <option value="AMBOS">👨👩 Ambos (Homens e Mulheres)</option>
                                  <option value="HOMENS">👨 Apenas Homens</option>
                                  <option value="MULHERES">👩 Apenas Mulheres</option>
                                </select>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <h4 className="font-bold text-gray-900 mb-4">💳 Métodos de Pagamento</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <label className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="checkbox" checked={configPlano.checkoutAceitaPix} onChange={(e) => setConfigPlano({...configPlano, checkoutAceitaPix: e.target.checked})} className="w-5 h-5" />
                            <span>PIX</span>
                          </label>
                          <label className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="checkbox" checked={configPlano.checkoutAceitaCartao} onChange={(e) => setConfigPlano({...configPlano, checkoutAceitaCartao: e.target.checked})} className="w-5 h-5" />
                            <span>Cartão</span>
                          </label>
                          <label className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="checkbox" checked={configPlano.checkoutAceitaBoleto} onChange={(e) => setConfigPlano({...configPlano, checkoutAceitaBoleto: e.target.checked})} className="w-5 h-5" />
                            <span>Boleto</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-6 border-t mt-6">
                      <button type="button" onClick={() => setModalConfig({ aberto: false, planoId: null })} className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition">
                        Cancelar
                      </button>
                      <button onClick={handleSalvarConfigPlano} className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">
                        💾 Salvar Configurações
                      </button>
                     </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}