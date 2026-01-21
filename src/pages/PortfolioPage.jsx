import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { COLORS } from '../styles/constants';
import { navigationItems } from '../config/navigationItems';

// Portfolio project data with images
const PORTFOLIO_PROJECTS = {
  auditboard: {
    name: 'AuditBoard',
    category: 'Email Development',
    year: '2024',
    description: 'Global Marketo email template system with 200+ editable parameters for enterprise audit and compliance SaaS.',
    caseStudyLink: '/works/auditboard',
    images: [
      {
        src: '/portfolio/auditboard-email-template.png',
        alt: 'AuditBoard Newsletter Email Template',
        caption: 'Risk in Focus 2024 newsletter with hero, content cards, and modular footer'
      },
      {
        src: '/portfolio/auditboard-design-spec.png',
        alt: 'AuditBoard Email Design Specification',
        caption: 'Modular template design with spacing annotations and component specs'
      }
    ],
    tags: ['Marketo', 'Email', 'Enterprise']
  },
  liveintent: {
    name: 'LiveIntent',
    category: 'Marketing Operations',
    year: '2013-2016',
    description: 'Marketing infrastructure and Marketo email automation for identity resolution and programmatic advertising platform.',
    caseStudyLink: '/works/liveintent',
    images: [
      {
        src: '/portfolio/liveintent-email-myths.jpg',
        alt: 'LiveIntent 5 Myths About Sending Email',
        caption: 'Educational infographic addressing common email advertising misconceptions'
      }
    ],
    tags: ['Marketo', 'Email', 'Marketing Automation']
  },
  tunecore: {
    name: 'TuneCore',
    category: 'Lifecycle Marketing',
    year: '2016-2018',
    description: 'Scaled email program to 1M+ subscribers with +250% open rate improvement for music distribution platform.',
    caseStudyLink: '/works/tunecore',
    images: [],
    tags: ['Email', 'Lifecycle', 'Music Tech']
  },
  'estee-lauder': {
    name: 'Estée Lauder',
    category: 'Email Development',
    year: '2023-2024',
    description: 'Email development and CRM standardization for luxury beauty brand portfolio (Origins).',
    caseStudyLink: '/works/estee-lauder',
    images: [],
    tags: ['Email', 'CRM', 'Beauty']
  },
  reddit: {
    name: 'Reddit',
    category: 'Marketing Systems',
    year: '2022-2023',
    description: 'Marketing systems architecture for community and advertiser engagement programs.',
    caseStudyLink: '/works/reddit',
    images: [],
    tags: ['Salesforce', 'HubSpot', 'Social Media']
  }
};

// Filter categories
const FILTER_OPTIONS = [
  { key: 'all', label: 'ALL PROJECTS' },
  { key: 'email', label: 'EMAIL DEVELOPMENT' },
  { key: 'martech', label: 'MARKETING SYSTEMS' },
  { key: 'automation', label: 'AUTOMATION' }
];

