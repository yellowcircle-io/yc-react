import React, { memo, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { loadGoogleMapsAPI } from '../../../utils/googleMapsLoader';

/**
 * TripPlannerMapNode - Interactive Trip Planning Map
 *
 * Features:
 * - Google Maps JavaScript API with custom markers
 * - Hotel/base location as central reference
 * - All destinations plotted on map
 * - Walking distances from base to each location
 * - Proximity-based day grouping suggestions
 * - Click marker to see details & directions
 * - AI-powered itinerary suggestions
 */

const PLACE_CATEGORIES = {
  hotel: { icon: '🏨', color: '#8b5cf6', label: 'Hotel/Base', marker: 'purple' },
  attraction: { icon: '🏛️', color: '#3b82f6', label: 'Attraction', marker: 'blue' },
  restaurant: { icon: '🍽️', color: '#f97316', label: 'Restaurant', marker: 'orange' },
  shopping: { icon: '🛍️', color: '#ec4899', label: 'Shopping', marker: 'pink' },
  activity: { icon: '🎯', color: '#22c55e', label: 'Activity', marker: 'green' },
  transport: { icon: '🚇', color: '#6b7280', label: 'Transport', marker: 'gray' },
};

const DAY_COLORS = [
  '#ef4444', // Day 1 - Red
  '#f97316', // Day 2 - Orange
  '#eab308', // Day 3 - Yellow
  '#22c55e', // Day 4 - Green
  '#3b82f6', // Day 5 - Blue
  '#8b5cf6', // Day 6 - Purple
];

// Get Map ID from environment for AdvancedMarkerElement support
const GOOGLE_MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID || '';

/**
 * Create a DOM element for marker content (used by AdvancedMarkerElement)
 */
const createMarkerContent = (color, label = null, scale = 24) => {
  const container = document.createElement('div');
  container.style.cssText = `
    width: ${scale}px;
    height: ${scale}px;
    border-radius: 50%;
    background-color: ${color};
    border: 3px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${scale * 0.5}px;
    color: white;
    font-weight: bold;
    cursor: pointer;
  `;
  if (label) {
    container.textContent = label;
  }
  return container;
};

// Custom comparison for memo - ensure places/baseLocation changes trigger re-render
const arePropsEqual = (prevProps, nextProps) => {
  // Always re-render if these change
  if (prevProps.selected !== nextProps.selected) return false;
  if (prevProps.id !== nextProps.id) return false;

  // Deep check critical data properties
  const prevData = prevProps.data;
  const nextData = nextProps.data;

  if (prevData.places?.length !== nextData.places?.length) return false;
  if (prevData.baseLocation?.name !== nextData.baseLocation?.name) return false;
  if (prevData.title !== nextData.title) return false;
  if (prevData.proximityGroups?.length !== nextData.proximityGroups?.length) return false;
  if (prevData.aiSuggestion !== nextData.aiSuggestion) return false;

  // Check if any place was modified
  if (prevData.places && nextData.places) {
    for (let i = 0; i < prevData.places.length; i++) {
      if (prevData.places[i]?.assignedDay !== nextData.places[i]?.assignedDay) return false;
      if (prevData.places[i]?.id !== nextData.places[i]?.id) return false;
    }
  }

  return true;
};

const TripPlannerMapNode = memo(({ id, data, selected }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const baseInputRef = useRef(null);
  const placeInputRef = useRef(null);
  const baseAutocompleteRef = useRef(null);
  const placeAutocompleteRef = useRef(null);
  const useAdvancedMarkers = useRef(false);

  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('map'); // map, list, ai
  const [_selectedPlace, setSelectedPlace] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlace, setNewPlace] = useState({ name: '', category: 'attraction' });
  const [dayFilter, setDayFilter] = useState('all'); // 'all' or day number
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Node data
  const title = data.title || 'Trip Planner';
  const baseLocation = data.baseLocation || null;
  const places = data.places || [];
  const apiKey = data.apiKey || '';
  const proximityGroups = data.proximityGroups || [];
  const aiSuggestion = data.aiSuggestion || '';

  // Get unique days for filter dropdown
  const availableDays = useMemo(() => {
    const days = [...new Set(places.filter(p => p.assignedDay).map(p => p.assignedDay))].sort((a, b) => a - b);
    return days;
  }, [places]);

  // Sort and filter places for List tab
  const sortedFilteredPlaces = useMemo(() => {
    let filtered = [...places];

    // Filter by day if not 'all'
    if (dayFilter !== 'all') {
      const dayNum = parseInt(dayFilter);
      if (dayFilter === 'unassigned') {
        filtered = filtered.filter(p => !p.assignedDay);
      } else if (!isNaN(dayNum)) {
        filtered = filtered.filter(p => p.assignedDay === dayNum);
      }
    }

    // Sort by day (unassigned at the end)
    filtered.sort((a, b) => {
      const dayA = a.assignedDay || 999;
      const dayB = b.assignedDay || 999;
      return dayA - dayB;
    });

    return filtered;
  }, [places, dayFilter]);

  // Load Google Maps script using singleton loader
  useEffect(() => {
    if (!apiKey) return;

    let isMounted = true;

    loadGoogleMapsAPI(apiKey)
      .then(() => {
        if (isMounted) {
          initMap();
        }
      })
      .catch((error) => {
        if (isMounted) {
          console.error('Google Maps load error:', error);
          setError('Failed to load Google Maps');
        }
      });

    return () => {
      isMounted = false;
      // Cleanup markers (handle both legacy Marker and AdvancedMarkerElement)
      markersRef.current.forEach(m => {
        try {
          if (typeof m.setMap === 'function') {
            m.setMap(null); // Legacy Marker API
          } else if ('map' in m) {
            m.map = null; // AdvancedMarkerElement API
          }
        } catch (_e) {
          // Ignore errors during cleanup
        }
      });
      markersRef.current = [];
    };
  }, [apiKey]);

  // Initialize Places Autocomplete for base location
  useEffect(() => {
    if (!window.google?.maps?.places || !baseInputRef.current || baseLocation) return;

    // Avoid duplicate initialization
    if (baseAutocompleteRef.current) return;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(baseInputRef.current, {
        types: ['establishment', 'geocode'],
        fields: ['name', 'formatted_address', 'geometry', 'place_id']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry && data.onDataChange) {
          data.onDataChange(id, {
            baseLocation: {
              name: place.name || place.formatted_address,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              formattedAddress: place.formatted_address,
              placeId: place.place_id
            }
          });
        }
      });

      baseAutocompleteRef.current = autocomplete;
    } catch (e) {
      console.warn('Could not initialize base autocomplete:', e);
    }
  }, [apiKey, baseLocation, id, data]);

  // Initialize Places Autocomplete for add place form
  useEffect(() => {
    if (!window.google?.maps?.places || !placeInputRef.current || !showAddForm) return;

    // Avoid duplicate initialization
    if (placeAutocompleteRef.current) return;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(placeInputRef.current, {
        types: ['establishment', 'geocode'],
        fields: ['name', 'formatted_address', 'geometry', 'place_id']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          setNewPlace(prev => ({
            ...prev,
            name: place.name || place.formatted_address,
            formattedAddress: place.formatted_address,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            placeId: place.place_id
          }));
        }
      });

      placeAutocompleteRef.current = autocomplete;
    } catch (e) {
      console.warn('Could not initialize place autocomplete:', e);
    }

    return () => {
      placeAutocompleteRef.current = null;
    };
  }, [showAddForm]);

  // Initialize map
  const initMap = useCallback(() => {
    // Guard: Check for Map constructor specifically (fixes Mobile Safari race condition)
    if (!mapRef.current || !window.google?.maps?.Map) return;

    const center = baseLocation?.lat && baseLocation?.lng
      ? { lat: baseLocation.lat, lng: baseLocation.lng }
      : { lat: 45.5017, lng: -73.5673 }; // Default Montreal

    // Check if AdvancedMarkerElement is available (requires mapId and marker library)
    const canUseAdvancedMarkers = GOOGLE_MAP_ID && window.google?.maps?.marker?.AdvancedMarkerElement;
    useAdvancedMarkers.current = canUseAdvancedMarkers;

    if (!canUseAdvancedMarkers && GOOGLE_MAP_ID) {
      console.warn('⚠️ AdvancedMarkerElement not available. Ensure marker library is loaded.');
    } else if (!GOOGLE_MAP_ID) {
      console.info('ℹ️ No Map ID configured. Using legacy markers. Set VITE_GOOGLE_MAP_ID for AdvancedMarkerElement.');
    }

    const mapOptions = {
      center,
      zoom: 13,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
        { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    };

    // Add mapId if available (required for AdvancedMarkerElement)
    if (GOOGLE_MAP_ID) {
      mapOptions.mapId = GOOGLE_MAP_ID;
    }

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);

    infoWindowRef.current = new window.google.maps.InfoWindow();

    // Add markers
    updateMarkers();
  }, [baseLocation]);

  // Update markers when places change
  useEffect(() => {
    if (mapInstanceRef.current && window.google?.maps?.Map) {
      updateMarkers();
    }
  }, [places, baseLocation]);

  // Fix: Re-render map when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && mapInstanceRef.current && activeTab === 'map' && window.google?.maps?.Map) {
        try {
          // Trigger resize to fix rendering issues
          window.google.maps.event.trigger(mapInstanceRef.current, 'resize');
          // Re-fit bounds after resize
          if (markersRef.current.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            markersRef.current.forEach(marker => {
              // Handle both legacy Marker (getPosition) and AdvancedMarkerElement (position property)
              const pos = typeof marker.getPosition === 'function'
                ? marker.getPosition()
                : marker.position;
              if (pos) bounds.extend(pos);
            });
            mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
          }
        } catch (e) {
          console.warn('Map visibility change error:', e);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeTab]);

  // Re-initialize map when switching back to map tab (container is recreated)
  useEffect(() => {
    if (activeTab === 'map' && apiKey && window.google?.maps?.Map) {
      // Small delay to ensure the DOM element is ready
      const timer = setTimeout(() => {
        if (mapRef.current) {
          // Re-initialize the map since the container was re-mounted
          initMap();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab, apiKey, initMap]);

  const updateMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !window.google?.maps?.Map) return;

    const AdvancedMarker = window.google?.maps?.marker?.AdvancedMarkerElement;
    const shouldUseAdvanced = useAdvancedMarkers.current && AdvancedMarker;

    // Clear existing markers safely (handle both APIs)
    markersRef.current.forEach(m => {
      try {
        if (typeof m.setMap === 'function') {
          m.setMap(null); // Legacy Marker
        } else if ('map' in m) {
          m.map = null; // AdvancedMarkerElement
        }
      } catch (_e) {
        // Ignore errors during cleanup
      }
    });
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();

    // Add base location marker (hotel)
    if (baseLocation?.lat && baseLocation?.lng) {
      const position = { lat: baseLocation.lat, lng: baseLocation.lng };
      let baseMarker;

      if (shouldUseAdvanced) {
        // Use AdvancedMarkerElement
        const content = createMarkerContent(PLACE_CATEGORIES.hotel.color, '🏨', 28);
        baseMarker = new AdvancedMarker({
          position,
          map: mapInstanceRef.current,
          title: baseLocation.name || 'Hotel',
          content,
          zIndex: 1000,
        });
      } else {
        // Fallback to legacy Marker
        baseMarker = new window.google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          title: baseLocation.name || 'Hotel',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: PLACE_CATEGORIES.hotel.color,
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 3,
          },
          zIndex: 1000,
        });
      }

      baseMarker.addListener('click', () => {
        infoWindowRef.current.setContent(`
          <div style="padding: 8px; max-width: 200px;">
            <strong>🏨 ${baseLocation.name || 'Hotel'}</strong>
            <p style="margin: 4px 0 0; font-size: 12px; color: #666;">Your base location</p>
          </div>
        `);
        // AdvancedMarkerElement requires different anchor handling
        if (shouldUseAdvanced) {
          infoWindowRef.current.open({
            anchor: baseMarker,
            map: mapInstanceRef.current,
          });
        } else {
          infoWindowRef.current.open(mapInstanceRef.current, baseMarker);
        }
      });

      markersRef.current.push(baseMarker);
      bounds.extend(position);
    }

    // Add place markers
    places.forEach((place) => {
      if (!place.lat || !place.lng) return;

      const category = PLACE_CATEGORIES[place.category] || PLACE_CATEGORIES.attraction;
      const dayIndex = place.assignedDay ? place.assignedDay - 1 : null;
      const markerColor = dayIndex !== null ? DAY_COLORS[dayIndex % DAY_COLORS.length] : category.color;
      const position = { lat: place.lat, lng: place.lng };
      const label = dayIndex !== null ? String(place.assignedDay) : category.icon;

      let marker;

      if (shouldUseAdvanced) {
        // Use AdvancedMarkerElement with DOM content
        const content = createMarkerContent(markerColor, label, dayIndex !== null ? 32 : 28);
        marker = new AdvancedMarker({
          position,
          map: mapInstanceRef.current,
          title: place.name,
          content,
        });
      } else {
        // Fallback to legacy Marker
        marker = new window.google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          title: place.name,
          label: {
            text: label,
            fontSize: dayIndex !== null ? '12px' : '14px',
            fontWeight: 'bold',
          },
          icon: dayIndex !== null ? {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 16,
            fillColor: markerColor,
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          } : undefined,
        });
      }

      marker.addListener('click', () => {
        const distance = place.distanceFromBase;
        infoWindowRef.current.setContent(`
          <div style="padding: 8px; max-width: 250px;">
            <strong>${category.icon} ${place.name}</strong>
            ${distance ? `<p style="margin: 4px 0; font-size: 12px; color: #666;">
              🚶 ${distance.duration || distance.text} from hotel
            </p>` : ''}
            ${place.assignedDay ? `<p style="margin: 4px 0; font-size: 12px; color: ${markerColor}; font-weight: bold;">
              Day ${place.assignedDay}
            </p>` : ''}
            <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.formattedAddress || place.name)}&travelmode=walking"
               target="_blank"
               style="display: inline-block; margin-top: 8px; padding: 4px 8px; background: #4285f4; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">
              Get Directions
            </a>
          </div>
        `);
        // AdvancedMarkerElement requires different anchor handling
        if (shouldUseAdvanced) {
          infoWindowRef.current.open({
            anchor: marker,
            map: mapInstanceRef.current,
          });
        } else {
          infoWindowRef.current.open(mapInstanceRef.current, marker);
        }
        setSelectedPlace(place);
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // Fit bounds if we have markers
    if (markersRef.current.length > 1) {
      try {
        mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
      } catch (e) {
        console.warn('Could not fit map bounds:', e);
      }
    }
  }, [places, baseLocation]);

  // Calculate distances and suggestions
  const handleCalculateDistances = useCallback(async () => {
    if (!baseLocation?.name || places.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'https://us-central1-yellowcircle-app.cloudfunctions.net/geocodePlacesWithDistances',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            baseLocation: baseLocation.formattedAddress || baseLocation.name,
            places: places.map(p => p.formattedAddress || p.name),
            mode: 'walking'
          })
        }
      );

      const result = await response.json();

      if (result.success && data.onDataChange) {
        // Update places with distance info
        const updatedPlaces = places.map(place => {
          const enriched = result.places.find(p =>
            p.name.toLowerCase().includes(place.name.toLowerCase()) ||
            place.name.toLowerCase().includes(p.name.toLowerCase())
          );
          return enriched ? {
            ...place,
            lat: enriched.lat,
            lng: enriched.lng,
            formattedAddress: enriched.formattedAddress,
            distanceFromBase: enriched.distanceFromBase
          } : place;
        });

        data.onDataChange(id, {
          places: updatedPlaces,
          proximityGroups: result.proximityGroups,
          aiSuggestion: result.aiSuggestion
        });
      }
    } catch (err) {
      console.error('Distance calculation error:', err);
      setError('Failed to calculate distances');
    } finally {
      setIsLoading(false);
    }
  }, [baseLocation, places, id, data]);

  // Add new place (uses autocomplete data if available, otherwise just name)
  const handleAddPlace = useCallback(() => {
    // Read from input ref as primary source (autocomplete may have set it directly)
    const inputName = placeInputRef.current?.value || newPlace.name;
    if (!inputName.trim()) return;

    const place = {
      id: `place-${Date.now()}`,
      name: newPlace.name || inputName, // Prefer state if set by autocomplete listener
      category: newPlace.category,
      lat: newPlace.lat || null,
      lng: newPlace.lng || null,
      formattedAddress: newPlace.formattedAddress || inputName,
      placeId: newPlace.placeId || null,
      addedAt: new Date().toISOString(),
      assignedDay: null
    };

    if (data.onDataChange) {
      data.onDataChange(id, {
        places: [...places, place]
      });
    }

    // Clear input and reset state
    if (placeInputRef.current) {
      placeInputRef.current.value = '';
    }
    setNewPlace({ name: '', category: 'attraction' });
    setShowAddForm(false);
    // Reset autocomplete ref so it can be reinitialized
    placeAutocompleteRef.current = null;
  }, [newPlace, places, id, data]);

  // Set base location (fallback for Enter key without autocomplete selection)
  const handleSetBase = useCallback(async (placeName) => {
    if (!placeName.trim() || !window.google?.maps) return;

    setIsLoading(true);
    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: placeName }, (results, status) => {
        setIsLoading(false);
        if (status === 'OK' && results[0] && data.onDataChange) {
          const result = results[0];
          data.onDataChange(id, {
            baseLocation: {
              name: placeName,
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng(),
              formattedAddress: result.formatted_address,
              placeId: result.place_id
            }
          });
        } else {
          console.warn('Geocode failed:', status);
          setError('Could not find location. Try selecting from dropdown.');
        }
      });
    } catch (err) {
      console.error('Set base error:', err);
      setIsLoading(false);
    }
  }, [id, data]);

  // Assign day to place
  const handleAssignDay = useCallback((placeId, day) => {
    if (data.onDataChange) {
      data.onDataChange(id, {
        places: places.map(p =>
          p.id === placeId ? { ...p, assignedDay: day } : p
        )
      });
    }
  }, [places, id, data]);

  // Remove place
  const handleRemovePlace = useCallback((placeId) => {
    if (data.onDataChange) {
      data.onDataChange(id, {
        places: places.filter(p => p.id !== placeId)
      });
    }
  }, [places, id, data]);

  // Handle title change
  const handleTitleChange = useCallback((newTitle) => {
    if (data.onDataChange) {
      data.onDataChange(id, { title: newTitle });
    }
  }, [id, data]);

  // Generate Google Maps URL with all destinations
  const generateGoogleMapsUrl = useCallback(() => {
    if (!baseLocation || places.length === 0) return null;

    // Sort places by assigned day
    const sortedPlaces = [...places].sort((a, b) => {
      const dayA = a.assignedDay || 999;
      const dayB = b.assignedDay || 999;
      return dayA - dayB;
    });

    // Build Google Maps directions URL
    // Format: https://www.google.com/maps/dir/?api=1&origin=START&destination=END&waypoints=WP1|WP2|WP3&travelmode=walking
    const origin = encodeURIComponent(baseLocation.formattedAddress || baseLocation.name);
    const destination = encodeURIComponent(sortedPlaces[sortedPlaces.length - 1]?.formattedAddress || sortedPlaces[sortedPlaces.length - 1]?.name || '');

    // All places except the last one become waypoints (max 10 for free tier)
    const waypoints = sortedPlaces.slice(0, -1).slice(0, 10).map(p =>
      encodeURIComponent(p.formattedAddress || p.name)
    ).join('|');

    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
    if (waypoints) {
      url += `&waypoints=${waypoints}`;
    }

    return url;
  }, [baseLocation, places]);

  // Generate simple map URL showing all locations
  const generateGoogleMapsViewUrl = useCallback(() => {
    if (!baseLocation) return null;

    // Create a URL that opens Google Maps centered on the area with search for nearby places
    const lat = baseLocation.lat;
    const lng = baseLocation.lng;

    // Alternative: Use My Maps / saved places URL format
    // For now, just open centered on hotel with a good zoom level
    return `https://www.google.com/maps/@${lat},${lng},14z`;
  }, [baseLocation]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '420px',
        backgroundColor: '#ffffff',
        border: `2px solid ${selected ? '#22c55e' : '#e5e7eb'}`,
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'default',
        position: 'relative',
        boxShadow: selected
          ? '0 8px 24px rgba(34, 197, 94, 0.25)'
          : isHovered
            ? '0 8px 20px rgba(0, 0, 0, 0.15)'
            : '0 4px 8px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'scale(1.01)' : 'scale(1)',
      }}
    >
      {/* Connection handles */}
      <Handle type="target" position={Position.Top} style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', border: '2px solid #fff' }} />

      {/* Delete button */}
      {(isHovered || selected) && data.onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); data.onDelete(id); }}
          className="nodrag nopan"
          style={{
            position: 'absolute',
            top: '-6px',
            left: '-6px',
            width: '24px',
            height: '24px',
            minWidth: '24px',
            minHeight: '24px',
            padding: 0,
            borderRadius: '50%',
            backgroundColor: '#374151',
            border: '2px solid white',
            color: 'white',
            fontSize: '14px',
            fontWeight: '400',
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            zIndex: 10,
          }}
        >×</button>
      )}

      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <span style={{ fontSize: '20px' }}>🗺️</span>
            {isEditingTitle ? (
              <input
                autoFocus
                defaultValue={title}
                onBlur={(e) => {
                  handleTitleChange(e.target.value);
                  setIsEditingTitle(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTitleChange(e.target.value);
                    setIsEditingTitle(false);
                  } else if (e.key === 'Escape') {
                    setIsEditingTitle(false);
                  }
                }}
                className="nodrag"
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: '1px solid #22c55e',
                  borderRadius: '4px',
                  outline: 'none',
                }}
              />
            ) : (
              <span
                onDoubleClick={() => setIsEditingTitle(true)}
                style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#111827',
                  cursor: 'text',
                }}
                title="Double-click to edit title"
              >
                {title}
              </span>
            )}
          </div>
          {isLoading && <span style={{ fontSize: '12px', color: '#6b7280' }}>Loading...</span>}
        </div>

        {/* Base location */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>🏨 Base:</span>
          {baseLocation ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
              <span style={{ fontSize: '11px', fontWeight: '500', color: '#374141', flex: 1 }}>
                {baseLocation.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (data.onDataChange) {
                    data.onDataChange(id, { baseLocation: null });
                  }
                  // Reset autocomplete ref so it reinitializes
                  baseAutocompleteRef.current = null;
                }}
                className="nodrag nopan"
                style={{
                  padding: '2px 6px', fontSize: '10px', backgroundColor: '#f3f4f6',
                  color: '#6b7280', border: 'none', borderRadius: '4px', cursor: 'pointer'
                }}
                title="Change base location"
              >
                ✏️
              </button>
            </div>
          ) : (
            <input
              ref={baseInputRef}
              type="text"
              placeholder="Enter hotel/base location..."
              className="nodrag"
              onKeyDown={(e) => e.key === 'Enter' && handleSetBase(e.target.value)}
              style={{
                flex: 1, padding: '4px 8px', fontSize: '11px', border: '1px solid #d1d5db',
                borderRadius: '4px', outline: 'none'
              }}
            />
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }}>
          {['map', 'list', 'ai'].map(tab => (
            <button
              key={tab}
              onClick={(e) => { e.stopPropagation(); setActiveTab(tab); }}
              className="nodrag nopan"
              style={{
                flex: 1, padding: '6px', fontSize: '11px', fontWeight: '600',
                backgroundColor: activeTab === tab ? '#22c55e' : '#f3f4f6',
                color: activeTab === tab ? 'white' : '#374151',
                border: 'none', borderRadius: '4px', cursor: 'pointer'
              }}
            >
              {tab === 'map' ? '🗺️ Map' : tab === 'list' ? '📋 List' : '🤖 AI'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'map' && (
        <div style={{ position: 'relative' }}>
          {/* Map container */}
          <div ref={mapRef} style={{ height: '280px', backgroundColor: '#e5e7eb' }}>
            {!apiKey && (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#6b7280', fontSize: '12px' }}>
                <span style={{ fontSize: '32px', marginBottom: '8px' }}>🗺️</span>
                <span>API key required</span>
              </div>
            )}
          </div>

          {/* Map legend */}
          <div style={{ padding: '8px 12px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {Object.entries(PLACE_CATEGORIES).map(([key, cat]) => (
              <span key={key} style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: cat.color }} />
                {cat.label}
              </span>
            ))}
          </div>

          {/* Open in Google Maps buttons */}
          {baseLocation && places.length > 0 && (
            <div style={{ padding: '8px 12px', backgroundColor: '#f0f9ff', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '6px' }}>
              <a
                href={generateGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="nodrag"
                style={{
                  flex: 1, padding: '6px 10px', fontSize: '11px', fontWeight: '600',
                  backgroundColor: '#4285f4', color: 'white', textDecoration: 'none',
                  borderRadius: '6px', textAlign: 'center', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: '4px'
                }}
              >
                🗺️ Open Route in Maps
              </a>
              <a
                href={generateGoogleMapsViewUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="nodrag"
                style={{
                  padding: '6px 10px', fontSize: '11px', fontWeight: '600',
                  backgroundColor: '#34a853', color: 'white', textDecoration: 'none',
                  borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                📍 View Area
              </a>
            </div>
          )}
        </div>
      )}

      {activeTab === 'list' && (
        <div className="nodrag nopan nowheel" style={{ padding: '12px', maxHeight: '300px', overflowY: 'auto' }}>
          {/* Header with Add + Filter */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            {/* Add place button */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowAddForm(!showAddForm); }}
              className="nodrag nopan"
              style={{
                flex: 1, padding: '8px', fontSize: '12px',
                backgroundColor: showAddForm ? '#f3f4f6' : '#22c55e', color: showAddForm ? '#374141' : 'white',
                border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'
              }}
            >
              {showAddForm ? '✕ Cancel' : '+ Add Place'}
            </button>
            {/* Day filter dropdown */}
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="nodrag"
              style={{
                padding: '8px 12px', fontSize: '12px', border: '2px solid #22c55e',
                borderRadius: '6px', backgroundColor: dayFilter === 'all' ? '#f0fdf4' : 'white',
                cursor: 'pointer', fontWeight: '600', color: '#166534',
                minWidth: '90px'
              }}
            >
              <option value="all">All Days</option>
              {availableDays.map(d => (
                <option key={d} value={d}>Day {d}</option>
              ))}
              {places.some(p => !p.assignedDay) && (
                <option value="unassigned">Unassigned</option>
              )}
            </select>
          </div>

          {/* Suggest Daily Activities button - at top when places exist */}
          {places.length > 0 && baseLocation && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('📍 Suggest Daily Activities clicked');
                console.log('  - Places:', places.length);
                console.log('  - ProximityGroups:', proximityGroups.length);
                console.log('  - onDataChange defined:', !!data.onDataChange);

                const dayAssignments = {};

                if (proximityGroups.length > 0) {
                  console.log('  - Using proximity-based grouping');
                  proximityGroups.forEach((group, dayIndex) => {
                    group.places.forEach(placeName => {
                      dayAssignments[placeName.toLowerCase()] = dayIndex + 1;
                    });
                  });
                } else {
                  console.log('  - Using fallback distribution (4 places/day)');
                  places.forEach((place, index) => {
                    dayAssignments[place.name.toLowerCase()] = Math.floor(index / 4) + 1;
                  });
                }

                console.log('  - Day assignments:', dayAssignments);

                if (data.onDataChange) {
                  const updatedPlaces = places.map(p => ({
                    ...p,
                    assignedDay: dayAssignments[p.name.toLowerCase()] || p.assignedDay
                  }));
                  console.log('  - Updated places:', updatedPlaces);
                  data.onDataChange(id, { places: updatedPlaces });
                } else {
                  console.error('❌ onDataChange not defined - cannot update places');
                  alert('Unable to update day assignments. Please try reloading the page.');
                }
              }}
              className="nodrag nopan"
              style={{
                width: '100%', padding: '10px', marginBottom: '10px', fontSize: '13px',
                backgroundColor: '#22c55e', color: 'white', border: 'none',
                borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              📍 Suggest Daily Activities
            </button>
          )}

          {/* Add form */}
          {showAddForm && (
            <div className="nodrag" style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '8px', marginBottom: '10px' }}>
              <input
                ref={placeInputRef}
                type="text"
                placeholder="Search place (e.g., Times Square)"
                defaultValue={newPlace.name}
                onChange={(e) => setNewPlace(prev => ({ ...prev, name: e.target.value }))}
                style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', marginBottom: '6px', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {Object.entries(PLACE_CATEGORIES).filter(([k]) => k !== 'hotel').map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => setNewPlace({ ...newPlace, category: key })}
                    style={{
                      padding: '4px 8px', fontSize: '10px',
                      backgroundColor: newPlace.category === key ? cat.color : '#f3f4f6',
                      color: newPlace.category === key ? 'white' : '#374151',
                      border: 'none', borderRadius: '4px', cursor: 'pointer'
                    }}
                  >
                    {cat.icon}
                  </button>
                ))}
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleAddPlace(); }} disabled={isLoading} className="nodrag nopan" style={{ width: '100%', padding: '6px', fontSize: '12px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                {isLoading ? 'Adding...' : 'Add Place'}
              </button>
            </div>
          )}

          {/* Places list - sorted by day, with optional filter */}
          {sortedFilteredPlaces.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>
              {places.length === 0
                ? 'No places added yet. Add destinations above!'
                : `No places for ${dayFilter === 'unassigned' ? 'unassigned' : `Day ${dayFilter}`}`}
            </div>
          ) : (
            sortedFilteredPlaces.map((place) => {
              const category = PLACE_CATEGORIES[place.category] || PLACE_CATEGORIES.attraction;
              const dayColor = place.assignedDay ? DAY_COLORS[(place.assignedDay - 1) % DAY_COLORS.length] : null;
              return (
                <div
                  key={place.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px',
                    marginBottom: '6px', backgroundColor: '#f9fafb', borderRadius: '8px',
                    borderLeft: `4px solid ${dayColor || category.color}`
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{category.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {place.name}
                    </div>
                    {place.distanceFromBase && (
                      <div style={{ fontSize: '10px', color: '#6b7280' }}>
                        🚶 {place.distanceFromBase.duration || place.distanceFromBase.text}
                      </div>
                    )}
                  </div>
                  {/* Day selector */}
                  <select
                    value={place.assignedDay || ''}
                    onChange={(e) => handleAssignDay(place.id, e.target.value ? parseInt(e.target.value) : null)}
                    className="nodrag"
                    style={{
                      padding: '4px 6px',
                      fontSize: '10px',
                      border: dayColor ? `2px solid ${dayColor}` : '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      color: dayColor || '#374151',
                      fontWeight: dayColor ? '600' : '400',
                      minWidth: '55px'
                    }}
                  >
                    <option value="">Day?</option>
                    {[1, 2, 3, 4, 5, 6].map(d => (
                      <option key={d} value={d}>Day {d}</option>
                    ))}
                  </select>
                  <button onClick={() => handleRemovePlace(place.id)} className="nodrag" style={{ padding: '2px 6px', fontSize: '12px', backgroundColor: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>×</button>
                </div>
              );
            })
          )}

          {/* Calculate distances button */}
          {places.length > 0 && baseLocation && (
            <button
              onClick={(e) => { e.stopPropagation(); handleCalculateDistances(); }}
              disabled={isLoading}
              className="nodrag nopan"
              style={{
                width: '100%', padding: '8px', marginTop: '8px', fontSize: '12px',
                backgroundColor: '#3b82f6', color: 'white', border: 'none',
                borderRadius: '6px', cursor: 'pointer', fontWeight: '600'
              }}
            >
              {isLoading ? 'Calculating...' : '📍 Calculate Distances & Group'}
            </button>
          )}
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="nodrag nopan nowheel" style={{ padding: '12px', maxHeight: '300px', overflowY: 'auto' }}>
          {/* Generate AI Suggestions button - shown when places exist but no suggestion yet */}
          {places.length > 0 && baseLocation && !aiSuggestion && (
            <button
              onClick={(e) => { e.stopPropagation(); handleCalculateDistances(); }}
              disabled={isLoading}
              className="nodrag nopan"
              style={{
                width: '100%', padding: '10px', marginBottom: '12px', fontSize: '12px',
                backgroundColor: '#8b5cf6', color: 'white', border: 'none',
                borderRadius: '6px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: '600',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? '🤖 Generating...' : '🤖 Generate AI Suggestions'}
            </button>
          )}

          {/* AI Suggestion */}
          {aiSuggestion ? (
            <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px' }}>🤖</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#166534' }}>AI Suggestion</span>
              </div>
              <div style={{ fontSize: '12px', color: '#15803d', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                {aiSuggestion.split(/(?=DAY \d|ARRIVAL|DEPARTURE)/g).map((section, i) => (
                  <div key={i} style={{ marginBottom: i > 0 ? '8px' : '0' }}>
                    {section.split('•').map((part, j) => (
                      j === 0 ? (
                        <div key={j} style={{ fontWeight: part.match(/^(DAY \d|ARRIVAL|DEPARTURE)/) ? '600' : '400' }}>
                          {part.trim()}
                        </div>
                      ) : (
                        <div key={j} style={{ paddingLeft: '12px', marginTop: '2px' }}>• {part.trim()}</div>
                      )
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : !places.length || !baseLocation ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>
              {!baseLocation ? 'Set a base location first.' : 'Add places to get AI suggestions.'}
            </div>
          ) : null}

          {/* Suggest Daily Activities button - at top of AI tab when places exist */}
          {places.length > 0 && baseLocation && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('📍 Suggest Daily Activities clicked (AI tab)');
                const dayAssignments = {};
                if (proximityGroups.length > 0) {
                  proximityGroups.forEach((group, dayIndex) => {
                    group.places.forEach(placeName => {
                      dayAssignments[placeName.toLowerCase()] = dayIndex + 1;
                    });
                  });
                } else {
                  places.forEach((place, index) => {
                    dayAssignments[place.name.toLowerCase()] = Math.floor(index / 4) + 1;
                  });
                }
                if (data.onDataChange) {
                  const updatedPlaces = places.map(p => ({
                    ...p,
                    assignedDay: dayAssignments[p.name.toLowerCase()] || p.assignedDay
                  }));
                  data.onDataChange(id, { places: updatedPlaces });
                }
              }}
              className="nodrag nopan"
              style={{
                width: '100%', padding: '10px', marginBottom: '12px', fontSize: '13px',
                backgroundColor: '#22c55e', color: 'white', border: 'none',
                borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              📍 Suggest Daily Activities
            </button>
          )}

          {/* Proximity Groups */}
          {proximityGroups.length > 0 && (
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Suggested Day Groupings
              </h4>
              {proximityGroups.map((group, i) => (
                <div
                  key={group.groupId}
                  style={{
                    padding: '10px', marginBottom: '8px', backgroundColor: '#f9fafb',
                    borderRadius: '8px', borderLeft: `4px solid ${DAY_COLORS[i % DAY_COLORS.length]}`
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: '600', color: DAY_COLORS[i % DAY_COLORS.length], marginBottom: '4px' }}>
                    {group.suggestedDay} ({group.count} places)
                  </div>
                  <div style={{ fontSize: '11px', color: '#374151' }}>
                    {group.places.join(' → ')}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Error display */}
      {error && (
        <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '11px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', border: '2px solid #fff' }} />
    </div>
  );
}, arePropsEqual);

TripPlannerMapNode.displayName = 'TripPlannerMapNode';

export default TripPlannerMapNode;
