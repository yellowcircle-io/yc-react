import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import globalContent from '../../config/globalContent';
import { CALENDAR_ENABLED, openCalendarBooking } from '../../config/calendarConfig';

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
  const { footerOpen, openContactModal } = useLayout();
  const footerRef = React.useRef(null);
  const [footerEmail, setFooterEmail] = React.useState('');

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

  // Reset email when footer closes
  React.useEffect(() => {
    if (!footerOpen) {
      setFooterEmail('');
    }
  }, [footerOpen]);

  // Handle email submit - opens ContactModal with email prefilled
  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (footerEmail && footerEmail.includes('@')) {
      openContactModal(footerEmail);
      setFooterEmail('');
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
  const resourcesConfig = globalContent.footer.resources;

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

          {/* Email + Phone on same line */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px 20px',
            marginBottom: '12px'
          }}>
            {contactConfig.links.filter(link => link.type === 'email' || link.type === 'phone').map((link, index) => (
              <a
                key={index}
                href={link.url}
                style={{
                  color: contactConfig.colors.linkColor,
                  textDecoration: 'none',
                  fontSize: 'clamp(11px, 2.5vw, 14px)',
                  fontWeight: '500',
                  letterSpacing: '0.1em',
                  transition: 'color 0.3s ease',
                  wordBreak: link.type === 'email' ? 'break-word' : 'normal'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = contactConfig.colors.linkHoverColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = contactConfig.colors.linkColor;
                }}
              >
                {link.text}
              </a>
            ))}
          </div>

          {/* Row 1: Social links (LinkedIn, Instagram) */}
          <div style={{
            display: 'flex',
            gap: '20px',
            marginBottom: '8px',
            flexWrap: 'wrap'
          }}>
            {contactConfig.links.filter(link => link.type === 'social').map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: contactConfig.colors.linkColor,
                  textDecoration: 'none',
                  fontSize: 'clamp(11px, 2.5vw, 14px)',
                  fontWeight: '500',
                  letterSpacing: '0.1em',
                  transition: 'color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
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

          {/* Row 2: Legal/navigation links (Feedback, Privacy, Terms) */}
          <div style={{
            display: 'flex',
            gap: '20px',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            {contactConfig.links.filter(link => link.type === 'link').map((link, index) => (
              <a
                key={`link-${index}`}
                href={link.url}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(link.route || link.url);
                }}
                style={{
                  color: contactConfig.colors.linkColor,
                  textDecoration: 'none',
                  fontSize: 'clamp(10px, 2vw, 12px)',
                  fontWeight: '500',
                  letterSpacing: '0.1em',
                  transition: 'color 0.3s ease',
                  cursor: 'pointer',
                  opacity: 0.7
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = contactConfig.colors.linkHoverColor;
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = contactConfig.colors.linkColor;
                  e.currentTarget.style.opacity = '0.7';
                }}
              >
                {link.text}
              </a>
            ))}
          </div>

          {/* Contact Capture Module - Email on Row 1, Buttons on Row 2 */}
          <div style={{ maxWidth: '400px' }}>
            {/* Row 1: Email input */}
            <form onSubmit={handleEmailSubmit} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={footerEmail}
                onChange={(e) => setFooterEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgb(251, 191, 36)';
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                }}
                required
              />
              {/* Row 2: Buttons - Get In Touch + Book A Call */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  style={{
                    padding: '12px 16px',
                    backgroundColor: 'rgb(251, 191, 36)',
                    color: 'black',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(251, 191, 36)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  GET IN TOUCH
                </button>
                <button
                  type="button"
                  onClick={() => openCalendarBooking(() => openContactModal('', 'Discovery Call Request'))}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: 'transparent',
                    color: 'rgb(251, 191, 36)',
                    border: '1px solid rgb(251, 191, 36)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(251, 191, 36)';
                    e.currentTarget.style.color = 'black';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgb(251, 191, 36)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  BOOK A CALL
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Resources Section */}
        <div className="footer-section footer-resources" style={{
          flex: '1 1 50%',
          minWidth: 'min(300px, 100%)',
          backgroundColor: resourcesConfig.colors.backgroundColor,
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start'
        }}>
          <h2 style={{
            color: resourcesConfig.colors.titleColor,
            fontSize: 'clamp(18px, 4vw, 24px)',
            fontWeight: '600',
            letterSpacing: '0.3em',
            margin: '0 0 20px 0',
            borderBottom: `2px solid ${resourcesConfig.colors.borderColor}`,
            paddingBottom: '10px'
          }}>{resourcesConfig.title}</h2>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            {resourcesConfig.links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                onClick={link.route ? (e) => {
                  e.preventDefault();
                  navigate(link.route);
                } : undefined}
                style={{
                  color: resourcesConfig.colors.linkColor,
                  textDecoration: 'none',
                  fontSize: 'clamp(11px, 2.5vw, 14px)',
                  fontWeight: '500',
                  letterSpacing: '0.1em',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = resourcesConfig.colors.linkHoverColor}
                onMouseLeave={(e) => e.target.style.color = resourcesConfig.colors.linkColor}
              >{link.text}</a>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

export default Footer;
