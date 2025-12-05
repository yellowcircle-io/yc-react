import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * UnityModeSelector - Tab navigation for Unity Platform modes
 *
 * Taxonomy (per nomenclature document):
 * - notes: UnityNOTES - Visual note-taking canvas (current)
 * - map: UnityMAP - Campaign/journey builder (ACTIVE - connects to Outreach Generator)
 * - studio: UnitySTUDIO - Asset creation suite (coming soon)
 *
 * Progressive Disclosure:
 * - Hidden by default on fresh page load
 * - Shows when:
 *   1. Coming from Outreach Generator (via URL param or localStorage)
 *   2. User has generated content that could become a campaign
 *   3. Explicitly shown via prop
 */

const MODES = [
  {
    key: 'notes',
    label: 'NOTES',
    icon: '📝',
    description: 'Visual canvas workspace',
    available: true,
    route: '/unity-notes',
    color: '#EECF00', // Yellow
    badge: null
  },
  {
    key: 'map',
    label: 'MAP',
    icon: '🗺️',
    description: 'Campaign journey builder • Connected to Outreach Generator',
    available: true, // ACTIVE - campaign builder
    route: '/unity-notes?mode=map',
    color: '#8b5cf6', // Purple
    badge: '⚡ OUTREACH', // Indicates Outreach Generator connection
    badgeColor: '#EECF00'
  },
  {
    key: 'studio',
    label: 'STUDIO',
    icon: '🎨',
    description: 'Asset creation suite',
    available: false, // Coming soon
    route: '/unity-notes?mode=studio',
    color: '#3b82f6', // Blue
    badge: null
  },
];

function UnityModeSelector({
  currentMode = 'notes',
  onModeChange,
  showAlways = false,
  hasJourneyContent = false, // True if canvas has journey/campaign content
  style = {},
}) {
  const navigate = useNavigate();

  // Progressive disclosure logic
  // Check if we should show the selector
  const fromOutreachGenerator = React.useMemo(() => {
    // Check URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get('from') === 'outreach') return true;

    // Check localStorage for recent outreach deployment
    try {
      const lastDeployment = localStorage.getItem('unity-last-outreach-deployment');
      if (lastDeployment) {
        const deployTime = parseInt(lastDeployment, 10);
        // Show if deployed within last 5 minutes
        if (Date.now() - deployTime < 5 * 60 * 1000) return true;
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return false;
  }, []);

  // Determine if selector should be visible
  const shouldShow = showAlways || fromOutreachGenerator || hasJourneyContent || currentMode !== 'notes';

  const handleModeClick = (mode) => {
    if (!mode.available) return;

    if (onModeChange) {
      onModeChange(mode.key);
    } else {
      // Default navigation behavior
      navigate(mode.route);
    }
  };

  // Don't render if progressive disclosure hides it
  if (!shouldShow) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '4px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
        border: '1px solid rgba(238, 207, 0, 0.3)',
        ...style,
      }}
    >
      {MODES.map((mode) => {
        const isActive = currentMode === mode.key;
        const isDisabled = !mode.available;

        return (
          <button
            key={mode.key}
            onClick={() => handleModeClick(mode)}
            disabled={isDisabled}
            title={isDisabled ? `${mode.label} - Coming soon` : mode.description}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              fontSize: '11px',
              fontWeight: isActive ? '700' : '600',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              border: 'none',
              borderRadius: '8px',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: isActive ? mode.color : 'transparent',
              color: isActive ? (mode.key === 'notes' ? '#000' : '#fff') : isDisabled ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.7)',
              opacity: isDisabled ? 0.5 : 1,
              position: 'relative',
            }}
          >
            <span style={{ fontSize: '14px' }}>{mode.icon}</span>
            <span>{mode.label}</span>
            {/* Connection badge for MAP mode */}
            {mode.badge && isActive && (
              <span
                style={{
                  fontSize: '8px',
                  fontWeight: '700',
                  backgroundColor: mode.badgeColor || '#EECF00',
                  color: '#000',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  marginLeft: '4px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              >
                {mode.badge}
              </span>
            )}
            {isDisabled && (
              <span
                style={{
                  fontSize: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  marginLeft: '2px',
                }}
              >
                SOON
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default UnityModeSelector;
