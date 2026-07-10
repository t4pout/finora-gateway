'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import LoadingScreen from '@/app/components/LoadingScreen';
import { upload } from '@vercel/blob/client';

export default function EditarProdutoPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'DIGITAL',
    preco: '',
    comissao: '',
    estoque: '',
    arquivoUrl: '',
    imagem: '', 
    status: 'ATIVO'
  });

  useEffect(() => {
    carregarProduto();
  }, []);

  const carregarProduto = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/produtos/${params.id}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          nome: data.produto.nome,
          descricao: data.produto.descricao || '',
          tipo: data.produto.tipo,
          preco: data.produto.preco.toString(),
          comissao: data.produto.comissao.toString(),
          estoque: data.produto.estoque?.toString() || '',
          arquivoUrl: data.produto.arquivoUrl || '',
          imagem: data.produto.imagem || '',
          status: data.produto.status
        });
      }
    } catch (err) {
      setError('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/produtos/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Produto atualizado!');
        router.push('/dashboard/produtos');
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao atualizar');
      }
    } catch (err) {
      setError('Erro ao conectar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/produtos/${params.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });

      if (response.ok) {
        alert('Produto excluído!');
        router.push('/dashboard/produtos');
      }
    } catch (err) {
      alert('Erro ao excluir');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-finoradark-bg">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-finoradark-bg dark:to-finoradark-bg">
      <header className="bg-white dark:bg-finoradark-card shadow-sm dark:shadow-none border-b dark:border-finoradark-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-500 dark:from-finoradark-glow dark:to-[#5b4dc9] rounded-xl"></div>
            <div className="text-2xl font-bold text-gray-900 dark:text-finoradark-text">Finora</div>
          </Link>
          <Link href="/dashboard/produtos">
            <button className="px-4 py-2 text-sm text-gray-700 dark:text-finoradark-textmuted hover:bg-gray-50 dark:hover:bg-finoradark-card2 rounded-lg">Voltar</button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-finoradark-text mb-2">Editar Produto</h1>
          <p className="text-gray-600 dark:text-finoradark-textmuted">Atualize as informações</p>
        </div>

        <div className="bg-white dark:bg-finoradark-card rounded-2xl p-8 shadow-lg dark:shadow-none">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-finoradark-text mb-2">Nome *</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                required
                className="w-full px-4 py-3 border dark:border-finoradark-border dark:bg-finoradark-card2 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900 dark:text-finoradark-text"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-finoradark-text mb-2">Descrição</label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                rows={4}
                className="w-full px-4 py-3 border dark:border-finoradark-border dark:bg-finoradark-card2 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900 dark:text-finoradark-text"
              />
            </div>
           <div>
  <label className="block text-sm font-semibold text-gray-900 dark:text-finoradark-text mb-2">
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
                        const blob = await upload(file.name, file, {
                          access: 'public',
                          handleUploadUrl: '/api/upload-url',
                        });
                        if (blob.url) { 
                          setFormData(prev => ({ ...prev, imagem: blob.url })); 
                          alert('✅ Imagem enviada com sucesso!'); 
                        }
                      } catch (err) { 
                        console.error(err);
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

            {formData.tipo === 'DIGITAL' && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-finoradark-text mb-2">📄 Arquivo do Produto (PDF/Ebook)</label>
                <div className="space-y-2">
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
                          setFormData(prev => ({ ...prev, arquivoUrl: blob.url })); 
                          alert('✅ PDF enviado com sucesso! Clique em Salvar Alterações para confirmar.');
                        }
                      } catch (err) { 
                        console.error(err);
                        alert('❌ Erro ao enviar PDF'); 
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-dashed border-blue-300 dark:border-blue-900/50 dark:bg-finoradark-card2 rounded-lg cursor-pointer hover:border-blue-400 transition"
                  />
                  {formData.arquivoUrl && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900/40">
                      <span className="text-blue-700 dark:text-blue-400 text-sm font-medium">✅ Arquivo carregado</span>
                      <a href={formData.arquivoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 text-sm underline">Visualizar</a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-finoradark-text mb-2">Tipo *</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  className="w-full px-4 py-3 border dark:border-finoradark-border dark:bg-finoradark-card2 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900 dark:text-finoradark-text"
                >
                  <option value="DIGITAL">Digital</option>
                  <option value="FISICO">Físico</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-finoradark-text mb-2">Preço *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.preco}
                  onChange={(e) => setFormData({...formData, preco: e.target.value})}
                  required
                  className="w-full px-4 py-3 border dark:border-finoradark-border dark:bg-finoradark-card2 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900 dark:text-finoradark-text"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-finoradark-text mb-2">Comissão (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.comissao}
                  onChange={(e) => setFormData({...formData, comissao: e.target.value})}
                  className="w-full px-4 py-3 border dark:border-finoradark-border dark:bg-finoradark-card2 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900 dark:text-finoradark-text"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-finoradark-text mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-3 border dark:border-finoradark-border dark:bg-finoradark-card2 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900 dark:text-finoradark-text"
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-purple-600 dark:bg-finoradark-glow text-white rounded-lg font-bold hover:bg-purple-700 dark:hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}