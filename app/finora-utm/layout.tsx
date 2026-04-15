'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SidebarUTM from './components/SidebarUTM';

export default function FinoraUTMLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<{ nome: string; role?: string } | null>(null);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) { router.push('/auth/login'); return; }
    if (userData) {
      const u = JSON.parse(userData);
      if (!u.finoraUtmAtivo) { router.push('/dashboard'); return; }
      setUser(u);
    }
    setVerificando(false);
  }, [router]);

  if (verificando) return (
    <div className="flex h-screen bg-gray-950 items-center justify-center">
      <div className="text-gray-400 text-sm">Carregando...</div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      <SidebarUTM user={user} />
      <main className="flex-1 overflow-y-auto bg-gray-900">
        {children}
      </main>
    </div>
  );
}