'use client';

import Sidebar from '@/app/components/Sidebar';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Package,
  DollarSign,
  Users,
  LogOut,
  ShoppingBag,
  BarChart3, Zap,
  TrendingUp,
  Calendar,
  Award
, Shield , Wallet , ChevronDown } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface User {
  nome: string;
}

interface RelatorioData {
  vendasPorDia: Array<{ data: string; total: number; quantidade: number }>;
  produtosMaisVendidos: Array<{ nome: string; vendas: number; receita: number }>;
  campanhasTop: Array<{ nome: string; cliques: number; conversoes: number }>;
  totais: {
    receitaTotal: number;
    vendasTotal: number;
    ticketMedio: number;
  };
}

export default function RelatoriosPage() {
  const router = useRouter();
  const [vendasOpen, setVendasOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('30');
  const [dados, setDados] = useState<RelatorioData | null>(null);
  const [temaDark, setTemaDark] = useState(false);

  useEffect(() => {
    const checarTema = () => setTemaDark(document.documentElement.classList.contains('dark'));
    checarTema();
    const observer = new MutationObserver(checarTema);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }

    carregarRelatorio();
  }, [router, periodo]);

  const carregarRelatorio = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/relatorios?periodo=${periodo}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (response.ok) {
        const data = await response.json();
        setDados(data);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading || !dados) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-finoradark-bg flex items-center justify-center">
        <div className="text-purple-600 dark:text-finoradark-glow text-xl">Carregando relatórios...</div>
      </div>
    );
  }

  const corTexto = temaDark ? '#8b83b8' : '#374151';
  const corGrid = temaDark ? '#2a2350' : '#e5e7eb';

  // Dados para gráfico de vendas por dia
  const vendasChart = {
    labels: dados.vendasPorDia.map(v => new Date(v.data).toLocaleDateString('pt-BR')),
    datasets: [
      {
        label: 'Vendas (R$)',
        data: dados.vendasPorDia.map(v => v.total),
        borderColor: temaDark ? 'rgb(139, 123, 245)' : 'rgb(139, 63, 184)',
        backgroundColor: temaDark ? 'rgba(139, 123, 245, 0.15)' : 'rgba(139, 63, 184, 0.1)',
        tension: 0.4
      }
    ]
  };

  const chartOptionsComuns = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { labels: { color: corTexto } }
    },
    scales: {
      x: { grid: { color: corGrid }, ticks: { color: corTexto } },
      y: { grid: { color: corGrid }, ticks: { color: corTexto } }
    }
  };

  // Dados para gráfico de produtos
  const produtosChart = {
    labels: dados.produtosMaisVendidos.map(p => p.nome),
    datasets: [
      {
        label: 'Vendas',
        data: dados.produtosMaisVendidos.map(p => p.vendas),
        backgroundColor: [
          'rgba(139, 63, 184, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ]
      }
    ]
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-finoradark-bg">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white dark:bg-finoradark-card border-b border-gray-200 dark:border-finoradark-border px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-finoradark-text">Relatórios</h1>
              <p className="text-sm text-gray-500 dark:text-finoradark-textmuted">Análise detalhada de performance</p>
            </div>

            <div className="flex items-center space-x-2">
              <Calendar size={20} className="text-gray-400 dark:text-finoradark-textmuted" />
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-finoradark-border dark:bg-finoradark-card2 dark:text-finoradark-text rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="14">Últimos 14 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
              </select>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-finoradark-card rounded-xl p-6 border border-gray-200 dark:border-finoradark-border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-600 dark:text-finoradark-textmuted">Receita Total</div>
                <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-finoradark-text">
                R$ {dados.totais.receitaTotal.toFixed(2).replace('.', ',')}
              </div>
            </div>

            <div className="bg-white dark:bg-finoradark-card rounded-xl p-6 border border-gray-200 dark:border-finoradark-border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-600 dark:text-finoradark-textmuted">Total de Vendas</div>
                <DollarSign size={20} className="text-purple-600 dark:text-finoradark-glow" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-finoradark-text">
                {dados.totais.vendasTotal}
              </div>
            </div>

            <div className="bg-white dark:bg-finoradark-card rounded-xl p-6 border border-gray-200 dark:border-finoradark-border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-600 dark:text-finoradark-textmuted">Ticket Médio</div>
                <Award size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-finoradark-text">
                R$ {dados.totais.ticketMedio.toFixed(2).replace('.', ',')}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-finoradark-card rounded-xl p-6 border border-gray-200 dark:border-finoradark-border">
              <h3 className="text-lg font-bold text-gray-900 dark:text-finoradark-text mb-4">Vendas por Dia</h3>
              <Line data={vendasChart} options={chartOptionsComuns} />
            </div>

            <div className="bg-white dark:bg-finoradark-card rounded-xl p-6 border border-gray-200 dark:border-finoradark-border">
              <h3 className="text-lg font-bold text-gray-900 dark:text-finoradark-text mb-4">Produtos Mais Vendidos</h3>
              <Bar data={produtosChart} options={chartOptionsComuns} />
            </div>
          </div>

          <div className="bg-white dark:bg-finoradark-card rounded-xl p-6 border border-gray-200 dark:border-finoradark-border">
            <h3 className="text-lg font-bold text-gray-900 dark:text-finoradark-text mb-4">Top Campanhas</h3>
            {dados.campanhasTop.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 size={64} className="mx-auto text-gray-300 dark:text-finoradark-border mb-4" />
                <p className="text-gray-600 dark:text-finoradark-textmuted">Nenhuma campanha com dados ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dados.campanhasTop.map((campanha, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-finoradark-card2 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl font-bold text-purple-600 dark:text-finoradark-glow">#{index + 1}</div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-finoradark-text">{campanha.nome}</div>
                        <div className="text-sm text-gray-600 dark:text-finoradark-textmuted">
                          {campanha.cliques} cliques • {campanha.conversoes} conversões
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 dark:text-finoradark-textmuted">Taxa de Conversão</div>
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                        {campanha.cliques > 0 ? ((campanha.conversoes / campanha.cliques) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}