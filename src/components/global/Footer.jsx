import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import globalContent from '../../config/globalContent';

/**
 * Footer - Two-section footer (Contact + Projects)
 * Now driven by globalContent configuration
 * Editable via: .claude/automation/global-manager.js
 */
function Footer({ onFooterToggle }) {
  const navigate = useNavigate();
  const { footerOpen } = useLayout();
  const footerRef = React.useRef(null);

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
                style={{
                  color: contactConfig.colors.linkColor,
                  textDecoration: 'none',
                  fontSize: 'clamp(11px, 2.5vw, 14px)',
                  fontWeight: '500',
                  letterSpacing: '0.1em',
                  transition: 'color 0.3s ease',
                  wordBreak: link.type === 'email' ? 'break-word' : 'normal'
                }}
                onMouseEnter={(e) => e.target.style.color = contactConfig.colors.linkHoverColor}
                onMouseLeave={(e) => e.target.style.color = contactConfig.colors.linkColor}
              >{link.text}</a>
            ))}
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
    </div>
  );
}

export default Footer;
