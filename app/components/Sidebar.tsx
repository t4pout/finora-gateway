'use client';
import Image from 'next/image';
import { Bell, Link2, CreditCard, FileText, ShoppingCart, LayoutDashboard, DollarSign, Percent, ArrowDownToLine, Cpu, Home, Package, Wallet, Package2, Clock, Store, BarChart2, BarChart3, TrendingUp, Wrench, Shield, UserCog, Zap, LogOut, ShoppingBag, ChevronDown, Moon, Sun, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarProps {
  user: {
    nome: string;
    role?: string;
    finoraUtmAtivo?: boolean;
    verificado?: boolean;
    statusVerificacao?: string;
  } | null;
  onLogout: () => void;
}
export default function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [vendasOpen, setVendasOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [temaDark, setTemaDark] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const tema = localStorage.getItem('finora-tema');
    setTemaDark(tema === 'dark');
  }, []);

  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  const alternarTema = () => {
    const novoTema = !temaDark;
    setTemaDark(novoTema);
    if (novoTema) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('finora-tema', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('finora-tema', 'light');
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role === 'ADMIN') return;
    const rotasLiberadas = ['/dashboard/verificacao', '/dashboard/perfil'];
    const estaEmRotaLiberada = rotasLiberadas.some(r => pathname.startsWith(r));
    if (!estaEmRotaLiberada && !user.verificado && user.statusVerificacao !== 'APROVADO') {
      router.replace('/dashboard/verificacao');
    }
  }, [user, pathname]);

  const isActive = (path: string) => pathname === path;
  const isActivePrefix = (path: string) => pathname.startsWith(path);

  return (
    <>
      {/* Botão hambúrguer - só aparece no mobile */}
      <button
        onClick={() => setMenuAberto(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 bg-white dark:bg-finoradark-card border border-gray-200 dark:border-finoradark-border rounded-lg flex items-center justify-center shadow-sm"
      >
        <Menu size={20} className="text-gray-700 dark:text-finoradark-text" />
      </button>

      {/* Overlay escuro - só aparece quando o menu mobile está aberto */}
      {menuAberto && (
        <div
          onClick={() => setMenuAberto(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
        />
      )}

      <aside className={`
        w-64 bg-white dark:bg-finoradark-card border-r border-gray-200 dark:border-finoradark-border flex flex-col
        fixed lg:static inset-y-0 left-0 z-50
        transform transition-transform duration-200 ease-in-out
        ${menuAberto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-finoradark-border">
          <Link href="/dashboard" className="block">
            <Image
              src="/logo.png"
              alt="Finora - Pagamentos que fluem"
              width={180}
              height={50}
              priority
              className="w-auto h-12"
            />
          </Link>
          <button onClick={() => setMenuAberto(false)} className="lg:hidden p-1 text-gray-500 dark:text-finoradark-textmuted">
            <X size={22} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-finoradark-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-finoradark-card2 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 dark:text-finoradark-glow font-bold text-lg">
                {user?.nome.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-finoradark-text truncate">{user?.nome}</div>
              {user?.role === 'ADMIN' && (
                <div className="text-xs text-purple-500 dark:text-finoradark-glow font-medium">Administrador</div>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 pt-3">
          <button
            onClick={alternarTema}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-finoradark-card2 border border-gray-200 dark:border-finoradark-border transition"
          >
            <div className="flex items-center space-x-2">
              {temaDark ? <Moon size={16} className="text-finoradark-glow" /> : <Sun size={16} className="text-gray-600" />}
              <span className="text-sm font-medium text-gray-700 dark:text-finoradark-text">{temaDark ? 'Modo escuro' : 'Modo claro'}</span>
            </div>
            <div className={`w-9 h-5 rounded-full transition relative ${temaDark ? 'bg-finoradark-glow' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${temaDark ? 'left-4.5' : 'left-0.5'}`}></div>
            </div>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/dashboard">
            <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${
              isActive('/dashboard')
                ? 'bg-purple-50 dark:bg-finoradark-card2 text-purple-600 dark:text-finoradark-glow font-semibold'
                : 'text-gray-700 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'
            }`}>
              <Home size={20} />
              <span>Página Inicial</span>
            </div>
          </Link>

          <Link href="/dashboard/produtos">
            <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${
              isActivePrefix('/dashboard/produtos')
                ? 'bg-purple-50 dark:bg-finoradark-card2 text-purple-600 dark:text-finoradark-glow font-semibold'
                : 'text-gray-700 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'
            }`}>
              <Package size={20} />
              <span>Produtos</span>
            </div>
          </Link>

          <div>
            <button
              onClick={() => setVendasOpen(!vendasOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-finoradark-card2 text-gray-700 dark:text-finoradark-textmuted font-medium transition"
            >
              <div className="flex items-center space-x-3">
                <DollarSign size={20} />
                <span>Vendas</span>
              </div>
              <ChevronDown size={16} className={`transition-transform ${vendasOpen ? 'rotate-180' : ''}`} />
            </button>

            {vendasOpen && (
              <div className="ml-4 mt-1 space-y-1">
                <Link href="/dashboard/vendas">
                    <div className={`flex items-center space-x-3 pl-8 pr-4 py-2 rounded-lg text-sm font-medium transition ${isActive('/dashboard/vendas') ? 'bg-purple-50 dark:bg-finoradark-card2 text-purple-600 dark:text-finoradark-glow' : 'text-gray-600 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'}`}>
                      <CreditCard size={16} /><span>Todas as Vendas</span>
                    </div>
                  </Link>
                  <Link href="/dashboard/financeiro">
                    <div className={`flex items-center space-x-3 pl-8 pr-4 py-2 rounded-lg text-sm font-medium transition ${isActive('/dashboard/financeiro') ? 'bg-purple-50 dark:bg-finoradark-card2 text-purple-600 dark:text-finoradark-glow' : 'text-gray-600 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'}`}>
                      <FileText size={16} /><span>Financeiro</span>
                    </div>
                  </Link>
                  <Link href="/dashboard/vendas/utm">
                    <div className={`flex items-center space-x-3 pl-8 pr-4 py-2 rounded-lg text-sm font-medium transition ${isActive('/dashboard/relatorio-utm') ? 'bg-purple-50 dark:bg-finoradark-card2 text-purple-600 dark:text-finoradark-glow' : 'text-gray-600 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'}`}>
                      <Link2 size={16} /><span>Relatório UTM</span>
                    </div>
                  </Link>
                  <Link href="/dashboard/vendas/carrinhos">
                    <div className={`flex items-center space-x-3 pl-8 pr-4 py-2 rounded-lg text-sm font-medium transition ${isActive('/dashboard/carrinhos-abandonados') ? 'bg-purple-50 dark:bg-finoradark-card2 text-purple-600 dark:text-finoradark-glow' : 'text-gray-600 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'}`}>
                      <ShoppingCart size={16} /><span>Carrinhos Abandonados</span>
                    </div>
                  </Link>
              </div>
            )}
          </div>

          <Link href="/dashboard/carteira">
            <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${
              isActive('/dashboard/carteira')
                ? 'bg-purple-50 dark:bg-finoradark-card2 text-purple-600 dark:text-finoradark-glow font-semibold'
                : 'text-gray-700 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'
            }`}>
              <Wallet size={20} />
              <span>Carteira</span>
            </div>
          </Link>

          <Link href="/dashboard/pad">
            <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${
              isActivePrefix('/dashboard/pad')
                ? 'bg-purple-50 dark:bg-finoradark-card2 text-purple-600 dark:text-finoradark-glow font-semibold'
                : 'text-gray-700 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'
            }`}>
              <Package size={20} />
              <span>PAD</span>
            </div>
          </Link>

          <Link href="/dashboard/notificacoes">
            <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${
              isActive('/dashboard/notificacoes')
                ? 'bg-purple-50 dark:bg-finoradark-card2 text-purple-600 dark:text-finoradark-glow font-semibold'
                : 'text-gray-700 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'
            }`}>
              <Bell size={20} />
              <span>Notificações</span>
            </div>
          </Link>

          <Link href="/dashboard/solicitacoes-afiliacao">
            <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${
              isActive('/dashboard/solicitacoes-afiliacao')
                ? 'bg-purple-50 dark:bg-finoradark-card2 text-purple-600 dark:text-finoradark-glow font-semibold'
                : 'text-gray-700 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'
            }`}>
              <Clock size={20} />
              <span>Solicitações</span>
            </div>
          </Link>

          <Link href="/dashboard/mercado">
            <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${
              isActive('/dashboard/mercado')
                ? 'bg-purple-50 dark:bg-finoradark-card2 text-purple-600 dark:text-finoradark-glow font-semibold'
                : 'text-gray-700 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'
            }`}>
              <ShoppingBag size={20} />
              <span>Mercado</span>
            </div>
          </Link>

          <Link href="/dashboard/relatorios">
            <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${
              isActive('/dashboard/relatorios')
                ? 'bg-purple-50 dark:bg-finoradark-card2 text-purple-600 dark:text-finoradark-glow font-semibold'
                : 'text-gray-700 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'
            }`}>
              <BarChart3 size={20} />
              <span>Relatórios</span>
            </div>
          </Link>
          
          <Link href={user?.finoraUtmAtivo ? '/finora-utm' : '/dashboard/finora-utm/planos'}>
            <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold transition ${
              isActivePrefix('/finora-utm')
                ? 'bg-purple-600 dark:bg-finoradark-glow text-white'
                : 'bg-purple-50 dark:bg-finoradark-card2 text-purple-700 dark:text-finoradark-glow hover:bg-purple-100 dark:hover:bg-finoradark-border'
            }`}>
              <TrendingUp size={20} />
              <span>Finora UTM</span>
              {!user?.finoraUtmAtivo && (
                <span className="ml-auto text-xs bg-purple-200 dark:bg-finoradark-border text-purple-800 dark:text-finoradark-text px-2 py-0.5 rounded-full">Pro</span>
              )}
            </div>
          </Link>
          <div className="border-t border-gray-200 dark:border-finoradark-border my-1"></div>

          <Link href="/dashboard/testes-ab">
            <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${
              isActive('/dashboard/testes-ab')
                ? 'bg-purple-50 dark:bg-finoradark-card2 text-purple-600 dark:text-finoradark-glow font-semibold'
                : 'text-gray-700 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'
            }`}>
              <Zap size={20} />
              <span>Testes A/B</span>
            </div>
          </Link>
           
           <Link href="/dashboard/integracoes">
            <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${
              isActivePrefix('/dashboard/integracoes')
                ? 'bg-purple-50 dark:bg-finoradark-card2 text-purple-600 dark:text-finoradark-glow font-semibold'
                : 'text-gray-700 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'
            }`}>
              <Link2 size={20} />
              <span>Integrações</span>
            </div>
          </Link>
          
<Link href="/dashboard/ferramentas">
            <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${
              isActivePrefix('/dashboard/ferramentas')
                ? 'bg-purple-50 dark:bg-finoradark-card2 text-purple-600 dark:text-finoradark-glow font-semibold'
                : 'text-gray-700 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'
            }`}>
              <Zap size={20} />
              <span>Ferramentas</span>
            </div>
          </Link>

          {/* Menu Admin expandível */}
          {user?.role === 'ADMIN' && (
            <>
              <div className="border-t border-gray-200 dark:border-finoradark-border my-2"></div>
              <div>
                <button
                  onClick={() => setAdminOpen(!adminOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-semibold transition ${
                    isActivePrefix('/dashboard/admin')
                      ? 'bg-purple-50 dark:bg-finoradark-card2 text-purple-600 dark:text-finoradark-glow'
                      : 'text-purple-600 dark:text-finoradark-glow hover:bg-purple-50 dark:hover:bg-finoradark-card2'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Shield size={20} />
                    <span>Admin</span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${adminOpen ? 'rotate-180' : ''}`} />
                </button>

                {adminOpen && (
                  <div className="ml-4 mt-1 space-y-1">
                    <Link href="/dashboard/admin">
                    <div className={`flex items-center space-x-3 pl-8 pr-4 py-2 rounded-lg text-sm font-medium transition ${isActive('/dashboard/admin') ? 'bg-purple-50 dark:bg-finoradark-card2 text-purple-600 dark:text-finoradark-glow' : 'text-gray-600 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'}`}>
                      <LayoutDashboard size={16} /><span>Painel</span>
                    </div>
                  </Link>
                  <Link href="/dashboard/admin/documentos">
                    <div className={`flex items-center space-x-3 pl-8 pr-4 py-2 rounded-lg text-sm font-medium transition ${isActive('/dashboard/admin/documentos') ? 'bg-purple-50 dark:bg-finoradark-card2 text-purple-600 dark:text-finoradark-glow' : 'text-gray-600 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'}`}>
                      <FileText size={16} /><span>Documentos</span>
                    </div>
                  </Link>
                  <Link href="/dashboard/admin/receita">
                    <div className={`flex items-center space-x-3 pl-8 pr-4 py-2 rounded-lg text-sm font-medium transition ${isActive('/dashboard/admin/receita') ? 'bg-purple-50 dark:bg-finoradark-card2 text-purple-600 dark:text-finoradark-glow' : 'text-gray-600 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'}`}>
                      <DollarSign size={16} /><span>Receita</span>
                    </div>
                  </Link>
                  <Link href="/dashboard/admin/taxas">
                    <div className={`flex items-center space-x-3 pl-8 pr-4 py-2 rounded-lg text-sm font-medium transition ${isActive('/dashboard/admin/taxas') ? 'bg-purple-50 dark:bg-finoradark-card2 text-purple-600 dark:text-finoradark-glow' : 'text-gray-600 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'}`}>
                      <Percent size={16} /><span>Taxas</span>
                    </div>
                  </Link>
                  <Link href="/dashboard/admin/saques">
                    <div className={`flex items-center space-x-3 pl-8 pr-4 py-2 rounded-lg text-sm font-medium transition ${isActive('/dashboard/admin/saques') ? 'bg-purple-50 dark:bg-finoradark-card2 text-purple-600 dark:text-finoradark-glow' : 'text-gray-600 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'}`}>
                      <ArrowDownToLine size={16} /><span>Saques</span>
                    </div>
                  </Link>
                  <Link href="/dashboard/admin/gateways">
                    <div className={`flex items-center space-x-3 pl-8 pr-4 py-2 rounded-lg text-sm font-medium transition ${isActive('/dashboard/admin/gateways') ? 'bg-purple-50 dark:bg-finoradark-card2 text-purple-600 dark:text-finoradark-glow' : 'text-gray-600 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2'}`}>
                      <Cpu size={16} /><span>Gateways</span>
                    </div>
                  </Link>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="border-t border-gray-200 dark:border-finoradark-border my-4"></div>

          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-finoradark-card2 text-red-600 font-medium transition"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-finoradark-border">
          <div className="text-xs text-gray-500 dark:text-finoradark-textmuted text-center">© 2026 Finora</div>
        </div>
      </aside>
    </>
  );
}