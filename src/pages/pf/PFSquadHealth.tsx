import { useState } from 'react';
import Layout from '@/components/Layout';
import { HealthStatus } from '@/data/players';
import { Search, Check, AlertTriangle, ShieldOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePlayers } from '@/context/PlayerContext';
import { usePf } from '@/context/PfContext';
import { toast } from 'sonner';

const PFSquadHealth = () => {
  const { players } = usePlayers();
  const { updateHealthStatus } = usePf();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  const currentItems = filteredPlayers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPaginationRange = (current: number, total: number) => {
    const range: (number | string)[] = [];
    if (total <= 5) {
      for (let i = 1; i <= total; i++) range.push(i);
    } else {
      range.push(1);
      if (current > 3) range.push('...');
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) {
        if (!range.includes(i)) range.push(i);
      }
      if (current < total - 2) range.push('...');
      if (!range.includes(total)) range.push(total);
    }
    return range;
  };

  const handleUpdateStatus = async (id: string, status: HealthStatus, currentDesc?: string) => {
    let description = currentDesc || '';
    if (status !== 'disponible') {
      const response = prompt(
        `Describí la observación de lesión o duda para este jugador:`, 
        currentDesc || ''
      );
      if (response === null) return; // cancelado
      description = response;
    }
    
    try {
      await updateHealthStatus(id, status, description);
      toast.success('Estado médico actualizado correctamente');
    } catch (e) {
      toast.error('Error al actualizar el estado médico');
    }
  };

  return (
    <Layout title="Control Médico">
      <div className="content-width section-spacing animate-fade-in pb-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h2 className="font-display text-lg tracking-wide">ESTADO DEL PLANTEL</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Semáforo de disponibilidad en tiempo real</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar jugador..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 min-h-[400px]">
          {currentItems.map(player => (
            <div key={player.id} className="premium-card p-6 space-y-6 flex flex-col justify-between bg-white border-slate-50">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center font-display text-xl text-white shrink-0">
                      {player.number}
                    </div>
                    <div>
                      <div className="font-bold text-base leading-tight mb-1">{player.name}</div>
                      <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{player.position}</div>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    player.healthStatus === 'disponible' ? 'bg-emerald-500' : 
                    player.healthStatus === 'duda' ? 'bg-amber-500' : 'bg-rose-500'
                  } shadow-lg shadow-current/20`} />
                </div>

                <div className="bg-slate-50/80 rounded-2xl p-5 min-h-[80px] flex items-center border border-slate-100/50">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {player.healthStatus !== 'disponible' ? (player.injuryDescription || 'Sin observaciones detalladas') : 'Sin novedades médicas'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <button
                  onClick={() => handleUpdateStatus(player.id, 'disponible')}
                  className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300 ${
                    player.healthStatus === 'disponible' 
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-200' 
                      : 'border-slate-100 text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span className="text-[8px] font-black tracking-widest uppercase">APTO</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus(player.id, 'duda', player.injuryDescription)}
                  className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300 ${
                    player.healthStatus === 'duda' 
                      ? 'bg-amber-500 border-amber-500 text-white shadow-xl shadow-amber-200' 
                      : 'border-slate-100 text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-[8px] font-black tracking-widest uppercase">DUDA</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus(player.id, 'lesionado', player.injuryDescription)}
                  className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300 ${
                    player.healthStatus === 'lesionado' 
                      ? 'bg-rose-500 border-rose-500 text-white shadow-xl shadow-rose-200' 
                      : 'border-slate-100 text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <ShieldOff className="w-4 h-4" />
                  <span className="text-[8px] font-black tracking-widest uppercase">BAJA</span>
                </button>
              </div>
            </div>
          ))}
        </div>

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
    </Layout>
  );
};

export default PFSquadHealth;
