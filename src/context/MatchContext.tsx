import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export type ConvocationStatus = 'pendiente' | 'confirmado' | 'rechazado';

export interface Convocation {
  playerId: string;
  status: ConvocationStatus;
  selectedForMatch?: boolean;
  positionX?: number;
  positionY?: number;
}

export interface Match {
  id: string;
  date: string;
  rival: string;
  venue: string;
  convocations: Convocation[];
  createdAt: string;
  completed?: boolean;
  formation?: string;
}

interface MatchContextType {
  matches: Match[];
  loading: boolean;
  createMatch: (match: Omit<Match, 'id' | 'createdAt'>) => Promise<void>;
  updateMatch: (matchId: string, data: Partial<Omit<Match, 'id' | 'createdAt'>>) => Promise<void>;
  deleteMatch: (matchId: string) => Promise<void>;
  respondConvocation: (matchId: string, playerId: string, status: 'confirmado' | 'rechazado') => Promise<void>;
  removeConvocation: (matchId: string, playerId: string) => Promise<void>;
  setSelectionForMatch: (matchId: string, playerId: string, selected: boolean) => Promise<void>;
  setSelectionForAllConfirmed: (matchId: string, selected: boolean) => Promise<void>;
  updatePlayerPitchPosition: (matchId: string, playerId: string, x: number | null, y: number | null) => Promise<void>;
  getPlayerMatches: (playerId: string) => Match[];
  refreshMatches: () => Promise<void>;
}

const MatchContext = createContext<MatchContextType | null>(null);

