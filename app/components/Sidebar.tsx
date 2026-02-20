'use client';

import Image from 'next/image';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Package, DollarSign, LogOut, ShoppingBag,
  BarChart3, Zap, Wallet, Shield,
  ChevronDown, Clock
} from 'lucide-react';

interface SidebarProps {
  user: {
    nome: string;
    role?: string;
  } | null;
  onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [vendasOpen, setVendasOpen] = useState(false);

  const isActive = (path: string) => pathname === path;
  const isActivePrefix = (path: string) => pathname.startsWith(path);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <Link href="/dashboard" className="p-6 border-b border-gray-200 block">
        <Image
          src="/logo.png"
          alt="Finora - Pagamentos que fluem"
          width={180}
          height={50}
          priority
          className="w-auto h-12"
        />
      </Link>

      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-purple-600 font-bold text-lg">
              {user?.nome.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{user?.nome}</div>
            {user?.role === 'ADMIN' && (
              <div className="text-xs text-purple-500 font-medium">Administrador</div>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <Link href="/dashboard">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${
            isActive('/dashboard')
              ? 'bg-purple-50 text-purple-600 font-semibold'
              : 'text-gray-700 hover:bg-gray-50'
          }`}>
            <Home size={20} />
            <span>Página Inicial</span>
          </div>
        </Link>

        <Link href="/dashboard/produtos">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${
            isActivePrefix('/dashboard/produtos')
              ? 'bg-purple-50 text-purple-600 font-semibold'
              : 'text-gray-700 hover:bg-gray-50'
          }`}>
            <Package size={20} />
            <span>Produtos</span>
          </div>
        </Link>

        <div>
          <button
            onClick={() => setVendasOpen(!vendasOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"
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
                <div className={`flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition ${
                  isActive('/dashboard/vendas')
                    ? 'bg-purple-50 text-purple-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}>
                  <span>💳 Todas as Vendas</span>
                </div>
              </Link>
              <Link href="/dashboard/financeiro">
                <div className={`flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition ${
                  isActive('/dashboard/financeiro')
                    ? 'bg-purple-50 text-purple-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}>
                  <span>📈 Financeiro</span>
                </div>
              </Link>
            </div>
          )}
        </div>

        <Link href="/dashboard/carteira">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${
            isActive('/dashboard/carteira')
              ? 'bg-purple-50 text-purple-600 font-semibold'
              : 'text-gray-700 hover:bg-gray-50'
          }`}>
            <Wallet size={20} />
            <span>Carteira</span>
          </div>
        </Link>

        <Link href="/dashboard/pad">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${
            isActivePrefix('/dashboard/pad')
              ? 'bg-purple-50 text-purple-600 font-semibold'
              : 'text-gray-700 hover:bg-gray-50'
          }`}>
            <Package size={20} />
            <span>PAD</span>
          </div>
        </Link>

        <Link href="/dashboard/notificacoes">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${
            isActive('/dashboard/notificacoes')
              ? 'bg-purple-50 text-purple-600 font-semibold'
              : 'text-gray-700 hover:bg-gray-50'
          }`}>
            <Bell size={20} />
            <span>Notificações</span>
          </div>
        </Link>

        <Link href="/dashboard/solicitacoes-afiliacao">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${
            isActive('/dashboard/solicitacoes-afiliacao')
              ? 'bg-purple-50 text-purple-600 font-semibold'
              : 'text-gray-700 hover:bg-gray-50'
          }`}>
            <Clock size={20} />
            <span>Solicitações</span>
          </div>
        </Link>

        <Link href="/dashboard/mercado">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${
            isActive('/dashboard/mercado')
              ? 'bg-purple-50 text-purple-600 font-semibold'
              : 'text-gray-700 hover:bg-gray-50'
          }`}>
            <ShoppingBag size={20} />
            <span>Mercado</span>
          </div>
        </Link>

        <Link href="/dashboard/relatorios">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${
            isActive('/dashboard/relatorios')
              ? 'bg-purple-50 text-purple-600 font-semibold'
              : 'text-gray-700 hover:bg-gray-50'
          }`}>
            <BarChart3 size={20} />
            <span>Relatórios</span>
          </div>
        </Link>

        <Link href="/dashboard/testes-ab">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition ${
            isActive('/dashboard/testes-ab')
              ? 'bg-purple-50 text-purple-600 font-semibold'
              : 'text-gray-700 hover:bg-gray-50'
          }`}>
            <Zap size={20} />
            <span>Testes A/B</span>
          </div>
        </Link>

        <div className="border-t border-gray-200 my-4"></div>

        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 font-medium transition"
        >
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </nav>

      {user?.role === 'ADMIN' && (
        <div className="p-4 border-t border-gray-200">
          <Link href="/dashboard/admin">
            <div className={`flex items-center justify-center space-x-3 px-4 py-3 rounded-xl font-semibold transition ${
              isActivePrefix('/dashboard/admin')
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg'
            }`}>
              <Shield size={20} />
              <span>Painel Administrativo</span>
            </div>
          </Link>
        </div>
      )}

      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">© 2026 Finora</div>
      </div>
    </aside>
  );
}