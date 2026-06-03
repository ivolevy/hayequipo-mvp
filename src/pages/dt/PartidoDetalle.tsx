import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useMatches } from '@/context/MatchContext';
import { useAuth } from '@/context/AuthContext';
import { usePlayers } from '@/context/PlayerContext';
import { Player } from '@/data/players';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, MapPin, Shield, Users, Trash2, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import FootballPitch from '@/components/FootballPitch';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotices } from '@/context/NoticeContext';
import NotFound from '../NotFound';

const statusOrder = { pendiente: 1, confirmado: 0, rechazado: 2 } as const;

const statusStyles = {
  confirmado: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  pendiente: 'bg-amber-50 text-amber-700 border-amber-100',
  rechazado: 'bg-rose-50 text-rose-700 border-rose-100',
  lesionado: 'bg-slate-50 text-slate-400 border-slate-100 grayscale',
} as const;

const statusLabels = {
  confirmado: 'Confirmado',
  pendiente: 'Pendiente',
  rechazado: 'Rechazado',
  lesionado: 'Lesionado',
} as const;

const formations = {
  '4-4-2': [
    { x: 50, y: 90 }, // GK
    { x: 20, y: 70 }, { x: 40, y: 75 }, { x: 60, y: 75 }, { x: 80, y: 70 }, // DEF
    { x: 20, y: 45 }, { x: 40, y: 50 }, { x: 60, y: 50 }, { x: 80, y: 45 }, // MID
    { x: 35, y: 25 }, { x: 65, y: 25 }, // FWD
  ],
  '4-3-3': [
    { x: 50, y: 90 }, // GK
    { x: 20, y: 70 }, { x: 40, y: 75 }, { x: 60, y: 75 }, { x: 80, y: 70 }, // DEF
    { x: 30, y: 50 }, { x: 50, y: 55 }, { x: 70, y: 50 }, // MID
    { x: 20, y: 25 }, { x: 50, y: 20 }, { x: 80, y: 25 }, // FWD
  ],
  '4-2-3-1': [
    { x: 50, y: 90 }, // GK
    { x: 20, y: 70 }, { x: 40, y: 75 }, { x: 60, y: 75 }, { x: 80, y: 70 }, // DEF
    { x: 35, y: 55 }, { x: 65, y: 55 }, // CDM
    { x: 20, y: 40 }, { x: 50, y: 40 }, { x: 80, y: 40 }, // CAM/W
    { x: 50, y: 20 }, // ST
  ],
  '4-1-4-1': [
    { x: 50, y: 90 }, // GK
    { x: 20, y: 70 }, { x: 40, y: 75 }, { x: 60, y: 75 }, { x: 80, y: 70 }, // DEF
    { x: 50, y: 60 }, // CDM
    { x: 20, y: 45 }, { x: 40, y: 45 }, { x: 60, y: 45 }, { x: 80, y: 45 }, // MID
    { x: 50, y: 20 }, // ST
  ],
  '4-3-1-2': [
    { x: 50, y: 90 }, // GK
    { x: 20, y: 70 }, { x: 40, y: 75 }, { x: 60, y: 75 }, { x: 80, y: 70 }, // DEF
    { x: 30, y: 55 }, { x: 50, y: 60 }, { x: 70, y: 55 }, // CM
    { x: 50, y: 40 }, // CAM
    { x: 35, y: 25 }, { x: 65, y: 25 }, // FWD
  ],
  '3-5-2': [
    { x: 50, y: 90 }, // GK
    { x: 30, y: 75 }, { x: 50, y: 80 }, { x: 70, y: 75 }, // DEF
    { x: 15, y: 50 }, { x: 35, y: 55 }, { x: 50, y: 60 }, { x: 65, y: 55 }, { x: 85, y: 50 }, // MID
    { x: 35, y: 25 }, { x: 65, y: 25 }, // FWD
  ],
  '3-4-3': [
    { x: 50, y: 90 }, // GK
    { x: 30, y: 75 }, { x: 50, y: 80 }, { x: 70, y: 75 }, // DEF
    { x: 20, y: 50 }, { x: 40, y: 55 }, { x: 60, y: 55 }, { x: 80, y: 50 }, // MID
    { x: 25, y: 25 }, { x: 50, y: 20 }, { x: 75, y: 25 }, // FWD
  ],
  '5-3-2': [
    { x: 50, y: 90 }, // GK
    { x: 15, y: 65 }, { x: 33, y: 75 }, { x: 50, y: 80 }, { x: 67, y: 75 }, { x: 85, y: 65 }, // DEF
    { x: 30, y: 50 }, { x: 50, y: 55 }, { x: 70, y: 50 }, // MID
    { x: 35, y: 25 }, { x: 65, y: 25 }, // FWD
  ],
  '5-4-1': [
    { x: 50, y: 90 }, // GK
    { x: 15, y: 65 }, { x: 33, y: 75 }, { x: 50, y: 80 }, { x: 67, y: 75 }, { x: 85, y: 65 }, // DEF
    { x: 20, y: 45 }, { x: 40, y: 50 }, { x: 60, y: 50 }, { x: 80, y: 45 }, // MID
    { x: 50, y: 20 }, // FWD
  ]
};

