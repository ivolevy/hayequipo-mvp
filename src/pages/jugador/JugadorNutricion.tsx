import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { usePlayers } from '@/context/PlayerContext';
import { Apple, Utensils, Info } from 'lucide-react';
import { useNutri } from '@/context/NutriContext';

const JugadorNutricion = () => {
  const { user } = useAuth();
  const { recommendations, playerPlans } = useNutri();
  const { players } = usePlayers();
  const playerData = players.find(p => p.id === user?.playerId || p.id === user?.id) || players[0];
  const myPlan = playerPlans[playerData.id];

  return (
    <Layout title="Mi Nutrición">
      <div className="content-width px-2 py-4 md:py-8 animate-fade-in max-w-4xl pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Left Column: Plan & Advice */}
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
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed italic">
                      "{myPlan?.goal || 'Mantenimiento del peso actual y enfoque en hidratación deportiva.'}"
                    </p>
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

          {/* Right Column: Meal Recommendations */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Sugerencias del Nutricionista</p>
              <div className="grid grid-cols-1 gap-3">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="premium-card p-5 hover:bg-slate-50 transition-all border-slate-100">
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
