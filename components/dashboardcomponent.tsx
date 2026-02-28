'use client'

import { useEffect, useState } from 'react'
import { getUserSession } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

// We definiëren een simpel type voor de gebruiker
interface UserProfile {
  email?: string;
  [key: string]: any;
}

export default function DashboardComponents() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isApproved, setIsApproved] = useState<boolean>(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkUserAndAccess() {
      const currentUser = await getUserSession()
      
      if (!currentUser) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('whitelist')
        .select('is_approved')
        .eq('email', currentUser.email)
        .single()

      if (error || !data || !data.is_approved) {
        setUser(currentUser as UserProfile)
        setIsApproved(false)
        setLoading(false)
      } else {
        setUser(currentUser as UserProfile)
        setIsApproved(true)
        setLoading(false)
      }
    }
    
    checkUserAndAccess()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e10600]"></div>
      </div>
    )
  }

  if (!isApproved) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-[#15151e] border border-red-900/50 rounded-2xl text-center">
        <h2 className="text-2xl font-black italic text-[#e10600] uppercase mb-4">Geen Toegang</h2>
        <p className="text-slate-400 mb-6">
          Je bent ingelogd als <span className="text-white font-bold">{user?.email}</span>, 
          maar dit account is nog niet goedgekeurd.
        </p>
        <button 
          onClick={async () => {
            await supabase.auth.signOut()
            window.location.href = '/login'
          }}
          className="bg-white text-black text-xs font-bold py-2 px-4 rounded uppercase hover:bg-[#e10600] hover:text-white transition-all"
        >
          Met ander account inloggen
        </button>
      </div>
    )
  }

  return (
    <main className="max-w-4xl mx-auto grid gap-6 p-6">
      <div className="mb-4 text-xs text-slate-500 uppercase tracking-widest">
        Ingelogd als: {user?.email}
      </div>

      <Link href="/event/next" className="group block p-6 bg-[#15151e] border-l-4 border-[#e10600] rounded-r-xl hover:bg-[#1e1e2d] transition-all">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold uppercase italic tracking-tight">Next Event</h2>
            <p className="text-sm text-slate-400 mt-1">Voorspel de komende Grand Prix</p>
          </div>
          <span className="text-2xl group-hover:translate-x-2 transition-transform duration-300">🏎️</span>
        </div>
      </Link>

      <Link href="/kalender" className="group block p-6 bg-[#15151e] border-l-4 border-slate-600 rounded-r-xl hover:bg-[#1e1e2d] transition-all">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold uppercase italic tracking-tight">Racekalender</h2>
            <p className="text-sm text-slate-400 mt-1">Alle races van 2026</p>
          </div>
          <span className="text-2xl group-hover:translate-x-2 transition-transform duration-300">📅</span>
        </div>
      </Link>
    </main>
  )
}