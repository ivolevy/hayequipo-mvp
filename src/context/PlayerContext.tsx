import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Player, players as initialPlayers } from '@/data/players';
import { useAuth } from './AuthContext';

interface PlayerContextType {
  players: Player[];
  loading: boolean;
  refreshPlayers: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const activeTeamId = user?.activeTeamId;
  const [playersList, setPlayersList] = useState<Player[]>(initialPlayers);
  const [loading, setLoading] = useState(true);

  const fetchPlayers = useCallback(async () => {
    if (!activeTeamId) {
      setPlayersList([]);
      setLoading(false);
      return;
    }
    try {
      const { data: dbProfiles, error } = await supabase
        .from('hayequipo_squad')
        .select('*')
        .eq('team_id', activeTeamId)
        .eq('role', 'jugador');

      if (error) throw error;

      const mappedPlayers: Player[] = (dbProfiles || []).map(p => ({
        id: p.id,
        name: p.full_name,
        position: p.position || 'Sin posición',
        number: p.number || 0,
        healthStatus: (p.health_status as any) || 'disponible',
        injuryDescription: p.injury_description || undefined,
        weight: p.weight ? Number(p.weight) : undefined,
        targetWeight: p.target_weight ? Number(p.target_weight) : undefined,
        activePlans: {
          training: p.training_plan || 'Sin asignar',
          nutrition: p.nutrition_plan || 'Sin asignar'
        }
      }));

      // Fusionar asegurando unicidad por id (preferir datos de la base de datos)
      const mergedMap = new Map<string, Player>();
      initialPlayers.forEach(p => mergedMap.set(p.id, p));
      mappedPlayers.forEach(p => mergedMap.set(p.id, p));

      setPlayersList(Array.from(mergedMap.values()));
    } catch (error) {
      console.error('Error fetching dynamic roster:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTeamId]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  return (
    <PlayerContext.Provider value={{ 
      players: playersList, 
      loading,
      refreshPlayers: fetchPlayers 
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayers = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayers must be used within PlayerProvider');
  return ctx;
};
