import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export type PricingPlan = 'free' | 'intermediate' | 'advanced' | 'premium';

export const usePlanLimits = () => {
  const { user, refreshMemberships } = useAuth();
  
  const currentPlan: PricingPlan = (user?.activeTeamPlan as PricingPlan) || 'free';
  const activeTeamId = user?.activeTeamId;

  const limits = {
    planName: currentPlan === 'free' ? 'Plan Inicial (Gratis)' : 
              currentPlan === 'intermediate' ? 'Plan Intermedio' :
              currentPlan === 'advanced' ? 'Plan Avanzado' : 'Plan Premium',
    maxPlayers: currentPlan === 'free' ? 15 : currentPlan === 'intermediate' ? 30 : 999,
    hasRoutines: ['intermediate', 'advanced', 'premium'].includes(currentPlan),
    hasNutrition: ['advanced', 'premium'].includes(currentPlan),
    hasPhysicalPrep: ['advanced', 'premium'].includes(currentPlan),
    hasMultiTeam: currentPlan === 'premium',
  };

  const simulateUpgrade = async (newPlan: PricingPlan) => {
    if (!activeTeamId) {
      toast.error('No hay un equipo activo seleccionado.');
      return;
    }
    try {
      const { error } = await supabase
        .from('hayequipo_teams')
        .update({ plan: newPlan })
        .eq('id', activeTeamId);

      if (error) throw error;
      
      toast.success(`¡Plan actualizado con éxito a ${newPlan.toUpperCase()}! (Demo)`);
      
      await refreshMemberships();
    } catch (e) {
      console.error(e);
      toast.error('Error al simular la actualización del plan');
    }
  };

  return {
    plan: currentPlan,
    limits,
    simulateUpgrade
  };
};
