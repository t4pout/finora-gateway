'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl"></div>
              <div className="text-2xl font-bold text-gray-900">Finora</div>
            </Link>
            <Link href="/dashboard/produtos" className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition">
              <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg font-medium flex items-center space-x-2">
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Novo Produto</h1>
          <p className="text-gray-600">Preencha os dados do seu produto</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome do Produto *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Ex: Curso de Marketing Digital"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                DescriÃ§Ã£o
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                placeholder="Descreva seu produto..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-gray-900"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-gray-900"
                >
                  <option value="DIGITAL">Digital</option>
                  <option value="FISICO">FÃ­sico</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  PreÃ§o (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.preco}
                  onChange={(e) => setFormData({...formData, preco: e.target.value})}
                  placeholder="0,00"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-gray-900"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ComissÃ£o Afiliados (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.comissao}
                  onChange={(e) => setFormData({...formData, comissao: e.target.value})}
                  placeholder="10"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-gray-900"
                />
              </div>

              {formData.tipo === 'FISICO' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estoque
                  </label>
                  <input
                    type="number"
                    value={formData.estoque}
                    onChange={(e) => setFormData({...formData, estoque: e.target.value})}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-gray-900"
                  />
                </div>
              )}

              {formData.tipo === 'DIGITAL' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    URL do Arquivo
                  </label>
                  <input
                    type="url"
                    value={formData.arquivoUrl}
                    onChange={(e) => setFormData({...formData, arquivoUrl: e.target.value})}
                    placeholder="https://..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-gray-900"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <input
                type="checkbox"
                id="publicoAfiliados"
                checked={formData.publicoParaAfiliados}
                onChange={(e) => setFormData({...formData, publicoParaAfiliados: e.target.checked})}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-600"
              />
              <label htmlFor="publicoAfiliados" className="text-sm font-medium text-gray-900 cursor-pointer">
                Disponível para afiliados no Mercado
              </label>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Criando...' : 'Criar Produto'}
              </button>
              <Link href="/dashboard/produtos" className="flex-1">
                <button
                  type="button"
                  className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50"
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