export const MatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const activeTeamId = user?.activeTeamId;

  const fetchMatches = useCallback(async () => {
    if (!activeTeamId) {
      setMatches([]);
      setLoading(false);
      return;
    }
    try {
      // 1. Obtener partidos
      const { data: dbMatches, error: matchesError } = await supabase
        .from('hayequipo_matches')
        .select('*')
        .eq('team_id', activeTeamId)
        .order('date', { ascending: false });

      if (matchesError) throw matchesError;

      const matchIds = (dbMatches || []).map(m => m.id);
      let dbConvocations: any[] = [];

      // 2. Obtener convocatorias filtradas por los partidos del equipo
      if (matchIds.length > 0) {
        const { data: convs, error: convocationsError } = await supabase
          .from('hayequipo_convocations')
          .select('*')
          .in('match_id', matchIds);

        if (convocationsError) throw convocationsError;
        dbConvocations = convs || [];
      }

      // 3. Obtener todos los perfiles de jugadores para rellenar convocatorias vacías
      const { data: dbPlayers, error: playersError } = await supabase
        .from('hayequipo_squad')
        .select('id')
        .eq('team_id', activeTeamId)
        .eq('role', 'jugador');

      if (playersError) throw playersError;

      // Agrupar convocatorias por match_id
      const convocationsMap: Record<string, Convocation[]> = {};
      dbConvocations.forEach(c => {
        if (!convocationsMap[c.match_id]) {
          convocationsMap[c.match_id] = [];
        }
        convocationsMap[c.match_id].push({
          playerId: c.profile_id,
          status: c.status as ConvocationStatus,
          selectedForMatch: c.selected_for_match || false,
          positionX: c.position_x !== null && c.position_x !== undefined ? Number(c.position_x) : undefined,
          positionY: c.position_y !== null && c.position_y !== undefined ? Number(c.position_y) : undefined
        });
      });

      // Mapear partidos al formato local
      const mappedMatches: Match[] = (dbMatches || []).map(m => {
        const matchConvs = convocationsMap[m.id] || [];
        const convPlayerIds = new Set(matchConvs.map(c => c.playerId));
        
        const fullConvs = [...matchConvs];
        (dbPlayers || []).forEach(p => {
          if (!convPlayerIds.has(p.id)) {
            fullConvs.push({
              playerId: p.id,
              status: 'pendiente',
              selectedForMatch: false
            });
          }
        });

        return {
          id: m.id,
          date: m.date,
          rival: m.rival,
          venue: m.location,
          createdAt: m.created_at,
          completed: m.status === 'completed',
          convocations: fullConvs,
          formation: m.formation || '4-3-3'
        };
      });

      setMatches(mappedMatches);
    } catch (error) {
      console.error('Error fetching matches & convocations:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTeamId]);

  useEffect(() => {
    fetchMatches();

    const channel = supabase
      .channel('matches-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hayequipo_matches' },
        () => {
          fetchMatches();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hayequipo_convocations' },
        () => {
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMatches]);

  const createMatch = useCallback(async (data: Omit<Match, 'id' | 'createdAt'>) => {
    try {
      if (!activeTeamId) throw new Error('No hay equipo activo seleccionado');

      // 1. Insertar partido
      const { data: newMatch, error: matchError } = await supabase
        .from('hayequipo_matches')
        .insert({
          team_id: activeTeamId,
          date: new Date(data.date).toISOString(),
          rival: data.rival,
          location: data.venue,
          status: 'scheduled',
          formation: data.formation || '4-3-3'
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // 2. Insertar convocatorias
      if (data.convocations.length > 0) {
        const convsToInsert = data.convocations.map(c => ({
          match_id: newMatch.id,
          profile_id: c.playerId,
          status: c.status,
          selected_for_match: false
        }));

        const { error: convsError } = await supabase
          .from('hayequipo_convocations')
          .insert(convsToInsert);

        if (convsError) throw convsError;
      }

      await fetchMatches();
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }, [activeTeamId, fetchMatches]);

  const updateMatch = useCallback(async (matchId: string, data: Partial<Omit<Match, 'id' | 'createdAt'>>) => {
    try {
      const { error: matchError } = await supabase
        .from('hayequipo_matches')
        .update({
          date: data.date ? new Date(data.date).toISOString() : undefined,
          rival: data.rival,
          location: data.venue,
          status: data.completed !== undefined ? (data.completed ? 'completed' : 'scheduled') : undefined,
          formation: data.formation
        })
        .eq('id', matchId);

      if (matchError) throw matchError;

      if (data.convocations) {
        const { error: deleteError } = await supabase
          .from('hayequipo_convocations')
          .delete()
          .eq('match_id', matchId);

        if (deleteError) throw deleteError;

        if (data.convocations.length > 0) {
          const convsToInsert = data.convocations.map(c => ({
            match_id: matchId,
            profile_id: c.playerId,
            status: c.status,
            selected_for_match: c.selectedForMatch || false,
            position_x: c.positionX,
            position_y: c.positionY
          }));

          const { error: insertError } = await supabase
            .from('hayequipo_convocations')
            .insert(convsToInsert);

          if (insertError) throw insertError;
        }
      }

      await fetchMatches();
    } catch (error) {
      console.error('Error updating match:', error);
      throw error;
    }
  }, [fetchMatches]);

  const deleteMatch = useCallback(async (matchId: string) => {
    try {
      const { error } = await supabase
        .from('hayequipo_matches')
        .delete()
        .eq('id', matchId);

      if (error) throw error;
      await fetchMatches();
    } catch (error) {
      console.error('Error deleting match:', error);
      throw error;
    }
  }, [fetchMatches]);

  const respondConvocation = useCallback(async (matchId: string, playerId: string, status: 'confirmado' | 'rechazado') => {
    try {
      // Verificar si ya existe la convocatoria
      const { data: existing } = await supabase
        .from('hayequipo_convocations')
        .select('id')
        .eq('match_id', matchId)
        .eq('profile_id', playerId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('hayequipo_convocations')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hayequipo_convocations')
          .insert({
            match_id: matchId,
            profile_id: playerId,
            status,
            selected_for_match: false,
            updated_at: new Date().toISOString()
          });
        if (error) throw error;
      }
      await fetchMatches();
    } catch (error) {
      console.error('Error responding convocation:', error);
      throw error;
    }
  }, [fetchMatches]);

  const removeConvocation = useCallback(async (matchId: string, playerId: string) => {
    try {
      const { error } = await supabase
        .from('hayequipo_convocations')
        .delete()
        .eq('match_id', matchId)
        .eq('profile_id', playerId);

      if (error) throw error;
      await fetchMatches();
    } catch (error) {
      console.error('Error removing convocation:', error);
      throw error;
    }
  }, [fetchMatches]);

  const setSelectionForMatch = useCallback(async (matchId: string, playerId: string, selected: boolean) => {
    try {
      // Verificar si ya existe la convocatoria
      const { data: existing } = await supabase
        .from('hayequipo_convocations')
        .select('id')
        .eq('match_id', matchId)
        .eq('profile_id', playerId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('hayequipo_convocations')
          .update({ selected_for_match: selected })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hayequipo_convocations')
          .insert({
            match_id: matchId,
            profile_id: playerId,
            status: 'pendiente',
            selected_for_match: selected,
            updated_at: new Date().toISOString()
          });
        if (error) throw error;
      }
      await fetchMatches();
    } catch (error) {
      console.error('Error setting selection for match:', error);
      throw error;
    }
  }, [fetchMatches]);

  const setSelectionForAllConfirmed = useCallback(async (matchId: string, selected: boolean) => {
    try {
      const { error } = await supabase
        .from('hayequipo_convocations')
        .update({ selected_for_match: selected })
        .eq('match_id', matchId)
        .eq('status', 'confirmado');

      if (error) throw error;
      await fetchMatches();
    } catch (error) {
      console.error('Error setting selection for all confirmed:', error);
      throw error;
    }
  }, [fetchMatches]);

  const updatePlayerPitchPosition = useCallback(async (matchId: string, playerId: string, x: number | null, y: number | null) => {
    try {
      // Verificar si ya existe la convocatoria
      const { data: existing } = await supabase
        .from('hayequipo_convocations')
        .select('id')
        .eq('match_id', matchId)
        .eq('profile_id', playerId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('hayequipo_convocations')
          .update({ 
            position_x: x, 
            position_y: y,
            selected_for_match: x !== null
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hayequipo_convocations')
          .insert({
            match_id: matchId,
            profile_id: playerId,
            status: 'confirmado', // si está en la cancha se asume confirmado
            position_x: x,
            position_y: y,
            selected_for_match: x !== null,
            updated_at: new Date().toISOString()
          });
        if (error) throw error;
      }
      await fetchMatches();
    } catch (error) {
      console.error('Error updating player pitch position:', error);
      throw error;
    }
  }, [fetchMatches]);

  const getPlayerMatches = useCallback(
    (playerId: string) => matches.filter(m => m.convocations.some(c => c.playerId === playerId)),
    [matches]
  );

  return (
    <MatchContext.Provider value={{ 
      matches, 
      loading,
      createMatch, 
      updateMatch,
      deleteMatch,
      respondConvocation, 
      removeConvocation, 
      setSelectionForMatch, 
      setSelectionForAllConfirmed,
      updatePlayerPitchPosition,
      getPlayerMatches,
      refreshMatches: fetchMatches
    }}>
      {children}
    </MatchContext.Provider>
  );
};

export const useMatches = () => {
  const ctx = useContext(MatchContext);
  if (!ctx) throw new Error('useMatches must be used within MatchProvider');
  return ctx;
};
