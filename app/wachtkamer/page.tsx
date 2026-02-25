export default function WachtkamerPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f111a] text-white p-6 text-center">
      <div className="max-w-md border-t-4 border-[#e10600] bg-[#15151e] p-10 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-black italic text-[#e10600] uppercase tracking-tighter">Geduld aub...</h1>
        <p className="mt-6 text-slate-300">
          Je account is aangemaakt, maar de <strong>Race Director</strong> (admin) moet je nog toegang geven tot de grid.
        </p>
        <div className="mt-8 animate-pulse text-sm text-slate-500 uppercase tracking-widest">
          Status: In de pitstraat...
        </div>
      </div>
    </div>
  )
}