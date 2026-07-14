import React, { useState, useEffect } from 'react';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { Bell, X } from 'lucide-react';

export const NotificationPrompt: React.FC = () => {
  const { needsPermission, requestPermission } = useRealtimeNotifications();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if running on mobile/tablet device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;

    // Only show if running on mobile, in standalone mode (PWA), user needs to grant permission, and hasn't dismissed it
    const isDismissed = sessionStorage.getItem('hay_equipo_notifications_dismissed') === 'true';
    if (isMobile && isStandalone && needsPermission && !isDismissed) {
      // Delay showing it slightly for a smoother entry
      const timer = setTimeout(() => setShowPrompt(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [needsPermission]);

  const handleAllowClick = async () => {
    await requestPermission();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('hay_equipo_notifications_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed top-28 left-4 right-4 max-w-sm mx-auto bg-emerald-600 text-white rounded-2xl p-4 shadow-[0_10px_30px_rgba(16,185,129,0.2)] border border-emerald-500 z-[9998] flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-5 duration-300">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 text-white">
          <Bell className="w-5 h-5 animate-bounce" />
        </div>
        <div>
          <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider text-white">Activar Alertas</h4>
          <p className="text-[9.5px] text-emerald-100 font-medium mt-0.5 leading-snug">
            Recibí avisos de partidos y novedades directo en tu pantalla.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleAllowClick}
          className="bg-white hover:bg-slate-50 text-emerald-600 font-black text-[9px] tracking-widest uppercase py-2 px-3 rounded-lg transition-all shadow-md shrink-0"
        >
          Permitir
        </button>
        <button
          onClick={handleDismiss}
          className="text-emerald-200 hover:text-white p-1 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
