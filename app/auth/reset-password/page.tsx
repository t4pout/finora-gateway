'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setMessage('Token inválido ou ausente');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setMessage('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setMessage(data.message);
        setTimeout(() => router.push('/auth/login'), 3000);
      } else {
        setMessage(data.error || 'Erro ao redefinir senha');
      }
    } catch (error) {
      setMessage('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">❌ Token Inválido</h1>
          <p className="text-gray-600 mb-6">O link de recuperação é inválido ou expirou.</p>
          <Link href="/auth/forgot-password" className="text-purple-600 hover:underline">
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔑 Redefinir Senha</h1>
          <p className="text-gray-600">Digite sua nova senha</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Nova Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Confirmar Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
              placeholder="Digite a senha novamente"
              required
            />
          </div>

          {message && (
            <div className={`p-4 rounded-lg ${
              success 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
          >
            {loading ? 'Redefinindo...' : success ? 'Redirecionando...' : 'Redefinir Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}