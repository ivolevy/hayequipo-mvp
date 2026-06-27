import { useState } from 'react';
import Layout from '@/components/Layout';
import { Plus, FileText, ChevronRight, Search, ChevronLeft, Trash2, Dumbbell, Save, X, Check } from 'lucide-react';
import { usePlayers } from '@/context/PlayerContext';
import { usePf } from '@/context/PfContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

const parseTrainingPlan = (planStr?: string): TrainingPlanJSON => {
  if (!planStr || planStr === 'Sin asignar') {
    return {
      title: '',
      days: [
        {
          name: 'Día 1',
          exercises: [{ name: '', sets: '', reps: '', rest: '' }]
        }
      ]
    };
  }
  try {
    const parsed = JSON.parse(planStr);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.days)) {
      return parsed as TrainingPlanJSON;
    }
  } catch (e) {
    // Treat as plain text
  }
  return {
    title: planStr,
    days: [
      {
        name: 'Día 1',
        exercises: [{ name: planStr, sets: '', reps: '', rest: '' }]
      }
    ]
  };
};

const formatPlanDisplay = (planStr?: string) => {
  if (!planStr || planStr === 'Sin asignar') return 'Sin asignar';
  try {
    const parsed = JSON.parse(planStr);
    if (parsed && parsed.title) {
      const daysCount = parsed.days?.length || 0;
      return `${parsed.title} (${daysCount} ${daysCount === 1 ? 'día' : 'días'})`;
    }
  } catch (e) {
    // Return the string directly if it's not JSON
  }
  return planStr;
};

