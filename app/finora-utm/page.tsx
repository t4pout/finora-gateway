'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FinoraUTMRoot() {
  const router = useRouter();
  useEffect(() => { router.replace('/finora-utm/dashboard'); }, [router]);
  return null;
}