import Link from 'next/link';
import Image from 'next/image';

export default function ComplaintsPage() {
  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full text-center">
        
        <header className="mb-8">
          <h1 className="font-f1 text-4xl font-black italic uppercase text-[#e10600] mb-2">
            Klachtenloket
          </h1>
          <div className="w-20 h-1 bg-[#e10600] mx-auto shadow-[0_0_10px_rgba(225,6,0,0.5)]"></div>
        </header>

        <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800 shadow-[0_0_30px_rgba(0,0,0,0.5)] mb-8">
          {/* Vervang /complaints.jpg door de juiste naam van je bestand in de public map */}
          <img 
            src="/max_finger.jpg" 
            alt="Klachtenloket"
            className="w-full h-auto"
          />
        </div>

        <p className="font-f1 italic font-black uppercase text-xl text-slate-400 mb-10 leading-tight">
          Bedankt voor je feedback. <br/>We doen er helemaal niets mee.
        </p>

        <Link 
          href="/info" 
          className="inline-block font-f1 font-black italic uppercase bg-white text-black px-8 py-3 rounded-full hover:bg-[#e10600] hover:text-white transition-colors"
        >
          ← Terug naar info
        </Link>
      </div>
    </div>
  );
}