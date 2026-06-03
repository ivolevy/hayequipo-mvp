import Layout from '@/components/Layout';
import { Player } from '@/data/players';
import { usePlayers } from '@/context/PlayerContext';
import { Apple, Search, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNutri } from '@/context/NutriContext';
import { toast } from 'sonner';

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

const NutriPlans = () => {
  const { players } = usePlayers();
  const { playerPlans, updatePlayerPlan } = useNutri();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [editingPlan, setEditingPlan] = useState('');

  const location = useLocation();
  const statePlayerId = location.state?.selectedPlayerId;

  useEffect(() => {
    if (statePlayerId) {
      const player = players.find(p => p.id === statePlayerId);
      if (player) {
        setSelectedPlayer(player);
        setEditingPlan(playerPlans[player.id]?.goal || '');
      }
    }
  }, [statePlayerId, playerPlans]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const currentPlayers = filteredPlayers.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    setEditingPlan(playerPlans[player.id]?.goal || '');
  };

  const handleSavePlan = () => {
    if (!selectedPlayer) return;
    updatePlayerPlan(selectedPlayer.id, { 
      goal: editingPlan, 
      notes: '' 
    });
    toast.success('Plan actualizado');
  };

  if (selectedPlayer) {
    const currentPlan = playerPlans[selectedPlayer.id];
    
    return (
      <Layout title={selectedPlayer.name} showBack onBack={() => setSelectedPlayer(null)}>
        <div className="max-w-4xl mx-auto px-4 py-8 animate-in slide-in-from-right duration-300 space-y-10 pb-32">

          <div className="space-y-8">
            <div className="px-2">
              <h2 className="font-display text-xl text-slate-900 leading-none mb-2">{selectedPlayer.name}</h2>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">{selectedPlayer.position}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dorsal {selectedPlayer.number}</span>
              </div>
            </div>

            <div className="premium-card p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Plan Nutricional Activo</p>
                  {currentPlan && (
                    <span className="text-[8px] font-bold text-slate-300 uppercase">Actualizado: {new Date(currentPlan.lastUpdated).toLocaleDateString()}</span>
                  )}
                </div>
                
                <textarea 
                  value={editingPlan}
                  onChange={(e) => setEditingPlan(e.target.value)}
                  placeholder="ESCRIBIR PLAN NUTRICIONAL AQUÍ..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-medium text-slate-700 leading-relaxed outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-white transition-all resize-none"
                />
              </div>

              <button 
                onClick={handleSavePlan}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Actualizar Plan
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Gestión Dietética">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10 animate-fade-in pb-32">
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-lg tracking-tight text-slate-900 uppercase">PLANTEL</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Seleccioná un jugador para gestionar su plan</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/20 transition-all"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentPlayers.map(player => (
              <button 
                key={player.id} 
                onClick={() => handlePlayerSelect(player)}
                className="w-full premium-card p-4 md:p-6 border-none shadow-md flex items-center justify-between group hover:border-emerald-200 transition-all active:scale-[0.99] bg-white text-left"
              >
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-slate-900 flex items-center justify-center text-white font-display text-lg md:text-2xl shadow-inner shrink-0">
                    {player.number}
                  </div>
                  <div>
                    <h3 className="text-sm md:text-lg font-display text-slate-900 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">{player.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md text-emerald-600 bg-emerald-50">
                        {playerPlans[player.id]?.goal || 'Mantenimiento General'}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </button>
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
      </div>
    </Layout>
  );
};

export default NutriPlans;
