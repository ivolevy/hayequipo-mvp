import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface NutriObjective {
  id: string;
  title: string;
  description: string;
  category: 'hydration' | 'protein' | 'carbs' | 'general';
}

export interface MealRecommendation {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre-match' | 'post-match';
  title: string;
  items: string[];
}

export interface PlayerSpecificPlan {
  playerId: string;
  goal: string;
  notes: string;
  lastUpdated: string;
}

interface NutriContextType {
  objectives: NutriObjective[];
  recommendations: MealRecommendation[];
  playerPlans: Record<string, PlayerSpecificPlan>;
  loading: boolean;
  addObjective: (obj: Omit<NutriObjective, 'id'>) => Promise<void>;
  removeObjective: (id: string) => Promise<void>;
  updateRecommendation: (rec: MealRecommendation) => Promise<void>;
  updatePlayerPlan: (playerId: string, plan: Omit<PlayerSpecificPlan, 'playerId' | 'lastUpdated'>) => Promise<void>;
  refreshNutriData: () => Promise<void>;
}

const NutriContext = createContext<NutriContextType | undefined>(undefined);

const initialObjectives: NutriObjective[] = [
  { id: 'objective-hardcoded-1', title: 'Hidratación', description: '500ml extras por cada hora de entrenamiento.', category: 'hydration' },
  { id: 'objective-hardcoded-2', title: 'Recuperación', description: 'Consumir proteína dentro de los 45 min post esfuerzo.', category: 'protein' },
];

const initialRecommendations: MealRecommendation[] = [
  { 
    id: 'recommendation-hardcoded-1', 
    type: 'pre-match', 
    title: 'Desayuno Pre-Partido', 
    items: ['Avena con banana', '2 tostadas con miel', 'Jugo de naranja'] 
  },
  { 
    id: 'recommendation-hardcoded-2', 
    type: 'post-match', 
    title: 'Cena de Recuperación', 
    items: ['Pollo a la plancha', 'Arroz blanco', 'Ensalada de hojas verdes'] 
  }
];

const initialPlayerPlans: Record<string, PlayerSpecificPlan> = {
  '22222222-2222-2222-2222-222222222222': {
    playerId: '22222222-2222-2222-2222-222222222222',
    goal: 'Aumento de masa muscular magra',
    notes: 'Priorizar ingesta de carbohidratos complejos en almuerzos.',
    lastUpdated: new Date().toISOString()
  }
};

export const NutriProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const activeTeamId = user?.activeTeamId;
  const [objectives, setObjectives] = useState<NutriObjective[]>(initialObjectives);
  const [recommendations, setRecommendations] = useState<MealRecommendation[]>(initialRecommendations);
  const [playerPlans, setPlayerPlans] = useState<Record<string, PlayerSpecificPlan>>(initialPlayerPlans);
  const [loading, setLoading] = useState(true);

  const fetchNutriData = useCallback(async () => {
    if (!activeTeamId) {
      setObjectives(initialObjectives);
      setRecommendations(initialRecommendations);
      setPlayerPlans({});
      setLoading(false);
      return;
    }
    try {
      // 1. Cargar objetivos
      const { data: dbObjectives, error: objError } = await supabase
        .from('hayequipo_nutrition_objectives')
        .select('*');

      if (objError) throw objError;

      // 2. Cargar recomendaciones
      const { data: dbRecs, error: recsError } = await supabase
        .from('hayequipo_nutrition_recommendations')
        .select('*');

      if (recsError) throw recsError;

      // 3. Cargar perfiles de jugadores para armar planes específicos
      const { data: dbProfiles, error: profError } = await supabase
        .from('hayequipo_squad')
        .select('id, nutrition_plan, created_at')
        .eq('team_id', activeTeamId)
        .eq('role', 'jugador');

      if (profError) throw profError;

      // Mapear objetivos
      const mappedObjectives: NutriObjective[] = (dbObjectives || []).map(o => ({
        id: o.id,
        title: o.title,
        description: o.description,
        category: o.category as any
      }));

      // Mapear recomendaciones
      const mappedRecs: MealRecommendation[] = (dbRecs || []).map(r => ({
        id: r.id,
        type: r.type as any,
        title: r.title,
        items: Array.isArray(r.items) ? r.items : []
      }));

      // Mapear planes específicos por jugador
      const plansMap: Record<string, PlayerSpecificPlan> = { ...initialPlayerPlans };
      (dbProfiles || []).forEach(p => {
        if (p.nutrition_plan) {
          plansMap[p.id] = {
            playerId: p.id,
            goal: p.nutrition_plan,
            notes: '',
            lastUpdated: p.created_at || new Date().toISOString()
          };
        }
      });

      setObjectives([...mappedObjectives, ...initialObjectives]);
      setRecommendations([...mappedRecs, ...initialRecommendations]);
      setPlayerPlans(plansMap);
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTeamId]);

  useEffect(() => {
    fetchNutriData();
  }, [fetchNutriData]);

  const addObjective = useCallback(async (obj: Omit<NutriObjective, 'id'>) => {
    try {
      const { error } = await supabase
        .from('hayequipo_nutrition_objectives')
        .insert({
          title: obj.title,
          description: obj.description,
          category: obj.category
        });

      if (error) throw error;
      await fetchNutriData();
    } catch (error) {
      console.error('Error adding objective:', error);
      throw error;
    }
  }, [fetchNutriData]);

  const removeObjective = useCallback(async (id: string) => {
    if (id.startsWith('objective-hardcoded')) {
      setObjectives(prev => prev.filter(o => o.id !== id));
      return;
    }

    try {
      const { error } = await supabase
        .from('hayequipo_nutrition_objectives')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchNutriData();
    } catch (error) {
      console.error('Error removing objective:', error);
      throw error;
    }
  }, [fetchNutriData]);

  const updateRecommendation = useCallback(async (rec: MealRecommendation) => {
    if (rec.id.startsWith('recommendation-hardcoded')) {
      setRecommendations(prev => prev.map(r => r.id === rec.id ? rec : r));
      return;
    }

    try {
      const { error } = await supabase
        .from('hayequipo_nutrition_recommendations')
        .update({
          title: rec.title,
          items: rec.items
        })
        .eq('id', rec.id);

      if (error) throw error;
      await fetchNutriData();
    } catch (error) {
      console.error('Error updating recommendation:', error);
      throw error;
    }
  }, [fetchNutriData]);

  const updatePlayerPlan = useCallback(async (playerId: string, plan: Omit<PlayerSpecificPlan, 'playerId' | 'lastUpdated'>) => {
    if (!activeTeamId) throw new Error('No hay un equipo activo seleccionado');
    try {
      const { error } = await supabase
        .from('hayequipo_memberships')
        .update({
          nutrition_plan: plan.goal
        })
        .eq('profile_id', playerId)
        .eq('team_id', activeTeamId);

      if (error) throw error;
      await fetchNutriData();
    } catch (error) {
      console.error('Error updating player plan:', error);
      throw error;
    }
  }, [fetchNutriData, activeTeamId]);

  return (
    <NutriContext.Provider value={{ 
      objectives, 
      recommendations, 
      playerPlans,
      loading,
      addObjective,
      removeObjective,
      updateRecommendation,
      updatePlayerPlan,
      refreshNutriData: fetchNutriData
    }}>
      {children}
    </NutriContext.Provider>
  );
};

export const useNutri = () => {
  const context = useContext(NutriContext);
  if (context === undefined) {
    throw new Error('useNutri must be used within a NutriProvider');
  }
  return context;
};
