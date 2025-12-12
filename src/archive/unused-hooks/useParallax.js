import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for parallax effects with mouse and device motion
 * @param {Object} options Configuration options
 * @param {boolean} options.enableMouse Enable mouse tracking (default: true)
 * @param {boolean} options.enableDeviceMotion Enable device motion/orientation (default: true)
 * @param {number} options.mouseIntensity Mouse movement intensity multiplier (default: 1)
 * @param {number} options.motionIntensity Device motion intensity multiplier (default: 1)
 * @param {number} options.throttleMs Throttle interval in ms (default: 16 ~60fps)
 * @returns {Object} Parallax state { x, y, isMouseActive, isMotionActive }
 */
export const useParallax = ({
  enableMouse = true,
  enableDeviceMotion = true,
  mouseIntensity = 1,
  motionIntensity = 1,
  throttleMs = 16
} = {}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [deviceMotion, setDeviceMotion] = useState({ x: 0, y: 0 });
  const [isMouseActive, setIsMouseActive] = useState(false);
  const [isMotionActive, setIsMotionActive] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const lastUpdateRef = useRef(0);
  const mouseThrottleRef = useRef(null);

  // Throttled mouse move handler
  const handleMouseMove = useCallback((e) => {
    if (!enableMouse) return;

    const now = Date.now();
    if (now - lastUpdateRef.current < throttleMs) return;
    lastUpdateRef.current = now;

    const x = (e.clientX / window.innerWidth - 0.5) * 2 * mouseIntensity;
    const y = (e.clientY / window.innerHeight - 0.5) * 2 * mouseIntensity;

    setMousePosition({ x, y });
    setIsMouseActive(true);
  }, [enableMouse, mouseIntensity, throttleMs]);

  // Device orientation handler
  const handleOrientation = useCallback((e) => {
    if (!enableDeviceMotion || !permissionGranted) return;

    const gamma = e.gamma || 0; // Left/right tilt (-90 to 90)
    const beta = e.beta || 0;   // Front/back tilt (-180 to 180)

    const x = (gamma / 90) * motionIntensity;
    const y = ((beta - 90) / 90) * motionIntensity;

    setDeviceMotion({ x, y });
    setIsMotionActive(true);
  }, [enableDeviceMotion, motionIntensity, permissionGranted]);

  // Request device motion permission (iOS 13+)
  const requestMotionPermission = useCallback(async () => {
    if (!enableDeviceMotion) return;

    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          setPermissionGranted(true);
        }
      } catch (error) {
        console.warn('Device orientation permission denied:', error);
      }
    } else {
      // Non-iOS or older browsers - permission not required
      setPermissionGranted(true);
    }
  }, [enableDeviceMotion]);

  // Setup mouse tracking
  useEffect(() => {
    if (!enableMouse) return;

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [enableMouse, handleMouseMove]);

  // Setup device motion tracking
  useEffect(() => {
    if (!enableDeviceMotion) return;

    // Auto-request permission on mobile devices
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      requestMotionPermission();
    } else {
      setPermissionGranted(true);
    }

    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [enableDeviceMotion, handleOrientation, requestMotionPermission]);

  // Combine mouse and device motion
  const x = isMouseActive ? mousePosition.x : (isMotionActive ? deviceMotion.x : 0);
  const y = isMouseActive ? mousePosition.y : (isMotionActive ? deviceMotion.y : 0);

  return {
    x,
    y,
    isMouseActive,
    isMotionActive,
    permissionGranted,
    requestMotionPermission,
    mousePosition,
    deviceMotion
  };
};

export default useParallax;
