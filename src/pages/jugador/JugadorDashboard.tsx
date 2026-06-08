import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Trophy, Target, Zap, Clock, CalendarDays, MapPin, ChevronRight, Megaphone, Apple, Utensils, Info, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useMatches } from '@/context/MatchContext';
import { useNotices } from '@/context/NoticeContext';
import { useNutri } from '@/context/NutriContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const JugadorDashboard = () => {
  const { user } = useAuth();
  const { matches, respondConvocation } = useMatches();
  const { notices } = useNotices();
  const { objectives } = useNutri();
  const [showNotice, setShowNotice] = useState(false);
  const [showConvocatoria, setShowConvocatoria] = useState(false);
  
  const standardNotices = notices.filter(n => n.type !== 'convocatoria');
  const convocatoriaNotices = notices.filter(n => n.type === 'convocatoria');
  
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.supabaseId) return;
      setLoadingProfile(true);
      try {
        let query = supabase.from('hayequipo_squad').select('*').eq('id', user.supabaseId);
        if (user.activeTeamId) {
          query = query.eq('team_id', user.activeTeamId);
        }
        const { data, error } = await query.maybeSingle();

        if (error) throw error;
        setPlayerProfile(data);
      } catch (err) {
        console.error('Error fetching player profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [user]);

  const nextMatch = [...matches]
    .filter(m => !m.completed && new Date(m.date).getTime() >= Date.now() - 3 * 60 * 60 * 1000)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  const matchDateShort = nextMatch 
    ? format(new Date(nextMatch.date), "d/M - HH:mm'hs'", { locale: es }) 
    : '';
  const matchInfoText = nextMatch 
    ? `vs ${nextMatch.rival} (${matchDateShort})` 
    : '';
  
  const playerId = user?.supabaseId || user?.playerId || user?.id;
  const myConvocation = nextMatch?.convocations.find(c => c.playerId === playerId);
  const convocationStatus = myConvocation?.status || 'pendiente';

  const handleResponse = async (status: 'confirmado' | 'rechazado') => {
    if (!nextMatch || !playerId) return;
    try {
      await respondConvocation(nextMatch.id, playerId, status);
      toast.success(status === 'confirmado' ? 'Asistencia confirmada' : 'Convocatoria rechazada');
    } catch (e) {
      console.error(e);
      toast.error('Error al enviar respuesta');
    }
  };

  if (loadingProfile) {
    return (
      <Layout title="Mi Perfil">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const displayName = playerProfile?.full_name || user?.name || 'Jugador';
  const displayPosition = playerProfile?.position || 'Jugador';
  const displayHealth = playerProfile?.health_status || 'disponible';
  const displayNumber = playerProfile?.number || '-';

  return (
    <Layout title="Mi Perfil">
      <div className="content-width px-4 py-8 animate-fade-in max-w-4xl pb-32 space-y-8 md:space-y-12">
        
        {/* Player Header - Minimalist */}
        <div className="px-2">
          <h1 className="text-xl md:text-2xl font-display text-slate-900 uppercase tracking-tight leading-none mb-2">{displayName}</h1>
          <div className="flex items-center gap-3">
            <span className="text-label text-emerald-600/70">{displayPosition}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{displayHealth}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dorsal {displayNumber}</span>
          </div>
        </div>

        {/* Convocatorias Oficiales - Collapsible Indigo Button & Card */}
        {convocatoriaNotices.length > 0 && (
          <div className="space-y-3 px-2">
            <button 
              onClick={() => setShowConvocatoria(!showConvocatoria)}
              className="w-full bg-indigo-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-indigo-600/25 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                  Convocatoria disponible {matchInfoText}
                </span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${showConvocatoria ? 'rotate-90' : ''}`} />
            </button>

            {showConvocatoria && (
              <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                {convocatoriaNotices.map(notice => (
                  <div 
                    key={notice.id} 
                    className="premium-card p-6 border-l-4 border-l-indigo-600 bg-indigo-50/20 shadow-indigo-100/50 shadow-md border border-indigo-100/50"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase">
                          Lista Oficial
                        </span>
                        <h3 className="font-display text-base text-indigo-900 font-bold uppercase tracking-tight">
                          {notice.title}
                        </h3>
                      </div>
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                        {format(new Date(notice.date), "d MMM", { locale: es })}
                      </span>
                    </div>
                    <p className="text-sm text-indigo-950/80 leading-relaxed font-medium whitespace-pre-wrap">
                      {notice.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Avisos Section - Red Alert Style */}
        {standardNotices.length > 0 && (
          <div className="space-y-3 px-2">
            <button 
              onClick={() => setShowNotice(!showNotice)}
              className="w-full bg-rose-500 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-rose-500/20 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tienes un nuevo comunicado</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${showNotice ? 'rotate-90' : ''}`} />
            </button>

            {showNotice && (
              <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                {standardNotices.map(notice => (
                  <div key={notice.id} className="premium-card p-6 border-l-4 border-l-rose-500 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-display text-base text-slate-900 uppercase tracking-tight">{notice.title}</h3>
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                        {format(new Date(notice.date), "d MMM", { locale: es })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">{notice.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nutrition Section */}
        <div className="space-y-4">
          <h2 className="font-display text-lg tracking-tight text-slate-900 uppercase px-2">Nutrición & Rendimiento</h2>
          
          <div className="px-2">
            <Link to="/jugador/nutricion" className="block group">
              <div className="premium-card p-5 bg-white border border-slate-100 hover:border-emerald-250 transition-all flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-3.5 bg-emerald-500 rounded-full" />
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">Mi Objetivo</p>
                  </div>
                  <h3 className="font-display text-base text-slate-900 uppercase tracking-tight">
                    {playerProfile?.nutrition_plan || 'Mantenimiento General'}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-slate-400 group-hover:text-emerald-600 transition-colors">
                  <span className="text-[9px] font-black tracking-widest uppercase hidden sm:inline">Ver Alimentación</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Next Match Highlight - Minimalist and simple */}
        {nextMatch && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h2 className="font-display text-[10px] font-black text-slate-400 uppercase tracking-widest">Próximo Desafío</h2>
              <Link to="/jugador/partidos" className="text-[8px] md:text-[10px] font-black text-emerald-600 tracking-widest uppercase hover:text-emerald-700 transition-colors bg-emerald-50 px-2.5 py-1 rounded-full">
                VER TODOS
              </Link>
            </div>
            <div className="premium-card p-5 bg-white border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Link to={`/jugador/partido/${nextMatch.id}`} className="group flex-1 text-left">
                <h3 className="font-display text-base font-semibold text-slate-800 uppercase tracking-tight group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                  vs {nextMatch.rival}
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </h3>
                <div className="flex flex-col gap-1 mt-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {(() => {
                        const formatted = format(new Date(nextMatch.date), "EEEE d 'de' MMMM · HH:mm'hs'", { locale: es });
                        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
                      })()}
                    </span>
                  </div>
                  {nextMatch.venue && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{nextMatch.venue}</span>
                    </div>
                  )}
                </div>
              </Link>


              <div className="flex items-center gap-2">
                {convocationStatus === 'confirmado' ? (
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Asistirás
                      </span>
                      <button 
                        onClick={() => handleResponse('rechazado')}
                        className="text-[10px] font-semibold text-slate-400 hover:text-rose-600 transition-colors uppercase tracking-wider underline"
                      >
                        Cancelar
                      </button>
                    </div>
                    {/* Convocated / Squad list status */}
                    <div>
                      {myConvocation?.selectedForMatch === true ? (
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-100 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          ¡CONVOCADO!
                        </span>
                      ) : myConvocation?.selectedForMatch === false ? (
                        <span className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-slate-100 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          RESERVA
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-100 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          ESPERANDO LISTA
                        </span>
                      )}
                    </div>
                  </div>
                ) : convocationStatus === 'rechazado' ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
                      <X className="w-3.5 h-3.5" /> No asistiré
                    </span>
                    <button 
                      onClick={() => handleResponse('confirmado')}
                      className="text-[10px] font-semibold text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-wider underline"
                    >
                      Confirmar
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleResponse('confirmado')}
                      className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-semibold tracking-wider uppercase hover:bg-emerald-700 transition-all"
                    >
                      Confirmar
                    </button>
                    <button 
                      onClick={() => handleResponse('rechazado')}
                      className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-semibold tracking-wider uppercase hover:bg-slate-200 transition-all"
                    >
                      No asistiré
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default JugadorDashboard;
