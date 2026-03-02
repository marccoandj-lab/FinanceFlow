import { useEffect, useRef, useState } from 'react';

export type InstallState =
  | 'unsupported'   // browser can't install at all
  | 'ios'           // iOS Safari – show manual instructions
  | 'available'     // beforeinstallprompt fired – show native prompt
  | 'installing'    // prompt shown, waiting for user
  | 'installed'     // already installed / just installed
  | 'dismissed';    // user dismissed the banner

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<InstallState>('unsupported');
  const [bannerDismissed, setBannerDismissed] = useState(() =>
    localStorage.getItem('pwa-banner-dismissed') === 'true'
  );

  useEffect(() => {
    // Already installed (standalone mode)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    ) {
      setState('installed');
      return;
    }

    // iOS Safari detection (no beforeinstallprompt support)
    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    const isInStandaloneMode =
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isIos && !isInStandaloneMode) {
      setState('ios');
      return;
    }

    // Chrome/Edge/Samsung — listen for the native prompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setState('available');
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setState('installed');
      deferredPrompt.current = null;
      localStorage.setItem('pwa-banner-dismissed', 'true');
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt.current) return;
    setState('installing');
    await deferredPrompt.current.prompt();
    const choice = await deferredPrompt.current.userChoice;
    if (choice.outcome === 'accepted') {
      setState('installed');
    } else {
      setState('dismissed');
      dismiss();
    }
    deferredPrompt.current = null;
  };

  const dismiss = () => {
    setBannerDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  const resetDismiss = () => {
    setBannerDismissed(false);
    localStorage.removeItem('pwa-banner-dismissed');
  };

  const showBanner =
    !bannerDismissed &&
    (state === 'available' || state === 'ios');

  return { state, install, dismiss, resetDismiss, showBanner, bannerDismissed };
}
