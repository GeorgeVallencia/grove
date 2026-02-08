import { Trees, Flower, Zap } from 'lucide-react';

// We add a 'stats' prop and a check to see if it exists
export default function Garden({ stats }: { stats: any }) {
  
  // STEP 1a: If stats is null/undefined, show this instead of crashing
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
        <p className="text-slate-400 animate-pulse text-sm">Tending to the soil...</p>
      </div>
    );
  }

  return (
    <div className="flex justify-around items-end h-64 bg-gradient-to-b from-blue-50 to-emerald-50 rounded-3xl p-8 border border-emerald-100 shadow-sm">
      {/* Investor Oak */}
      <div className="flex flex-col items-center group">
        <Trees 
          size={Math.max(stats.investor_oak_growth, 20)} 
          className="text-emerald-700 transition-all duration-700 hover:scale-110" 
        />
        <span className="text-[10px] uppercase tracking-wider mt-3 text-emerald-800 font-bold">Investor Oak</span>
      </div>
      
      {/* Typing Bamboo */}
      <div className="flex flex-col items-center group">
        <Zap 
          size={Math.max(stats.typing_bamboo_growth, 20)} 
          className="text-amber-500 transition-all duration-700 hover:scale-110" 
        />
        <span className="text-[10px] uppercase tracking-wider mt-3 text-amber-800 font-bold">Typing Bamboo</span>
      </div>

      {/* Family Rose */}
      <div className="flex flex-col items-center group">
        <Flower 
          size={Math.max(stats.family_rose_growth, 20)} 
          className="text-rose-400 transition-all duration-700 hover:scale-110" 
        />
        <span className="text-[10px] uppercase tracking-wider mt-3 text-rose-800 font-bold">Family Rose</span>
      </div>
    </div>
  );
}
