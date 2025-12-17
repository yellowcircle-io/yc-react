/**
 * AIGenerateCanvasModal - Two-step AI canvas generation popup
 *
 * Step 1: Enter prompt OR choose Quick Start template
 * Step 2: Configure options (include images, video placeholders)
 *
 * Style borrowed from PhotoUploadModal
 */

import React, { useState } from 'react';

const QUICK_START_TEMPLATES = [
  { id: 'project', icon: '📋', label: 'Project Plan', description: 'Goals, tasks, timeline', prompt: 'Project planning canvas with goals, milestones, and action items' },
  { id: 'weekly', icon: '📅', label: 'Weekly Goals', description: 'Plan your week', prompt: 'Weekly goals and priorities canvas with daily focus areas' },
  { id: 'brainstorm', icon: '💡', label: 'Brainstorm', description: 'Capture ideas', prompt: 'Brainstorming canvas for creative ideation and concept exploration' },
  { id: 'meeting', icon: '🤝', label: 'Meeting Notes', description: 'Agenda & actions', prompt: 'Meeting notes canvas with agenda, discussion points, and action items' },
  { id: 'vision', icon: '✨', label: 'Vision Board', description: 'Goals & dreams', prompt: 'Vision board canvas with goals, inspirations, and aspirations for the future' },
  { id: 'content', icon: '✍️', label: 'Content Plan', description: 'Blog/social ideas', prompt: 'Content planning canvas with topics, themes, and publishing schedule' },
];

