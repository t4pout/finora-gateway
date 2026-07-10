'use client';

import Sidebar from '@/app/components/Sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';import { BarChart3, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';
import LoadingScreen from '@/app/components/LoadingScreen';

interface User {
  nome: string;
  role?: string;
}

interface Venda {
  id: string;
  valor: number;
  status: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

interface UTMRow {
  source: string;
  medium: string;
  campaign: string;
  vendas: number;
  pagas: number;
  receita: number;
  taxaAprovacao: number;
}

export default function RelatorioUTMPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [agruparPor, setAgruparPor] = useState<'source' | 'medium' | 'campaign'>('source');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) { router.push('/auth/login'); return; }
    if (userData) setUser(JSON.parse(userData));
    carregarVendas();
  }, [router]);

  const carregarVendas = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/vendas', { headers: { 'Authorization': 'Bearer ' + token } });
      if (res.ok) {
        const data = await res.json();
        setVendas(data.vendas || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const vendasComUTM = vendas.filter(v => v.utmSource);
  const vendasSemUTM = vendas.filter(v => !v.utmSource);

  const gerarRelatorio = (): UTMRow[] => {
    const mapa = new Map<string, { vendas: number; pagas: number; receita: number }>();

    vendasComUTM.forEach(v => {
      let chave = '';
      if (agruparPor === 'source') chave = v.utmSource || '(sem source)';
      else if (agruparPor === 'medium') chave = v.utmMedium || '(sem medium)';
      else chave = v.utmCampaign || '(sem campaign)';

      const atual = mapa.get(chave) || { vendas: 0, pagas: 0, receita: 0 };
      atual.vendas++;
      if (v.status === 'PAGO') { atual.pagas++; atual.receita += v.valor; }
      mapa.set(chave, atual);
    });

    return Array.from(mapa.entries())
      .map(([chave, dados]) => ({
        source: agruparPor === 'source' ? chave : '',
        medium: agruparPor === 'medium' ? chave : '',
        campaign: agruparPor === 'campaign' ? chave : '',
        vendas: dados.vendas,
        pagas: dados.pagas,
        receita: dados.receita,
        taxaAprovacao: dados.vendas > 0 ? (dados.pagas / dados.vendas) * 100 : 0
      }))
      .sort((a, b) => b.receita - a.receita);
  };

  const relatorio = gerarRelatorio();
  const totalReceita = vendasComUTM.filter(v => v.status === 'PAGO').reduce((acc, v) => acc + v.valor, 0);
  const totalPagas = vendasComUTM.filter(v => v.status === 'PAGO').length;

  const getChave = (row: UTMRow) => {
    if (agruparPor === 'source') return row.source;
    if (agruparPor === 'medium') return row.medium;
    return row.campaign;
  };

  if (loading) return (
    <div className="flex h-screen bg-gray-50 dark:bg-finoradark-bg">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="flex-1 flex items-center justify-center">
        <LoadingScreen />
      </main>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-finoradark-bg">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white dark:bg-finoradark-card border-b border-gray-200 dark:border-finoradark-border px-8 py-4">
          <div className="flex items-center gap-3">
            <BarChart3 size={24} className="text-purple-600 dark:text-finoradark-glow" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-finoradark-text">Relatório UTM</h1>
              <p className="text-sm text-gray-500 dark:text-finoradark-textmuted">Analise o desempenho das suas campanhas</p>
            </div>
          </div>
        </header>

        <div className="p-8">

          {/* Cards resumo */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-finoradark-glow dark:to-[#5b4dc9] rounded-xl p-6 text-white">
              <div className="text-sm font-medium opacity-90 mb-1">Receita Rastreada</div>
              <div className="text-3xl font-bold">R$ {totalReceita.toFixed(2).replace('.', ',')}</div>
              <div className="text-sm opacity-75 mt-1">{totalPagas} vendas pagas</div>
            </div>
            <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border p-6">
              <div className="text-sm text-gray-600 dark:text-finoradark-textmuted mb-1">Vendas com UTM</div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{vendasComUTM.length}</div>
              <div className="text-xs text-gray-500 dark:text-finoradark-textmuted mt-1">de {vendas.length} total</div>
            </div>
            <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border p-6">
              <div className="text-sm text-gray-600 dark:text-finoradark-textmuted mb-1">Sem Rastreamento</div>
              <div className="text-3xl font-bold text-gray-400 dark:text-finoradark-textmuted">{vendasSemUTM.length}</div>
              <div className="text-xs text-gray-500 dark:text-finoradark-textmuted mt-1">vendas sem UTM</div>
            </div>
            <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border p-6">
              <div className="text-sm text-gray-600 dark:text-finoradark-textmuted mb-1">Canais Ativos</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {new Set(vendasComUTM.map(v => v.utmSource)).size}
              </div>
              <div className="text-xs text-gray-500 dark:text-finoradark-textmuted mt-1">origens diferentes</div>
            </div>
          </div>

          {/* Agrupador */}
          <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border p-6 mb-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-700 dark:text-finoradark-textmuted">Agrupar por:</span>
              <div className="flex gap-2">
                {(['source', 'medium', 'campaign'] as const).map(tipo => (
                  <button
                    key={tipo}
                    onClick={() => setAgruparPor(tipo)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      agruparPor === tipo
                        ? 'bg-purple-600 dark:bg-finoradark-glow text-white'
                        : 'bg-gray-100 dark:bg-finoradark-card2 text-gray-700 dark:text-finoradark-textmuted hover:bg-gray-200 dark:hover:bg-finoradark-border'
                    }`}
                  >
                    {tipo === 'source' ? '🌐 Source' : tipo === 'medium' ? '📡 Medium' : '🎯 Campaign'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-finoradark-border">
              <h2 className="text-lg font-bold text-gray-900 dark:text-finoradark-text">
                {agruparPor === 'source' ? '🌐 Por Origem (utm_source)' : agruparPor === 'medium' ? '📡 Por Mídia (utm_medium)' : '🎯 Por Campanha (utm_campaign)'}
              </h2>
            </div>
            {relatorio.length === 0 ? (
              <div className="text-center py-16">
                <BarChart3 size={64} className="mx-auto text-gray-300 dark:text-finoradark-border mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-finoradark-text mb-2">Nenhum dado UTM ainda</h3>
                <p className="text-gray-600 dark:text-finoradark-textmuted">Gere links UTM e faça vendas para ver o relatório aqui.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-finoradark-border bg-gray-50 dark:bg-finoradark-card2">
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900 dark:text-finoradark-text">
                        {agruparPor === 'source' ? 'Origem' : agruparPor === 'medium' ? 'Mídia' : 'Campanha'}
                      </th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Total Vendas</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Pagas</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Receita</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Taxa Aprovação</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900 dark:text-finoradark-text">% da Receita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-finoradark-border hover:bg-gray-50 dark:hover:bg-finoradark-card2">
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                            {getChave(row)}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-semibold text-gray-900 dark:text-finoradark-text">{row.vendas}</td>
                        <td className="py-4 px-6 font-semibold text-green-600 dark:text-green-400">{row.pagas}</td>
                        <td className="py-4 px-6 font-bold text-gray-900 dark:text-finoradark-text">R$ {row.receita.toFixed(2).replace('.', ',')}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-finoradark-border rounded-full h-2 w-20">
                              <div
                                className="bg-purple-600 dark:bg-finoradark-glow h-2 rounded-full"
                                style={{ width: `${row.taxaAprovacao}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-700 dark:text-finoradark-textmuted">{row.taxaAprovacao.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-semibold text-purple-600 dark:text-finoradark-glow">
                            {totalReceita > 0 ? ((row.receita / totalReceita) * 100).toFixed(1) : 0}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detalhamento completo */}
          {vendasComUTM.length > 0 && (
            <div className="bg-white dark:bg-finoradark-card rounded-xl border border-gray-200 dark:border-finoradark-border overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-finoradark-border">
                <h2 className="text-lg font-bold text-gray-900 dark:text-finoradark-text">📋 Detalhamento Completo (Source + Medium + Campaign)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-finoradark-border bg-gray-50 dark:bg-finoradark-card2">
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Source</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Medium</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Campaign</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Vendas</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Pagas</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900 dark:text-finoradark-text">Receita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const mapa = new Map<string, { source: string; medium: string; campaign: string; vendas: number; pagas: number; receita: number }>();
                      vendasComUTM.forEach(v => {
                        const chave = `${v.utmSource}|${v.utmMedium || ''}|${v.utmCampaign || ''}`;
                        const atual = mapa.get(chave) || { source: v.utmSource || '', medium: v.utmMedium || '', campaign: v.utmCampaign || '', vendas: 0, pagas: 0, receita: 0 };
                        atual.vendas++;
                        if (v.status === 'PAGO') { atual.pagas++; atual.receita += v.valor; }
                        mapa.set(chave, atual);
                      });
                      return Array.from(mapa.values()).sort((a, b) => b.receita - a.receita).map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-100 dark:border-finoradark-border hover:bg-gray-50 dark:hover:bg-finoradark-card2">
                          <td className="py-3 px-6"><span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-semibold">{row.source}</span></td>
                          <td className="py-3 px-6"><span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded text-xs font-semibold">{row.medium || '—'}</span></td>
                          <td className="py-3 px-6"><span className="px-2 py-1 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded text-xs font-semibold">{row.campaign || '—'}</span></td>
                          <td className="py-3 px-6 font-semibold text-gray-900 dark:text-finoradark-text">{row.vendas}</td>
                          <td className="py-3 px-6 font-semibold text-green-600 dark:text-green-400">{row.pagas}</td>
                          <td className="py-3 px-6 font-bold text-gray-900 dark:text-finoradark-text">R$ {row.receita.toFixed(2).replace('.', ',')}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}