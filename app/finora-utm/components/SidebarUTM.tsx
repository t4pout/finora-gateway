'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Link2, BarChart3, Plug, ArrowLeft, TrendingUp } from 'lucide-react';

interface SidebarUTMProps {
  user: { nome: string; role?: string } | null;
}

export default function SidebarUTM({ user }: SidebarUTMProps) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  const isActivePrefix = (path: string) => pathname.startsWith(path);

  return (
    <aside className="w-60 bg-gray-950 flex flex-col min-h-screen">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">Finora UTM</div>
            <div className="text-gray-500 text-xs">Rastreamento de campanhas</div>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-7 h-7 bg-purple-800 rounded-full flex items-center justify-center text-xs text-white font-bold">
            {user?.nome?.charAt(0).toUpperCase()}
          </div>
          <span className="text-gray-300 text-xs truncate">{user?.nome}</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider px-3 py-2">Principal</p>

        <Link href="/finora-utm/dashboard">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
            isActive('/finora-utm/dashboard') || isActive('/finora-utm')
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}>
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </div>
        </Link>

        <Link href="/finora-utm/links">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
            isActivePrefix('/finora-utm/links')
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}>
            <Link2 size={16} />
            <span>Links UTM</span>
          </div>
        </Link>

        <Link href="/finora-utm/relatorios">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
            isActivePrefix('/finora-utm/relatorios')
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}>
            <BarChart3 size={16} />
            <span>Relatorios</span>
          </div>
        </Link>

        <Link href="/finora-utm/integracoes">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
            isActivePrefix('/finora-utm/integracoes')
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}>
            <Plug size={16} />
            <span>Integracoes</span>
          </div>
        </Link>

        <div className="border-t border-gray-800 my-3"></div>

        <Link href="/dashboard">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-800 hover:text-white transition cursor-pointer">
            <ArrowLeft size={16} />
            <span>Voltar ao Finora</span>
          </div>
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-600 text-center">Finora UTM v1.0</div>
      </div>
    </aside>
  );
}