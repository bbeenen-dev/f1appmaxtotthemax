import DashboardComponents from '@/components/dashboardcomponent'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-6">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-black italic text-[#e10600] uppercase tracking-tighter">F1 Poule</h1>
        <p className="text-slate-400">Welkom terug op de grid!</p>
      </header>

      <DashboardComponents />
    </div>
  )
}