const AIGenerateCanvasModal = ({
  isOpen,
  onClose,
  onGenerate,
  isGenerating = false,
}) => {
  const [step, setStep] = useState(1); // 1 = prompt/quickstart, 2 = options
  const [prompt, setPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [options, setOptions] = useState({
    includeImages: true,
    includeVideoPlaceholder: false,
    cardCount: 5,
  });

  const handleClose = () => {
    setStep(1);
    setPrompt('');
    setSelectedTemplate(null);
    setOptions({
      includeImages: true,
      includeVideoPlaceholder: false,
      cardCount: 5,
    });
    onClose();
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setPrompt(template.prompt);
    setStep(2);
  };

  const handleContinue = () => {
    if (!prompt.trim()) return;
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    onGenerate(prompt, options);
  };

  if (!isOpen) return null;

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
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating) handleClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '0',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 32px',
          borderBottom: '2px solid white',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {step === 2 && (
              <button
                onClick={handleBack}
                disabled={isGenerating}
                style={{
                  padding: '6px 12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  letterSpacing: '0.1em',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'transparent',
                  color: 'white',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  borderRadius: '0',
                  transition: 'all 0.3s ease',
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
              margin: 0,
            }}>
              {step === 1 ? '🎨 AI CANVAS' : '⚙️ OPTIONS'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isGenerating}
            style={{
              padding: '4px 12px',
              fontSize: '24px',
              border: 'none',
              background: 'transparent',
              color: 'white',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              lineHeight: 1,
              transition: 'color 0.3s ease',
            }}
            onMouseOver={(e) => e.target.style.color = '#EECF00'}
            onMouseOut={(e) => e.target.style.color = 'white'}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          {step === 1 ? (
            <>
              {/* Custom Prompt Input */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  letterSpacing: '0.1em',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '8px',
                }}>
                  DESCRIBE YOUR CANVAS
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder='e.g., "Product launch plan for Q1", "Book summary notes", "Team retrospective"'
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0',
                    color: 'white',
                    fontSize: '14px',
                    resize: 'vertical',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#EECF00'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                />
                <button
                  onClick={handleContinue}
                  disabled={!prompt.trim()}
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    padding: '12px',
                    backgroundColor: prompt.trim() ? '#EECF00' : 'rgba(255, 255, 255, 0.1)',
                    color: prompt.trim() ? 'black' : 'rgba(255, 255, 255, 0.4)',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '700',
                    letterSpacing: '0.1em',
                    cursor: prompt.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                  }}
                >
                  CONTINUE →
                </button>
              </div>

              {/* Divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                margin: '24px 0',
              }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
                <span style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.4)',
                  letterSpacing: '0.1em',
                }}>OR QUICK START</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
              </div>

              {/* Quick Start Templates */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
              }}>
                {QUICK_START_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    style={{
                      padding: '16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '0',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.1)';
                      e.currentTarget.style.borderColor = '#EECF00';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{template.icon}</div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      letterSpacing: '0.05em',
                      color: 'white',
                      marginBottom: '4px',
                    }}>
                      {template.label}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: 'rgba(255, 255, 255, 0.5)',
                    }}>
                      {template.description}
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Step 2: Options */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  letterSpacing: '0.1em',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '8px',
                }}>
                  CANVAS TOPIC
                </label>
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(238, 207, 0, 0.1)',
                  border: '1px solid rgba(238, 207, 0, 0.3)',
                  color: 'white',
                  fontSize: '14px',
                }}>
                  {selectedTemplate ? (
                    <span>
                      <span style={{ marginRight: '8px' }}>{selectedTemplate.icon}</span>
                      {selectedTemplate.label}
                    </span>
                  ) : prompt}
                </div>
              </div>

              {/* Card Count */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  letterSpacing: '0.1em',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '8px',
                }}>
                  NUMBER OF CARDS
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[3, 5, 7].map((count) => (
                    <button
                      key={count}
                      onClick={() => setOptions({ ...options, cardCount: count })}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: options.cardCount === count ? '#EECF00' : 'rgba(255, 255, 255, 0.05)',
                        color: options.cardCount === count ? 'black' : 'white',
                        border: options.cardCount === count ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Include Options */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  letterSpacing: '0.1em',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '12px',
                }}>
                  INCLUDE
                </label>

                {/* Include Images Toggle */}
                <button
                  onClick={() => setOptions({ ...options, includeImages: !options.includeImages })}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    marginBottom: '8px',
                    backgroundColor: options.includeImages ? 'rgba(238, 207, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${options.includeImages ? 'rgba(238, 207, 0, 0.5)' : 'rgba(255, 255, 255, 0.15)'}`,
                    borderRadius: '0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>🖼️</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>AI Images</div>
                      <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>Generate images for cards</div>
                    </div>
                  </div>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    backgroundColor: options.includeImages ? '#EECF00' : 'transparent',
                    border: `2px solid ${options.includeImages ? '#EECF00' : 'rgba(255, 255, 255, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'black',
                    fontSize: '14px',
                    fontWeight: '700',
                  }}>
                    {options.includeImages && '✓'}
                  </div>
                </button>

                {/* Include Video Placeholder Toggle */}
                <button
                  onClick={() => setOptions({ ...options, includeVideoPlaceholder: !options.includeVideoPlaceholder })}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    backgroundColor: options.includeVideoPlaceholder ? 'rgba(238, 207, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${options.includeVideoPlaceholder ? 'rgba(238, 207, 0, 0.5)' : 'rgba(255, 255, 255, 0.15)'}`,
                    borderRadius: '0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>🎬</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>Video Placeholder</div>
                      <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>Add video embed card</div>
                    </div>
                  </div>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    backgroundColor: options.includeVideoPlaceholder ? '#EECF00' : 'transparent',
                    border: `2px solid ${options.includeVideoPlaceholder ? '#EECF00' : 'rgba(255, 255, 255, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'black',
                    fontSize: '14px',
                    fontWeight: '700',
                  }}>
                    {options.includeVideoPlaceholder && '✓'}
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer - Generate button (only in step 2) */}
        {step === 2 && (
          <div style={{
            padding: '24px 32px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: isGenerating ? 'rgba(238, 207, 0, 0.5)' : '#EECF00',
                color: 'black',
                border: 'none',
                fontSize: '16px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                cursor: isGenerating ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              {isGenerating ? (
                <>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid black',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  GENERATING...
                </>
              ) : (
                <>🎨 GENERATE CANVAS</>
              )}
            </button>
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIGenerateCanvasModal;
