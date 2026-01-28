import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { MapPin } from 'lucide-react';
import { loadGoogleMapsAPI } from '../../../utils/googleMapsLoader';

/**
 * MapNode - Interactive map with location markers
 *
 * Features:
 * - Google Maps Embed for visualization
 * - Address search with geocoding
 * - Place markers with categories
 * - Link to todo items
 * - Connection handles for flow linking
 */

const MAP_CATEGORIES = {
  attraction: { icon: '🏛️', color: '#3b82f6', label: 'Attraction' },
  restaurant: { icon: '🍽️', color: '#f97316', label: 'Restaurant' },
  hotel: { icon: '🏨', color: '#8b5cf6', label: 'Hotel' },
  shopping: { icon: '🛍️', color: '#ec4899', label: 'Shopping' },
  activity: { icon: '🎯', color: '#22c55e', label: 'Activity' },
  transport: { icon: '🚇', color: '#6b7280', label: 'Transport' },
};

const MapNode = memo(({ id, data, selected }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showPlaceForm, setShowPlaceForm] = useState(false);
  const [newPlace, setNewPlace] = useState({ name: '', address: '', category: 'attraction' });

  const searchInputRef = useRef(null);
  const searchAutocompleteRef = useRef(null);
  const placeInputRef = useRef(null);
  const placeAutocompleteRef = useRef(null);

  // Node data
  const title = data.title || 'Map';
  const address = data.address || '';
  const coordinates = data.coordinates || null;
  const zoom = data.zoom || 14;
  const places = data.places || [];

  // Google Maps API Key (passed from parent or config)
  const apiKey = data.apiKey || '';

  // Load Google Maps API for autocomplete
  useEffect(() => {
    if (!apiKey) return;
    loadGoogleMapsAPI(apiKey).catch(console.error);
  }, [apiKey]);

  // Initialize Places Autocomplete for search
  useEffect(() => {
    if (!window.google?.maps?.places || !searchInputRef.current) return;
    if (searchAutocompleteRef.current) return;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        types: ['establishment', 'geocode'],
        fields: ['name', 'formatted_address', 'geometry', 'place_id']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry && data.onDataChange) {
          data.onDataChange(id, {
            address: place.formatted_address || place.name,
            coordinates: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            }
          });
          // Clear the input after selection
          if (searchInputRef.current) {
            searchInputRef.current.value = '';
          }
        }
      });

      searchAutocompleteRef.current = autocomplete;
    } catch (e) {
      console.warn('Could not initialize search autocomplete:', e);
    }
  }, [apiKey, id, data]);

  // Initialize Places Autocomplete for add place form
  useEffect(() => {
    if (!window.google?.maps?.places || !placeInputRef.current || !showPlaceForm) return;
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
            address: place.formatted_address
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
  }, [showPlaceForm]);

  // Fallback search using browser-side Geocoder (for Enter key without autocomplete selection)
  const handleSearch = useCallback(() => {
    const searchQuery = searchInputRef.current?.value || '';
    if (!searchQuery.trim() || !window.google?.maps) return;
    setIsSearching(true);

    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: searchQuery }, (results, status) => {
        setIsSearching(false);
        if (status === 'OK' && results[0] && data.onDataChange) {
          const result = results[0];
          data.onDataChange(id, {
            address: result.formatted_address || searchQuery,
            coordinates: {
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng()
            }
          });
          // Clear the input after search
          if (searchInputRef.current) {
            searchInputRef.current.value = '';
          }
        } else {
          console.warn('Geocode failed:', status);
        }
      });
    } catch (error) {
      console.error('Geocoding error:', error);
      setIsSearching(false);
    }
  }, [id, data]);

  const handleAddPlace = useCallback(() => {
    if (!newPlace.name.trim()) return;

    const place = {
      id: `place-${Date.now()}`,
      name: newPlace.name,
      address: newPlace.address,
      category: newPlace.category,
      addedAt: new Date().toISOString(),
    };

    if (data.onDataChange) {
      data.onDataChange(id, {
        places: [...places, place],
      });
    }

    setNewPlace({ name: '', address: '', category: 'attraction' });
    setShowPlaceForm(false);
  }, [newPlace, places, id, data]);

  const handleRemovePlace = useCallback((placeId) => {
    if (data.onDataChange) {
      data.onDataChange(id, {
        places: places.filter(p => p.id !== placeId),
      });
    }
  }, [places, id, data]);

  const handleTitleChange = useCallback((newTitle) => {
    if (data.onDataChange) {
      data.onDataChange(id, { title: newTitle });
    }
  }, [id, data]);

  // Generate map embed URL
  const getMapEmbedUrl = () => {
    if (!apiKey) return null;

    if (coordinates) {
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${coordinates.lat},${coordinates.lng}&zoom=${zoom}`;
    }
    if (address) {
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(address)}&zoom=${zoom}`;
    }
    // Default to Montreal
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=Montreal,QC&zoom=12`;
  };

  const mapUrl = getMapEmbedUrl();

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '320px',
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
        outline: selected ? '2px solid #3b82f6' : 'none',
        outlineOffset: selected ? '2px' : '0',
      }}
    >
      {/* Type icon - top-left */}
      <div style={{ position: 'absolute', top: '8px', left: '8px', opacity: 0.4, zIndex: 5 }}>
        <MapPin size={14} />
      </div>

      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: '#22c55e',
          border: '2px solid #fff',
        }}
      />

      {/* Delete button */}
      {(isHovered || selected) && data.onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete(id);
          }}
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
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1f2937';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#374151';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Delete node"
        >
          ×
        </button>
      )}

      {/* Header */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '18px' }}>🗺️</span>
          {isEditing ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              className="nodrag"
              style={{
                flex: 1,
                padding: '4px 8px',
                fontSize: '14px',
                fontWeight: '600',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                outline: 'none',
              }}
            />
          ) : (
            <span
              onDoubleClick={() => setIsEditing(true)}
              style={{
                flex: 1,
                fontSize: '14px',
                fontWeight: '600',
                color: '#111827',
                cursor: 'text',
              }}
            >
              {title}
            </span>
          )}
        </div>

        {/* Search bar - uncontrolled for Google Places Autocomplete compatibility */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search location..."
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="nodrag"
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="nodrag"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isSearching ? 'wait' : 'pointer',
              opacity: isSearching ? 0.7 : 1,
            }}
          >
            {isSearching ? '...' : '🔍'}
          </button>
        </div>
      </div>

      {/* Map embed */}
      <div style={{ height: '180px', backgroundColor: '#e5e7eb' }}>
        {mapUrl ? (
          <iframe
            src={mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Map of ${address || 'Montreal'}`}
          />
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              fontSize: '12px',
              textAlign: 'center',
              padding: '20px',
            }}
          >
            <span style={{ fontSize: '32px', marginBottom: '8px' }}>🗺️</span>
            <span>Map API key required</span>
            <span style={{ fontSize: '10px', marginTop: '4px' }}>
              Add apiKey to node data
            </span>
          </div>
        )}
      </div>

      {/* Current address display */}
      {address && (
        <div
          style={{
            padding: '8px 14px',
            fontSize: '11px',
            color: '#6b7280',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
          }}
        >
          📍 {address}
        </div>
      )}

      {/* Places list */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>
            Places ({places.length})
          </span>
          <button
            onClick={() => setShowPlaceForm(!showPlaceForm)}
            className="nodrag"
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              backgroundColor: showPlaceForm ? '#f3f4f6' : '#22c55e',
              color: showPlaceForm ? '#374151' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {showPlaceForm ? 'Cancel' : '+ Add'}
          </button>
        </div>

        {/* Add place form */}
        {showPlaceForm && (
          <div
            className="nodrag"
            style={{
              padding: '10px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '8px',
            }}
          >
            <input
              ref={placeInputRef}
              type="text"
              placeholder="Search place..."
              value={newPlace.name}
              onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                marginBottom: '6px',
                boxSizing: 'border-box',
              }}
            />
            <input
              type="text"
              placeholder="Address (optional)"
              value={newPlace.address}
              onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                marginBottom: '6px',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {Object.entries(MAP_CATEGORIES).map(([key, cat]) => (
                <button
                  key={key}
                  onClick={() => setNewPlace({ ...newPlace, category: key })}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    backgroundColor: newPlace.category === key ? cat.color : '#f3f4f6',
                    color: newPlace.category === key ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleAddPlace}
              style={{
                width: '100%',
                padding: '6px',
                fontSize: '12px',
                backgroundColor: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Add Place
            </button>
          </div>
        )}

        {/* Places list */}
        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
          {places.length === 0 ? (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: '12px',
              }}
            >
              No places added yet
            </div>
          ) : (
            places.map((place) => {
              const category = MAP_CATEGORIES[place.category] || MAP_CATEGORIES.attraction;
              return (
                <div
                  key={place.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    marginBottom: '4px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    borderLeft: `3px solid ${category.color}`,
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{category.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#111827',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {place.name}
                    </div>
                    {place.address && (
                      <div
                        style={{
                          fontSize: '10px',
                          color: '#6b7280',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {place.address}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemovePlace(place.id)}
                    className="nodrag"
                    style={{
                      width: '20px',
                      height: '20px',
                      padding: 0,
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Remove place"
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: '#22c55e',
          border: '2px solid #fff',
        }}
      />
    </div>
  );
});

MapNode.displayName = 'MapNode';

export default MapNode;
