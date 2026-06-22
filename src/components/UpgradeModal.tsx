import React from 'react';
import { X, Shield, Activity, Apple, Lock, CheckCircle2 } from 'lucide-react';
import { usePlanLimits, PricingPlan } from '@/hooks/usePlanLimits';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: 'nutrition' | 'physical' | 'players' | 'multiteam' | 'routines';
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, feature = 'nutrition' }) => {
  const { simulateUpgrade } = usePlanLimits();

  if (!isOpen) return null;

  const featureDetails = {
    nutrition: {
      title: 'Módulo de Nutrición',
      tagline: 'Habilita dietas, planes de comida y objetivos específicos para tu plantel.',
      requiredPlan: 'advanced' as PricingPlan,
      requiredPlanLabel: 'Plan Avanzado',
      price: '$19 / mes',
      icon: Apple,
      iconColor: 'text-amber-500 bg-amber-50 border-amber-100',
      benefits: [
        'Perfil de Nutricionista especializado.',
        'Asignación de planes nutricionales a jugadores.',
        'Biblioteca de comidas y suplementación.',
        'Objetivos diarios de hidratación y proteínas.'
      ]
    },
    physical: {
      title: 'Preparador Físico & Kinesiología',
      tagline: 'Planifica rutinas, controla el estado físico e informes de lesiones de tus jugadores.',
      requiredPlan: 'advanced' as PricingPlan,
      requiredPlanLabel: 'Plan Avanzado',
      price: '$19 / mes',
      icon: Activity,
      iconColor: 'text-purple-500 bg-purple-50 border-purple-100',
      benefits: [
        'Perfil de Preparador Físico y Kinesiólogo.',
        'Reportes y alertas de lesiones por jugador.',
        'Asignación de planes de entrenamiento.',
        'Historial de evolución física.'
      ]
    },
    players: {
      title: 'Límite de Jugadores Excedido',
      tagline: 'Has alcanzado la capacidad máxima de tu plan actual.',
      requiredPlan: 'intermediate' as PricingPlan,
      requiredPlanLabel: 'Plan Intermedio',
      price: '$9 / mes',
      icon: Lock,
      iconColor: 'text-emerald-500 bg-emerald-50 border-emerald-100',
      benefits: [
        'Aumenta el límite a 30 jugadores (Plan Intermedio).',
        'Opciones de plantel ilimitado (Plan Avanzado/Premium).',
        'Gestión básica de rutinas y planes en la nube.',
        'Ideal para planteles competitivos en crecimiento.'
      ]
    },
    routines: {
      title: 'Rutinas de Entrenamiento',
      tagline: 'Guarda y comparte planes en la nube.',
      requiredPlan: 'intermediate' as PricingPlan,
      requiredPlanLabel: 'Plan Intermedio',
      price: '$9 / mes',
      icon: Shield,
      iconColor: 'text-blue-500 bg-blue-50 border-blue-100',
      benefits: [
        'Almacenamiento básico para rutinas.',
        'Fácil distribución para el plantel.',
        'Acceso de lectura directo para los jugadores.',
        'Menor dependencia de archivos PDF o WhatsApp.'
      ]
    },
    multiteam: {
      title: 'Gestión Multi-Categorías',
      tagline: 'Administra múltiples divisiones bajo una administración centralizada.',
      requiredPlan: 'premium' as PricingPlan,
      requiredPlanLabel: 'Plan Premium',
      price: '$39 / mes',
      icon: Shield,
      iconColor: 'text-slate-900 bg-slate-100 border-slate-200',
      benefits: [
        'Coordinación de múltiples categorías o divisiones.',
        'Administración centralizada de cuerpo técnico.',
        'Estadísticas consolidadas del club.',
        'Soporte prioritario 24/7.'
      ]
    }
  };

  const details = featureDetails[feature] || featureDetails.nutrition;
  const FeatureIcon = details.icon;

  const handleUpgrade = async () => {
    await simulateUpgrade(details.requiredPlan);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-6 sm:p-8 md:p-10 space-y-6 overflow-hidden">
        {/* Decorative Gradient Background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -z-10 -mr-16 -mt-16" />
        
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${details.iconColor}`}>
              <FeatureIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">FUNCIONALIDAD PREMIUM</div>
              <h3 className="font-display text-base tracking-tight text-slate-900 uppercase mt-0.5">{details.title}</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Tagline */}
        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          {details.tagline}
        </p>

        {/* Required Plan Info Card */}
        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 flex items-center justify-between">
          <div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Requerido</span>
            <div className="text-sm font-bold text-slate-800 uppercase mt-0.5">{details.requiredPlanLabel}</div>
          </div>
          <div className="text-right">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Valor Muestra</span>
            <div className="text-sm font-bold text-emerald-600 uppercase mt-0.5">{details.price}</div>
          </div>
        </div>

        {/* Benefits List */}
        <div className="space-y-3.5 pt-2">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">¿Qué incluye este plan?</div>
          <div className="space-y-3">
            {details.benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-650 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action Button */}
        <div className="space-y-3 pt-4">
          <button
            onClick={handleUpgrade}
            className="w-full bg-slate-900 hover:bg-emerald-600 hover:scale-[1.02] text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <span>ACTIVAR PLAN (SIMULADO)</span>
          </button>
          <button
            onClick={onClose}
            className="w-full bg-transparent hover:bg-slate-50 text-slate-400 hover:text-slate-600 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
          >
            Volver a la App
          </button>
        </div>
      </div>
    </div>
  );
};
