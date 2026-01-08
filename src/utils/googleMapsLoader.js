/**
 * Google Maps Singleton Loader
 *
 * Ensures Google Maps JavaScript API is only loaded once,
 * even when multiple components request it simultaneously.
 */

// Track loading state
let loadingPromise = null;
let isLoaded = false;

/**
 * Load the Google Maps JavaScript API
 * @param {string} apiKey - Google Maps API key
 * @returns {Promise<void>} - Resolves when the API is ready
 */
export const loadGoogleMapsAPI = (apiKey) => {
  // Already loaded
  if (isLoaded && window.google?.maps) {
    return Promise.resolve();
  }

  // Already loading - return existing promise
  if (loadingPromise) {
    return loadingPromise;
  }

  // Check if script was loaded externally
  if (window.google?.maps) {
    isLoaded = true;
    return Promise.resolve();
  }

  // Helper to wait for core Maps API (Map constructor + Places library)
  const waitForMapsReady = (resolve, reject, maxWait = 5000) => {
    const startTime = Date.now();
    const check = () => {
      // Must have Map constructor (fixes Mobile Safari race condition)
      const hasMapConstructor = !!window.google?.maps?.Map;
      const hasPlacesLibrary = !!window.google?.maps?.places?.Autocomplete;

      if (hasMapConstructor && hasPlacesLibrary) {
        isLoaded = true;
        resolve();
      } else if (Date.now() - startTime > maxWait) {
        // Timeout - check what's available
        if (hasMapConstructor) {
          isLoaded = true;
          console.warn('⚠️ Google Maps Places library took too long, proceeding with Map only');
          resolve();
        } else if (window.google?.maps) {
          // Maps object exists but Map constructor not ready - keep waiting a bit longer
          console.warn('⚠️ Google Maps API partially loaded, waiting for Map constructor...');
          setTimeout(check, 100);
        } else {
          reject(new Error('Google Maps API failed to initialize'));
        }
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  };

  // Check if script tag already exists (from previous load attempt)
  const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
  if (existingScript) {
    // Wait for existing script to load
    loadingPromise = new Promise((resolve, reject) => {
      if (window.google?.maps?.Map && window.google?.maps?.places?.Autocomplete) {
        isLoaded = true;
        resolve();
      } else if (window.google?.maps) {
        // Maps loaded but not fully ready yet
        waitForMapsReady(resolve, reject);
      } else {
        existingScript.addEventListener('load', () => {
          waitForMapsReady(resolve, reject);
        });
        existingScript.addEventListener('error', () => {
          reject(new Error('Failed to load Google Maps API'));
        });
        // Timeout in case events were missed
        setTimeout(() => {
          if (window.google?.maps) {
            waitForMapsReady(resolve, reject);
          }
        }, 1000);
      }
    });
    return loadingPromise;
  }

  // Create and load the script
  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,marker&loading=async`;
    script.async = true;
    script.defer = true;
    script.id = 'google-maps-script';

    script.onload = () => {
      // Wait for Map constructor + Places library to be fully initialized
      // The onload fires before libraries are ready
      console.log('📍 Google Maps script loaded, waiting for Map constructor + Places library...');
      waitForMapsReady(
        () => {
          console.log('✅ Google Maps API fully loaded (Map + Places ready)');
          resolve();
        },
        reject
      );
    };

    script.onerror = () => {
      loadingPromise = null; // Allow retry
      reject(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);
  });

  return loadingPromise;
};

/**
 * Check if Google Maps is currently loaded
 * @returns {boolean}
 */
export const isGoogleMapsLoaded = () => {
  return isLoaded && !!window.google?.maps;
};

/**
 * Reset the loader state (for testing purposes)
 */
export const resetGoogleMapsLoader = () => {
  loadingPromise = null;
  isLoaded = false;
};

export default loadGoogleMapsAPI;
