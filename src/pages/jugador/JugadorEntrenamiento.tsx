import { useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { usePlayers } from '@/context/PlayerContext';
import { Dumbbell, ChevronRight, CheckCircle2, Calendar, Clock, RotateCcw } from 'lucide-react';

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
    // Treat as plain text, return null so it falls back to standard text rendering
  }
  return null;
};

const JugadorEntrenamiento = () => {
  const { user } = useAuth();
  const { players } = usePlayers();
  const playerData = players.find(p => p.id === user?.playerId || p.id === user?.id);

  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});

  if (!playerData) return null;

  const rawTrainingPlan = playerData.activePlans?.training;
  const structuredPlan = parseTrainingPlan(rawTrainingPlan);

  const toggleExerciseComplete = (dayIdx: number, exIdx: number) => {
    const key = `${dayIdx}-${exIdx}`;
    setCompletedExercises(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const resetTodayProgress = () => {
    const updated = { ...completedExercises };
    if (structuredPlan && structuredPlan.days[activeDayIdx]) {
      structuredPlan.days[activeDayIdx].exercises.forEach((_, exIdx) => {
        delete updated[`${activeDayIdx}-${exIdx}`];
      });
    }
    setCompletedExercises(updated);
  };

  // Calculate today's progress percentage
  const getProgressPercentage = () => {
    if (!structuredPlan || !structuredPlan.days[activeDayIdx]) return 0;
    const exercises = structuredPlan.days[activeDayIdx].exercises;
    const completedCount = exercises.filter((_, exIdx) => completedExercises[`${activeDayIdx}-${exIdx}`]).length;
    return Math.round((completedCount / exercises.length) * 100);
  };

  return (
    <Layout title="Mi Entrenamiento">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Content Column */}
          <div className="md:col-span-2 space-y-6">
            {structuredPlan ? (
              <>
                {/* Plan Header */}
                <div className="card-surface p-6 border-l-4 border-emerald-500 bg-white shadow-sm rounded-3xl">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <Dumbbell className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RUTINA ASIGNADA</span>
                        <h2 className="font-display text-lg text-slate-900 uppercase tracking-tight mt-0.5">{structuredPlan.title}</h2>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">PROGRESO</span>
                      <span className="text-sm font-bold text-emerald-600">{getProgressPercentage()}%</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                </div>

                {/* Day Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {structuredPlan.days.map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveDayIdx(idx)}
                      className={`px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                        activeDayIdx === idx
                          ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                          : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{day.name}</span>
                    </button>
                  ))}
                </div>

                {/* Exercises List for selected day */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      EJERCICIOS ({structuredPlan.days[activeDayIdx]?.exercises.length || 0})
                    </span>
                    {getProgressPercentage() > 0 && (
                      <button
                        onClick={resetTodayProgress}
                        className="text-[9px] font-black text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reiniciar
                      </button>
                    )}
                  </div>

                  {structuredPlan.days[activeDayIdx]?.exercises.map((exercise, idx) => {
                    const isCompleted = !!completedExercises[`${activeDayIdx}-${idx}`];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleExerciseComplete(activeDayIdx, idx)}
                        className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                          isCompleted
                            ? 'bg-emerald-50/20 border-emerald-500/20 shadow-inner'
                            : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                            isCompleted ? 'bg-emerald-500 border-emerald-500 scale-105' : 'border-slate-150'
                          }`}>
                            {isCompleted && <CheckCircle2 className="w-4 h-4 text-white fill-emerald-500 stroke-[2.5]" />}
                          </div>
                          <div className="min-w-0">
                            <div className={`text-sm font-bold truncate transition-all ${
                              isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'
                            }`}>
                              {exercise.name}
                            </div>
                            
                            {/* Exercise specifics */}
                            <div className="flex items-center gap-4 mt-2 flex-wrap">
                              {exercise.sets && (
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2 py-0.5">
                                  {exercise.sets} Series
                                </span>
                              )}
                              {exercise.reps && (
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2 py-0.5">
                                  {exercise.reps} Reps
                                </span>
                              )}
                              {exercise.rest && (
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-350" />
                                  Descanso: {exercise.rest}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* Legacy plain text plan rendering fallback */
              <div className="card-surface p-6 border-l-4 border-slate-900 bg-white rounded-3xl shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900/5 flex items-center justify-center text-slate-800 shrink-0">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg text-slate-900">Plan de Hoy</h2>
                    <p className="text-sm text-muted-foreground">{rawTrainingPlan || 'Rutina general de mantenimiento'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                   {[
                     { t: 'Entrada en calor', d: '10 min movilidad articular', c: true },
                     { t: 'Bloque Principal', d: 'Ejercicios de fuerza explosiva', c: false },
                     { t: 'Vuelta a la calma', d: 'Elongación guiada', c: false },
                   ].map((item, i) => (
                     <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all cursor-pointer">
                       <div className="flex items-center gap-3">
                         {item.c ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200" />}
                         <div>
                           <div className={`text-sm font-bold ${item.c ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{item.t}</div>
                           <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{item.d}</div>
                         </div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-350" />
                     </div>
                   ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Recommendation - Shared */}
          <div className="md:col-span-1">
            <div className="card-surface p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                RECOMENDACIONES DEL PF
              </span>
              <p className="text-xs text-slate-500 leading-relaxed italic">
                "Recordá hidratarte bien durante la sesión. Si sentís molestia o dolor muscular agudo durante cualquier ejercicio, bajá la carga o detené la actividad y avisame de inmediato."
              </p>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default JugadorEntrenamiento;
