'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { SecurityMode } from '@/lib/types';

export default function AdminPage() {
  const router = useRouter();
  const [mode, setMode] = useState<SecurityMode | null>(null);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const me = await (await fetch('/api/auth/me')).json();
        if (!me.user || me.user.role !== 'admin') {
          router.push('/admin/login');
          return;
        }
        const res = await fetch('/api/vulnlens/mode');
        if (res.ok) setMode((await res.json()).mode);
      } catch {
        setError('Could not load current mode.');
      }
    })();
  }, [router]);

  const toggle = async () => {
    if (!mode) return;
    const next: SecurityMode = mode === 'SECURE' ? 'LAB' : 'SECURE';
    setSwitching(true);
    setError('');
    try {
      const res = await fetch('/api/vulnlens/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: next }),
      });
      if (res.ok) setMode(next);
      else setError('Failed to switch mode.');
    } catch {
      setError('Network error.');
    } finally {
      setSwitching(false);
    }
  };

  const isLab = mode === 'LAB';

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center max-w-sm w-full">
        {mode === null ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : (
          <>
            <div
              className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                isLab ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isLab ? <ShieldAlert className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
            </div>

            <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Current Mode</p>
            <h1 className={`text-2xl font-black mb-8 ${isLab ? 'text-amber-600' : 'text-emerald-700'}`}>
              {isLab ? 'LAB SIMULATION' : 'SECURE'}
            </h1>

            <button
              onClick={toggle}
              disabled={switching}
              className={`w-full py-3 rounded-xl text-sm font-black transition-all active:scale-95 disabled:opacity-50 ${
                isLab
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
            >
              {switching ? 'Switching...' : isLab ? 'Switch to SECURE' : 'Switch to LAB SIMULATION'}
            </button>

            {error && <p className="text-xs text-red-600 mt-4">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
