import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.is_admin || false
  }

  return (
    <nav className="bg-[#161a23]/90 backdrop-blur-md border-t border-white/5 p-5 fixed bottom-0 left-0 right-0 z-50 shadow-[0_-15px_40px_rgba(0,0,0,0.6)]">
      <div className="max-w-4xl mx-auto flex justify-center items-center">
        {/* font-f1 voor die authentieke racing look */}
        <div className="flex gap-6 sm:gap-12 font-f1 text-[10px] font-black uppercase tracking-[0.25em] items-center text-slate-400">
          
          <Link href="/" className="hover:text-white transition-colors duration-300">
            Home
          </Link>

          <Link href="/races" className="hover:text-white transition-colors duration-300">
            Kalender
          </Link>

          <Link href="/info" className="hover:text-white transition-colors duration-300">
            Info
          </Link>
          
          {isAdmin && (
            <Link href="/admin" className="text-[#e10600] px-2 py-0.5 border border-[#e10600]/30 rounded-sm italic hover:bg-[#e10600] hover:text-white transition-all duration-300">
              Admin
            </Link>
          )}

          <div className="h-4 w-[1px] bg-slate-800 mx-1" /> {/* Verticale scheidingslijn */}

          {user ? (
            <Link href="/logout" className="text-slate-500 hover:text-white transition-colors duration-300 italic lowercase tracking-normal font-sans">
              uitloggen
            </Link>
          ) : (
            <Link href="/login" className="text-[#e10600] font-black italic">
              Inloggen
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}