import React, { useState } from 'react';
import { isCloudinaryConfigured } from '../../utils/cloudinaryUpload';

const PhotoUploadModal = ({ isOpen, onClose, onUpload }) => {
  console.log('📸 PhotoUploadModal rendered, isOpen:', isOpen); // Debug log
  console.log('🎯 React Root Element:', document.getElementById('root'));
  console.log('🎯 Body Children Count:', document.body.children.length);

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
    onClose();
  };

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
    console.log('🚫 Modal is closed, returning null');
    return null;
  }

  console.log('✅ Modal IS OPEN - About to return JSX');

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
              {step === 'method' ? 'ADD MEMORY' : 'MEMORY DETAILS'}
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {/* Method Selection Step */}
          {step === 'method' && (
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
            </div>
          )}

          {/* Details Form Step */}
          {step === 'details' && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                  placeholder="Tell the story behind this memory..."
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
                  {isSubmitting ? 'ADDING...' : 'ADD MEMORY'}
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
