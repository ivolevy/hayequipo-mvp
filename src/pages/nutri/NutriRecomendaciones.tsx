import { useState } from 'react';
import Layout from '@/components/Layout';
import { Utensils, ChevronLeft, Plus, Check } from 'lucide-react';
import { useNutri, MealRecommendation } from '@/context/NutriContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const NutriRecomendaciones = () => {
  const { recommendations, updateRecommendation } = useNutri();
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editItems, setEditItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');

  const handleEdit = (rec: MealRecommendation) => {
    setEditingId(rec.id);
    setEditTitle(rec.title);
    setEditItems([...rec.items]);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    setEditItems(prev => [...prev, newItem.trim()]);
    setNewItem('');
  };

  const handleRemoveItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const handleSave = (rec: MealRecommendation) => {
    if (!editTitle) {
      toast.error('El título no puede estar vacío');
      return;
    }
    let finalItems = [...editItems];
    if (newItem.trim()) {
      finalItems.push(newItem.trim());
      setNewItem('');
    }
    updateRecommendation({ ...rec, title: editTitle, items: finalItems });
    setEditingId(null);
    toast.success('Recomendación actualizada');
  };

  return (
    <Layout title="Recomendaciones" showBack backTo="/nutri">
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in pb-32 space-y-10">

        <div className="space-y-6">
          <div className="flex flex-col gap-2 px-2">
            <h2 className="font-display text-lg tracking-tight text-slate-900 uppercase">Sugerencias y Platos</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestiona las ideas de comidas para distintos momentos del día</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((rec) => (
              <div key={rec.id} className="premium-card p-6 flex flex-col h-full border-emerald-50 hover:border-emerald-100 transition-all">
                
                {editingId === rec.id ? (
                  <div className="space-y-4 flex-1">
                    <input 
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-sm font-bold uppercase tracking-tight outline-none focus:border-emerald-500"
                    />
                    
                    <div className="space-y-2">
                      {editItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-lg">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight truncate pl-2">{item}</span>
                          <button 
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-300 hover:text-rose-500 p-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddItem} className="flex gap-2">
                      <input 
                        value={newItem}
                        onChange={e => setNewItem(e.target.value)}
                        placeholder="NUEVO ALIMENTO..."
                        className="flex-1 bg-white border border-slate-100 p-2 rounded-lg text-[10px] font-black tracking-widest outline-none focus:border-emerald-500"
                      />
                      <button type="submit" className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Plus className="w-4 h-4" />
                      </button>
                    </form>

                    <button 
                      onClick={() => handleSave(rec)}
                      className="w-full mt-4 bg-emerald-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Guardar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Utensils className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-xl text-slate-900 uppercase tracking-tight">{rec.title}</h3>
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{rec.type}</p>
                      </div>
                    </div>
                    
                    <ul className="space-y-3 flex-1">
                      {rec.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-600 leading-relaxed">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-200 mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                      {rec.items.length === 0 && (
                        <li className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Sin alimentos listados</li>
                      )}
                    </ul>

                    <button 
                      onClick={() => handleEdit(rec)}
                      className="w-full mt-auto bg-slate-50 text-slate-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 hover:text-slate-600 transition-all"
                    >
                      Editar Placa
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NutriRecomendaciones;
