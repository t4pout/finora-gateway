'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { upload } from '@vercel/blob/client';

export default function NovoProdutoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'DIGITAL',
    preco: '',
    comissao: '10',
    estoque: '',
    arquivoUrl: '',
    imagem: '',
    publicoParaAfiliados: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/produtos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Produto criado com sucesso!');
        router.push('/dashboard/produtos');
      } else {
        setError(data.error || 'Erro ao criar produto');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-finoradark-bg dark:to-finoradark-bg">
      <header className="bg-white dark:bg-finoradark-card border-b border-gray-200 dark:border-finoradark-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-500 dark:from-finoradark-glow dark:to-[#5b4dc9] rounded-xl"></div>
              <div className="text-2xl font-bold text-gray-900 dark:text-finoradark-text">Finora</div>
            </Link>
            <Link href="/dashboard/produtos" className="flex items-center space-x-2 text-gray-600 dark:text-finoradark-textmuted hover:text-purple-600 dark:hover:text-finoradark-glow transition">
              <button className="px-4 py-2 text-sm text-gray-700 dark:text-finoradark-textmuted hover:bg-gray-100 dark:hover:bg-finoradark-card2 rounded-lg font-medium flex items-center space-x-2">
                <ArrowLeft size={16} />
                <span>
                Voltar
                </span>
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-finoradark-text mb-2">Novo Produto</h1>
          <p className="text-gray-600 dark:text-finoradark-textmuted">Preencha os dados do seu produto</p>
        </div>

        <div className="bg-white dark:bg-finoradark-card rounded-2xl p-8 shadow-lg dark:shadow-none border border-gray-100 dark:border-finoradark-border">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-finoradark-textmuted mb-2">
                Imagem do Produto
              </label>
              <div className="space-y-2">
  <input 
    type="file" 
    accept="image/*" 
    onChange={async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const ext = file.name.split('.').pop();
        const nomeUnico = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const blob = await upload(nomeUnico, file, {
          access: 'public',
          handleUploadUrl: '/api/upload-url',
        });
        if (blob.url) {
          setFormData({...formData, imagem: blob.url});
          alert('✅ Imagem enviada com sucesso!');
        }
      } catch (error) {
        console.error(error);
        alert('❌ Erro ao enviar imagem');
      }
    }}
    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-finoradark-border dark:bg-finoradark-card2 rounded-lg cursor-pointer hover:border-purple-400 transition"
  />
  {formData.imagem && (
    <div className="mt-2">
      <img src={formData.imagem} alt="Preview" className="h-32 w-32 object-cover rounded-lg border-2 border-gray-200 dark:border-finoradark-border" />
    </div>
  )}
</div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-finoradark-textmuted mb-2">
                Nome do Produto *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Ex: Curso de Marketing Digital"
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-finoradark-border dark:bg-finoradark-card2 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-gray-900 dark:text-finoradark-text"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-finoradark-textmuted mb-2">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                placeholder="Descreva seu produto..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-finoradark-border dark:bg-finoradark-card2 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-gray-900 dark:text-finoradark-text"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-finoradark-textmuted mb-2">
                  Tipo *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-finoradark-border dark:bg-finoradark-card2 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-gray-900 dark:text-finoradark-text"
                >
                  <option value="DIGITAL">Digital</option>
                  <option value="FISICO">Fà­sico</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-finoradark-textmuted mb-2">
                  Preço (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.preco}
                  onChange={(e) => setFormData({...formData, preco: e.target.value})}
                  placeholder="0,00"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-finoradark-border dark:bg-finoradark-card2 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-gray-900 dark:text-finoradark-text"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-finoradark-textmuted mb-2">
                  Comissão Afiliados (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.comissao}
                  onChange={(e) => setFormData({...formData, comissao: e.target.value})}
                  placeholder="10"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-finoradark-border dark:bg-finoradark-card2 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-gray-900 dark:text-finoradark-text"
                />
              </div>

              {formData.tipo === 'FISICO' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-finoradark-textmuted mb-2">
                    Estoque
                  </label>
                  <input
                    type="number"
                    value={formData.estoque}
                    onChange={(e) => setFormData({...formData, estoque: e.target.value})}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-finoradark-border dark:bg-finoradark-card2 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-gray-900 dark:text-finoradark-text"
                  />
                </div>
              )}

              {formData.tipo === 'DIGITAL' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-finoradark-textmuted mb-2">
                    📄 Arquivo do Produto (PDF/Ebook)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.epub,.zip"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        alert('⏳ Enviando PDF, aguarde...');
                        const blob = await upload(file.name, file, {
                          access: 'public',
                          handleUploadUrl: '/api/upload-url',
                        });
                        if (blob.url) {
                          setFormData({...formData, arquivoUrl: blob.url});
                          alert('✅ PDF enviado com sucesso!');
                        }
                      } catch (error) {
                        console.error(error);
                        alert('❌ Erro ao enviar PDF');
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-dashed border-blue-300 dark:border-blue-900/50 dark:bg-finoradark-card2 rounded-lg cursor-pointer hover:border-blue-400 transition"
                  />
                  {formData.arquivoUrl && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900/40 mt-2">
                      <span className="text-blue-700 dark:text-blue-400 text-sm font-medium">✅ Arquivo carregado</span>
                      <a href={formData.arquivoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 text-sm underline">Visualizar</a>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 p-4 bg-purple-50 dark:bg-finoradark-card2 rounded-lg border border-purple-200 dark:border-finoradark-border">
              <input
                type="checkbox"
                id="publicoAfiliados"
                checked={formData.publicoParaAfiliados}
                onChange={(e) => setFormData({...formData, publicoParaAfiliados: e.target.checked})}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-600"
              />
              <label htmlFor="publicoAfiliados" className="text-sm font-medium text-gray-900 dark:text-finoradark-text cursor-pointer">
                Disponível para afiliados no Mercado
              </label>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-purple-600 dark:bg-finoradark-glow text-white rounded-lg font-bold hover:bg-purple-700 dark:hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Criando...' : 'Criar Produto'}
              </button>
              <Link href="/dashboard/produtos" className="flex-1">
                <button
                  type="button"
                  className="w-full py-3 border-2 border-gray-300 dark:border-finoradark-border text-gray-700 dark:text-finoradark-textmuted rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-finoradark-card2"
                >
                  Cancelar
                </button>
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}