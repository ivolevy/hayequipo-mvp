import Layout from '@/components/Layout';
import { ChevronRight, Target, Utensils, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NutriDashboard = () => {
  const navigate = useNavigate();

  return (
    <Layout title="Panel Nutricional">
      <div className="content-width px-4 py-8 animate-fade-in max-w-4xl pb-32 space-y-12">
        
        {/* Header Section */}
        <div className="px-2">
          <h1 className="text-xl md:text-2xl font-display text-slate-900 uppercase tracking-tight leading-none mb-2">Panel Nutricional</h1>
          <p className="text-xs text-slate-500 font-medium">Accede a las herramientas de planificación, objetivos y seguimiento individual del equipo.</p>
        </div>

        {/* Minimal Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
          {/* Card 1: Objetivos */}
          <div 
            onClick={() => navigate('/nutri/objetivos')}
            className="premium-card p-6 bg-white border border-slate-100 hover:border-emerald-200 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group h-64"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors shrink-0">
                <Target className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base text-slate-900 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">Objetivos Vigentes</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Establece metas generales del plantel como pautas de hidratación y recuperación post-esfuerzo.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-4">
              <span>Gestionar Objetivos</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 2: Sugerencias */}
          <div 
            onClick={() => navigate('/nutri/recomendaciones')}
            className="premium-card p-6 bg-white border border-slate-100 hover:border-emerald-200 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group h-64"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors shrink-0">
                <Utensils className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base text-slate-900 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">Sugerencias y Platos</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Crea y edita ideas de comidas, desayunos y cenas activas recomendadas para el plantel.</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-4">
              <span>Gestionar Sugerencias</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 3: Planes */}
          <div 
            onClick={() => navigate('/nutri/planes')}
            className="premium-card p-6 bg-white border border-slate-100 hover:border-emerald-200 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group h-64"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base text-slate-900 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">Seguimiento Individual</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Busca jugadores específicos y edita o asigna planes nutricionales personalizados.</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-4">
              <span>Ver Planes Individuales</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default NutriDashboard;
