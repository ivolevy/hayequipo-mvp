import { useState } from 'react';
import Layout from '@/components/Layout';
import { Target, Plus, Trash2, ChevronLeft } from 'lucide-react';
import { useNutri } from '@/context/NutriContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const NutriObjetivos = () => {
  const { objectives, addObjective, removeObjective } = useNutri();
  const [newObjTitle, setNewObjTitle] = useState('');
  const [newObjDesc, setNewObjDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const navigate = useNavigate();

  const handleAddObj = () => {
    if (!newObjTitle || !newObjDesc) {
      toast.error('Completa todos los campos');
      return;
    }
    addObjective({ title: newObjTitle, description: newObjDesc, category: 'general' });
    setNewObjTitle('');
    setNewObjDesc('');
    setIsAdding(false);
    toast.success('Objetivo añadido');
  };

  return (
    <Layout title="Objetivos Semanales" showBack backTo="/nutri">
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in pb-32 space-y-10">

        <div className="space-y-6">
          <div className="flex flex-col gap-2 px-2">
            <h2 className="font-display text-lg tracking-tight text-slate-900 uppercase">Gestión de Objetivos</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carga el enfoque nutricional para todo el plantel</p>
          </div>
          
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="w-full premium-card p-6 border-dashed border-2 hover:border-emerald-200 bg-slate-50 hover:bg-emerald-50/50 flex flex-col items-center justify-center gap-3 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Añadir Nuevo Objetivo</span>
          </button>

          {isAdding && (
            <div className="premium-card p-6 border-2 border-emerald-100 bg-emerald-50/30 animate-in slide-in-from-top-4 duration-300 space-y-4">
              <div className="space-y-3">
                <input 
                  value={newObjTitle}
                  onChange={(e) => setNewObjTitle(e.target.value)}
                  placeholder="TÍTULO DEL OBJETIVO..."
                  className="w-full bg-white border border-slate-100 p-4 rounded-xl text-xs font-black tracking-widest outline-none focus:border-emerald-500"
                />
                <textarea 
                  value={newObjDesc}
                  onChange={(e) => setNewObjDesc(e.target.value)}
                  placeholder="DESCRIPCIÓN DETALLADA..."
                  rows={3}
                  className="w-full bg-white border border-slate-100 p-4 rounded-xl text-xs font-black tracking-widest outline-none focus:border-emerald-500 resize-none"
                />
              </div>
              <button 
                onClick={handleAddObj}
                className="w-full bg-emerald-600 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
              >
                GUARDAR OBJETIVO
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {objectives.map((obj) => (
              <div key={obj.id} className="premium-card p-6 flex items-start gap-4 hover:border-emerald-100 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex shrink-0 items-center justify-center text-emerald-600">
                  <Target className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-display text-slate-900 uppercase tracking-tight mb-1">{obj.title}</h3>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed">{obj.description}</p>
                </div>
                <button 
                  onClick={() => removeObjective(obj.id)}
                  className="w-8 h-8 rounded-lg text-slate-200 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {objectives.length === 0 && !isAdding && (
               <div className="py-12 text-center">
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No hay objetivos cargados para esta semana.</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NutriObjetivos;
