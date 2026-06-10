import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useMatches } from '@/context/MatchContext';
import { usePlayers } from '@/context/PlayerContext';
import { Player } from '@/data/players';
import { toast } from 'sonner';
import { Check, CalendarDays, MapPin, Shield, Search, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CrearPartido = () => {
  const navigate = useNavigate();
  const { createMatch } = useMatches();
  const { players } = usePlayers();

  const [step, setStep] = useState(1);
  const [date, setDate] = useState('');
  const [rival, setRival] = useState('');
  const [venue, setVenue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Arqueros', 'Defensores', 'Mediocampistas', 'Delanteros']);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const availablePlayers = players.filter(p => p.healthStatus !== 'lesionado');

  const getGroupedPlayers = () => {
    const filtered = players.filter(player => 
      player.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return {
      'Arqueros': filtered.filter(p => p.position === 'Arquero'),
      'Defensores': filtered.filter(p => p.position === 'Defensor'),
      'Mediocampistas': filtered.filter(p => ['Mediocampista', 'Enganche'].includes(p.position)),
      'Delanteros': filtered.filter(p => p.position === 'Delantero'),
    };
  };

  const togglePlayer = (id: string) => {
    setSelectedPlayers(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedPlayers.length >= availablePlayers.length) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(availablePlayers.map(p => p.id));
    }
  };

  const handleSubmit = async () => {
    if (!date || !rival || !venue) {
      toast.error('Completá todos los campos del partido');
      return;
    }
    if (new Date(date).getTime() < Date.now()) {
      toast.error('La fecha del partido no puede estar en el pasado');
      return;
    }
    if (selectedPlayers.length === 0) {
      toast.error('Seleccioná al menos un jugador');
      return;
    }

    try {
      await createMatch({
        date,
        rival,
        venue,
        convocations: selectedPlayers.map(playerId => ({
          playerId,
          status: 'pendiente',
        })),
      });

      toast.success(`Convocatoria enviada a ${selectedPlayers.length} jugadores`);
      navigate('/dt');
    } catch (e: any) {
      toast.error(e.message || 'Error al crear el partido');
    }
  };

  const groupedPlayers = getGroupedPlayers();

  return (
    <Layout title="Nueva Convocatoria" showBack backTo="/dt">
      <div className="content-width pb-20 animate-fade-in space-y-8">
        
        {/* Step indicator */}
        <div className="flex items-center justify-between px-2 max-w-xs mx-auto mb-8 border border-slate-100 bg-white p-3 rounded-2xl shadow-sm">
          <button
            onClick={() => step > 1 && setStep(1)}
            disabled={step === 1}
            className="flex flex-col items-center cursor-pointer disabled:cursor-default"
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= 1 ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'
            }`}>
              1
            </div>
            <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${step >= 1 ? 'text-emerald-600' : 'text-slate-400'}`}>Datos</span>
          </button>
          
          <div className={`flex-1 h-[2px] mx-4 transition-colors duration-350 ${step >= 2 ? 'bg-emerald-600' : 'bg-slate-150'}`} />
          
          <div
            className="flex flex-col items-center"
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= 2 ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'
            }`}>
              2
            </div>
            <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${step >= 2 ? 'text-emerald-600' : 'text-slate-400'}`}>Plantel</span>
          </div>
        </div>

        {/* STEP 1: Datos del Partido */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="space-y-6">
              <div className="px-2">
                <h2 className="font-display text-lg tracking-tight text-slate-900 uppercase">Datos del Partido</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Información logística del encuentro</p>
              </div>

              <div className="premium-card p-8 bg-white border-none shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5 text-emerald-500" /> Fecha y hora
                    </label>
                    <input
                      type="datetime-local"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all text-slate-800"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-emerald-500" /> Rival
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Laba Tata"
                      value={rival}
                      onChange={e => setRival(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all text-slate-800"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Cancha / Sede
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Nilo Costanera"
                      value={venue}
                      onChange={e => setVenue(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 px-2">
              <button
                onClick={() => {
                  if (new Date(date).getTime() < Date.now()) {
                    toast.error('La fecha del partido no puede estar en el pasado');
                    return;
                  }
                  setStep(2);
                }}
                disabled={!date || !rival || !venue}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-14 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all shadow-lg shadow-emerald-600/15 disabled:opacity-50 disabled:grayscale disabled:scale-100 active:scale-95 flex items-center gap-2"
              >
                <span>Siguiente Paso</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Selección de Plantel */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div>
                  <h2 className="font-display text-lg tracking-tight text-slate-900 uppercase">Convocar Plantel</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Seleccioná a los jugadores por posición</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-100 rounded-full pl-10 pr-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all shadow-sm"
                    />
                  </div>
                  <button
                    onClick={selectAll}
                    className="whitespace-nowrap px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded-full transition-all border border-emerald-100 bg-white shadow-sm"
                  >
                    {selectedPlayers.length >= availablePlayers.length ? 'Limpiar' : 'Convocar Todos'}
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                {(Object.entries(groupedPlayers) as [string, Player[]][]).map(([group, groupPlayers]) => (
                  groupPlayers.length > 0 && (
                    <div key={group} className="space-y-4">
                      <button 
                        onClick={() => toggleGroup(group)}
                        className="flex items-center gap-3 w-full px-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <h3 className="font-display text-base text-slate-900 uppercase tracking-tight">{group}</h3>
                        <div className="flex-1 h-[1px] bg-slate-100 mx-2" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">
                          {groupPlayers.filter(p => selectedPlayers.includes(p.id)).length} / {groupPlayers.length}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${expandedGroups.includes(group) ? 'rotate-180' : ''}`} />
                      </button>

                      {expandedGroups.includes(group) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          {groupPlayers.map(player => {
                            const selected = selectedPlayers.includes(player.id);
                            const isLesionado = player.healthStatus === 'lesionado';
                            
                            return (
                              <button
                                key={player.id}
                                onClick={() => !isLesionado && togglePlayer(player.id)}
                                disabled={isLesionado}
                                className={`group relative flex items-center gap-4 p-4 rounded-2xl text-left border transition-all duration-300 ${
                                  isLesionado 
                                    ? 'opacity-40 bg-slate-50 grayscale cursor-not-allowed border-slate-100'
                                    : selected 
                                      ? 'bg-emerald-50/50 border-emerald-500/50 ring-1 ring-emerald-500/10 shadow-lg shadow-emerald-500/5' 
                                      : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-md'
                                }`}
                              >
                                <div className="relative shrink-0">
                                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-display text-lg transition-all ${
                                    selected ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-50 text-slate-400'
                                  }`}>
                                    {player.number}
                                  </div>
                                  <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                    player.healthStatus === 'disponible' ? 'bg-emerald-500' : 
                                    player.healthStatus === 'duda' ? 'bg-amber-400' : 'bg-rose-500'
                                  }`} />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className={`text-sm font-bold truncate tracking-tight ${selected ? 'text-emerald-900' : 'text-slate-900'}`}>
                                    {player.name}
                                  </div>
                                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                    {player.position}
                                  </div>
                                </div>

                                {!isLesionado && (
                                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                                    selected ? 'bg-emerald-500 border-emerald-500 scale-110' : 'border-slate-100 scale-100'
                                  }`}>
                                    {selected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Bottom Actions Row for Step 2 */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto pt-8 px-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-white border border-slate-200 text-slate-600 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Volver
              </button>
              <button
                onClick={handleSubmit}
                disabled={selectedPlayers.length === 0}
                className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20"
              >
                <Users className="w-4 h-4" />
                <span>Confirmar Convocatoria ({selectedPlayers.length})</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default CrearPartido;
