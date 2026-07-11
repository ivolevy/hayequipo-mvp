import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Trophy, Target, Zap, Clock, CalendarDays, MapPin, ChevronRight, Megaphone, Apple, Utensils, Info, Check, X, Dumbbell, Activity, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useMatches } from '@/context/MatchContext';
import { useNotices } from '@/context/NoticeContext';
import { useNutri } from '@/context/NutriContext';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { UpgradeModal } from '@/components/UpgradeModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
}

interface Day {
  name: string;
  exercises: Exercise[];
}

interface TrainingPlanJSON {
  title: string;
  days: Day[];
}

interface NutritionMeal {
  name: string;
  food: string;
  quantity: string;
}

interface NutritionPlanJSON {
  title: string;
  meals: NutritionMeal[];
}

const parseTrainingPlan = (planStr?: string): TrainingPlanJSON | null => {
  if (!planStr || planStr === 'Sin asignar') {
    return null;
  }
  try {
    const parsed = JSON.parse(planStr);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.days)) {
      return parsed as TrainingPlanJSON;
    }
  } catch (e) {
    // Fallback
  }
  return null;
};

const parseNutritionPlan = (planStr?: string): NutritionPlanJSON | null => {
  if (!planStr || planStr === 'Sin asignar') {
    return null;
  }
  try {
    const parsed = JSON.parse(planStr);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.meals)) {
      return parsed as NutritionPlanJSON;
    }
  } catch (e) {
    // Fallback
  }
  return null;
};

