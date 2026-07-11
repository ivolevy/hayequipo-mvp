import Layout from '@/components/Layout';
import { useMatches, Match } from '@/context/MatchContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronRight, CalendarDays, MapPin, Search, ArrowUpDown, Check, X, HelpCircle, Trophy } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

type TabType = 'todos' | 'proximos' | 'pasados';
type SortType = 'proximidad' | 'reciente' | 'antiguo';

const PartidosList = () => {
  const { matches, loading } = useMatches();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('todos');
  const [sortBy, setSortBy] = useState<SortType>('proximidad');
  const [searchTerm, setSearchTerm] = useState('');

  const role = user?.role || 'jugador';
  const playerId = user?.supabaseId || user?.playerId || user?.id;

  // Filter & Sort matches
  const filteredAndSortedMatches = useMemo(() => {
    let result = [...matches];

    // Search filter
    if (searchTerm.trim() !== '') {
      result = result.filter(m => 
        m.rival.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.venue && m.venue.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Tab filter
    const now = Date.now();
    const threeHoursAgo = now - 3 * 60 * 60 * 1000;
    if (activeTab === 'proximos') {
      result = result.filter(m => !m.completed && new Date(m.date).getTime() >= threeHoursAgo);
    } else if (activeTab === 'pasados') {
      result = result.filter(m => m.completed || new Date(m.date).getTime() < threeHoursAgo);
    }

    // Sort
    result.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();

      if (sortBy === 'reciente') {
        return timeB - timeA; // Newest first
      } else if (sortBy === 'antiguo') {
        return timeA - timeB; // Oldest first
      } else {
        // Proximity: nearest future match first, then other future matches, then past matches
        const isPastA = a.completed || timeA < threeHoursAgo;
        const isPastB = b.completed || timeB < threeHoursAgo;

        if (!isPastA && !isPastB) {
          return timeA - timeB; // both future, sort ascending (closest first)
        }
        if (isPastA && isPastB) {
          return timeB - timeA; // both past, sort descending (most recent first)
        }
        return isPastA ? 1 : -1; // future matches before past matches
      }
    });

    return result;
  }, [matches, searchTerm, activeTab, sortBy]);

  const getPlayerConvocationStatus = (match: Match) => {
    const myConv = match.convocations.find(c => c.playerId === playerId);
    return myConv?.status || 'pendiente';
  };

  return (
    <Layout title="Partidos">
      <div className="content-width px-4 py-8 animate-fade-in max-w-4xl pb-24 space-y-6">
        
        {/* Header Section */}
        <div className="px-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-display text-slate-900 uppercase tracking-tight">
              Cronograma de Partidos
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
              {role === 'dt' ? 'Gestioná convocatorias e historial' : role === 'admin' ? 'Historial y detalles de encuentros' : 'Revisá tus próximos encuentros y asistencia'}
            </p>
          </div>
        </div>

        {/* Filters and Sorting Controls */}
        <div className="space-y-4 px-1">
          <div className="flex flex-col md:flex-row gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 group">
              <input
                type="text"
                placeholder="BUSCAR POR RIVAL O SEDE..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-100 px-5 py-3.5 pl-12 rounded-2xl text-[10px] font-black tracking-widest text-slate-700 outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all placeholder:text-slate-300 shadow-sm"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
            </div>

            {/* Sorting Dropdown */}
            <div className="relative group min-w-[200px]">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortType)}
                className="w-full bg-white border border-slate-100 px-5 py-3.5 pr-10 rounded-2xl text-[10px] font-black tracking-widest text-slate-700 outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all shadow-sm appearance-none cursor-pointer uppercase"
              >
                <option value="proximidad">Próximos Primero</option>
                <option value="reciente">Fecha: Recientes Primero</option>
                <option value="antiguo">Fecha: Antiguos Primero</option>
              </select>
              <ArrowUpDown className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Tabs Filter */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-fit gap-1 shadow-inner">
            {(['todos', 'proximos', 'pasados'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all duration-350 ${
                  activeTab === tab
                    ? 'bg-white text-slate-900 shadow-md font-bold scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                }`}
              >
                {tab === 'todos' ? 'Todos' : tab === 'proximos' ? 'Próximos' : 'Pasados'}
              </button>
            ))}
          </div>
        </div>

        {/* Matches Grid/List */}
        <div className="grid grid-cols-1 gap-4 px-1">
          {loading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredAndSortedMatches.length === 0 ? (
            <div className="premium-card p-12 md:p-24 text-center border-dashed bg-white border-slate-200">
              <CalendarDays className="w-10 h-10 text-slate-200 mx-auto mb-4" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                No se encontraron partidos
              </p>
              <p className="text-xs text-slate-350 mt-1">
                Probá cambiando los filtros o buscando otro término
              </p>
            </div>
          ) : (
            filteredAndSortedMatches.map(match => {
              const dateObj = new Date(match.date);
              const formattedDate = format(dateObj, "EEEE d 'de' MMMM · HH:mm'hs'", { locale: es });
              const isPast = match.completed || dateObj.getTime() < (Date.now() - 3 * 60 * 60 * 1000);

              // Role Specific variables
              const confirmed = match.convocations.filter(c => c.status === 'confirmado').length;
              const rejected = match.convocations.filter(c => c.status === 'rechazado').length;
              const pending = match.convocations.filter(c => c.status === 'pendiente').length;

              const personalStatus = getPlayerConvocationStatus(match);

              return (
                <button
                  key={match.id}
                  onClick={() => navigate(`/${role}/partido/${match.id}`)}
                  className={`group premium-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all duration-350 text-left relative overflow-hidden shadow-sm ${
                    isPast 
                      ? 'bg-rose-50/10 border-rose-100/40 opacity-70 hover:border-rose-200/50' 
                      : 'bg-white border-slate-100 hover:border-emerald-100'
                  }`}
                >
                  {/* Past Match Indicator */}
                  {isPast && (
                    <div className="absolute top-0 right-0 bg-slate-100 text-slate-400 text-[7px] font-black tracking-widest px-3 py-1 rounded-bl-xl uppercase">
                      Finalizado
                    </div>
                  )}

                  {/* Left Side: Rival and details */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isPast ? 'bg-slate-300' : 'bg-emerald-500 animate-pulse'}`} />
                      <h3 className="font-display text-base font-semibold text-slate-800 uppercase tracking-tight group-hover:text-emerald-600 transition-colors truncate">
                        vs {match.rival}
                      </h3>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs text-slate-500">
                      <div className="flex items-center gap-2 font-medium">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="capitalize">{formattedDate}</span>
                      </div>
                      {match.venue && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                          <span className="truncate">{match.venue}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Role specific stats/status */}
                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-slate-50 shrink-0">
                    
                    {/* DT/Admin info: Convocation counts */}
                    {role === 'dt' || role === 'admin' ? (
                      <div className="flex items-center gap-4 text-xs font-medium">
                        <StatusBadge status="confirmado" count={confirmed} />
                        <StatusBadge status="pendiente" count={pending} />
                        <StatusBadge status="rechazado" count={rejected} />
                      </div>
                    ) : (
                      /* Player info: Personal status badge */
                      <div className="flex items-center gap-2">
                        {personalStatus === 'confirmado' ? (
                          <span className="bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                            <Check className="w-3 h-3 text-emerald-500" />
                            {isPast ? 'Asistido' : 'Asistirás'}
                          </span>
                        ) : personalStatus === 'rechazado' ? (
                          <span className="bg-rose-50 text-rose-700 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-100 flex items-center gap-1.5 shadow-sm">
                            <X className="w-3 h-3 text-rose-500" />
                            {isPast ? 'No Asistido' : 'No Asistirás'}
                          </span>
                        ) : (
                          <span className="bg-amber-50/70 text-amber-700 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1.5 shadow-sm">
                            <HelpCircle className="w-3 h-3 text-amber-500" />
                            {isPast ? 'No Asistido' : 'Pendiente'}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Navigation indicator */}
                    <div className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest group-hover:underline">
                      <span className="hidden sm:inline">Detalles</span>
                      <ChevronRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                </button>
              );
            })
          )}
        </div>

      </div>
    </Layout>
  );
};

export default PartidosList;