const PFTrainingPlans = () => {
  const { players } = usePlayers();
  const { updateTrainingPlan } = usePf();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Plan editor states
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedBulkPlayerIds, setSelectedBulkPlayerIds] = useState<string[]>([]);
  const [planForm, setPlanForm] = useState<TrainingPlanJSON>({
    title: '',
    days: []
  });
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  const currentItems = filteredPlayers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPaginationRange = (current: number, total: number) => {
    const range: (number | string)[] = [];
    if (total <= 5) {
      for (let i = 1; i <= total; i++) range.push(i);
    } else {
      range.push(1);
      if (current > 3) range.push('...');
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) {
        if (!range.includes(i)) range.push(i);
      }
      if (current < total - 2) range.push('...');
      if (!range.includes(total)) range.push(total);
    }
    return range;
  };

  const handleOpenPlanEditor = (player: any) => {
    setIsBulkMode(false);
    setSelectedPlayer(player);
    setSelectedBulkPlayerIds([]);
    const parsed = parseTrainingPlan(player.activePlans?.training);
    setPlanForm(parsed);
    setActiveDayIndex(0);
    setIsModalOpen(true);
  };

  const handleOpenBulkPlanEditor = () => {
    setIsBulkMode(true);
    setSelectedPlayer(null);
    setSelectedBulkPlayerIds([]);
    setPlanForm({
      title: '',
      days: [
        {
          name: 'Día 1',
          exercises: [{ name: '', sets: '', reps: '', rest: '' }]
        }
      ]
    });
    setActiveDayIndex(0);
    setIsModalOpen(true);
  };

  const handleAddDay = () => {
    const nextDayNum = planForm.days.length + 1;
    setPlanForm(prev => ({
      ...prev,
      days: [
        ...prev.days,
        {
          name: `Día ${nextDayNum}`,
          exercises: [{ name: '', sets: '', reps: '', rest: '' }]
        }
      ]
    }));
    setActiveDayIndex(planForm.days.length);
  };

  const handleRemoveDay = (indexToRemove: number) => {
    if (planForm.days.length <= 1) {
      toast.error('El plan debe tener al menos un día');
      return;
    }
    const updatedDays = planForm.days.filter((_, idx) => idx !== indexToRemove).map((day, idx) => ({
      ...day,
      name: `Día ${idx + 1}`
    }));
    
    setPlanForm(prev => ({
      ...prev,
      days: updatedDays
    }));
    
    setActiveDayIndex(prev => {
      if (prev >= updatedDays.length) return updatedDays.length - 1;
      return prev;
    });
    toast.success('Día eliminado');
  };

  const handleAddExercise = () => {
    setPlanForm(prev => {
      const updatedDays = [...prev.days];
      updatedDays[activeDayIndex] = {
        ...updatedDays[activeDayIndex],
        exercises: [
          ...updatedDays[activeDayIndex].exercises,
          { name: '', sets: '', reps: '', rest: '' }
        ]
      };
      return { ...prev, days: updatedDays };
    });
  };

  const handleRemoveExercise = (exerciseIndex: number) => {
    setPlanForm(prev => {
      const updatedDays = [...prev.days];
      const updatedExercises = updatedDays[activeDayIndex].exercises.filter((_, idx) => idx !== exerciseIndex);
      
      updatedDays[activeDayIndex] = {
        ...updatedDays[activeDayIndex],
        exercises: updatedExercises.length > 0 ? updatedExercises : [{ name: '', sets: '', reps: '', rest: '' }]
      };
      return { ...prev, days: updatedDays };
    });
  };

  const handleExerciseChange = (exerciseIndex: number, field: keyof Exercise, value: string) => {
    setPlanForm(prev => {
      const updatedDays = [...prev.days];
      const updatedExercises = [...updatedDays[activeDayIndex].exercises];
      updatedExercises[exerciseIndex] = {
        ...updatedExercises[exerciseIndex],
        [field]: value
      };
      updatedDays[activeDayIndex] = {
        ...updatedDays[activeDayIndex],
        exercises: updatedExercises
      };
      return { ...prev, days: updatedDays };
    });
  };

  const handleSavePlan = async () => {
    if (!planForm.title.trim()) {
      toast.error('Por favor ingresá un nombre para el plan');
      return;
    }
    if (planForm.title.trim().length > 50) {
      toast.error('El nombre del plan no puede superar los 50 caracteres');
      return;
    }

    if (isBulkMode && selectedBulkPlayerIds.length === 0) {
      toast.error('Seleccioná al menos un jugador para asignar el plan');
      return;
    }

    // Validation: check if there's any exercise with no name
    const hasEmptyExercise = planForm.days.some(day => 
      day.exercises.some(ex => !ex.name.trim())
    );

    if (hasEmptyExercise) {
      toast.error('Completá el nombre de todos los ejercicios agregados');
      return;
    }

    const hasLongExName = planForm.days.some(day => 
      day.exercises.some(ex => ex.name.trim().length > 50)
    );
    if (hasLongExName) {
      toast.error('El nombre del ejercicio no puede superar los 50 caracteres');
      return;
    }
    const hasLongExSets = planForm.days.some(day => 
      day.exercises.some(ex => ex.sets.trim().length > 20)
    );
    if (hasLongExSets) {
      toast.error('Las series no pueden superar los 20 caracteres');
      return;
    }
    const hasLongExReps = planForm.days.some(day => 
      day.exercises.some(ex => ex.reps.trim().length > 20)
    );
    if (hasLongExReps) {
      toast.error('Las repeticiones no pueden superar los 20 caracteres');
      return;
    }
    const hasLongExRest = planForm.days.some(day => 
      day.exercises.some(ex => ex.rest.trim().length > 20)
    );
    if (hasLongExRest) {
      toast.error('El descanso no puede superar los 20 caracteres');
      return;
    }

    try {
      const serializedPlan = JSON.stringify(planForm);
      if (isBulkMode) {
        // Bulk update
        await Promise.all(
          selectedBulkPlayerIds.map(playerId => updateTrainingPlan(playerId, serializedPlan))
        );
        toast.success(`Plan asignado a ${selectedBulkPlayerIds.length} jugadores`);
      } else {
        // Individual update
        await updateTrainingPlan(selectedPlayer.id, serializedPlan);
        toast.success('Plan de entrenamiento guardado y asignado');
      }
      setIsModalOpen(false);
    } catch (e) {
      toast.error('Error al guardar el plan');
    }
  };

  return (
    <Layout title="Gestión de Entrenamiento">
      <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="border-l-4 border-emerald-500 pl-5">
            <h2 className="font-display text-lg tracking-tight text-slate-900 uppercase">PLANES POR JUGADOR</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Asigná rutinas de recuperación o fuerza</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <button 
              onClick={handleOpenBulkPlanEditor}
              className="bg-slate-900 text-white px-5 py-3 rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-2.5 shadow-xl shadow-slate-900/10"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">ASIGNAR MASIVO</span>
            </button>
            <button 
              onClick={() => {
                const name = prompt('Ingresá el nombre del jugador a buscar o selecciona abajo:');
                if (name) handleSearch(name);
              }}
              className="bg-emerald-600 text-white px-5 py-3 rounded-2xl hover:bg-emerald-700 transition-all flex items-center gap-2.5 shadow-xl shadow-emerald-255"
            >
              <Search className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">BUSCAR JUGADOR</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input
            type="text"
            placeholder="Buscar por nombre de jugador..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[300px]">
          {currentItems.map(player => (
            <div 
              key={player.id} 
              onClick={() => handleOpenPlanEditor(player)}
              className="premium-card p-6 flex flex-col justify-between hover:border-emerald-200 transition-all cursor-pointer group bg-white border-slate-50"
            >
              <div>
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-display text-lg text-white shrink-0">
                      {player.number}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 leading-none mb-1 group-hover:text-emerald-600 transition-colors uppercase text-sm tracking-tight">{player.name}</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{player.position}</div>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${player.healthStatus === 'disponible' ? 'bg-emerald-500' : player.healthStatus === 'duda' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                </div>
                
                <div className="space-y-4">
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100/50 flex items-center gap-3 group-hover:bg-white group-hover:border-emerald-100 transition-all">
                    <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="text-[11px] font-bold text-slate-700 truncate">
                      Rutina: {formatPlanDisplay(player.activePlans?.training)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">
                    <span>Editar rutina</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

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

      {/* PLAN CREATOR/EDITOR DIALOG */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-8 bg-white border border-slate-100 shadow-2xl">
          <DialogHeader className="mb-6 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="font-display text-xl text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <Dumbbell className="w-6 h-6 text-emerald-500" />
                <span>
                  {isBulkMode 
                    ? "Asignar Plan a Múltiples Jugadores" 
                    : `Asignar Plan: ${selectedPlayer?.name}`
                  }
                </span>
              </DialogTitle>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mt-1">
                Estructurá el entrenamiento por días, ejercicios, series y repeticiones
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
                placeholder="Ej. Fuerza Explosiva, Recuperación Isquiotibial, Acondicionamiento..."
                value={planForm.title}
                onChange={e => setPlanForm(prev => ({ ...prev, title: e.target.value }))}
                maxLength={50}
                required
                className="w-full bg-slate-50/80 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all text-slate-800"
              />
            </div>

            {/* Player Selection for Bulk Mode */}
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
                      className="text-[9px] font-black text-slate-400 hover:text-slate-650 uppercase tracking-widest"
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

            {/* Days Selection and Table */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
                {planForm.days.map((day, idx) => (
                  <div key={idx} className="relative group">
                    <button
                      type="button"
                      onClick={() => setActiveDayIndex(idx)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeDayIndex === idx
                          ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                          : 'bg-slate-50 border border-slate-100 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <span>{day.name}</span>
                      {planForm.days.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveDay(idx);
                          }}
                          className={`hover:text-red-500 transition-colors ml-1 p-0.5 rounded ${
                            activeDayIndex === idx ? 'text-slate-400' : 'text-slate-400'
                          }`}
                          title="Eliminar Día"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddDay}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/50 hover:bg-emerald-100 transition-all flex items-center gap-1.5 ml-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Día</span>
                </button>
              </div>

              {/* Table of Exercises for Active Day */}
              {planForm.days[activeDayIndex] && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm text-slate-700 uppercase tracking-wider">
                      Ejercicios para el {planForm.days[activeDayIndex].name}
                    </h3>
                  </div>

                  <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/80">
                          <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[40%]">Ejercicio</th>
                          <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[15%]">Series</th>
                          <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[15%]">Reps</th>
                          <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[20%]">Descanso</th>
                          <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[10%] text-center">Quitar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {planForm.days[activeDayIndex].exercises.map((exercise, exIdx) => (
                          <tr key={exIdx} className="border-b border-slate-50 hover:bg-white transition-colors">
                            <td className="p-2.5">
                              <input
                                type="text"
                                placeholder="Ej. Sentadilla Goblet"
                                value={exercise.name}
                                onChange={e => handleExerciseChange(exIdx, 'name', e.target.value)}
                                maxLength={50}
                                required
                                className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500 transition-all text-slate-800"
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                placeholder="Ej. 4"
                                value={exercise.sets}
                                onChange={e => handleExerciseChange(exIdx, 'sets', e.target.value)}
                                maxLength={20}
                                required
                                className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500 transition-all text-slate-800"
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                placeholder="Ej. 10 o 8-12"
                                value={exercise.reps}
                                onChange={e => handleExerciseChange(exIdx, 'reps', e.target.value)}
                                maxLength={20}
                                required
                                className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500 transition-all text-slate-800"
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                placeholder="Ej. 90'' o 2 min"
                                value={exercise.rest}
                                onChange={e => handleExerciseChange(exIdx, 'rest', e.target.value)}
                                maxLength={20}
                                className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500 transition-all text-slate-800"
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveExercise(exIdx)}
                                className="p-2 text-slate-300 hover:text-red-500 transition-all hover:bg-red-50 rounded-xl"
                                title="Eliminar ejercicio"
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
                    onClick={handleAddExercise}
                    className="w-full py-3.5 border-2 border-dashed border-slate-100 hover:border-emerald-500/50 rounded-2xl text-xs font-black text-slate-400 hover:text-emerald-600 transition-all flex items-center justify-center gap-2 bg-white"
                  >
                    <Plus className="w-4 h-4" />
                    <span>AGREGAR EJERCICIO A ESTE DÍA</span>
                  </button>
                </div>
              )}
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
              <span>Guardar Plan de Entrenamiento</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default PFTrainingPlans;
