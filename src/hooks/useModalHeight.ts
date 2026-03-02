import { useState, useEffect } from 'react';

const NAV_H_MOBILE = 64; // matches h-16 in Layout.tsx

export function useModalHeight() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  // On mobile: the portal gets paddingBottom = NAV_H_MOBILE so the sheet
  // slides up and stops exactly above the bottom navbar. No JS height math needed.
  // On desktop: sheet is centered, no offset needed.
  return {
    isMobile,
    portalPaddingBottom: isMobile ? NAV_H_MOBILE : 0,
    // Max height the sheet can grow to — uses dvh so iOS Safari toolbar is excluded
    sheetMaxH: isMobile
      ? `calc(100dvh - ${NAV_H_MOBILE + 16}px)`
      : 'min(88dvh, 680px)',
  };
}