type PitchSlot = {
  id: number;
  baseX: number;
  baseY: number;
  currentX: number;
  currentY: number;
  playerId: string | null;
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

const PartidoDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { matches, respondConvocation, removeConvocation, setSelectionForMatch, updatePlayerPitchPosition, updateMatch, deleteMatch } = useMatches();
  const { players } = usePlayers();
  const { addNotice } = useNotices();
  const [showLineup, setShowLineup] = useState(false);
  const [formation, setFormation] = useState<keyof typeof formations>(() => {
    const saved = localStorage.getItem(`formation_${id}`);
    return (saved as any) || '4-3-3';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const playersPerPage = 3;
  
  const [slots, setSlots] = useState<PitchSlot[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  
  const match = matches.find(m => m.id === id);
  const isReadOnly = user?.role !== 'dt';
  const myConv = match?.convocations.find(c => c.playerId === user?.supabaseId || c.playerId === user?.playerId);

  const isPast = match ? (match.completed || new Date(match.date).getTime() < (Date.now() - 3 * 60 * 60 * 1000)) : false;

  const [isEditing, setIsEditing] = useState(false);
  const [editRival, setEditRival] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editVenue, setEditVenue] = useState('');

  useEffect(() => {
    if (match) {
      setEditRival(match.rival);
      try {
        setEditDate(format(new Date(match.date), "yyyy-MM-dd'T'HH:mm"));
      } catch (e) {
        setEditDate('');
      }
      setEditVenue(match.venue);
    }
  }, [match]);

  const handleSaveEdit = async () => {
    if (!match || isPast) return;
    if (!editRival.trim() || !editDate || !editVenue.trim()) {
      toast.error('Todos los campos del partido son obligatorios');
      return;
    }
    if (new Date(editDate).getTime() < Date.now()) {
      toast.error('La fecha del partido no puede estar en el pasado');
      return;
    }
    try {
      await updateMatch(match.id, {
        rival: editRival.trim(),
        date: editDate,
        venue: editVenue.trim()
      });
      toast.success('Datos del partido actualizados correctamente');
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message || 'Error al actualizar el partido');
    }
  };

  const handleDeleteMatch = async () => {
    if (!match || isPast) return;
    if (confirm(`¿Estás seguro de eliminar el partido contra ${match.rival}? Esta acción no se puede deshacer.`)) {
      try {
        await deleteMatch(match.id);
        toast.success('Partido eliminado correctamente');
        navigate('/dt');
      } catch (e: any) {
        toast.error(e.message || 'Error al eliminar el partido');
      }
    }
  };

  // Sincronizar slots desde las convocatorias guardadas en el partido
  useEffect(() => {
    if (!match) return;

    // 1. Crear slots base para la formación actual
    const baseSlots = formations[formation].map((pos, i) => ({
      id: i,
      baseX: pos.x,
      baseY: pos.y,
      currentX: pos.x,
      currentY: pos.y,
      playerId: null as string | null
    }));

    // 2. Mapear convocatorias posicionadas a los slots correspondientes
    const positionedConvs = match.convocations.filter(
      c => c.positionX !== undefined && c.positionY !== undefined
    );

    positionedConvs.forEach(conv => {
      // Encontrar el slot base más cercano disponible
      let nearestSlotIndex = -1;
      let minDistance = Infinity;

      baseSlots.forEach((slot, index) => {
        if (slot.playerId !== null) return;
        const dx = slot.baseX - (conv.positionX as number);
        const dy = slot.baseY - (conv.positionY as number);
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) {
          minDistance = distance;
          nearestSlotIndex = index;
        }
      });

      if (nearestSlotIndex !== -1) {
        baseSlots[nearestSlotIndex].playerId = conv.playerId;
        baseSlots[nearestSlotIndex].currentX = conv.positionX as number;
        baseSlots[nearestSlotIndex].currentY = conv.positionY as number;
      }
    });

    setSlots(baseSlots);
  }, [match?.id, match?.convocations, formation]);

  if (!match) return <NotFound />;

  const confirmed = match.convocations.filter(c => c.status === 'confirmado').length;
  const pending = match.convocations.filter(c => c.status === 'pendiente').length;
  const rejected = match.convocations.filter(c => c.status === 'rechazado').length;

  const sortedConvocations = [...match.convocations].sort(
    (a, b) => statusOrder[a.status] - statusOrder[b.status]
  );

  const filteredConvocations = sortedConvocations.filter(conv => {
    const player = players.find(p => p.id === conv.playerId);
    return player?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredConvocations.length / playersPerPage);
  const paginatedConvocations = filteredConvocations.slice(
    (currentPage - 1) * playersPerPage,
    currentPage * playersPerPage
  );

  const convocatedPlayers = match.convocations
    .filter(c => c.status === 'confirmado' && c.selectedForMatch === true)
    .map(c => players.find(p => p.id === c.playerId))
    .filter((p): p is Player => p !== undefined && p.healthStatus !== 'lesionado');

  const assignedPlayerIds = slots.filter(s => s.playerId !== null).map(s => s.playerId as string);
  const availablePlayers = convocatedPlayers.filter(p => !assignedPlayerIds.includes(p.id));

  const handlePublishSquadList = () => {
    if (!match || isPast) return;
    const convocatedWithDetails = match.convocations
      .filter(c => c.status === 'confirmado' && c.selectedForMatch === true)
      .map(c => players.find(p => p.id === c.playerId))
      .filter((p): p is Player => p !== undefined);

    if (convocatedWithDetails.length === 0) {
      toast.error('Debes convocar al menos a un jugador para publicar la lista.');
      return;
    }

    // Group by position
    const positionsOrder = ['Arquero', 'Defensor', 'Mediocampista', 'Enganche', 'Delantero'];
    const positionLabels: Record<string, string> = {
      'Arquero': 'Arqueros',
      'Defensor': 'Defensores',
      'Mediocampista': 'Mediocampistas',
      'Enganche': 'Enganches / Volantes Creativos',
      'Delantero': 'Delanteros'
    };

    const groupedMap: Record<string, string[]> = {};
    convocatedWithDetails.forEach(p => {
      const pos = p.position || 'Otros';
      if (!groupedMap[pos]) groupedMap[pos] = [];
      groupedMap[pos].push(`${p.name} (${p.number})`);
    });

    let messageBody = '';
    positionsOrder.forEach(pos => {
      if (groupedMap[pos] && groupedMap[pos].length > 0) {
        messageBody += `• ${positionLabels[pos] || pos}:\n  ${groupedMap[pos].join(', ')}\n\n`;
      }
    });

    // Add any other positions not in the order list
    Object.keys(groupedMap).forEach(pos => {
      if (!positionsOrder.includes(pos)) {
        messageBody += `• ${pos}:\n  ${groupedMap[pos].join(', ')}\n\n`;
      }
    });

    const title = `Convocatoria Oficial: vs ${match.rival}`;
    const dateFormatted = format(new Date(match.date), "EEEE d 'de' MMMM · HH:mm'hs'", { locale: es });
    const message = `El DT Caruso Lombardi ha publicado la lista de convocados oficiales para el encuentro frente a ${match.rival} en ${match.venue} (${dateFormatted}).\n\n${messageBody.trim()}\n\n¡Hay equipo!`;
    
    addNotice(title, message, 'dt', 'convocatoria');
    toast.success('¡Convocatoria publicada en el Muro de Avisos!');
  };

  const handleDropOnPitch = async (playerId: string, x: number, y: number) => {
    if (isPast) return;
    // 1. Optimistic UI update
    setSlots(prev => {
      const next = [...prev];
      const existingSlotIndex = next.findIndex(s => s.playerId === playerId);
      
      if (existingSlotIndex !== -1) {
        next[existingSlotIndex] = { ...next[existingSlotIndex], currentX: x, currentY: y };
        return next;
      } else {
        let nearestSlotIndex = -1;
        let minDistance = Infinity;
        
        next.forEach((slot, index) => {
          const dx = slot.currentX - x;
          const dy = slot.currentY - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < minDistance) {
            minDistance = distance;
            nearestSlotIndex = index;
          }
        });
        
        if (nearestSlotIndex !== -1) {
          next[nearestSlotIndex] = { ...next[nearestSlotIndex], playerId };
        }
        return next;
      }
    });

    // 2. Persistir en Supabase
    try {
      await updatePlayerPitchPosition(match.id, playerId, x, y);
    } catch (e) {
      toast.error('Error al guardar la posición táctica');
    }
  };

  const handleRemoveFromPitch = async (playerId: string) => {
    if (isPast) return;
    // 1. Optimistic UI update
    setSlots(prev => prev.map(s => 
      s.playerId === playerId 
        ? { ...s, playerId: null, currentX: s.baseX, currentY: s.baseY } 
        : s
    ));

    // 2. Persistir en Supabase
    try {
      await updatePlayerPitchPosition(match.id, playerId, null, null);
    } catch (e) {
      toast.error('Error al quitar la posición del jugador');
    }
  };

  const onBenchDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const playerId = e.dataTransfer.getData('playerId');
    if (playerId) {
      handleRemoveFromPitch(playerId);
    }
  };

  return (
    <Layout title={`vs ${match.rival}`} showBack backTo={isReadOnly ? "/jugador" : "/dt"}>
      <div className="content-width section-spacing animate-fade-in">
        
        {/* Player Convocation Action Banner */}
        {user?.role === 'jugador' && myConv && !isPast && (
          <div className="premium-card p-6 border-emerald-500/30 bg-emerald-500/5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-3 duration-300">
            <div className="flex items-center gap-4 text-left w-full sm:w-auto">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                myConv.status === 'confirmado' ? 'bg-emerald-100 text-emerald-600' :
                myConv.status === 'pendiente' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
              }`}>
                {myConv.status === 'confirmado' ? <Check className="w-5 h-5" /> : 
                 myConv.status === 'pendiente' ? <CalendarDays className="w-5 h-5 animate-pulse" /> : <X className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tu Convocatoria</p>
                <h4 className="text-sm font-bold text-slate-800 uppercase mt-0.5">
                  Estado: {statusLabels[myConv.status] || myConv.status}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {myConv.status === 'pendiente' && 'El DT te ha convocado. Por favor confirma si asistes.'}
                  {myConv.status === 'confirmado' && '¡Asistencia confirmada para el partido!'}
                  {myConv.status === 'rechazado' && 'Indicaste que no puedes asistir a este partido.'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={async () => {
                  try {
                    await respondConvocation(match.id, user.playerId || user.supabaseId, 'confirmado');
                    toast.success('¡Asistencia confirmada!');
                  } catch (e) {
                    toast.error('Error al confirmar asistencia');
                  }
                }}
                disabled={myConv.status === 'confirmado'}
                className={`px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                  myConv.status === 'confirmado'
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/10 active:scale-95'
                }`}
              >
                Confirmar
              </button>
              <button
                onClick={async () => {
                  try {
                    await respondConvocation(match.id, user.playerId || user.supabaseId, 'rechazado');
                    toast.success('Has rechazado la convocatoria');
                  } catch (e) {
                    toast.error('Error al rechazar convocatoria');
                  }
                }}
                disabled={myConv.status === 'rechazado'}
                className={`px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                  myConv.status === 'rechazado'
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50'
                    : 'bg-rose-100 text-rose-600 hover:bg-rose-200 active:scale-95'
                }`}
              >
                Rechazar
              </button>
            </div>
          </div>
        )}

        {/* Match Header Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="premium-card p-8 space-y-6">
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Rival / Contrincante</label>
                  <input
                    type="text"
                    value={editRival}
                    onChange={(e) => setEditRival(e.target.value)}
                    className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold px-4 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha y Hora</label>
                  <input
                    type="datetime-local"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold px-4 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sede / Cancha</label>
                  <input
                    type="text"
                    value={editVenue}
                    onChange={(e) => setEditVenue(e.target.value)}
                    className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold px-4 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-800"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 h-11 border border-slate-150 text-slate-500 rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] tracking-widest uppercase transition-all shadow-md"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-label mb-1">Fecha y Hora</p>
                    <p className="text-base font-bold text-slate-800">
                      {(() => {
                        try {
                          return format(new Date(match.date), "EEEE d 'de' MMMM · HH:mm'hs'", { locale: es });
                        } catch (e) {
                          return 'Fecha inválida';
                        }
                      })()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-label mb-1">Sede / Cancha</p>
                    <p className="text-base font-bold text-slate-800">{match.venue}</p>
                  </div>
                </div>

                {!isReadOnly && !isPast && (
                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setEditRival(match.rival);
                        try {
                          setEditDate(new Date(match.date).toISOString().slice(0, 16));
                        } catch (e) {
                          setEditDate('');
                        }
                        setEditVenue(match.venue);
                        setIsEditing(true);
                      }}
                      className="flex-1 h-11 border border-slate-150 text-slate-650 hover:bg-slate-50 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Pencil className="w-4 h-4 text-slate-400" />
                      Editar Datos
                    </button>
                    <button
                      onClick={handleDeleteMatch}
                      className="flex-1 h-11 border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4 text-rose-450" />
                      Eliminar Partido
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="premium-card p-8 flex flex-col justify-center border-emerald-50">
            <h3 className="text-label mb-6 text-emerald-600/50">Resumen de Plantel</h3>
            <div className="flex justify-between items-end">
              {[
                { status: 'confirmado' as const, count: confirmed, label: 'Confirmados', color: 'bg-emerald-500', text: 'text-emerald-600' },
                { status: 'pendiente' as const, count: pending, label: 'Pendientes', color: 'bg-amber-500', text: 'text-amber-600' },
                { status: 'rechazado' as const, count: rejected, label: 'Rechazados', color: 'bg-rose-500', text: 'text-rose-600' }
              ].map((s) => (
                <div key={s.status} className="flex flex-col items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${s.color} mb-1`} />
                  <span className={`text-4xl font-display ${s.text} leading-none`}>{s.count}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tactical Board Section */}
        {confirmed > 0 && (
          <div className="space-y-6 pt-10">
            <div className="flex flex-col gap-4 px-2">
              <h2 className="font-display text-lg tracking-tight text-slate-900 uppercase">PIZARRA TÁCTICA</h2>
              <button 
                onClick={() => setShowLineup(!showLineup)}
                className="self-start bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center gap-3 uppercase active:scale-95"
              >
                <Users className="w-4 h-4" />
                {showLineup ? 'Cerrar Pizarra' : 'Abrir Pizarra'}
              </button>
            </div>

            {showLineup && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-top-4 duration-500">
                {/* Pitch Area */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-emerald-100">
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Esquema Táctico</span>
                    <Select 
                      value={formation}
                      onValueChange={(val: any) => {
                        const newFormation = val as keyof typeof formations;
                        setFormation(newFormation);
                        if (match) {
                          localStorage.setItem(`formation_${match.id}`, newFormation);
                        }
                        setSlots(formations[newFormation].map((pos, i) => ({
                          id: i,
                          baseX: pos.x,
                          baseY: pos.y,
                          currentX: pos.x,
                          currentY: pos.y,
                          playerId: null
                        })));
                      }}
                    >
                      <SelectTrigger className="bg-background border border-emerald-100 rounded-xl px-6 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 text-center cursor-pointer min-w-[120px] text-emerald-700 h-10 w-fit">
                        <SelectValue placeholder="Seleccionar esquema" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-emerald-100 rounded-xl shadow-lg">
                        {Object.keys(formations).map(f => (
                          <SelectItem key={f} value={f} className="text-xs font-semibold py-2 px-3 hover:bg-slate-50 cursor-pointer rounded-lg text-emerald-700">{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="premium-card p-8 bg-emerald-50/30 border-emerald-100">
                    <FootballPitch halfPitch={true} onDropPlayer={isReadOnly ? undefined : handleDropOnPitch}>
                      {slots.map((slot) => {
                        if (slot.playerId) {
                          const p = players.find(player => player.id === slot.playerId);
                          if (!p) return null;
                          return (
                            <button
                              key={`player-${p.id}`}
                              draggable={!isReadOnly}
                              onDragStart={isReadOnly ? undefined : (e) => e.dataTransfer.setData('playerId', p.id)}
                              onClick={isReadOnly ? undefined : () => {
                                if (selectedPlayerId) {
                                  handleDropOnPitch(selectedPlayerId, slot.currentX, slot.currentY);
                                  setSelectedPlayerId(null);
                                } else {
                                  handleRemoveFromPitch(p.id);
                                }
                              }}
                              className={`absolute w-12 h-12 -ml-6 -mt-6 bg-white text-emerald-600 border-4 rounded-2xl flex items-center justify-center hover:scale-105 transition-all shadow-2xl z-20 group ${
                                isReadOnly ? 'border-emerald-500 cursor-default' : selectedPlayerId ? 'border-amber-400 animate-pulse scale-105 cursor-pointer' : 'border-emerald-500 cursor-pointer'
                              }`}
                              style={{ left: `${slot.currentX}%`, top: `${slot.currentY}%` }}
                            >
                              <span className="font-black text-sm">{p.number}</span>
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                {isReadOnly ? p.name : selectedPlayerId ? `Reemplazar por ${p.name.split(' ')[0]}` : `${p.name.split(' ')[0]} (Quitar)`}
                              </div>
                            </button>
                          );
                        } else {
                          return (
                            <button 
                              key={`slot-${slot.id}`}
                              disabled={isReadOnly}
                              onClick={isReadOnly ? undefined : () => {
                                if (selectedPlayerId) {
                                  handleDropOnPitch(selectedPlayerId, slot.baseX, slot.baseY);
                                  setSelectedPlayerId(null);
                                }
                              }}
                              className={`absolute w-12 h-12 -ml-6 -mt-6 rounded-2xl border-2 border-dashed transition-all duration-300 ${
                                isReadOnly ? 'border-emerald-200/50 bg-emerald-100/5 cursor-default' : selectedPlayerId ? 'border-emerald-500 bg-emerald-500/20 animate-pulse scale-110 cursor-pointer' : 'border-emerald-200 bg-emerald-100/10 cursor-pointer'
                              } flex items-center justify-center`}
                              style={{ left: `${slot.baseX}%`, top: `${slot.baseY}%` }}
                            />
                          );
                        }
                      })}
                    </FootballPitch>
                  </div>
                </div>
                
                {/* Bench Area */}
                <div className="lg:col-span-4 flex flex-col h-full">
                  <div 
                    className="premium-card flex-1 flex flex-col p-6 space-y-6 border-emerald-50"
                    onDragOver={isReadOnly ? undefined : (e) => e.preventDefault()}
                    onDrop={isReadOnly ? undefined : onBenchDrop}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">BANCO DE SUPLENTES</h3>
                      <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                        {availablePlayers.length} LIBRES
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                      {availablePlayers.length === 0 ? (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-emerald-100 rounded-[2rem]">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest opacity-40">Sin suplentes libres</p>
                        </div>
                      ) : (
                        availablePlayers.map(p => (
                          <button
                            key={p.id}
                            draggable={!isReadOnly}
                            onDragStart={isReadOnly ? undefined : (e) => e.dataTransfer.setData('playerId', p.id)}
                            onClick={isReadOnly ? undefined : () => setSelectedPlayerId(selectedPlayerId === p.id ? null : p.id)}
                            className={`w-full bg-white border p-4 rounded-2xl flex items-center gap-4 transition-all group ${
                              isReadOnly 
                                ? 'border-slate-50 cursor-default'
                                : selectedPlayerId === p.id 
                                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/50 shadow-xl scale-[1.02] cursor-pointer' 
                                  : 'border-slate-50 hover:border-emerald-200 cursor-pointer'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display text-lg transition-all shrink-0 ${
                              selectedPlayerId === p.id ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-400'
                            }`}>
                              {p.number}
                            </div>
                            <div className="min-w-0 text-left">
                              <div className="text-xs font-bold truncate group-hover:text-emerald-600 transition-colors uppercase">{p.name}</div>
                              <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{p.position}</div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    {!isReadOnly && (
                      <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-center gap-2 border border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">
                        <Trash2 className="w-4 h-4" />
                        Soltar acá para quitar
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Player List View */}
        {!showLineup && (
          <div className="space-y-10 pt-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
              <div className="space-y-4">
                <h2 className="font-display text-lg tracking-tight text-slate-900 uppercase">ASISTENCIA Y CONVOCATORIA</h2>
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="bg-emerald-50 px-4 h-9 rounded-full border border-emerald-100 flex items-center justify-center">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{filteredConvocations.length} JUGADORES</span>
                  </div>
                  {!isReadOnly && !isPast && (
                    <button
                      onClick={handlePublishSquadList}
                      className="bg-slate-900 text-white px-4 h-9 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 border border-slate-900"
                    >
                      <span>Publicar Convocatoria</span>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="relative group max-w-xs w-full">
                <input
                  type="text"
                  placeholder="BUSCAR JUGADOR..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-white border border-slate-100 px-6 py-4 rounded-2xl text-[10px] font-black tracking-widest text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-300"
                />
                <Users className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {paginatedConvocations.length === 0 ? (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No se encontraron jugadores</p>
                </div>
              ) : (
                paginatedConvocations.map(conv => {
                const player = players.find(p => p.id === conv.playerId);
                if (!player) return null;
                
                const isLesionado = player.healthStatus === 'lesionado';
                const displayStatus = isLesionado ? 'lesionado' : conv.status;

                return (
                  <div 
                    key={conv.playerId} 
                    className={`group flex items-center justify-between py-4 border-b border-slate-50 transition-all duration-300 ${
                      isLesionado ? 'opacity-30 grayscale' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-display text-lg text-slate-400 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        {player.number}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate uppercase tracking-tight group-hover:text-emerald-700 transition-colors">{player.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{player.position}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-200" />
                          <span className={`text-[9px] font-black uppercase tracking-widest ${
                            displayStatus === 'confirmado' ? 'text-emerald-500' : 
                            displayStatus === 'pendiente' ? 'text-amber-500' : 'text-rose-500'
                          }`}>
                            {statusLabels[displayStatus]}
                          </span>
                          {displayStatus === 'confirmado' && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-200" />
                              <span className={`text-[9px] font-black uppercase tracking-widest ${
                                conv.selectedForMatch ? 'text-emerald-600' : 'text-slate-450'
                              }`}>
                                {conv.selectedForMatch ? 'Convocado' : 'Reserva'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {!isReadOnly && displayStatus === 'confirmado' && (
                        <button
                          onClick={() => {
                            const nextState = !conv.selectedForMatch;
                            setSelectionForMatch(match.id, player.id, nextState);
                            toast.success(nextState ? `${player.name} convocado` : `${player.name} en reserva`);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                            conv.selectedForMatch 
                              ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600' 
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {conv.selectedForMatch ? 'Convocado ✓' : 'Convocar'}
                        </button>
                      )}

                      {!isReadOnly && (
                        <button
                          onClick={() => {
                            removeConvocation(match.id, player.id);
                            toast.success(`${player.name} eliminado de la convocatoria`);
                          }}
                          className="p-2 text-slate-200 hover:text-rose-500 transition-colors shrink-0"
                          aria-label={`Eliminar a ${player.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-3 rounded-xl border border-slate-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 sm:px-6"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline text-[9px] font-black tracking-[0.2em] uppercase">Anterior</span>
                </button>
                <div className="flex items-center gap-1 mx-2 sm:mx-4">
                  {getPaginationRange(currentPage, totalPages).map((page, i) => {
                    if (page === '...') {
                      return (
                        <span key={`dots-${i}`} className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-[10px] font-black text-slate-300">
                          ...
                        </span>
                      );
                    }
                    return (
                      <button
                        key={`page-${page}`}
                        onClick={() => setCurrentPage(Number(page))}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-[10px] font-black transition-all ${
                          currentPage === page 
                            ? 'bg-slate-900 text-white shadow-xl scale-110' 
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
                  className="p-3 rounded-xl border border-slate-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 sm:px-6"
                  aria-label="Siguiente"
                >
                  <span className="hidden sm:inline text-[9px] font-black tracking-[0.2em] uppercase">Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PartidoDetalle;
