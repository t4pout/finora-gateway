'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

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
    imagem: ''
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-purple-600 text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl"></div>
            <div className="text-2xl font-bold">Finora</div>
          </Link>
          <Link href="/dashboard/produtos">
            <button className="px-4 py-2 text-sm hover:bg-gray-50 rounded-lg">Voltar</button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Editar Produto</h1>
          <p className="text-gray-600">Atualize as informações</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Nome *</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Descrição</label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                rows={4}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900"
              />
            </div>
           <div>
  <label className="block text-sm font-semibold mb-2">
    Imagem do Produto
  </label>
  <div className="space-y-2">
    <input 
      type="file" 
      accept="image/*" 
      onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formDataUpload
          });
          const data = await res.json();
          if (data.url) {
            setFormData({...formData, imagem: data.url});
            alert('✅ Imagem enviada com sucesso!');
          }
        } catch (error) {
          alert('❌ Erro ao enviar imagem');
        }
      }}
      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 transition"
    />
    {formData.imagem && (
      <div className="mt-2">
        <img src={formData.imagem} alt="Preview" className="h-32 w-32 object-cover rounded-lg border-2 border-gray-200" />
      </div>
    )}
  </div>
</div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Tipo *</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900"
                >
                  <option value="DIGITAL">Digital</option>
                  <option value="FISICO">Físico</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Preço *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.preco}
                  onChange={(e) => setFormData({...formData, preco: e.target.value})}
                  required
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Comissão (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.comissao}
                  onChange={(e) => setFormData({...formData, comissao: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900"
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
                className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50"
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
