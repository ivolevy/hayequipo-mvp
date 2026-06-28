import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { usePlayers } from '@/context/PlayerContext';
import { Apple, Utensils, Info, Lock } from 'lucide-react';
import { useNutri } from '@/context/NutriContext';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { UpgradeModal } from '@/components/UpgradeModal';
import { useState } from 'react';

interface NutritionMeal {
  name: string;
  food: string;
  quantity: string;
}

interface NutritionPlanJSON {
  title: string;
  meals: NutritionMeal[];
}

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
    // Treat as plain text, return null so it falls back
  }
  return null;
};

const JugadorNutricion = () => {
  const { user } = useAuth();
  const { recommendations, playerPlans } = useNutri();
  const { players } = usePlayers();
  const { limits } = usePlanLimits();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const playerData = players.find(p => p.id === user?.playerId || p.id === user?.id) || players[0];
  const myPlan = playerPlans[playerData.id];

  const structuredPlan = parseNutritionPlan(myPlan?.goal);

  if (!limits.hasNutrition) {
    return (
      <Layout title="Mi Nutrición">
        <div className="content-width px-4 py-16 animate-fade-in max-w-lg mx-auto flex flex-col items-center justify-center text-center gap-6 pb-32">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-100 flex items-center justify-center shadow-sm">
            <Lock className="w-9 h-9 text-amber-400" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-xl text-slate-900 uppercase tracking-tight">Nutrición Bloqueada</h1>
            <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
              Los planes nutricionales personalizados están disponibles a partir del <strong className="text-slate-600">Plan Avanzado</strong>. Actualizá el plan de tu equipo para acceder.
            </p>
          </div>
          <button
            onClick={() => setUpgradeOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all shadow-md shadow-amber-200/50 active:scale-95"
          >
            Ver Planes Disponibles
          </button>
          <div className="w-full bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 space-y-2 opacity-40 pointer-events-none select-none">
            <div className="h-3 bg-slate-200 rounded-full w-2/3 mx-auto" />
            <div className="h-2 bg-slate-100 rounded-full w-1/2 mx-auto" />
            <div className="h-2 bg-slate-100 rounded-full w-3/4 mx-auto" />
          </div>
        </div>
        <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} feature="nutrition" />
      </Layout>
    );
  }

  return (
    <Layout title="Mi Nutrición">
      <div className="content-width px-2 py-4 md:py-8 animate-fade-in max-w-4xl pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Left Column: Plan & Advice Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Active Plan Card */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Mi Seguimiento Individual</p>
              <div className="premium-card p-8 bg-white border-slate-100 hover:border-emerald-100 transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Apple className="w-24 h-24 rotate-12 text-emerald-600" />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Apple className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg text-slate-900 uppercase tracking-tight">Plan Personalizado</h3>
                      <p className="text-[9px] text-slate-400 uppercase font-medium tracking-widest">
                        Última actualización: {myPlan ? new Date(myPlan.lastUpdated).toLocaleDateString() : 'Hoy'}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                    {structuredPlan ? (
                      <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                        Tenés asignado el plan <strong className="text-slate-800 uppercase tracking-tight font-display">{structuredPlan.title}</strong> con {structuredPlan.meals.length} comidas diarias. Mirá el detalle completo a la derecha.
                      </p>
                    ) : (
                      <p className="text-xs font-semibold text-slate-600 leading-relaxed italic">
                        "{myPlan?.goal || 'Mantenimiento del peso actual y enfoque en hidratación deportiva.'}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Pro Tip */}
            <div className="premium-card p-6 bg-emerald-50 border-emerald-100/50 flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h5 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Consejo Profesional</h5>
                <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                  "La hidratación durante el partido no es negociable. Asegurate de beber pequeños sorbos cada vez que el juego se detenga."
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Meal plan details & recommendations */}
          <div className="lg:col-span-2 space-y-6">
            {/* Structured Nutrition Plan */}
            {structuredPlan && (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Mi Plan Alimentario Diario</p>
                <div className="premium-card p-6 md:p-8 bg-white border-slate-100 space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Utensils className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-base text-slate-900 uppercase tracking-tight">{structuredPlan.title}</h3>
                        <p className="text-[8px] text-slate-400 uppercase font-medium tracking-widest">Plan de comidas asignado por el nutricionista</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {structuredPlan.meals.map((meal, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-slate-50/80 transition-all gap-4">
                        <div className="space-y-1 min-w-0 flex-1">
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50/50 inline-block">
                            {meal.name}
                          </span>
                          <p className="text-xs font-semibold text-slate-700 leading-relaxed mt-1 whitespace-pre-wrap">
                            {meal.food}
                          </p>
                        </div>
                        {meal.quantity && (
                          <div className="shrink-0 text-left sm:text-right">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Porción / Cantidad</span>
                            <span className="text-xs font-bold text-slate-950 bg-white border border-slate-100 px-3 py-1 rounded-xl shadow-sm inline-block mt-0.5">
                              {meal.quantity}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* General Recommendations */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                {structuredPlan ? 'Sugerencias Adicionales' : 'Sugerencias del Nutricionista'}
              </p>
              <div className="grid grid-cols-1 gap-3">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="premium-card p-5 hover:bg-slate-50 transition-all border-slate-100 bg-white">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <Utensils className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-display text-slate-900 uppercase tracking-tight">{rec.title}</h4>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {rec.items.map((item, idx) => (
                        <span key={idx} className="bg-white border border-slate-100 px-3 py-1.5 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest shadow-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default JugadorNutricion;
