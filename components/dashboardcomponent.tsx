'use client'

import { useEffect, useState } from 'react'
import { getUserSession } from '@/app/actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardComponents() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkUser() {
      const currentUser = await getUserSession()
      if (!currentUser) {
        router.push('/login')
      } else {
        setUser(currentUser)
        setLoading(false)
      }
    }
    checkUser()
  }, [router])

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e10600]"></div>
      </div>
    )
  }

  return (
    <main className="max-w-4xl mx-auto grid gap-6">
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