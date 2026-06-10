import Layout from '@/components/Layout';
import { Player } from '@/data/players';
import { usePlayers } from '@/context/PlayerContext';
import { Apple, Search, ChevronLeft, ChevronRight, Save, Plus, Trash2, X, Check, Utensils } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNutri } from '@/context/NutriContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NutritionMeal {
  name: string;
  food: string;
  quantity: string;
}

interface NutritionPlanJSON {
  title: string;
  meals: NutritionMeal[];
}

const parseNutritionPlan = (planStr?: string): NutritionPlanJSON => {
  if (!planStr || planStr === 'Sin asignar') {
    return {
      title: '',
      meals: [
        { name: 'Desayuno', food: '', quantity: '' }
      ]
    };
  }
  try {
    const parsed = JSON.parse(planStr);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.meals)) {
      return parsed as NutritionPlanJSON;
    }
  } catch (e) {
    // Treat as plain text
  }
  return {
    title: planStr,
    meals: [
      { name: 'Plan General', food: planStr, quantity: '' }
    ]
  };
};

const formatNutritionPlanDisplay = (planStr?: string) => {
  if (!planStr || planStr === 'Sin asignar') return 'Sin asignar';
  try {
    const parsed = JSON.parse(planStr);
    if (parsed && parsed.title) {
      const mealsCount = parsed.meals?.length || 0;
      return `${parsed.title} (${mealsCount} ${mealsCount === 1 ? 'comida' : 'comidas'})`;
    }
  } catch (e) {
    // Return the string directly if it's not JSON
  }
  return planStr;
};

const getPaginationRange = (current: number, total: number) => {
  const range: (number | string)[] = [];
  const siblingCount = 1;

  if (total <= 5) {
    for (let i = 1; i <= total; i++) {
      range.push(i);
    }
    return range;
  }

  const leftSiblingIndex = Math.max(current - siblingCount, 1);
  const rightSiblingIndex = Math.min(current + siblingCount, total);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < total - 1;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const itemSlice = 3 + siblingCount;
    for (let i = 1; i <= itemSlice; i++) {
      range.push(i);
    }
    range.push('...');
    range.push(total);
  } else if (shouldShowLeftDots && !shouldShowRightDots) {
    range.push(1);
    range.push('...');
    const itemSlice = total - (2 + siblingCount);
    for (let i = itemSlice; i <= total; i++) {
      range.push(i);
    }
  } else if (shouldShowLeftDots && shouldShowRightDots) {
    range.push(1);
    range.push('...');
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      range.push(i);
    }
    range.push('...');
    range.push(total);
  }

  return range;
};