const JugadorDashboard = () => {
  const { user } = useAuth();
  const { matches, loading: matchesLoading, respondConvocation } = useMatches();
  const { notices } = useNotices();
  const { objectives } = useNutri();
  const { limits } = usePlanLimits();
  const [showNotice, setShowNotice] = useState(false);
  const [showConvocatoria, setShowConvocatoria] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<'nutrition' | 'physical'>('nutrition');

  const openUpgrade = (feature: 'nutrition' | 'physical') => {
    setUpgradeFeature(feature);
    setUpgradeOpen(true);
  };
  
  const standardNotices = notices.filter(n => n.type !== 'convocatoria');
  const convocatoriaNotices = notices.filter(n => n.type === 'convocatoria');
  
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const structuredTrainingPlan = parseTrainingPlan(playerProfile?.training_plan);
  const structuredNutritionPlan = parseNutritionPlan(playerProfile?.nutrition_plan);

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
    <Layout title="Mi Panel">
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

        {/* Main Grid: Match & Active Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          
          {/* Column 1: Next Match */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-label font-bold text-slate-450">Próximo Desafío</h2>
              <Link to="/jugador/partidos" className="text-[8px] md:text-[10px] font-black text-emerald-600 tracking-widest uppercase hover:text-emerald-700 transition-colors bg-emerald-50 px-2.5 py-1 rounded-full">
                VER TODOS
              </Link>
            </div>

            {matchesLoading ? (
              <div className="premium-card p-8 bg-white border border-slate-100 text-center flex flex-col items-center justify-center min-h-[260px]">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : nextMatch ? (
              <div className="premium-card p-6 bg-white border border-slate-150 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[260px] group">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
                  <Trophy className="w-40 h-40 rotate-12 text-emerald-950" />
                </div>
                
                <div className="relative z-10 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                        OFICIAL
                      </span>
                      <h3 className="font-display text-xl font-bold text-slate-800 uppercase tracking-tight mt-2 flex items-center gap-1.5 group-hover:text-emerald-700 transition-colors">
                        vs {nextMatch.rival}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-4">
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-450">
                        <CalendarDays className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span>
                        {(() => {
                          const formatted = format(new Date(nextMatch.date), "EEEE d 'de' MMMM · HH:mm'hs'", { locale: es });
                          return formatted.charAt(0).toUpperCase() + formatted.slice(1);
                        })()}
                      </span>
                    </div>

                    {nextMatch.venue && (
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-450">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="truncate">{nextMatch.venue}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative z-10 border-t border-slate-100 pt-4 mt-6 flex items-center justify-between gap-4 flex-wrap">
                  {/* Convocated / Squad list status */}
                  <div>
                    {myConvocation?.selectedForMatch === true ? (
                      <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-100 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        ¡CONVOCADO!
                      </span>
                    ) : myConvocation?.selectedForMatch === false ? (
                      <span className="bg-slate-50 text-slate-405 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-slate-100 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        RESERVA
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-100 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        ESPERANDO LISTA
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {convocationStatus === 'confirmado' ? (
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> Asistirás
                        </span>
                        <button 
                          onClick={() => handleResponse('rechazado')}
                          className="text-[10px] font-semibold text-slate-400 hover:text-rose-600 transition-colors uppercase tracking-wider underline"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : convocationStatus === 'rechazado' ? (
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
                          <X className="w-4 h-4" /> No asistiré
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
                          className="bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-[10px] font-semibold tracking-wider uppercase hover:bg-emerald-700 transition-all shadow-sm"
                        >
                          Confirmar
                        </button>
                        <button 
                          onClick={() => handleResponse('rechazado')}
                          className="bg-slate-100 text-slate-600 px-3.5 py-2 rounded-xl text-[10px] font-semibold tracking-wider uppercase hover:bg-slate-200 transition-all"
                        >
                          No asistiré
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="premium-card p-8 bg-white border border-slate-100 text-center flex flex-col items-center justify-center min-h-[220px]">
                <CalendarDays className="w-10 h-10 text-slate-300 mb-3" />
                <h3 className="font-display text-sm text-slate-800 uppercase tracking-tight">Sin Partidos Programados</h3>
                <p className="text-xs text-slate-400 mt-1">No hay partidos próximos agendados por el cuerpo técnico.</p>
              </div>
            )}
          </div>

          {/* Column 2: Preparation & Performance */}
          <div className="space-y-6">
            <div className="px-2">
              <h2 className="text-label font-bold text-slate-450">Mi Preparación & Rendimiento</h2>
            </div>

            {/* Plan de Entrenamiento Card */}
            <div className="premium-card p-6 bg-white border border-slate-100 transition-all duration-300 group relative overflow-hidden">
              {!limits.hasPhysicalPrep && (
                <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[3px] flex flex-col items-center justify-center gap-3 rounded-[inherit]">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Plan Avanzado requerido</p>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">Rutinas personalizadas del Prep. Físico</p>
                  </div>
                  <button
                    onClick={() => openUpgrade('physical')}
                    className="bg-slate-900 hover:bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all"
                  >
                    Ver planes
                  </button>
                </div>
              )}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-md">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">PLAN DE ENTRENAMIENTO</p>
                    <h3 className="font-display text-base text-slate-900 uppercase tracking-tight mt-0.5">
                      {structuredTrainingPlan ? structuredTrainingPlan.title : (playerProfile?.training_plan || 'Sin asignar')}
                    </h3>
                  </div>
                </div>
                <Link to="/jugador/entrenamiento" className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-slate-900 group-hover:bg-slate-100 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Training details or call to action */}
              <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                {structuredTrainingPlan ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-600">
                      Rutina estructurada de <span className="text-slate-850 font-bold">{structuredTrainingPlan.days.length} días</span> asignada por el PF.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {structuredTrainingPlan.days.map((day, idx) => (
                        <span key={idx} className="text-[9px] font-bold text-slate-500 bg-white border border-slate-100 px-2 py-0.5 rounded-md">
                          {day.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-400 italic">
                      No tienes una rutina estructurada asignada.
                    </p>
                    <Link to="/jugador/contacto" className="text-[9px] font-black tracking-widest text-emerald-600 uppercase hover:underline">
                      Contactar PF
                    </Link>
                  </div>
                )}
              </div>

              {structuredTrainingPlan && (
                <div className="mt-4 pt-2 flex justify-end">
                  <Link 
                    to="/jugador/entrenamiento" 
                    className="text-[9px] font-black text-slate-850 tracking-widest uppercase hover:text-slate-950 transition-colors flex items-center gap-1"
                  >
                    <span>IR A ENTRENAR</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Plan Nutricional Card */}
            <div className="premium-card p-6 bg-white border border-slate-100 transition-all duration-300 group relative overflow-hidden">
              {!limits.hasNutrition && (
                <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[3px] flex flex-col items-center justify-center gap-3 rounded-[inherit]">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Plan Avanzado requerido</p>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">Planes nutricionales del Nutricionista</p>
                  </div>
                  <button
                    onClick={() => openUpgrade('nutrition')}
                    className="bg-amber-500 hover:bg-amber-600 text-white text-[8px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all"
                  >
                    Ver planes
                  </button>
                </div>
              )}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md">
                    <Apple className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">PLAN NUTRICIONAL</p>
                    <h3 className="font-display text-base text-slate-900 uppercase tracking-tight mt-0.5">
                      {structuredNutritionPlan ? structuredNutritionPlan.title : (playerProfile?.nutrition_plan || 'Mantenimiento General')}
                    </h3>
                  </div>
                </div>
                <Link to="/jugador/nutricion" className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Nutrition details or call to action */}
              <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                {structuredNutritionPlan ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-650">
                      Plan alimentario de <span className="text-emerald-700 font-bold">{structuredNutritionPlan.meals.length} comidas diarias</span> asignado.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {structuredNutritionPlan.meals.slice(0, 3).map((meal, idx) => (
                        <span key={idx} className="text-[9px] font-bold text-slate-500 bg-white border border-slate-100 px-2 py-0.5 rounded-md">
                          {meal.name}
                        </span>
                      ))}
                      {structuredNutritionPlan.meals.length > 3 && (
                        <span className="text-[9px] font-bold text-slate-400 px-1 py-0.5">
                          +{structuredNutritionPlan.meals.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-400 italic">
                      "{playerProfile?.nutrition_plan || 'Mantenimiento del peso actual y enfoque en hidratación deportiva.'}"
                    </p>
                    <Link to="/jugador/contacto" className="text-[9px] font-black tracking-widest text-emerald-600 uppercase hover:underline shrink-0 ml-2">
                      Contactar Nutri
                    </Link>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-2 flex justify-end">
                <Link 
                  to="/jugador/nutricion" 
                  className="text-[9px] font-black text-emerald-600 tracking-widest uppercase hover:text-emerald-700 transition-colors flex items-center gap-1"
                >
                  <span>VER ALIMENTACIÓN</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

        </div>

      </div>
      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        feature={upgradeFeature}
      />
    </Layout>
  );
};

export default JugadorDashboard;
