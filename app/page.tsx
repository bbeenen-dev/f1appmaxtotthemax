export const dynamic = "force-dynamic";

import { Suspense } from "react";
import dynamicImport from 'next/dynamic';

// We importeren het bestand 'dashboardcomponents.tsx' uit de map components
const DashboardContent = dynamicImport(() => import("@/components/dashboardcomponent"), {
  ssr: true,
});

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-6">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-black italic text-[#e10600] uppercase tracking-tighter">
          F1 Poule
        </h1>
        <p className="text-slate-400">Welkom terug op de grid!</p>
      </header>

      {/* De Suspense boundary die de build-fout (11/15) voorkomt */}
      <Suspense fallback={
        <div className="flex justify-center p-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e10600]"></div>
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </div>
  );
}