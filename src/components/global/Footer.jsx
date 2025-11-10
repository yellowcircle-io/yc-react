import React, { useState } from 'react';

/**
 * Shared Footer Component
 * Collapsible footer with contact and projects sections
 */
const Footer = ({
  isExpanded = false,
  onToggle,
  contactLinks = [],
  projectLinks = [],
  customStyles = {}
}) => {
  const [activeSection, setActiveSection] = useState(null);

  const handleSectionClick = (section) => {
    if (!isExpanded && onToggle) {
      onToggle();
    }
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <footer style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(242, 242, 242, 0.96)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      transition: 'height 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)',
      height: isExpanded ? '300px' : '60px',
      zIndex: 999,
      overflow: 'hidden',
      ...customStyles.container
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Footer Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => handleSectionClick('contact')}
            style={{
              fontSize: '14px',
              fontWeight: activeSection === 'contact' ? '700' : '600',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: activeSection === 'contact' ? '#EECF00' : 'black',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '8px 16px',
              transition: 'color 0.2s ease-out, font-weight 0.2s ease-out',
              font: 'inherit'
            }}
            onMouseEnter={(e) => e.target.style.color = '#EECF00'}
            onMouseLeave={(e) => e.target.style.color = activeSection === 'contact' ? '#EECF00' : 'black'}
          >
            Contact
          </button>

          <button
            type="button"
            onClick={() => handleSectionClick('projects')}
            style={{
              fontSize: '14px',
              fontWeight: activeSection === 'projects' ? '700' : '600',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: activeSection === 'projects' ? '#EECF00' : 'black',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '8px 16px',
              transition: 'color 0.2s ease-out, font-weight 0.2s ease-out',
              font: 'inherit'
            }}
            onMouseEnter={(e) => e.target.style.color = '#EECF00'}
            onMouseLeave={(e) => e.target.style.color = activeSection === 'projects' ? '#EECF00' : 'black'}
          >
            Projects
          </button>
        </div>

        {/* Footer Content */}
        <div style={{
          flex: 1,
          opacity: isExpanded ? 1 : 0,
          transform: isExpanded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
          transitionDelay: isExpanded ? '0.2s' : '0s'
        }}>
          {/* Contact Section */}
          {activeSection === 'contact' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              padding: '20px 0'
            }}>
              {contactLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '14px',
                    color: 'rgba(0,0,0,0.7)',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease-out',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#EECF00'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(0,0,0,0.7)'}
                >
                  {link.icon && <span>{link.icon}</span>}
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {/* Projects Section */}
          {activeSection === 'projects' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              padding: '20px 0'
            }}>
              {projectLinks.map((project, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    transition: 'background-color 0.2s ease-out'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)'}
                >
                  <a
                    href={project.url}
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'black',
                      textDecoration: 'none',
                      display: 'block',
                      marginBottom: '4px',
                      transition: 'color 0.2s ease-out'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#EECF00'}
                    onMouseLeave={(e) => e.target.style.color = 'black'}
                  >
                    {project.title}
                  </a>
                  {project.description && (
                    <p style={{
                      fontSize: '12px',
                      color: 'rgba(0,0,0,0.6)',
                      margin: 0,
                      lineHeight: '1.4'
                    }}>
                      {project.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
