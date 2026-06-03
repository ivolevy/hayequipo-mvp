import React, { createContext, useContext, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { usePlayers } from './PlayerContext';

interface PfContextType {
  updateTrainingPlan: (playerId: string, plan: string) => Promise<void>;
  updateHealthStatus: (playerId: string, status: 'disponible' | 'duda' | 'lesionado', description?: string) => Promise<void>;
}

const PfContext = createContext<PfContextType | undefined>(undefined);

export const PfProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { refreshPlayers } = usePlayers();

  const updateTrainingPlan = useCallback(async (playerId: string, plan: string) => {
    try {
      const { error } = await supabase
        .from('hayequipo_profiles')
        .update({
          training_plan: plan
        })
        .eq('id', playerId);

      if (error) throw error;
      await refreshPlayers();
    } catch (error) {
      console.error('Error updating training plan:', error);
      throw error;
    }
  }, [refreshPlayers]);

  const updateHealthStatus = useCallback(async (playerId: string, status: 'disponible' | 'duda' | 'lesionado', description?: string) => {
    try {
      const { error } = await supabase
        .from('hayequipo_profiles')
        .update({
          health_status: status,
          injury_description: status !== 'disponible' ? description : null
        })
        .eq('id', playerId);

      if (error) throw error;
      await refreshPlayers();
    } catch (error) {
      console.error('Error updating health status:', error);
      throw error;
    }
  }, [refreshPlayers]);

  return (
    <PfContext.Provider value={{ updateTrainingPlan, updateHealthStatus }}>
      {children}
    </PfContext.Provider>
  );
};

export const usePf = () => {
  const ctx = useContext(PfContext);
  if (!ctx) throw new Error('usePf must be used within PfProvider');
  return ctx;
};
