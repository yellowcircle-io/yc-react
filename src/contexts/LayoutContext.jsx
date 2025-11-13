import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const LayoutContext = createContext();

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

export function LayoutProvider({ children }) {
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [footerOpen, setFooterOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedSubSection, setExpandedSubSection] = useState(null);

  // Parallax State
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [deviceMotion, setDeviceMotion] = useState({ x: 0, y: 0 });
  const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0 });

  // Mouse movement handler with throttling
  const handleMouseMove = useCallback((e) => {
    setMousePosition({
      x: (e.clientX / window.innerWidth) * 60 - 20,
      y: (e.clientY / window.innerHeight) * 40 - 20
    });
  }, []);

  useEffect(() => {
    let timeoutId;
    const throttledMouseMove = (e) => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        handleMouseMove(e);
        timeoutId = null;
      }, 16); // ~60fps
    };

    window.addEventListener('mousemove', throttledMouseMove);
    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [handleMouseMove]);

  // Device motion handlers
  useEffect(() => {
    const handleDeviceOrientation = (e) => {
      if (e.gamma !== null && e.beta !== null) {
        setDeviceMotion({
          x: Math.max(-20, Math.min(20, (e.gamma / 90) * 20)),
          y: Math.max(-20, Math.min(20, (e.beta / 180) * 20))
        });
      }
    };

    const handleDeviceMotion = (e) => {
      if (e.accelerationIncludingGravity) {
        const acc = e.accelerationIncludingGravity;
        if (acc.x !== null && acc.y !== null) {
          setAccelerometerData({
            x: Math.max(-20, Math.min(20, (acc.x / 2) * -1)),
            y: Math.max(-20, Math.min(20, (acc.y / 2) * -1))
          });
        }
      }
    };

    if ('DeviceOrientationEvent' in window) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(response => {
            if (response === 'granted') {
              window.addEventListener('deviceorientation', handleDeviceOrientation);
            }
          })
          .catch(() => {});
      } else {
        window.addEventListener('deviceorientation', handleDeviceOrientation);
      }
    }

    if ('DeviceMotionEvent' in window) {
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
          .then(response => {
            if (response === 'granted') {
              window.addEventListener('devicemotion', handleDeviceMotion);
            }
          })
          .catch(() => {});
      } else {
        window.addEventListener('devicemotion', handleDeviceMotion);
      }
    }

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
  }, []);

  // Computed parallax values
  const combinedDeviceMotion = {
    x: deviceMotion.x + (accelerometerData.x * 0.3),
    y: deviceMotion.y + (accelerometerData.y * 0.3)
  };

  const parallaxX = (mousePosition.x + combinedDeviceMotion.x) * 0.6;
  const parallaxY = (mousePosition.y + combinedDeviceMotion.y) * 0.6;

  // Toggle handlers
  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleFooterToggle = useCallback(() => {
    setFooterOpen(prev => !prev);
  }, []);

  const handleMenuToggle = useCallback(() => {
    setMenuOpen(prev => !prev);
  }, []);

  const value = {
    // State
    sidebarOpen,
    setSidebarOpen,
    footerOpen,
    setFooterOpen,
    menuOpen,
    setMenuOpen,
    expandedSection,
    setExpandedSection,
    expandedSubSection,
    setExpandedSubSection,
    mousePosition,
    deviceMotion,
    accelerometerData,
    parallaxX,
    parallaxY,

    // Handlers
    handleSidebarToggle,
    handleFooterToggle,
    handleMenuToggle
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}
