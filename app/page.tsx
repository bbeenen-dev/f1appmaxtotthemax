export const dynamic = "force-dynamic";

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // STAP 1: Als je niet bent ingelogd, ga je direct naar de inlogpagina
  if (!user) {
    return redirect('/login')
  }

  // STAP 2: Als je wel bent ingelogd, zie je de hoofd-interface
  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-6">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-black italic text-[#e10600] uppercase">F1 Poule</h1>
        <p className="text-slate-400">Welkom terug op de grid!</p>
      </header>

      <main className="max-w-4xl mx-auto grid gap-6">
        {/* MENU ITEM 1: NEXT EVENT */}
        <Link 
          href="/event/next" 
          className="group block p-6 bg-[#15151e] border-l-4 border-[#e10600] rounded-r-xl hover:bg-[#1e1e2d] transition"
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold uppercase italic">Next Event</h2>
              <p className="text-sm text-slate-400 mt-1">Voorspel de komende Grand Prix</p>
            </div>
            <span className="text-2xl group-hover:translate-x-2 transition-transform">🏎️</span>
          </div>
        </Link>

        {/* MENU ITEM 2: RACEKALENDER */}
        <Link 
          href="/kalender" 
          className="group block p-6 bg-[#15151e] border-l-4 border-slate-600 rounded-r-xl hover:bg-[#1e1e2d] transition"
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold uppercase italic">Racekalender</h2>
              <p className="text-sm text-slate-400 mt-1">Alle races van 2026</p>
            </div>
            <span className="text-2xl group-hover:translate-x-2 transition-transform">📅</span>
          </div>
        </Link>
      </main>
    </div>
  )
}