const NutriPlans = () => {
  const { players } = usePlayers();
  const { playerPlans, updatePlayerPlan } = useNutri();
  
  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Display more players per page in grid

  // Plan editor states
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedBulkPlayerIds, setSelectedBulkPlayerIds] = useState<string[]>([]);
  const [planForm, setPlanForm] = useState<NutritionPlanJSON>({
    title: '',
    meals: []
  });

  const location = useLocation();
  const statePlayerId = location.state?.selectedPlayerId;

  // Handle direct navigation to player
  useEffect(() => {
    if (statePlayerId) {
      const player = players.find(p => p.id === statePlayerId);
      if (player) {
        handleOpenPlanEditor(player);
      }
    }
  }, [statePlayerId, playerPlans]);

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const currentPlayers = filteredPlayers.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const handleOpenPlanEditor = (player: Player) => {
    setIsBulkMode(false);
    setSelectedPlayer(player);
    setSelectedBulkPlayerIds([]);
    const dbPlan = playerPlans[player.id]?.goal;
    const parsed = parseNutritionPlan(dbPlan);
    setPlanForm(parsed);
    setIsModalOpen(true);
  };

  const handleOpenBulkPlanEditor = () => {
    setIsBulkMode(true);
    setSelectedPlayer(null);
    setSelectedBulkPlayerIds([]);
    setPlanForm({
      title: '',
      meals: [
        { name: 'Desayuno', food: '', quantity: '' }
      ]
    });
    setIsModalOpen(true);
  };

  const handleAddMeal = () => {
    setPlanForm(prev => ({
      ...prev,
      meals: [
        ...prev.meals,
        { name: '', food: '', quantity: '' }
      ]
    }));
  };

  const handleRemoveMeal = (idxToRemove: number) => {
    setPlanForm(prev => {
      const updatedMeals = prev.meals.filter((_, idx) => idx !== idxToRemove);
      return {
        ...prev,
        meals: updatedMeals.length > 0 ? updatedMeals : [{ name: 'Desayuno', food: '', quantity: '' }]
      };
    });
  };

  const handleMealChange = (idx: number, field: keyof NutritionMeal, value: string) => {
    setPlanForm(prev => {
      const updatedMeals = [...prev.meals];
      updatedMeals[idx] = {
        ...updatedMeals[idx],
        [field]: value
      };
      return { ...prev, meals: updatedMeals };
    });
  };

  const handleSavePlan = async () => {
    if (!planForm.title.trim()) {
      toast.error('Por favor ingresá un nombre para el plan');
      return;
    }

    if (isBulkMode && selectedBulkPlayerIds.length === 0) {
      toast.error('Seleccioná al menos un jugador para asignar el plan');
      return;
    }

    // Validation: make sure all meals have a name/type and food details
    const hasEmptyMeals = planForm.meals.some(meal => !meal.name.trim() || !meal.food.trim());
    if (hasEmptyMeals) {
      toast.error('Completá el nombre de comida y alimentos de todas las filas');
      return;
    }

    try {
      const serializedPlan = JSON.stringify(planForm);
      if (isBulkMode) {
        // Bulk update
        await Promise.all(
          selectedBulkPlayerIds.map(playerId => 
            updatePlayerPlan(playerId, { goal: serializedPlan, notes: '' })
          )
        );
        toast.success(`Plan de nutrición asignado a ${selectedBulkPlayerIds.length} jugadores`);
      } else if (selectedPlayer) {
        // Individual update
        await updatePlayerPlan(selectedPlayer.id, { goal: serializedPlan, notes: '' });
        toast.success(`Plan de nutrición asignado a ${selectedPlayer.name}`);
      }
      setIsModalOpen(false);
    } catch (e) {
      toast.error('Error al guardar el plan nutricional');
    }
  };

  return (
    <Layout title="Gestión Dietética">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10 animate-fade-in pb-32">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="border-l-4 border-emerald-500 pl-5">
            <h2 className="font-display text-lg tracking-tight text-slate-900 uppercase">PLANTEL</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Seleccioná un jugador para gestionar su plan</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <button 
              onClick={handleOpenBulkPlanEditor}
              className="bg-slate-900 text-white px-5 py-3 rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-2.5 shadow-xl shadow-slate-900/10"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">ASIGNAR MASIVO</span>
            </button>
            <div className="relative flex-1 md:flex-initial md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                type="text"
                placeholder="Buscar jugador..."
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Players List Grid */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[300px]">
            {currentPlayers.map(player => (
              <button 
                key={player.id} 
                onClick={() => handleOpenPlanEditor(player)}
                className="w-full premium-card p-6 border-slate-50 shadow-sm flex flex-col justify-between hover:border-emerald-200 hover:shadow-md transition-all bg-white text-left group"
              >
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-display text-sm shadow-inner shrink-0">
                        {player.number}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">{player.name}</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{player.position}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-0.5 group-hover:text-emerald-500 transition-all" />
                  </div>

                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100/50 flex items-center gap-3 group-hover:bg-white group-hover:border-emerald-100 transition-all">
                    <Apple className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="text-[11px] font-bold text-slate-700 truncate">
                      Plan: {formatNutritionPlanDisplay(playerPlans[player.id]?.goal)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-2.5 rounded-xl border border-slate-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 sm:px-4 sm:py-2"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[8px] md:text-[9px] font-black tracking-[0.2em] uppercase">Anterior</span>
              </button>
              <div className="flex items-center gap-1 mx-2">
                {getPaginationRange(currentPage, totalPages).map((page, i) => {
                  if (page === '...') {
                    return (
                      <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-[9px] md:text-[10px] font-black text-slate-300">
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={`page-${page}`}
                      onClick={() => setCurrentPage(Number(page))}
                      className={`w-8 h-8 rounded-xl text-[9px] md:text-[10px] font-black transition-all ${
                        currentPage === page 
                          ? 'bg-slate-900 text-white shadow-xl scale-105' 
                          : 'bg-white border border-slate-100 text-slate-400 hover:border-emerald-200'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-2.5 rounded-xl border border-slate-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 sm:px-4 sm:py-2"
                aria-label="Siguiente"
              >
                <span className="hidden sm:inline text-[8px] md:text-[9px] font-black tracking-[0.2em] uppercase">Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PLAN CREATOR/EDITOR DIALOG */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-8 bg-white border border-slate-100 shadow-2xl animate-in fade-in duration-200">
          <DialogHeader className="mb-6 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="font-display text-xl text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <Utensils className="w-6 h-6 text-emerald-500" />
                <span>
                  {isBulkMode 
                    ? "Asignar Plan de Nutrición Masivo" 
                    : `Asignar Plan Nutricional: ${selectedPlayer?.name}`
                  }
                </span>
              </DialogTitle>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mt-1">
                Definí los tiempos de comida, alimentos sugeridos y las porciones/cantidades
              </p>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Plan Title */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Nombre del Plan o Enfoque principal
              </label>
              <input
                type="text"
                placeholder="Ej. Volumen Magro, Déficit Calórico, Dieta de Competencia..."
                value={planForm.title}
                onChange={e => setPlanForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-slate-50/80 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all text-slate-800"
              />
            </div>

            {/* Player Selection Checklist for Bulk Mode */}
            {isBulkMode && (
              <div className="space-y-3 bg-slate-50/50 p-5 border border-slate-100 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Seleccionar Jugadores ({selectedBulkPlayerIds.length})
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBulkPlayerIds(players.map(p => p.id))}
                      className="text-[9px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest"
                    >
                      Seleccionar Todos
                    </button>
                    <span className="text-slate-200">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedBulkPlayerIds([])}
                      className="text-[9px] font-black text-slate-400 hover:text-slate-655 uppercase tracking-widest"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[160px] overflow-y-auto pr-1">
                  {players.map(player => {
                    const isSelected = selectedBulkPlayerIds.includes(player.id);
                    return (
                      <button
                        type="button"
                        key={player.id}
                        onClick={() => {
                          setSelectedBulkPlayerIds(prev =>
                            prev.includes(player.id)
                              ? prev.filter(id => id !== player.id)
                              : [...prev, player.id]
                          );
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-50/50 border-emerald-500/30 text-emerald-950 font-bold'
                            : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                          isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] truncate leading-tight">{player.name}</div>
                          <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{player.position}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Meals table constructor */}
            <div className="space-y-4">
              <h3 className="font-display text-sm text-slate-700 uppercase tracking-wider">
                Comidas y Distribución de Nutrientes
              </h3>

              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[25%]">Comida / Momento</th>
                      <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[45%]">Alimentos / Menú</th>
                      <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[20%]">Cantidades / Porción</th>
                      <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[10%] text-center">Quitar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planForm.meals.map((meal, idx) => (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-white transition-colors">
                        <td className="p-2.5">
                          <input
                            type="text"
                            placeholder="Ej. Desayuno, Almuerzo..."
                            value={meal.name}
                            onChange={e => handleMealChange(idx, 'name', e.target.value)}
                            className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500 transition-all text-slate-800"
                          />
                        </td>
                        <td className="p-2.5">
                          <textarea
                            placeholder="Ej. Claras de huevo revueltas, avena cocida con chía y una porción de frutos secos"
                            value={meal.food}
                            rows={2}
                            onChange={e => handleMealChange(idx, 'food', e.target.value)}
                            className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500 transition-all text-slate-800 resize-none"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            placeholder="Ej. 1 taza avena, 4 claras"
                            value={meal.quantity}
                            onChange={e => handleMealChange(idx, 'quantity', e.target.value)}
                            className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500 transition-all text-slate-800"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveMeal(idx)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-all hover:bg-red-50 rounded-xl"
                            title="Eliminar comida"
                          >
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={handleAddMeal}
                className="w-full py-3.5 border-2 border-dashed border-slate-100 hover:border-emerald-500/50 rounded-2xl text-xs font-black text-slate-400 hover:text-emerald-600 transition-all flex items-center justify-center gap-2 bg-white"
              >
                <Plus className="w-4 h-4" />
                <span>AGREGAR COMIDA O MOMENTO</span>
              </button>
            </div>
          </div>

          <div className="flex gap-4 mt-8 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 bg-white border border-slate-200 text-slate-600 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSavePlan}
              className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/10"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Plan Nutricional</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default NutriPlans;
