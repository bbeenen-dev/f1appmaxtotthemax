import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-[#15151e] border-b border-slate-800 p-4 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <Link href="/" className="font-black italic text-[#e10600] text-xl">F1 POULE</Link>
        <div className="flex gap-4 text-sm font-bold uppercase">
          <Link href="/kalender" className="hover:text-[#e10600]">Kalender</Link>
          <Link href="/account" className="hover:text-[#e10600]">Profiel</Link>
        </div>
      </div>
    </nav>
  )
}