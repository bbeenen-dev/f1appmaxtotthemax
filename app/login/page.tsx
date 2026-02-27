import { signInWithGoogle } from '@/app/actions'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#15151e] p-8 rounded-2xl border border-slate-800 shadow-2xl text-center">
        {/* Logo / Titel */}
        <h1 className="text-4xl font-black italic text-[#e10600] uppercase tracking-tighter mb-2">
          F1 POULE
        </h1>
        <p className="text-slate-400 mb-8 text-sm uppercase tracking-widest font-bold">
          Season 2026
        </p>

        <div className="space-y-6">
          <p className="text-slate-300 text-sm">
            Log in met je Google-account om toegang te krijgen tot de poule.
          </p>

          {/* De Google Login Knop */}
          <form action={signInWithGoogle}>
            <button 
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 px-6 rounded-xl hover:bg-slate-200 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <img 
                src="https://www.google.com/favicon.ico" 
                alt="Google" 
                className="w-5 h-5" 
              />
              Inloggen met Google
            </button>
          </form>

          <div className="pt-6 border-t border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] leading-relaxed">
              Toegang alleen voor genodigden.<br />
              Nog niet op de whitelist? Neem contact op met de admin.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}