/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

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
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactModalEmail, setContactModalEmail] = useState('');
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

  // Device motion handlers with throttling (~30fps for smooth animation without excessive renders)
  useEffect(() => {
    let orientationTimeoutId;
    let motionTimeoutId;

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

    // Throttled handlers (~30fps = 33ms interval, balances smoothness vs performance)
    const throttledOrientation = (e) => {
      if (orientationTimeoutId) return;
      orientationTimeoutId = setTimeout(() => {
        handleDeviceOrientation(e);
        orientationTimeoutId = null;
      }, 33);
    };

    const throttledMotion = (e) => {
      if (motionTimeoutId) return;
      motionTimeoutId = setTimeout(() => {
        handleDeviceMotion(e);
        motionTimeoutId = null;
      }, 33);
    };

    if ('DeviceOrientationEvent' in window) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(response => {
            if (response === 'granted') {
              window.addEventListener('deviceorientation', throttledOrientation);
            }
          })
          .catch(() => {});
      } else {
        window.addEventListener('deviceorientation', throttledOrientation);
      }
    }

    if ('DeviceMotionEvent' in window) {
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
          .then(response => {
            if (response === 'granted') {
              window.addEventListener('devicemotion', throttledMotion);
            }
          })
          .catch(() => {});
      } else {
        window.addEventListener('devicemotion', throttledMotion);
      }
    }

    return () => {
      window.removeEventListener('deviceorientation', throttledOrientation);
      window.removeEventListener('devicemotion', throttledMotion);
      if (orientationTimeoutId) clearTimeout(orientationTimeoutId);
      if (motionTimeoutId) clearTimeout(motionTimeoutId);
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

  const handleContactModalToggle = useCallback(() => {
    setContactModalOpen(prev => !prev);
  }, []);

  const openContactModal = useCallback((prefillEmail = '') => {
    setContactModalEmail(prefillEmail);
    setContactModalOpen(true);
  }, []);

  const closeContactModal = useCallback(() => {
    setContactModalOpen(false);
    setContactModalEmail('');
  }, []);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const value = useMemo(() => ({
    // State
    sidebarOpen,
    setSidebarOpen,
    footerOpen,
    setFooterOpen,
    menuOpen,
    setMenuOpen,
    contactModalOpen,
    setContactModalOpen,
    contactModalEmail,
    setContactModalEmail,
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
    handleMenuToggle,
    handleContactModalToggle,
    openContactModal,
    closeContactModal
  }), [
    sidebarOpen, footerOpen, menuOpen, contactModalOpen, contactModalEmail,
    expandedSection, expandedSubSection, mousePosition, deviceMotion,
    accelerometerData, parallaxX, parallaxY,
    handleSidebarToggle, handleFooterToggle, handleMenuToggle,
    handleContactModalToggle, openContactModal, closeContactModal
  ]);

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}
