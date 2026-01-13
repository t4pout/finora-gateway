'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Upload, X, CheckCircle, Clock } from 'lucide-react';

interface BannerVerificacaoProps {
  user: {
    verificado: boolean;
    statusVerificacao: string;
  };
  onUpdate: () => void;
}

export default function BannerVerificacao({ user, onUpdate }: BannerVerificacaoProps) {
  console.log('VERIFICACAO:', user);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [tipo, setTipo] = useState('RG');
  const [uploading, setUploading] = useState(false);

  if (user.verificado) return null;

  const handleUpload = async () => {
    if (!arquivo) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      formData.append('tipo', tipo);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/documentos', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token
        },
        body: formData
      });

      if (response.ok) {
        alert('Documento enviado com sucesso!');
        setMostrarModal(false);
        setArquivo(null);
        onUpdate();
      } else {
        alert('Erro ao enviar documento');
      }
    } catch (error) {
      alert('Erro ao fazer upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Banner */}
      {user.statusVerificacao === 'PENDENTE' && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle size={24} className="text-yellow-600" />
              <div>
                <div className="font-semibold text-yellow-900">Verificação Pendente</div>
                <div className="text-sm text-yellow-700">
                  Envie seus documentos para verificação de conta
                </div>
              </div>
            </div>
            <button
              onClick={() => setMostrarModal(true)}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition flex items-center space-x-2"
            >
              <Upload size={18} />
              <span>Enviar Documentos</span>
            </button>
          </div>
        </div>
      )}

      {user.statusVerificacao === 'EM_ANALISE' && (
        <div className="bg-blue-50 border-b border-blue-200 px-8 py-4">
          <div className="flex items-center space-x-3">
            <Clock size={24} className="text-blue-600" />
            <div>
              <div className="font-semibold text-blue-900">Em Análise</div>
              <div className="text-sm text-blue-700">
                Seus documentos estão sendo analisados. Aguarde a aprovação.
              </div>
            </div>
          </div>
        </div>
      )}

      {user.statusVerificacao === 'APROVADO' && (
        <div className="bg-green-50 border-b border-green-200 px-8 py-4">
          <div className="flex items-center space-x-3">
            <CheckCircle size={24} className="text-green-600" />
            <div>
              <div className="font-semibold text-green-900">Conta Verificada! ✓</div>
              <div className="text-sm text-green-700">
                Sua conta foi aprovada com sucesso
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Enviar Documentos</h3>
              <button
                onClick={() => setMostrarModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Tipo de Documento *
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                >
                  <option value="RG">RG (Identidade)</option>
                  <option value="CNH">CNH (Carteira de Motorista)</option>
                  <option value="CPF">CPF</option>
                  <option value="COMPROVANTE_RESIDENCIA">Comprovante de Residência</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Arquivo *
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Formatos aceitos: JPG, PNG, PDF (máx. 5MB)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpload}
                  disabled={!arquivo || uploading}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Enviando...' : 'Enviar'}
                </button>
                <button
                  onClick={() => setMostrarModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
