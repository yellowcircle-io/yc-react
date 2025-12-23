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

  // Helper to wait for Places library
  const waitForPlacesLibrary = (resolve, reject, maxWait = 5000) => {
    const startTime = Date.now();
    const check = () => {
      if (window.google?.maps?.places?.Autocomplete) {
        isLoaded = true;
        resolve();
      } else if (Date.now() - startTime > maxWait) {
        // Timeout - resolve anyway if basic maps is available
        if (window.google?.maps) {
          isLoaded = true;
          console.warn('⚠️ Google Maps Places library took too long, proceeding anyway');
          resolve();
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
      if (window.google?.maps?.places?.Autocomplete) {
        isLoaded = true;
        resolve();
      } else if (window.google?.maps) {
        // Maps loaded but Places not ready yet
        waitForPlacesLibrary(resolve, reject);
      } else {
        existingScript.addEventListener('load', () => {
          waitForPlacesLibrary(resolve, reject);
        });
        existingScript.addEventListener('error', () => {
          reject(new Error('Failed to load Google Maps API'));
        });
        // Timeout in case events were missed
        setTimeout(() => {
          if (window.google?.maps) {
            waitForPlacesLibrary(resolve, reject);
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
      // Wait for Places library to be fully initialized
      // The onload fires before libraries are ready
      console.log('📍 Google Maps script loaded, waiting for Places library...');
      waitForPlacesLibrary(
        () => {
          console.log('✅ Google Maps API + Places loaded (singleton)');
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
