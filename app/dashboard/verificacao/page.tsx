'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { Upload, FileText, CheckCircle, Clock, XCircle, Shield } from 'lucide-react';

interface User {
  nome: string;
  role?: string;
  verificado?: boolean;
  statusVerificacao?: string;
}

interface Documento {
  id: string;
  tipo: string;
  arquivo: string;
  status: string;
  createdAt: string;
}

export default function VerificacaoPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) { router.push('/auth/login'); return; }
    if (userData) {
      const u = JSON.parse(userData);
      setUser(u);
      if (u.verificado || u.role === 'ADMIN') {
        router.replace('/dashboard');
        return;
      }
    }
    carregarDocumentos();
  }, []);

  const carregarDocumentos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/documentos', { headers: { 'Authorization': 'Bearer ' + token } });
      if (res.ok) { const data = await res.json(); setDocumentos(data.documentos || []); }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleUpload = async (tipo: string, file: File) => {
    setUploading(tipo);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('arquivo', file);
      formData.append('tipo', tipo);

      const res = await fetch('/api/documentos', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        alert('✅ Documento enviado com sucesso! Nossa equipe irá analisar em até 24h.');
        carregarDocumentos();
        // Atualiza localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          const u = JSON.parse(userData);
          u.statusVerificacao = 'EM_ANALISE';
          localStorage.setItem('user', JSON.stringify(u));
          setUser(u);
        }
      } else {
        alert('❌ Erro: ' + data.error);
      }
    } catch (e) {
      alert('❌ Erro ao enviar documento');
    }
    setUploading(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const tiposDocumento = [
    { id: 'RG_FRENTE', label: 'RG ou CNH — Frente', icone: '🪪', descricao: 'Foto clara do documento de identidade' },
    { id: 'RG_VERSO', label: 'RG ou CNH — Verso', icone: '🪪', descricao: 'Foto clara do verso do documento' },
    { id: 'SELFIE', label: 'Selfie com Documento', icone: '🤳', descricao: 'Foto sua segurando o documento' },
    { id: 'COMPROVANTE_RESIDENCIA', label: 'Comprovante de Residência', icone: '🏠', descricao: 'Conta de água, luz ou telefone recente' },
  ];

  const getStatusDoc = (tipo: string) => {
    return documentos.find(d => d.tipo === tipo);
  };

  const statusVerificacao = user?.statusVerificacao || 'PENDENTE';
  const totalEnviados = tiposDocumento.filter(t => getStatusDoc(t.id)).length;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center gap-3">
            <Shield size={24} className="text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Verificação de Conta</h1>
              <p className="text-sm text-gray-500">Envie seus documentos para ativar sua conta</p>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-3xl mx-auto">

          {/* Status Banner */}
          <div className={`rounded-2xl p-6 mb-8 flex items-center gap-4 ${
            statusVerificacao === 'APROVADO' ? 'bg-green-50 border border-green-200' :
            statusVerificacao === 'EM_ANALISE' ? 'bg-yellow-50 border border-yellow-200' :
            statusVerificacao === 'REPROVADO' ? 'bg-red-50 border border-red-200' :
            'bg-purple-50 border border-purple-200'
          }`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
              statusVerificacao === 'APROVADO' ? 'bg-green-100' :
              statusVerificacao === 'EM_ANALISE' ? 'bg-yellow-100' :
              statusVerificacao === 'REPROVADO' ? 'bg-red-100' :
              'bg-purple-100'
            }`}>
              {statusVerificacao === 'APROVADO' && <CheckCircle size={28} className="text-green-600" />}
              {statusVerificacao === 'EM_ANALISE' && <Clock size={28} className="text-yellow-600" />}
              {statusVerificacao === 'REPROVADO' && <XCircle size={28} className="text-red-600" />}
              {statusVerificacao === 'PENDENTE' && <Shield size={28} className="text-purple-600" />}
            </div>
            <div>
              <h2 className={`text-lg font-bold ${
                statusVerificacao === 'APROVADO' ? 'text-green-800' :
                statusVerificacao === 'EM_ANALISE' ? 'text-yellow-800' :
                statusVerificacao === 'REPROVADO' ? 'text-red-800' :
                'text-purple-800'
              }`}>
                {statusVerificacao === 'APROVADO' && '✅ Conta Verificada'}
                {statusVerificacao === 'EM_ANALISE' && '⏳ Documentos em Análise'}
                {statusVerificacao === 'REPROVADO' && '❌ Verificação Reprovada'}
                {statusVerificacao === 'PENDENTE' && '📋 Verificação Pendente'}
              </h2>
              <p className={`text-sm ${
                statusVerificacao === 'APROVADO' ? 'text-green-700' :
                statusVerificacao === 'EM_ANALISE' ? 'text-yellow-700' :
                statusVerificacao === 'REPROVADO' ? 'text-red-700' :
                'text-purple-700'
              }`}>
                {statusVerificacao === 'APROVADO' && 'Sua conta está totalmente ativa. Pode usar todas as funcionalidades.'}
                {statusVerificacao === 'EM_ANALISE' && 'Seus documentos foram enviados e estão sendo analisados. Prazo: até 24h úteis.'}
                {statusVerificacao === 'REPROVADO' && 'Sua verificação foi reprovada. Por favor, reenvie os documentos corretamente.'}
                {statusVerificacao === 'PENDENTE' && `Envie seus documentos para ativar sua conta. ${totalEnviados}/4 documentos enviados.`}
              </p>
            </div>
          </div>

          {/* Por que verificar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-4">🔒 Por que precisamos verificar sua conta?</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-3xl mb-2">🛡️</div>
                <div className="font-semibold text-gray-900 text-sm">Segurança</div>
                <div className="text-xs text-gray-500 mt-1">Protegemos todos os usuários contra fraudes</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-3xl mb-2">💸</div>
                <div className="font-semibold text-gray-900 text-sm">Saques Seguros</div>
                <div className="text-xs text-gray-500 mt-1">Garantimos que o dinheiro vai para o titular</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-3xl mb-2">✅</div>
                <div className="font-semibold text-gray-900 text-sm">Conformidade</div>
                <div className="text-xs text-gray-500 mt-1">Requisito do Banco Central para gateways</div>
              </div>
            </div>
          </div>

          {/* Upload de documentos */}
          <div className="space-y-4">
            {tiposDocumento.map((tipo) => {
              const docEnviado = getStatusDoc(tipo.id);
              const estaUploading = uploading === tipo.id;

              return (
                <div key={tipo.id} className={`bg-white rounded-2xl border-2 p-6 transition ${docEnviado ? 'border-green-200' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${docEnviado ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {docEnviado ? '✅' : tipo.icone}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{tipo.label}</h4>
                        <p className="text-sm text-gray-500">{tipo.descricao}</p>
                        {docEnviado && (
                          <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                            docEnviado.status === 'APROVADO' ? 'bg-green-100 text-green-700' :
                            docEnviado.status === 'REPROVADO' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {docEnviado.status === 'APROVADO' ? '✅ Aprovado' :
                             docEnviado.status === 'REPROVADO' ? '❌ Reprovado' :
                             '⏳ Em análise'}
                          </span>
                        )}
                      </div>
                    </div>

                    <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm cursor-pointer transition ${
                      estaUploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                      docEnviado ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' :
                      'bg-purple-600 text-white hover:bg-purple-700'
                    }`}>
                      {estaUploading ? (
                        <>⏳ Enviando...</>
                      ) : (
                        <>
                          <Upload size={16} />
                          {docEnviado ? 'Reenviar' : 'Enviar'}
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="hidden"
                        disabled={estaUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(tipo.id, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progresso */}
          <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-900">Progresso</span>
              <span className="text-sm text-gray-500">{totalEnviados} de {tiposDocumento.length} documentos</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="bg-purple-600 h-3 rounded-full transition-all"
                style={{ width: `${(totalEnviados / tiposDocumento.length) * 100}%` }}
              ></div>
            </div>
            {totalEnviados === tiposDocumento.length && statusVerificacao === 'EM_ANALISE' && (
              <p className="text-sm text-green-700 font-semibold mt-3 text-center">
                ✅ Todos os documentos enviados! Aguarde a análise da nossa equipe.
              </p>
            )}
          </div>

          <div className="mt-4 text-center text-sm text-gray-500">
            Dúvidas? Entre em contato: <a href="mailto:sac@finorapayments.com" className="text-purple-600 font-semibold">sac@finorapayments.com</a>
          </div>

        </div>
      </main>
    </div>
  );
}