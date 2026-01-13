'use client';

import Sidebar from '@/app/components/Sidebar';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Package, DollarSign, Users, LogOut, ShoppingBag, BarChart3, Zap, Wallet, Shield, TrendingUp, TrendingDown, CreditCard, Clock, Banknote , ChevronDown } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Stats {
  receitaBruta: number;
  receitaLiquida: number;
  taxasCobradas: number;
  porMetodo: Record<string, { bruto: number; liquido: number; count: number }>;
  evolucao: { data: string; dia: number; mes: number; bruto: number; liquido: number }[];
  carteira: {
    saldoLiberado: number;
    saldoPendente: number;
    totalSaques: number;
  };
}

interface User {
  nome: string;
  role?: string;
}

export default function FinanceiroPage() {
  const router = useRouter();
  const [vendasOpen, setVendasOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

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

    carregarStats();
  }, [router]);

  const carregarStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/financeiro', {
        headers: { 'Authorization': 'Bearer ' + token }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
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

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-purple-600 text-xl">Carregando...</div>
      </div>
    );
  }

  const lineChartData = {
    labels: stats.evolucao.map(e => `${e.dia}/${e.mes}`),
    datasets: [
      {
        label: 'Receita Bruta',
        data: stats.evolucao.map(e => e.bruto),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Receita Líquida',
        data: stats.evolucao.map(e => e.liquido),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return context.dataset.label + ': R$ ' + context.parsed.y.toFixed(2).replace('.', ',');
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return 'R$ ' + value.toFixed(0);
          }
        }
      }
    }
  };

  const metodosData = Object.entries(stats.porMetodo);
  const doughnutData = {
    labels: metodosData.map(([metodo]) => metodo),
    datasets: [{
      data: metodosData.map(([_, data]) => data.bruto),
      backgroundColor: [
        'rgba(168, 85, 247, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(249, 115, 22, 0.8)',
      ],
      borderColor: [
        'rgb(168, 85, 247)',
        'rgb(59, 130, 246)',
        'rgb(249, 115, 22)',
      ],
      borderWidth: 2
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return context.label + ': R$ ' + context.parsed.toFixed(2).replace('.', ',');
          }
        }
      }
    }
  };

  const taxaMedia = stats.receitaBruta > 0 
    ? (stats.taxasCobradas / stats.receitaBruta * 100).toFixed(2)
    : '0.00';

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📊 Dashboard Financeiro</h1>
              <p className="text-sm text-gray-500">Visão completa da sua receita</p>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium opacity-90">Receita Bruta</div>
                <TrendingUp size={24} />
              </div>
              <div className="text-3xl font-bold mb-1">R$ {stats.receitaBruta.toFixed(2).replace('.', ',')}</div>
              <div className="text-xs opacity-90">Total em vendas aprovadas</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium opacity-90">Receita Líquida</div>
                <DollarSign size={24} />
              </div>
              <div className="text-3xl font-bold mb-1">R$ {stats.receitaLiquida.toFixed(2).replace('.', ',')}</div>
              <div className="text-xs opacity-90">Após descontar taxas</div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium opacity-90">Taxas Cobradas</div>
                <TrendingDown size={24} />
              </div>
              <div className="text-3xl font-bold mb-1">R$ {stats.taxasCobradas.toFixed(2).replace('.', ',')}</div>
              <div className="text-xs opacity-90">Taxa média: {taxaMedia}%</div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium opacity-90">Saldo Disponível</div>
                <Wallet size={24} />
              </div>
              <div className="text-3xl font-bold mb-1">R$ {stats.carteira.saldoLiberado.toFixed(2).replace('.', ',')}</div>
              <div className="text-xs opacity-90">Liberado para saque</div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Saldo Pendente</div>
                <Clock size={20} className="text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-yellow-600">R$ {stats.carteira.saldoPendente.toFixed(2).replace('.', ',')}</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Total Sacado</div>
                <Banknote size={20} className="text-gray-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">R$ {stats.carteira.totalSaques.toFixed(2).replace('.', ',')}</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Margem Líquida</div>
                <CreditCard size={20} className="text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {stats.receitaBruta > 0 
                  ? ((stats.receitaLiquida / stats.receitaBruta * 100).toFixed(1))
                  : '0'}%
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Evolução - Últimos 30 Dias</h3>
              <div style={{ height: '300px' }}>
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Por Método de Pagamento</h3>
              <div style={{ height: '300px' }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Detalhamento por Método</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {metodosData.map(([metodo, data]) => (
                <div key={metodo} className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-gray-900 mb-2">{metodo}</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transações:</span>
                      <span className="font-semibold">{data.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bruto:</span>
                      <span className="font-semibold text-purple-600">R$ {data.bruto.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Líquido:</span>
                      <span className="font-semibold text-green-600">R$ {data.liquido.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Taxa:</span>
                      <span className="font-semibold text-red-600">R$ {(data.bruto - data.liquido).toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
