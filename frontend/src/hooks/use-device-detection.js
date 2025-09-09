import { useState, useEffect } from 'react';

/**
 * Hook to detect device type and provide mobile-only access restrictions
 * Features:
 * - Detects mobile/tablet/desktop devices
 * - Provides Alt+L keyboard shortcut for admin override
 * - Returns device information and override state
 */
export function useDeviceDetection() {
  const [deviceType, setDeviceType] = useState('unknown');
  const [isMobile, setIsMobile] = useState(false);
  const [showAdminOverride, setShowAdminOverride] = useState(false);
  const [adminOverrideActive, setAdminOverrideActive] = useState(false);

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent,
      );
      const isTabletUA = /ipad|tablet|kindle|playbook|silk/i.test(userAgent);

      // Check screen dimensions as additional verification
      const screenWidth = window.screen.width;
      const isMobileScreen = screenWidth <= 768;
      const isTabletScreen = screenWidth > 768 && screenWidth <= 1024;

      // Touch support check
      const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Combine checks for more accurate detection
      const mobile = (isMobileUA && isMobileScreen) || (hasTouchSupport && screenWidth <= 768);
      const tablet = (isTabletUA || isTabletScreen) && hasTouchSupport;

      let type = 'desktop';
      if (mobile) type = 'mobile';
      else if (tablet) type = 'tablet';

      setDeviceType(type);
      setIsMobile(mobile || tablet); // Consider tablets as mobile for this app
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);

    // Alt+L keyboard shortcut for admin override
    const handleKeyDown = (event) => {
      if (event.altKey && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        if (!isMobile && !adminOverrideActive) {
          setShowAdminOverride(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', detectDevice);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobile, adminOverrideActive]);

  const activateAdminOverride = () => {
    setAdminOverrideActive(true);
    setShowAdminOverride(false);
  };

  const closeAdminOverride = () => {
    setShowAdminOverride(false);
  };

  const resetOverride = () => {
    setAdminOverrideActive(false);
  };

  return {
    deviceType,
    isMobile,
    isDesktop: !isMobile,
    showAdminOverride,
    adminOverrideActive,
    activateAdminOverride,
    closeAdminOverride,
    resetOverride,
    deviceInfo: {
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    },
  };
}

export default useDeviceDetection;
