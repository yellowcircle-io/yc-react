import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import globalContent from '../../config/globalContent';

// Social Media Icons
const SocialIcon = ({ type, size = 16, color = 'currentColor' }) => {
  const icons = {
    linkedin: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    instagram: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    )
  };
  return icons[type] || null;
};

/**
 * Footer - Two-section footer (Contact + Projects)
 * Now driven by globalContent configuration
 * Editable via: .claude/automation/global-manager.js
 *
 * Features:
 * - Contact capture module with email input
 * - Popup form for additional info (Name, Number, Message)
 * - Social media icons (LinkedIn, Instagram)
 */
function Footer({ onFooterToggle }) {
  const navigate = useNavigate();
  const { footerOpen } = useLayout();
  const footerRef = React.useRef(null);

  // Contact capture state
  const [showContactForm, setShowContactForm] = React.useState(false);
  const [showPopup, setShowPopup] = React.useState(false);
  const [contactData, setContactData] = React.useState({
    email: '',
    name: '',
    phone: '',
    message: ''
  });
  const [submitStatus, setSubmitStatus] = React.useState(null); // 'success' | 'error' | null

  const handleFooterClick = () => {
    if (!footerOpen && onFooterToggle) {
      onFooterToggle();
    }
  };

  // Close footer when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (footerOpen && footerRef.current && !footerRef.current.contains(event.target)) {
        if (onFooterToggle) {
          onFooterToggle();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [footerOpen, onFooterToggle]);

  // Reset contact form when footer closes
  React.useEffect(() => {
    if (!footerOpen) {
      setShowContactForm(false);
      setShowPopup(false);
      setSubmitStatus(null);
    }
  }, [footerOpen]);

  // Handle email submit - shows popup for more info
  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (contactData.email && contactData.email.includes('@')) {
      setShowPopup(true);
    }
  };

  // Handle full form submit
  const handleFullSubmit = async (e) => {
    e.preventDefault();
    try {
      // For now, log to console - storage solution to be scoped
      console.log('Contact form submitted:', contactData);

      // TODO: Implement storage solution (spreadsheet/AirTable/Database)
      // Options:
      // 1. Google Sheets API
      // 2. AirTable API
      // 3. Firebase/Firestore
      // 4. Simple email service (EmailJS, Formspree)

      setSubmitStatus('success');
      setTimeout(() => {
        setShowPopup(false);
        setShowContactForm(false);
        setContactData({ email: '', name: '', phone: '', message: '' });
        setSubmitStatus(null);
      }, 2000);
    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitStatus('error');
    }
  };

  // Inject responsive styles
  React.useEffect(() => {
    const styleId = 'footer-responsive-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @media (max-width: 768px) {
          .footer-container {
            height: 600px !important;
            bottom: -590px !important;
          }
          .footer-container.footer-open {
            bottom: 0 !important;
          }
          .footer-content {
            flex-direction: column !important;
          }
          .footer-section {
            flex: 1 1 100% !important;
            min-width: 100% !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Get configuration
  const contactConfig = globalContent.footer.contact;
  const projectsConfig = globalContent.footer.projects;

  return (
    <div
      ref={footerRef}
      className={`footer-container ${footerOpen ? 'footer-open' : ''}`}
      style={{
        position: 'fixed',
        bottom: footerOpen ? '0' : '-290px',
        left: '0',
        right: '0',
        height: '300px',
        zIndex: 200,
        transition: 'bottom 0.5s ease-out'
      }}
    >
      {/* Full Footer Content */}
      <div
        onClick={handleFooterClick}
        className="footer-content"
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          display: 'flex',
          flexDirection: 'row',
          cursor: footerOpen ? 'default' : 'pointer'
        }}
      >
        {/* Contact Section */}
        <div className="footer-section footer-contact" style={{
          flex: '1 1 50%',
          minWidth: 'min(300px, 100%)',
          backgroundColor: contactConfig.colors.backgroundColor,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start'
        }}>
          <h2 style={{
            color: contactConfig.colors.titleColor,
            fontSize: 'clamp(18px, 4vw, 24px)',
            fontWeight: '600',
            letterSpacing: '0.3em',
            margin: '0 0 20px 0',
            borderBottom: `2px solid ${contactConfig.colors.borderColor}`,
            paddingBottom: '10px'
          }}>{contactConfig.title}</h2>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            {contactConfig.links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target={link.type === 'social' ? '_blank' : undefined}
                rel={link.type === 'social' ? 'noopener noreferrer' : undefined}
                style={{
                  color: contactConfig.colors.linkColor,
                  textDecoration: 'none',
                  fontSize: 'clamp(11px, 2.5vw, 14px)',
                  fontWeight: '500',
                  letterSpacing: '0.1em',
                  transition: 'color 0.3s ease',
                  wordBreak: link.type === 'email' ? 'break-word' : 'normal',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = contactConfig.colors.linkHoverColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = contactConfig.colors.linkColor;
                }}
              >
                {link.icon && <SocialIcon type={link.icon} size={18} color="currentColor" />}
                <span>{link.text}</span>
              </a>
            ))}
          </div>

          {/* Contact Capture Module */}
          <div style={{ marginTop: '20px' }}>
            {!showContactForm ? (
              <button
                onClick={() => setShowContactForm(true)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#EECF00',
                  color: 'black',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  letterSpacing: '0.15em',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  maxWidth: '200px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#EECF00';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                GET IN TOUCH
              </button>
            ) : (
              <form onSubmit={handleEmailSubmit} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxWidth: '280px'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '8px'
                }}>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={contactData.email}
                    onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                    required
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#EECF00',
                      color: 'black',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EECF00'}
                  >
                    NEXT
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  style={{
                    padding: '6px',
                    backgroundColor: 'transparent',
                    color: 'rgba(255,255,255,0.5)',
                    border: 'none',
                    fontSize: '10px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Projects Section */}
        <div className="footer-section footer-projects" style={{
          flex: '1 1 50%',
          minWidth: 'min(300px, 100%)',
          backgroundColor: projectsConfig.colors.backgroundColor,
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start'
        }}>
          <h2 style={{
            color: projectsConfig.colors.titleColor,
            fontSize: 'clamp(18px, 4vw, 24px)',
            fontWeight: '600',
            letterSpacing: '0.3em',
            margin: '0 0 20px 0',
            borderBottom: `2px solid ${projectsConfig.colors.borderColor}`,
            paddingBottom: '10px'
          }}>{projectsConfig.title}</h2>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            {projectsConfig.links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                onClick={link.route ? (e) => {
                  e.preventDefault();
                  navigate(link.route);
                } : undefined}
                style={{
                  color: projectsConfig.colors.linkColor,
                  textDecoration: 'none',
                  fontSize: 'clamp(11px, 2.5vw, 14px)',
                  fontWeight: '500',
                  letterSpacing: '0.1em',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = projectsConfig.colors.linkHoverColor}
                onMouseLeave={(e) => e.target.style.color = projectsConfig.colors.linkColor}
              >{link.text}</a>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Popup Modal */}
      {showPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPopup(false);
          }}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'slideUpFadeIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '22px',
              fontWeight: '700',
              color: 'black',
              letterSpacing: '0.05em'
            }}>Tell us more</h3>
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '13px',
              color: 'rgba(0,0,0,0.6)'
            }}>We'll get back to you at {contactData.email}</p>

            <form onSubmit={handleFullSubmit} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <input
                type="text"
                placeholder="Your name"
                value={contactData.name}
                onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                style={{
                  padding: '14px 16px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'black',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#EECF00'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
              />
              <input
                type="tel"
                placeholder="Phone number (optional)"
                value={contactData.phone}
                onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                style={{
                  padding: '14px 16px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'black',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#EECF00'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
              />
              <textarea
                placeholder="How can we help?"
                value={contactData.message}
                onChange={(e) => setContactData({ ...contactData, message: e.target.value })}
                rows={3}
                style={{
                  padding: '14px 16px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'black',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '80px',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#EECF00'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
              />

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowPopup(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: 'transparent',
                    color: 'rgba(0,0,0,0.6)',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitStatus === 'success'}
                  style={{
                    flex: 2,
                    padding: '14px',
                    backgroundColor: submitStatus === 'success' ? '#22c55e' : '#EECF00',
                    color: submitStatus === 'success' ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    letterSpacing: '0.1em',
                    cursor: submitStatus === 'success' ? 'default' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (submitStatus !== 'success') {
                      e.currentTarget.style.backgroundColor = 'black';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (submitStatus !== 'success') {
                      e.currentTarget.style.backgroundColor = '#EECF00';
                      e.currentTarget.style.color = 'black';
                    }
                  }}
                >
                  {submitStatus === 'success' ? 'SENT!' : 'SEND MESSAGE'}
                </button>
              </div>

              {submitStatus === 'error' && (
                <p style={{
                  margin: 0,
                  fontSize: '12px',
                  color: '#ef4444',
                  textAlign: 'center'
                }}>
                  Something went wrong. Please try again.
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUpFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default Footer;
