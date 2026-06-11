import React, { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Download, X, ArrowDown, Share2, PlusSquare } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const { showInstallBtn, isIOS, triggerInstall } = usePWA();
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [pathname, setPathname] = useState(window.location.pathname);

  const hasBottomNav = !['/', '/seleccionar-equipo'].includes(pathname);

  useEffect(() => {
    // Listen to pathname changes dynamically
    const interval = setInterval(() => {
      if (window.location.pathname !== pathname) {
        setPathname(window.location.pathname);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [pathname]);

  useEffect(() => {
    // Show banner only if PWA install button is available and user hasn't dismissed it in this session
    const isDismissed = sessionStorage.getItem('hay_equipo_pwa_dismissed') === 'true';
    if (showInstallBtn && !isDismissed) {
      // Delay showing it slightly for a smoother entry
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [showInstallBtn]);

  useEffect(() => {
    const handleOpenModal = () => {
      setShowBanner(false);
      setShowIOSModal(true);
    };
    window.addEventListener('open-pwa-install-modal', handleOpenModal);
    return () => {
      window.removeEventListener('open-pwa-install-modal', handleOpenModal);
    };
  }, []);

  const handleInstallClick = async () => {
    const result = await triggerInstall();
    if (result === 'ios' || result === 'unsupported') {
      setShowBanner(false);
      setShowIOSModal(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('hay_equipo_pwa_dismissed', 'true');
  };

  if (!showBanner && !showIOSModal) return null;

  return (
    <>
      {/* Floating Bottom Banner (for initial invitation to install) */}
      {showBanner && (
        <div className={`fixed left-4 right-4 md:left-auto md:right-8 md:bottom-8 max-w-sm bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3 md:p-4 shadow-[0_10px_30px_rgba(0,0,0,0.3)] border border-slate-800/80 z-[9999] flex items-center justify-between gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-5 duration-300 ${
          hasBottomNav ? 'bottom-32' : 'bottom-24'
        }`}>
          <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 text-white shadow-md">
              <Download className="w-4.5 h-4.5 md:w-5 md:h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-100 truncate">Instalá la Aplicación</h4>
              <p className="hidden md:block text-[10px] text-slate-400 font-medium mt-0.5 leading-snug">
                Accedé más rápido y sin barras del navegador en tu pantalla.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-[8.5px] md:text-[9px] tracking-widest uppercase py-1.5 px-3 md:py-2 md:px-3 rounded-lg transition-all shadow-md"
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="text-slate-500 hover:text-slate-300 p-1 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-3.5 h-3.5 md:w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS & Custom Fallback Install Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-end justify-center animate-in fade-in duration-200">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => setShowIOSModal(false)} />

          {/* iOS Drawer Sheet */}
          <div className="relative w-full max-w-md bg-white rounded-t-[2.5rem] p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] z-[999999] pb-12 flex flex-col items-center space-y-6 text-center animate-in slide-in-from-bottom-full duration-300">
            {/* Grabber indicator for sheet */}
            <div className="w-12 h-1 bg-slate-200 rounded-full" />

            <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
              <Download className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="font-display text-lg tracking-tight text-slate-900 uppercase">
                Instalar en tu iPhone
              </h3>
              <p className="text-xs text-slate-400 font-medium max-w-xs leading-relaxed">
                Seguí estos simples pasos para tener **Hay Equipo** en tu pantalla de inicio como una aplicación de celular:
              </p>
            </div>

            {/* Instruction Steps */}
            <div className="w-full bg-slate-50 border border-slate-100/80 rounded-2xl p-4 text-left space-y-3.5">
              <div className="flex items-start gap-3.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                  Presioná el botón de <strong className="text-slate-800">Compartir</strong> 
                  <span className="inline-flex items-center justify-center p-1 bg-white border border-slate-100 rounded-md mx-1 shadow-sm">
                    <Share2 className="w-3.5 h-3.5 text-blue-500" />
                  </span> 
                  abajo en la barra del navegador Safari.
                </p>
              </div>

              <div className="flex items-start gap-3.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                  Buscá y seleccioná la opción <strong className="text-slate-800">"Agregar a inicio"</strong>
                  <span className="inline-flex items-center justify-center p-1 bg-white border border-slate-100 rounded-md mx-1 shadow-sm">
                    <PlusSquare className="w-3.5 h-3.5 text-slate-700" />
                  </span>.
                </p>
              </div>

              <div className="flex items-start gap-3.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                  Confirmá tocando <strong className="text-slate-800">"Agregar"</strong> arriba a la derecha. ¡Y listo!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md"
            >
              Entendido
            </button>

            {/* Bouncing Arrow pointing to iOS Safari bottom center bar */}
            {isIOS && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce z-[9999999] pointer-events-none">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest bg-emerald-400 px-3 py-1 rounded-full shadow-md">Toca Acá Abajo</span>
                <ArrowDown className="w-6 h-6 text-emerald-400 drop-shadow-[0_2px_5px_rgba(0,0,0,0.3)]" />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
