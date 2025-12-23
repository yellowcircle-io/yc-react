import React, { useState, useRef } from 'react';
import { isCloudinaryConfigured } from '../../utils/cloudinaryUpload';

const PhotoUploadModal = ({
  isOpen,
  onClose,
  onUpload,
  cardTypes,
  onAddCard,
  // MAP mode props
  currentMode = 'notes',
  onAddEmail,
  onAddWait,
  onAddCondition,
  _onEditCampaign,
  emailCount = 0,
  emailLimit = 3,
  _hasCampaign = false
}) => {
  const [step, setStep] = useState('method');
  const [uploadMethod, setUploadMethod] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [metadata, setMetadata] = useState({
    location: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const touchStartX = useRef(0);
  const hasCardTypes = cardTypes && onAddCard;

  // Start on page 1 (Card Types / MAP Actions) when modal opens
  // Both notes and map modes now default to the card/action selection
  React.useEffect(() => {
    if (isOpen) {
      setCurrentPage(1); // Card Types (notes mode) or MAP Actions (map mode)
    }
  }, [isOpen]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    console.log('📁 Files selected:', files.length, files);
    setSelectedFiles(files);
  };

  const triggerFileInput = () => {
    console.log('🔘 Triggering file input click');
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
      fileInput.click();
    } else {
      console.error('❌ File input not found');
    }
  };

  const handleMethodSelect = (method) => {
    setUploadMethod(method);
    setStep('details');
  };

  const handleBack = () => {
    setStep('method');
    setSelectedFiles([]);
    setImageUrl('');
  };

  const handleClose = () => {
    setStep('method');
    setUploadMethod(null);
    setSelectedFiles([]);
    setImageUrl('');
    setMetadata({
      location: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setCurrentPage(0);
    onClose();
  };

  // Swipe handlers for pagination
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if ((!hasCardTypes && currentMode !== 'map') || step !== 'method') return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    const maxPage = currentMode === 'notes' ? 2 : 1; // 3 pages in notes mode, 2 in map mode

    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (diff > 0 && currentPage < maxPage) {
        setCurrentPage(currentPage + 1); // Swipe left -> next page
      } else if (diff < 0 && currentPage > 0) {
        setCurrentPage(currentPage - 1); // Swipe right -> previous page
      }
    }
  };

  // Premium node types configuration
  const PREMIUM_NODE_TYPES = [
    { type: 'group', icon: '📦', label: 'GROUP', description: 'Visual container', color: '#9ca3af' },
    { type: 'todo', icon: '✅', label: 'TODO LIST', description: 'Checklist with progress', color: '#22c55e' },
    { type: 'sticky', icon: '📌', label: 'STICKY', description: 'Quick colored note', color: '#fbbf24' },
    { type: 'comment', icon: '💬', label: 'COMMENT', description: 'Annotation bubble', color: '#6366f1' },
    { type: 'swatch', icon: '🎨', label: 'COLOR SWATCH', description: 'Color collection', color: '#f97316' },
    { type: 'map', icon: '🗺️', label: 'MAP', description: 'Location with Google Maps', color: '#22c55e' },
    { type: 'tripPlanner', icon: '✈️', label: 'TRIP PLANNER', description: 'Map with destinations & AI itinerary', color: '#3b82f6' },
    { type: 'code', icon: '💻', label: 'CODE BLOCK', description: 'Code snippet', color: '#1e1e1e' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (uploadMethod === 'url' && !imageUrl) {
      alert('Please enter an image URL');
      return;
    }

    if ((uploadMethod === 'file' || uploadMethod === 'cloudinary') && selectedFiles.length === 0) {
      alert('Please select at least one photo');
      return;
    }

    setIsSubmitting(true);
    try {
      if (uploadMethod === 'url') {
        await onUpload([imageUrl], metadata, 'url');
      } else {
        await onUpload(selectedFiles, metadata, uploadMethod);
      }

      handleClose();
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMetadataChange = (field) => (e) => {
    setMetadata(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(4px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '0',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 32px',
          borderBottom: '2px solid white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {step === 'details' && (
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                style={{
                  padding: '6px 12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  letterSpacing: '0.1em',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'transparent',
                  color: 'white',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  borderRadius: '0',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = 'white';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
              >
                ← BACK
              </button>
            )}
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              letterSpacing: '0.2em',
              color: 'white',
              margin: 0
            }}>
              {step === 'method'
                ? (currentPage === 0 ? 'ADD NOTE' : currentPage === 1 ? (currentMode === 'map' ? 'MAP ACTIONS' : 'CARD TYPES') : 'PREMIUM')
                : 'NOTE DETAILS'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            style={{
              padding: '4px 12px',
              fontSize: '24px',
              border: 'none',
              background: 'transparent',
              color: 'white',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              lineHeight: 1,
              transition: 'color 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.color = '#EECF00'}
            onMouseOut={(e) => e.target.style.color = 'white'}
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Method Selection Step - With Pagination */}
          {step === 'method' && (
            <div style={{ position: 'relative', minHeight: '100%' }}>
              {/* Page Container - Slides horizontally */}
              <div style={{
                display: 'flex',
                transition: 'transform 0.3s ease-out',
                transform: `translateX(-${currentPage * 100}%)`
              }}>
                {/* Page 0: Upload Methods */}
                <div style={{
                  minWidth: '100%',
                  padding: '32px',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      letterSpacing: '0.05em',
                      color: 'rgba(255, 255, 255, 0.7)',
                      margin: '0 0 8px 0'
                    }}>
                      Choose your upload method:
                    </p>

                    {/* Cloudinary Upload (if configured) */}
                    {isCloudinaryConfigured() && (
                      <button
                        onClick={() => handleMethodSelect('cloudinary')}
                        style={{
                          width: '100%',
                          padding: '20px',
                          border: '1px solid #EECF00',
                          backgroundColor: 'rgba(238, 207, 0, 0.1)',
                          borderRadius: '0',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.2)';
                          e.currentTarget.style.borderColor = '#EECF00';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.1)';
                          e.currentTarget.style.borderColor = '#EECF00';
                        }}
                      >
                        <h4 style={{
                          fontWeight: '600',
                          fontSize: '14px',
                          letterSpacing: '0.1em',
                          color: 'white',
                          margin: '0 0 8px 0'
                        }}>
                          ☁️ CLOUD STORAGE
                        </h4>
                        <p style={{
                          fontSize: '13px',
                          fontWeight: '500',
                          letterSpacing: '0.02em',
                          color: 'rgba(255, 255, 255, 0.7)',
                          margin: 0
                        }}>
                          Permanent storage on Cloudinary (Recommended)
                        </p>
                      </button>
                    )}

                    <button
                      onClick={() => handleMethodSelect('file')}
                      style={{
                        width: '100%',
                        padding: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '0',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'white';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }}
                    >
                      <h4 style={{
                        fontWeight: '600',
                        fontSize: '14px',
                        letterSpacing: '0.1em',
                        color: 'white',
                        margin: '0 0 8px 0'
                      }}>
                        📱 FROM DEVICE
                      </h4>
                      <p style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        letterSpacing: '0.02em',
                        color: 'rgba(255, 255, 255, 0.7)',
                        margin: 0
                      }}>
                        Select photos from your phone or computer
                      </p>
                    </button>

                    <button
                      onClick={() => handleMethodSelect('url')}
                      style={{
                        width: '100%',
                        padding: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '0',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'white';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }}
                    >
                      <h4 style={{
                        fontWeight: '600',
                        fontSize: '14px',
                        letterSpacing: '0.1em',
                        color: 'white',
                        margin: '0 0 8px 0'
                      }}>
                        🔗 FROM URL
                      </h4>
                      <p style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        letterSpacing: '0.02em',
                        color: 'rgba(255, 255, 255, 0.7)',
                        margin: 0
                      }}>
                        Add image from web link
                      </p>
                    </button>

                    {!isCloudinaryConfigured() && (
                      <div style={{
                        marginTop: '12px',
                        padding: '16px',
                        backgroundColor: 'rgba(238, 207, 0, 0.1)',
                        border: '1px solid rgba(238, 207, 0, 0.3)',
                        borderRadius: '0',
                        fontSize: '13px'
                      }}>
                        <p style={{
                          color: 'rgba(255, 255, 255, 0.8)',
                          fontWeight: '500',
                          letterSpacing: '0.02em',
                          margin: 0
                        }}>
                          💡 <strong>Tip:</strong> Configure Cloudinary for permanent cloud storage.
                          See <code style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            padding: '2px 6px',
                            borderRadius: '2px'
                          }}>.env.example</code> for setup.
                        </p>
                      </div>
                    )}

                    {/* More Options Button - Navigate to Card Types / MAP Actions */}
                    {(hasCardTypes || currentMode === 'map') && (
                      <button
                        onClick={() => setCurrentPage(1)}
                        style={{
                          width: '100%',
                          marginTop: '16px',
                          padding: '14px 20px',
                          border: '1px dashed rgba(255, 255, 255, 0.3)',
                          backgroundColor: 'transparent',
                          borderRadius: '0',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = '#EECF00';
                          e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.05)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <span style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          letterSpacing: '0.1em',
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                          MORE OPTIONS
                        </span>
                        <span style={{
                          fontSize: '16px',
                          color: '#EECF00'
                        }}>
                          →
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Page 1: Card Types OR MAP Actions (context-aware) */}
                {(hasCardTypes || currentMode === 'map') && (
                  <div style={{
                    minWidth: '100%',
                    padding: '32px',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Back Button - Hide in MAP mode since we skip page 0 */}
                      {currentMode !== 'map' && (
                        <button
                          onClick={() => setCurrentPage(0)}
                          style={{
                            alignSelf: 'flex-start',
                            padding: '8px 16px',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            backgroundColor: 'transparent',
                            borderRadius: '0',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.3s ease',
                            marginBottom: '8px'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = '#EECF00';
                            e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.05)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <span style={{
                            fontSize: '14px',
                            color: '#EECF00'
                          }}>
                            ←
                          </span>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            letterSpacing: '0.1em',
                            color: 'rgba(255, 255, 255, 0.7)'
                          }}>
                            BACK
                          </span>
                        </button>
                      )}

                      <p style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        letterSpacing: '0.05em',
                        color: 'rgba(255, 255, 255, 0.7)',
                        margin: '0 0 8px 0'
                      }}>
                        {currentMode === 'map' ? 'Add journey step:' : 'Select a card type:'}
                      </p>

                      {/* MAP Mode Actions */}
                      {currentMode === 'map' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {/* Add Email */}
                          <button
                            onClick={() => {
                              if (emailCount < emailLimit && onAddEmail) {
                                onAddEmail();
                                handleClose();
                              }
                            }}
                            disabled={emailCount >= emailLimit}
                            style={{
                              width: '100%',
                              padding: '20px',
                              backgroundColor: emailCount < emailLimit ? 'rgb(251, 191, 36)' : 'rgba(251, 191, 36, 0.3)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0',
                              cursor: emailCount >= emailLimit ? 'not-allowed' : 'pointer',
                              fontSize: '14px',
                              fontWeight: '700',
                              letterSpacing: '0.1em',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              transition: 'all 0.2s ease',
                              textAlign: 'left',
                              opacity: emailCount >= emailLimit ? 0.5 : 1
                            }}
                            onMouseOver={(e) => {
                              if (emailCount < emailLimit) {
                                e.currentTarget.style.opacity = '0.9';
                                e.currentTarget.style.transform = 'translateX(4px)';
                              }
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.opacity = emailCount >= emailLimit ? '0.5' : '1';
                              e.currentTarget.style.transform = 'translateX(0)';
                            }}
                          >
                            <span style={{ fontSize: '24px' }}>📧</span>
                            <div>
                              <span style={{ display: 'block' }}>
                                {emailCount < emailLimit ? 'ADD EMAIL' : 'LIMIT REACHED'}
                              </span>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: '500',
                                opacity: 0.8
                              }}>
                                {emailCount}/{emailLimit} emails used
                              </span>
                            </div>
                          </button>

                          {/* Add Wait */}
                          <button
                            onClick={() => {
                              if (onAddWait) {
                                onAddWait();
                                handleClose();
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '20px',
                              backgroundColor: 'rgba(238, 207, 0, 0.85)',
                              color: 'black',
                              border: 'none',
                              borderRadius: '0',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '700',
                              letterSpacing: '0.1em',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              transition: 'all 0.2s ease',
                              textAlign: 'left'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.opacity = '0.9';
                              e.currentTarget.style.transform = 'translateX(4px)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.opacity = '1';
                              e.currentTarget.style.transform = 'translateX(0)';
                            }}
                          >
                            <span style={{ fontSize: '24px' }}>⏱️</span>
                            <div>
                              <span style={{ display: 'block' }}>ADD WAIT</span>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: '500',
                                opacity: 0.8
                              }}>
                                Add delay between steps
                              </span>
                            </div>
                          </button>

                          {/* Add Condition */}
                          <button
                            onClick={() => {
                              if (onAddCondition) {
                                onAddCondition();
                                handleClose();
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '20px',
                              backgroundColor: 'rgba(238, 207, 0, 0.7)',
                              color: 'black',
                              border: 'none',
                              borderRadius: '0',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '700',
                              letterSpacing: '0.1em',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              transition: 'all 0.2s ease',
                              textAlign: 'left'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.opacity = '0.9';
                              e.currentTarget.style.transform = 'translateX(4px)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.opacity = '1';
                              e.currentTarget.style.transform = 'translateX(0)';
                            }}
                          >
                            <span style={{ fontSize: '24px' }}>🔀</span>
                            <div>
                              <span style={{ display: 'block' }}>ADD CONDITION</span>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: '500',
                                opacity: 0.8
                              }}>
                                Branch based on engagement
                              </span>
                            </div>
                          </button>

                          {/* Divider */}
                          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '8px 0' }} />

                          {/* New Campaign - goes back to origin (Hub or Generator) */}
                          <button
                            onClick={() => {
                              const origin = localStorage.getItem('unity-outreach-origin') || '/outreach';
                              window.location.href = `${origin}?from=unity-map`;
                              handleClose();
                            }}
                            style={{
                              width: '100%',
                              padding: '20px',
                              backgroundColor: 'rgba(238, 207, 0, 0.5)',
                              color: 'black',
                              border: 'none',
                              borderRadius: '0',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '700',
                              letterSpacing: '0.1em',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              transition: 'all 0.2s ease',
                              textAlign: 'left'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.opacity = '0.9';
                              e.currentTarget.style.transform = 'translateX(4px)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.opacity = '1';
                              e.currentTarget.style.transform = 'translateX(0)';
                            }}
                          >
                            <span style={{ fontSize: '24px' }}>🚀</span>
                            <div>
                              <span style={{ display: 'block' }}>NEW CAMPAIGN</span>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: '500',
                                opacity: 0.8
                              }}>
                                Create in Generator
                              </span>
                            </div>
                          </button>
                        </div>
                      ) : (
                        /* NOTES Mode - Card Types */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {cardTypes && Object.entries(cardTypes).map(([type, config]) => (
                            <button
                              key={type}
                              onClick={() => {
                                if (type === 'photo') {
                                  // Photo: Navigate back to upload methods (page 0)
                                  setCurrentPage(0);
                                } else {
                                  // Other card types: Create and close
                                  onAddCard(type);
                                  handleClose();
                                }
                              }}
                              style={{
                                width: '100%',
                                padding: '20px',
                                backgroundColor: config.color,
                                color: type === 'photo' ? 'black' : 'white',
                                border: 'none',
                                borderRadius: '0',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '700',
                                letterSpacing: '0.1em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                transition: 'all 0.2s ease',
                                textAlign: 'left'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.opacity = '0.9';
                                e.currentTarget.style.transform = 'translateX(4px)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.opacity = '1';
                                e.currentTarget.style.transform = 'translateX(0)';
                              }}
                            >
                              <span style={{ fontSize: '24px' }}>{config.icon}</span>
                              <span>{config.label.toUpperCase()}</span>
                            </button>
                          ))}

                          {/* Premium Types Button */}
                          <button
                            onClick={() => setCurrentPage(2)}
                            style={{
                              width: '100%',
                              marginTop: '8px',
                              padding: '14px 20px',
                              border: '1px dashed rgba(255, 255, 255, 0.3)',
                              backgroundColor: 'transparent',
                              borderRadius: '0',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.borderColor = '#EECF00';
                              e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.05)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <span style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              letterSpacing: '0.1em',
                              color: 'rgba(255, 255, 255, 0.7)'
                            }}>
                              PREMIUM TYPES
                            </span>
                            <span style={{
                              fontSize: '16px',
                              color: '#EECF00'
                            }}>
                              →
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Page 2: Premium Node Types (Notes mode only) */}
                {currentMode === 'notes' && hasCardTypes && (
                  <div style={{
                    minWidth: '100%',
                    padding: '32px',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Back Button */}
                      <button
                        onClick={() => setCurrentPage(1)}
                        style={{
                          alignSelf: 'flex-start',
                          padding: '8px 16px',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          backgroundColor: 'transparent',
                          borderRadius: '0',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.3s ease',
                          marginBottom: '8px'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = '#EECF00';
                          e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.05)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <span style={{ fontSize: '14px', color: '#EECF00' }}>←</span>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          letterSpacing: '0.1em',
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                          BACK
                        </span>
                      </button>

                      <p style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        letterSpacing: '0.05em',
                        color: 'rgba(255, 255, 255, 0.7)',
                        margin: '0 0 8px 0'
                      }}>
                        Premium node types:
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {PREMIUM_NODE_TYPES.map((nodeType) => (
                          <button
                            key={nodeType.type}
                            onClick={() => {
                              onAddCard(nodeType.type);
                              handleClose();
                            }}
                            style={{
                              width: '100%',
                              padding: '16px 20px',
                              backgroundColor: nodeType.color,
                              color: nodeType.type === 'sticky' ? 'black' : 'white',
                              border: 'none',
                              borderRadius: '0',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '700',
                              letterSpacing: '0.08em',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              transition: 'all 0.2s ease',
                              textAlign: 'left',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.opacity = '0.9';
                              e.currentTarget.style.transform = 'translateX(4px)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.opacity = '1';
                              e.currentTarget.style.transform = 'translateX(0)';
                            }}
                          >
                            <span style={{ fontSize: '20px' }}>{nodeType.icon}</span>
                            <div style={{ flex: 1 }}>
                              <span style={{ display: 'block' }}>{nodeType.label}</span>
                              <span style={{
                                display: 'block',
                                fontSize: '10px',
                                fontWeight: '500',
                                opacity: 0.8,
                                marginTop: '2px'
                              }}>
                                {nodeType.description}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pagination Dots - Hide in MAP mode */}
              {hasCardTypes && currentMode !== 'map' && (
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: '20px'
                }}>
                  {[0, 1, 2].map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        width: currentPage === page ? '24px' : '8px',
                        height: '8px',
                        borderRadius: '4px',
                        backgroundColor: currentPage === page ? '#EECF00' : 'rgba(255, 255, 255, 0.4)',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'all 0.3s ease'
                      }}
                      title={page === 0 ? 'Upload Methods' : page === 1 ? 'Card Types' : 'Premium'}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Details Form Step */}
          {step === 'details' && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '32px' }}>
              {/* File Upload (Local or Cloudinary) */}
              {(uploadMethod === 'file' || uploadMethod === 'cloudinary') && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    color: 'white',
                    marginBottom: '8px'
                  }}>
                    SELECT PHOTOS
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    style={{
                      display: 'block',
                      border: '2px dashed rgba(255, 255, 255, 0.3)',
                      borderRadius: '0',
                      padding: '24px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      transition: 'all 0.3s ease',
                      WebkitTapHighlightColor: 'transparent',
                      userSelect: 'none'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#EECF00';
                      e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.05)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.borderColor = '#EECF00';
                      e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.05)';
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }}
                  >
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      letterSpacing: '0.05em',
                      color: 'white',
                      margin: '0 0 4px 0',
                      pointerEvents: 'none'
                    }}>
                      {selectedFiles.length > 0
                        ? `${selectedFiles.length} file(s) selected`
                        : 'Tap to browse for photos'}
                    </p>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      letterSpacing: '0.05em',
                      color: 'rgba(255, 255, 255, 0.6)',
                      margin: '0 0 4px 0',
                      pointerEvents: 'none'
                    }}>
                      JPEG, PNG, GIF, WebP, HEIC
                    </p>
                    <p style={{
                      fontSize: '11px',
                      fontWeight: '400',
                      letterSpacing: '0.02em',
                      color: 'rgba(238, 207, 0, 0.8)',
                      margin: 0,
                      pointerEvents: 'none',
                      fontStyle: 'italic'
                    }}>
                      Navigate to Pictures, Desktop, or Downloads folder
                    </p>
                  </label>

                  {/* Fallback button for devices where label click doesn't work */}
                  {selectedFiles.length === 0 && (
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      style={{
                        marginTop: '12px',
                        width: '100%',
                        padding: '12px 24px',
                        backgroundColor: '#EECF00',
                        color: 'black',
                        border: 'none',
                        borderRadius: '0',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '700',
                        letterSpacing: '0.1em',
                        transition: 'all 0.3s ease',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#fbbf24';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = '#EECF00';
                      }}
                    >
                      📸 CHOOSE PHOTOS
                    </button>
                  )}
                </div>
              )}

              {/* URL Input */}
              {uploadMethod === 'url' && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    color: 'white',
                    marginBottom: '8px'
                  }}>
                    IMAGE URL
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value.trim())}
                    placeholder="https://example.com/image.jpg"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '0',
                      fontSize: '14px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      boxSizing: 'border-box',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#EECF00';
                      e.target.style.backgroundColor = 'rgba(238, 207, 0, 0.05)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }}
                    required={uploadMethod === 'url'}
                  />
                  {imageUrl && (
                    <div style={{
                      marginTop: '8px',
                      width: '100%',
                      maxHeight: '160px',
                      overflow: 'hidden',
                      borderRadius: '6px',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img
                        src={imageUrl}
                        alt="Preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '160px',
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const errorMsg = document.createElement('div');
                          errorMsg.style.cssText = 'font-size: 14px; color: #dc2626; padding: 8px;';
                          errorMsg.textContent = 'Unable to load image. Please check the URL.';
                          e.target.parentElement.appendChild(errorMsg);
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Location */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  letterSpacing: '0.1em',
                  color: 'white',
                  marginBottom: '8px'
                }}>
                  LOCATION *
                </label>
                <input
                  type="text"
                  value={metadata.location}
                  onChange={handleMetadataChange('location')}
                  placeholder="e.g., Lake District, UK"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0',
                    fontSize: '14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EECF00';
                    e.target.style.backgroundColor = 'rgba(238, 207, 0, 0.05)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  letterSpacing: '0.1em',
                  color: 'white',
                  marginBottom: '8px'
                }}>
                  DATE *
                </label>
                <input
                  type="date"
                  value={metadata.date}
                  onChange={handleMetadataChange('date')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0',
                    fontSize: '14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    colorScheme: 'dark',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EECF00';
                    e.target.style.backgroundColor = 'rgba(238, 207, 0, 0.05)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  letterSpacing: '0.1em',
                  color: 'white',
                  marginBottom: '8px'
                }}>
                  DESCRIPTION (OPTIONAL)
                </label>
                <textarea
                  value={metadata.description}
                  onChange={handleMetadataChange('description')}
                  placeholder="Tell the story behind this note..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0',
                    fontSize: '14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    resize: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease',
                    fontFamily: 'Arial, sans-serif'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#EECF00';
                    e.target.style.backgroundColor = 'rgba(238, 207, 0, 0.05)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '0',
                    backgroundColor: 'transparent',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.5 : 1,
                    fontSize: '14px',
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    if (!isSubmitting) {
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.borderColor = 'white';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                >
                  BACK
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    ((uploadMethod === 'file' || uploadMethod === 'cloudinary') && selectedFiles.length === 0) ||
                    (uploadMethod === 'url' && !imageUrl)
                  }
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    backgroundColor: '#EECF00',
                    color: 'black',
                    border: 'none',
                    borderRadius: '0',
                    cursor: (isSubmitting ||
                      ((uploadMethod === 'file' || uploadMethod === 'cloudinary') && selectedFiles.length === 0) ||
                      (uploadMethod === 'url' && !imageUrl)) ? 'not-allowed' : 'pointer',
                    opacity: (isSubmitting ||
                      ((uploadMethod === 'file' || uploadMethod === 'cloudinary') && selectedFiles.length === 0) ||
                      (uploadMethod === 'url' && !imageUrl)) ? 0.5 : 1,
                    fontSize: '14px',
                    fontWeight: '700',
                    letterSpacing: '0.1em',
                    boxShadow: '0 4px 12px rgba(238, 207, 0, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    if (!e.target.disabled) {
                      e.target.style.backgroundColor = '#fbbf24';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 16px rgba(238, 207, 0, 0.4)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#EECF00';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(238, 207, 0, 0.3)';
                  }}
                >
                  {isSubmitting ? 'ADDING...' : 'ADD NOTE'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoUploadModal;
