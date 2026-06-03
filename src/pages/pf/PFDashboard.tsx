import { useState } from 'react';
import Layout from '@/components/Layout';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePlayers } from '@/context/PlayerContext';

const getPaginationRange = (current: number, total: number) => {
  const range: (number | string)[] = [];
  const siblingCount = 1;

  if (total <= 5) {
    for (let i = 1; i <= total; i++) {
      range.push(i);
    }
    return range;
  }

  const leftSiblingIndex = Math.max(current - siblingCount, 1);
  const rightSiblingIndex = Math.min(current + siblingCount, total);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < total - 1;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const itemSlice = 3 + siblingCount;
    for (let i = 1; i <= itemSlice; i++) {
      range.push(i);
    }
    range.push('...');
    range.push(total);
  } else if (shouldShowLeftDots && !shouldShowRightDots) {
    range.push(1);
    range.push('...');
    const itemSlice = total - (2 + siblingCount);
    for (let i = itemSlice; i <= total; i++) {
      range.push(i);
    }
  } else if (shouldShowLeftDots && shouldShowRightDots) {
    range.push(1);
    range.push('...');
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      range.push(i);
    }
    range.push('...');
    range.push(total);
  }

  return range;
};

const PFDashboard = () => {
  const { players } = usePlayers();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const playersPerPage = 3;

  const lesionados = players.filter(p => p.healthStatus === 'lesionado').length;
  const enDuda = players.filter(p => p.healthStatus === 'duda').length;

  const healthIssuesPlayers = players.filter(p => p.healthStatus !== 'disponible');
  
  const filteredPlayers = healthIssuesPlayers.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);
  const paginatedPlayers = filteredPlayers.slice(
    (currentPage - 1) * playersPerPage,
    currentPage * playersPerPage
  );

  return (
    <Layout title="Rendimiento Físico">
      <div className="content-width px-1 py-2 md:py-8 animate-fade-in max-w-4xl pb-24 space-y-6 md:space-y-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Health Status Monitoring */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="font-display text-base md:text-lg tracking-tight text-slate-900 uppercase">Estado de Salud</h2>
              <div className="flex gap-3 md:gap-4">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{lesionados} Bajas</span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{enDuda} En Duda</span>
                </div>
              </div>
            </div>

            <div className="relative group px-1">
              <input
                type="text"
                placeholder="BUSCAR POR NOMBRE..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-slate-100 px-5 py-3 md:px-6 md:py-4 rounded-2xl text-[9px] md:text-[10px] font-black tracking-widest text-slate-700 outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all placeholder:text-slate-300"
              />
              <Search className="absolute right-5 md:right-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
            </div>

            <div className="grid grid-cols-1 gap-3 px-1">
              {paginatedPlayers.length === 0 ? (
                <div className="py-12 md:py-20 text-center border-2 border-dashed border-slate-100 rounded-[2rem] md:rounded-[3rem]">
                  <p className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest">No se encontraron jugadores lesionados o en duda</p>
                </div>
              ) : (
                paginatedPlayers.map(player => (
                  <div key={player.id} className="premium-card p-4 md:p-6 border-none shadow-md">
                    <div className="flex items-center gap-4 md:gap-5">
                      <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-slate-900 flex items-center justify-center text-white font-display text-lg md:text-2xl shadow-inner">
                        {player.number}
                      </div>
                      <div>
                        <h3 className="text-sm md:text-lg font-display text-slate-900 uppercase tracking-tight">{player.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                            player.healthStatus === 'lesionado' ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50'
                          }`}>
                            {player.healthStatus === 'lesionado' ? 'Lesionado' : 'En Duda'}
                          </span>
                          {player.injuryDescription && (
                            <span className="text-[9px] text-slate-400 italic">
                              - {player.injuryDescription}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-2.5 rounded-xl border border-slate-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 sm:px-4 sm:py-2"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[8px] md:text-[9px] font-black tracking-[0.2em] uppercase">Anterior</span>
                </button>
                <div className="flex items-center gap-1 mx-2">
                  {getPaginationRange(currentPage, totalPages).map((page, i) => {
                    if (page === '...') {
                      return (
                        <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-[9px] md:text-[10px] font-black text-slate-300">
                          ...
                        </span>
                      );
                    }
                    return (
                      <button
                        key={`page-${page}`}
                        onClick={() => setCurrentPage(Number(page))}
                        className={`w-8 h-8 rounded-xl text-[9px] md:text-[10px] font-black transition-all ${
                          currentPage === page 
                            ? 'bg-slate-900 text-white shadow-xl scale-105' 
                            : 'bg-white border border-slate-100 text-slate-400 hover:border-emerald-200'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-2.5 rounded-xl border border-slate-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 sm:px-4 sm:py-2"
                  aria-label="Siguiente"
                >
                  <span className="hidden sm:inline text-[8px] md:text-[9px] font-black tracking-[0.2em] uppercase">Siguiente</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Daily Workload */}
          <div className="space-y-4 md:space-y-6">
            <h2 className="font-display text-base md:text-lg tracking-tight text-slate-900 uppercase px-2">Carga de Trabajo</h2>
            <div className="premium-card p-5 md:p-8 space-y-4 md:space-y-8">
              {[
                { label: 'Aeróbico', value: 75 },
                { label: 'Fuerza', value: 40 },
                { label: 'Táctico', value: 90 },
                { label: 'Prevención', value: 25 },
              ].map((item) => (
                <div key={item.label} className="space-y-2 md:space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-label text-[9px] md:text-xs">{item.label}</span>
                    <span className="text-xs md:text-sm font-bold text-slate-900">{item.value}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-900 rounded-full transition-all duration-1000" 
                      style={{ width: `${item.value}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PFDashboard;
