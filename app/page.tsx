export const dynamic = "force-dynamic";

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

// Deze component doet de data check
async function DashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-6">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-black italic text-[#e10600] uppercase tracking-tighter">F1 Poule</h1>
        <p className="text-slate-400">Welkom terug op de grid!</p>
      </header>

      <main className="max-w-4xl mx-auto grid gap-6">
        <Link href="/event/next" className="group block p-6 bg-[#15151e] border-l-4 border-[#e10600] rounded-r-xl hover:bg-[#1e1e2d] transition-all">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold uppercase italic tracking-tight">Next Event</h2>
              <p className="text-sm text-slate-400 mt-1">Voorspel de komende Grand Prix</p>
            </div>
            <span className="text-2xl group-hover:translate-x-2 transition-transform">🏎️</span>
          </div>
        </Link>

        <Link href="/kalender" className="group block p-6 bg-[#15151e] border-l-4 border-slate-600 rounded-r-xl hover:bg-[#1e1e2d] transition-all">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold uppercase italic tracking-tight">Racekalender</h2>
              <p className="text-sm text-slate-400 mt-1">Alle races van 2026</p>
            </div>
            <span className="text-2xl group-hover:translate-x-2 transition-transform">📅</span>
          </div>
        </Link>
      </main>
    </div>
  );
}

// De hoofdpagina die de grens trekt
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f111a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#e10600]"></div>
      </div>
    }>
      <DashboardData />
    </Suspense>
  );
}