function PortfolioPage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle, openContactModal } = useLayout();
  const [selectedProject, setSelectedProject] = useState('auditboard');
  const [activeFilter, setActiveFilter] = useState('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const carouselRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const project = PORTFOLIO_PROJECTS[selectedProject];
  const projectKeys = Object.keys(PORTFOLIO_PROJECTS);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle horizontal scrolling
  const handleScroll = useCallback((direction) => {
    if (!carouselRef.current) return;
    const scrollAmount = 250;
    const newPosition = direction === 'left'
      ? Math.max(0, scrollPosition - scrollAmount)
      : scrollPosition + scrollAmount;
    setScrollPosition(newPosition);
  }, [scrollPosition]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxOpen) {
        if (e.key === 'Escape') setLightboxOpen(false);
        if (e.key === 'ArrowLeft') setLightboxIndex(i => Math.max(0, i - 1));
        if (e.key === 'ArrowRight') setLightboxIndex(i => Math.min(project.images.length - 1, i + 1));
      } else {
        if (e.key === 'ArrowLeft' || e.key === 'a') handleScroll('left');
        if (e.key === 'ArrowRight' || e.key === 'd') handleScroll('right');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, project, handleScroll]);

  // Mouse wheel horizontal scroll
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleWheel = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        handleScroll(e.deltaX > 0 ? 'right' : 'left');
      }
    };

    carousel.addEventListener('wheel', handleWheel, { passive: false });
    return () => carousel.removeEventListener('wheel', handleWheel);
  }, [handleScroll]);

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <Layout
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={navigationItems}
      pageLabel="PORTFOLIO"
    >
      {/* Two-Column Container - extends full viewport */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: isMobile ? 0 : (sidebarOpen ? 'min(35vw, 472px)' : '80px'),
        right: 0,
        bottom: footerOpen ? '320px' : 0,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 0,
        transition: 'left 0.5s ease-out, bottom 0.5s ease-out',
        zIndex: 50,
        overflow: isMobile ? 'auto' : 'hidden'
      }}>
        {/* Left Panel - Yellow (20% on desktop, full width on mobile) */}
        <div style={{
          width: isMobile ? '100%' : '20%',
          minWidth: isMobile ? 'auto' : '220px',
          maxWidth: isMobile ? 'none' : '280px',
          backgroundColor: COLORS.yellow,
          padding: isMobile ? '100px 20px 20px 20px' : '100px 20px 30px 20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: isMobile ? 'visible' : 'auto',
          borderRight: isMobile ? 'none' : 'none',
          borderBottom: isMobile ? '2px solid rgba(0,0,0,0.1)' : 'none',
          flexShrink: 0
        }}>
          {/* Project Selector Dropdown */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.15em',
              color: 'rgba(0,0,0,0.5)',
              marginBottom: '8px'
            }}>
              SELECT PROJECT
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: 'black',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {projectKeys.map(key => (
                <option key={key} value={key}>
                  {PORTFOLIO_PROJECTS[key].name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Details */}
          <div style={{ flex: 1, overflow: isMobile ? 'visible' : 'auto' }}>
            <h1 style={{
              fontSize: isMobile ? '24px' : 'clamp(20px, 2vw, 28px)',
              fontWeight: '700',
              lineHeight: '1.2',
              margin: '0 0 10px 0',
              color: 'black'
            }}>
              {project.name}
            </h1>

            <div style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              marginBottom: '12px'
            }}>
              <span style={{
                backgroundColor: 'black',
                color: 'white',
                padding: '3px 8px',
                borderRadius: '3px',
                fontSize: '10px',
                fontWeight: '600'
              }}>
                {project.category}
              </span>
              <span style={{
                backgroundColor: 'rgba(0,0,0,0.1)',
                color: 'black',
                padding: '3px 8px',
                borderRadius: '3px',
                fontSize: '10px',
                fontWeight: '600'
              }}>
                {project.year}
              </span>
            </div>

            <p style={{
              fontSize: '13px',
              lineHeight: '1.5',
              color: 'rgba(0,0,0,0.8)',
              marginBottom: '16px'
            }}>
              {project.description}
            </p>

            {/* Tags */}
            <div style={{
              display: 'flex',
              gap: '4px',
              flexWrap: 'wrap',
              marginBottom: '16px'
            }}>
              {project.tags.map((tag, i) => (
                <span key={i} style={{
                  backgroundColor: 'rgba(255,255,255,0.6)',
                  color: 'black',
                  padding: '3px 8px',
                  borderRadius: '3px',
                  fontSize: '9px',
                  fontWeight: '500'
                }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate(project.caseStudyLink)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'black',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '700',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = 'black';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'black';
                  e.currentTarget.style.color = 'white';
                }}
              >
                VIEW CASE STUDY
              </button>
              <button
                onClick={() => openContactModal('', `Inquiry about ${project.name} project`)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  color: 'black',
                  border: '2px solid black',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '700',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'black';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'black';
                }}
              >
                CONTACT
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Black (80% on desktop) with Image Carousel */}
        <div
          ref={carouselRef}
          style={{
            flex: 1,
            backgroundColor: 'black',
            padding: isMobile ? '20px' : '100px 40px 30px 40px',
            display: 'flex',
            flexDirection: 'column',
            overflow: isMobile ? 'visible' : 'hidden',
            minHeight: isMobile ? '400px' : 'auto',
            position: 'relative'
          }}
        >
          {/* Filter Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: isMobile ? '20px' : '24px',
            flexWrap: 'wrap'
          }}>
            {FILTER_OPTIONS.map(filter => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: activeFilter === filter.key ? COLORS.yellow : 'transparent',
                  color: activeFilter === filter.key ? 'black' : 'white',
                  border: `1px solid ${activeFilter === filter.key ? COLORS.yellow : 'rgba(255,255,255,0.3)'}`,
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '600',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Image Gallery */}
          {project.images.length > 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                gap: '20px',
                transform: `translate3d(-${scrollPosition}px, 0, 0)`,
                transition: 'transform 0.3s ease-out'
              }}>
                {project.images.map((image, index) => (
                  <div
                    key={index}
                    onClick={() => openLightbox(index)}
                    style={{
                      width: '220px',
                      height: '320px',
                      flexShrink: 0,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                          <div style="text-align: center; padding: 20px; color: rgba(255,255,255,0.5);">
                            <div style="font-size: 40px; margin-bottom: 10px;">📧</div>
                            <div style="font-size: 12px;">${image.caption || 'Image'}</div>
                          </div>
                        `;
                      }}
                    />
                  </div>
                ))}
              </div>

            </div>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: 'rgba(255,255,255,0.5)'
            }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>📁</div>
              <p style={{ fontSize: '14px', marginBottom: '8px' }}>Visual samples coming soon</p>
              <button
                onClick={() => navigate(project.caseStudyLink)}
                style={{
                  marginTop: '16px',
                  padding: '10px 20px',
                  backgroundColor: COLORS.yellow,
                  color: 'black',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                VIEW CASE STUDY INSTEAD
              </button>
            </div>
          )}

          {/* Navigation Footer - arrows on LEFT aligned with helper text */}
          {!isMobile && (
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleScroll('left')}
                  style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    color: 'white',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.yellow;
                    e.currentTarget.style.color = 'black';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = 'white';
                  }}
                >
                  ←
                </button>
                <button
                  onClick={() => handleScroll('right')}
                  style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    color: 'white',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.yellow;
                    e.currentTarget.style.color = 'black';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = 'white';
                  }}
                >
                  →
                </button>
              </div>
              <span style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: '10px'
              }}>
                ← → to scroll • Click to enlarge
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && project.images.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={project.images[lightboxIndex]?.src}
            alt={project.images[lightboxIndex]?.alt}
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Caption */}
          <div style={{
            position: 'absolute',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white',
            fontSize: '14px',
            textAlign: 'center',
            maxWidth: '600px'
          }}>
            <p style={{ margin: '0 0 8px 0' }}>{project.images[lightboxIndex]?.caption}</p>
            <p style={{ margin: 0, opacity: 0.5, fontSize: '12px' }}>
              {lightboxIndex + 1} / {project.images.length} • ESC to close • ← → to navigate
            </p>
          </div>

          {/* Nav arrows */}
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i - 1); }}
              style={{
                position: 'absolute',
                left: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '50px',
                height: '50px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              ←
            </button>
          )}
          {lightboxIndex < project.images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i + 1); }}
              style={{
                position: 'absolute',
                right: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '50px',
                height: '50px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              →
            </button>
          )}

          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '40px',
              height: '40px',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '28px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
      )}
    </Layout>
  );
}

export default PortfolioPage;
