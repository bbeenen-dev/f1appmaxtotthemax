import React from 'react';

export default function InfoPage() {
  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-6 md:p-12 pb-32">
      <div className="max-w-3xl mx-auto">
        
        {/* Header met de rode F1-accentbalk */}
        <header className="mb-12 relative">
          <div className="w-20 h-1 bg-[#e10600] mb-4 shadow-[0_0_15px_rgba(225,6,0,0.5)]"></div>
          <h1 className="font-f1 text-4xl md:text-6xl font-black italic uppercase tracking-tighter">
            Spelregels <span className="text-slate-500">&</span> Uitleg
          </h1>
        </header>

        <div className="space-y-10 font-sans leading-relaxed">
          
          {/* Sectie 1: Hoe werkt het? */}
          <section className="bg-[#161a23] p-8 rounded-3xl border-l-4 border-[#e10600]">
            <h2 className="font-f1 text-2xl font-black italic uppercase mb-4 text-white">
              1. Hoe werkt de poule?
            </h2>
            <p className="text-slate-300">
              Voorspel voor elke Grand Prix de uitslag van de Qualifying, de Sprint (indien van toepassing) en de Race. Je kunt je voorspelling aanpassen tot het moment dat de betreffende sessie begint.
            </p>
          </section>

          {/* Sectie 2: Puntentelling */}
          <section>
            <h2 className="font-f1 text-2xl font-black italic uppercase mb-6 text-white flex items-center gap-3">
              <span className="text-[#e10600]">//</span> Puntentelling
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-[#161a23]/50 p-6 rounded-2xl border border-slate-800">
                <h3 className="font-f1 text-sm font-bold uppercase text-[#e10600] mb-2">Qualifying</h3>
                <ul className="text-sm text-slate-400 space-y-2">
                  <li>• P1 correct: 10 punten</li>
                  <li>• P2 correct: 5 punten</li>
                  <li>• P3 correct: 3 punten</li>
                </ul>
              </div>
              
              <div className="bg-[#161a23]/50 p-6 rounded-2xl border border-slate-800">
                <h3 className="font-f1 text-sm font-bold uppercase text-[#e10600] mb-2">Main Race</h3>
                <p className="text-sm text-slate-400">
                  Punten worden toegekend voor elke coureur die je op de juiste positie in de Top 10 hebt voorspeld.
                </p>
              </div>
            </div>
          </section>

          {/* Sectie 3: Deadlines */}
          <section className="bg-[#e10600]/5 p-8 rounded-3xl border border-[#e10600]/20">
            <h2 className="font-f1 text-2xl font-black italic uppercase mb-4 text-white">
              🚨 Deadlines
            </h2>
            <p className="text-slate-300 text-sm">
              Zodra de lichten op groen gaan voor een sessie, sluit de window. Wees dus op tijd met invullen! De tijden in de kalender zijn de officiële starttijden.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}