import { useState, useEffect } from 'react';

export const usePWA = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    // 1. Detect if running in standalone mode (already installed PWA)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    setIsInstalled(isStandalone);

    // 2. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // 3. Detect Safari
    const safari = /^((?!chrome|android).)*safari/i.test(userAgent);
    setIsSafari(safari);

    // If already installed, do not show install options
    if (isStandalone) {
      setShowInstallBtn(false);
      return;
    }

    // 4. Handle beforeinstallprompt for Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Fallback: If it's iOS (Safari or any browser, since iOS 16.4+ allows installation from third-party browsers)
    // we show the option because we can guide them to install it manually.
    if (ios) {
      setShowInstallBtn(true);
    }

    // For testing/development: we can default to showing the button if not in standalone
    // so it can be previewed/demonstrated on desktop too.
    if (!isStandalone && !ios && !deferredPrompt) {
      // Show as a generic option
      setShowInstallBtn(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstall = async (): Promise<'prompted' | 'ios' | 'unsupported'> => {
    // If it's iOS, we return 'ios' so the UI can trigger the manual installation guide modal
    if (isIOS) {
      return 'ios';
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`PWA install prompt outcome: ${outcome}`);
        setDeferredPrompt(null);
        setShowInstallBtn(false);
        return 'prompted';
      } catch (err) {
        console.error('Error triggering PWA install:', err);
        return 'unsupported';
      }
    }

    // If no beforeinstallprompt is available (e.g. desktop Safari, Firefox, or unsupported webviews)
    // we return 'unsupported' so the UI can show a generic modal with instructions.
    return 'unsupported';
  };

  return {
    isInstalled,
    isIOS,
    isSafari,
    showInstallBtn,
    triggerInstall,
  };
};
