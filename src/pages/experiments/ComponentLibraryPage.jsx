import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Component Library Components
import LibraryFilter from './component-library/components/LibraryFilter';
import ComponentCard from './component-library/components/ComponentCard';
import PreviewFrame, { EmailPreviewFrame } from './component-library/components/PreviewFrame';

// Rho Components
import Header from './component-library/libraries/rho/email-components/Header';
import BodyWithCTA from './component-library/libraries/rho/email-components/BodyWithCTA';
import Highlight from './component-library/libraries/rho/email-components/Highlight';
import TwoColumnCards from './component-library/libraries/rho/email-components/TwoColumnCards';
import PreFooter from './component-library/libraries/rho/email-components/PreFooter';
import Footer from './component-library/libraries/rho/email-components/Footer';

// Rho Atoms
import Button, { RhoPrimaryButton, RhoSecondaryButton } from './component-library/libraries/rho/atoms/Button';
import HorizontalRule, { RhoThinRule, RhoAccentRule } from './component-library/libraries/rho/atoms/HorizontalRule';
import ColorPalette, { RhoColors } from './component-library/libraries/rho/atoms/ColorPalette';

// Personal Library Components
import { yellowCircleComponents } from './component-library/libraries/yellowcircle/index';
import { cath3dralComponents } from './component-library/libraries/cath3dral/index';
import { goldenUnknownComponents } from './component-library/libraries/golden-unknown/index';

function ComponentLibraryPage() {
  const navigate = useNavigate();
  const [activeLibrary, setActiveLibrary] = useState('rho');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewComponent, setPreviewComponent] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [deviceMotion, setDeviceMotion] = useState({ x: 0, y: 0 });
  const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0 });
  const [expandedSection, setExpandedSection] = useState(null);
  const [footerOpen, setFooterOpen] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sample component data - this would typically come from a data source
  const componentData = useMemo(() => ({
    yellowcircle: yellowCircleComponents,
    cath3dral: cath3dralComponents,
    'golden-unknown': goldenUnknownComponents,
    rho: {
      'email-components': [
        {
          id: 'header',
          title: 'Header',
          description: 'Email header with logo and date/kicker information',
          category: 'Email',
          tags: ['email', 'header', 'branding'],
          component: <Header />,
          codeExample: `import Header from './Header';

<Header
  date="10.02.2025"
  kicker="Event Recap"
  logoUrl="https://39998325.fs1.hubspotusercontent-na1.net/hubfs/39998325/Rho-logo-25.png"
/>`,
          props: {
            date: "10.02.2025",
            kicker: "Event Recap",
            logoUrl: "https://39998325.fs1.hubspotusercontent-na1.net/hubfs/39998325/Rho-logo-25.png"
          }
        },
        {
          id: 'body-with-cta',
          title: 'Body with CTA',
          description: 'Email body content with call-to-action button',
          category: 'Email',
          tags: ['email', 'body', 'cta', 'button'],
          component: <BodyWithCTA />,
          codeExample: `import BodyWithCTA from './BodyWithCTA';

<BodyWithCTA
  greeting="Hello there,"
  content={[
    "Thank you for your interest in our services.",
    "We're excited to share some updates with you."
  ]}
  ctaText="Keep me updated"
  ctaUrl="#"
/>`,
          props: {
            greeting: "Hello there,",
            ctaText: "Keep me updated",
            ctaUrl: "#"
          }
        },
        {
          id: 'highlight',
          title: 'Highlight Section',
          description: 'Large headline with supporting description text',
          category: 'Email',
          tags: ['email', 'highlight', 'headline'],
          component: <Highlight />,
          codeExample: `import Highlight from './Highlight';

<Highlight
  headline="Big News Ahead"
  description="We're excited to share some important updates that will help you get the most out of your experience."
/>`,
          props: {
            headline: "Big News Ahead",
            description: "We're excited to share some important updates..."
          }
        },
        {
          id: 'two-column-cards',
          title: 'Two Column Cards',
          description: 'Side-by-side card layout for showcasing items',
          category: 'Email',
          tags: ['email', 'cards', 'layout', 'two-column'],
          component: <TwoColumnCards />,
          codeExample: `import TwoColumnCards from './TwoColumnCards';

<TwoColumnCards
  cards={[
    {
      image: "https://via.placeholder.com/300x120",
      title: "Feature Highlight",
      description: "Discover the latest features...",
      linkText: "Learn more →",
      url: "#"
    }
  ]}
/>`,
          props: {
            cards: [
              {
                image: "https://via.placeholder.com/300x120",
                title: "Feature Highlight",
                linkText: "Learn more →"
              }
            ]
          }
        },
        {
          id: 'pre-footer',
          title: 'Pre-Footer',
          description: 'Testimonial section with customer quotes',
          category: 'Email',
          tags: ['email', 'testimonials', 'pre-footer'],
          component: <PreFooter />,
          codeExample: `import PreFooter from './PreFooter';

<PreFooter
  headline="What our customers say"
  testimonials={[
    {
      quote: "This platform has transformed our business.",
      name: "Sarah Johnson",
      title: "CEO, TechStart",
      avatar: "https://via.placeholder.com/40x40"
    }
  ]}
/>`,
          props: {
            headline: "What our customers say",
            ctaText: "Read more testimonials"
          }
        },
        {
          id: 'footer',
          title: 'Footer',
          description: 'Email footer with company information',
          category: 'Email',
          tags: ['email', 'footer', 'contact'],
          component: <Footer />,
          codeExample: `import Footer from './Footer';

<Footer
  companyName="Rho Technologies"
  address="100 Crosby Street"
  city="New York"
  state="NY"
  zip="10012"
/>`,
          props: {
            companyName: "Rho Technologies",
            address: "100 Crosby Street",
            city: "New York"
          }
        }
      ],
      'atoms': [
        {
          id: 'button',
          title: 'Button',
          description: 'Customizable CTA button with Rho styling',
          category: 'Atoms',
          tags: ['button', 'cta', 'interactive'],
          component: <div className="space-y-4">
            <RhoPrimaryButton text="Primary Button" />
            <RhoSecondaryButton text="Secondary Button" />
          </div>,
          codeExample: `import Button, { RhoPrimaryButton, RhoSecondaryButton } from './Button';

<RhoPrimaryButton text="Primary Button" href="/action" />
<RhoSecondaryButton text="Secondary Button" href="/secondary" />
<Button
  text="Custom Button"
  backgroundColor="#00ECC0"
  textColor="#000"
/>`,
          props: {
            text: "Click here",
            href: "#",
            backgroundColor: "#00ECC0"
          }
        },
        {
          id: 'horizontal-rule',
          title: 'Horizontal Rule',
          description: 'Divider component with configurable styling',
          category: 'Atoms',
          tags: ['divider', 'separator', 'layout'],
          component: <div className="space-y-4">
            <RhoThinRule />
            <RhoAccentRule />
          </div>,
          codeExample: `import HorizontalRule, { RhoThinRule, RhoAccentRule } from './HorizontalRule';

<RhoThinRule />
<RhoAccentRule />
<HorizontalRule color="#00ECC0" thickness="2px" />`,
          props: {
            color: "#d9dfdf",
            thickness: "0.5px",
            width: "100%"
          }
        },
        {
          id: 'color-palette',
          title: 'Color Palette',
          description: 'Rho brand color system display',
          category: 'Atoms',
          tags: ['colors', 'branding', 'design-system'],
          component: <ColorPalette showUsage={false} />,
          codeExample: `import ColorPalette, { RhoColors } from './ColorPalette';

<ColorPalette showUsage={true} layout="grid" />

// Access colors directly
const primaryColor = RhoColors.primary; // "#00ECC0"`,
          props: {
            showUsage: false,
            layout: "grid",
            interactive: true
          }
        }
      ]
    }
  }), []);

  // Get all components for current library
  const allComponents = useMemo(() => {
    const library = componentData[activeLibrary];
    if (!library) return [];

    return Object.values(library).flat();
  }, [activeLibrary, componentData]);

  // Filter components based on search and category
  const filteredComponents = useMemo(() => {
    return allComponents.filter(component => {
      const matchesSearch = !searchQuery ||
        component.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' ||
        component.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [allComponents, searchQuery, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(['all']);
    allComponents.forEach(component => {
      cats.add(component.category.toLowerCase());
    });
    return Array.from(cats);
  }, [allComponents]);

  // Optimized mouse movement handler with throttling
  const handleMouseMove = useCallback((e) => {
    setMousePosition({
      x: (e.clientX / window.innerWidth) * 60 - 20,
      y: (e.clientY / window.innerHeight) * 40 - 20
    });
  }, []);

  useEffect(() => {
    let timeoutId;
    const throttledMouseMove = (e) => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        handleMouseMove(e);
        timeoutId = null;
      }, 16); // ~60fps
    };

    window.addEventListener('mousemove', throttledMouseMove);
    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [handleMouseMove]);

  // Device motion with better error handling
  useEffect(() => {
    const handleDeviceOrientation = (e) => {
      if (e.gamma !== null && e.beta !== null) {
        setDeviceMotion({
          x: Math.max(-20, Math.min(20, (e.gamma / 90) * 20)),
          y: Math.max(-20, Math.min(20, (e.beta / 180) * 20))
        });
      }
    };

    const handleDeviceMotion = (e) => {
      if (e.accelerationIncludingGravity) {
        const acc = e.accelerationIncludingGravity;
        if (acc.x !== null && acc.y !== null) {
          setAccelerometerData({
            x: Math.max(-20, Math.min(20, (acc.x / 2) * -1)),
            y: Math.max(-20, Math.min(20, (acc.y / 2) * -1))
          });
        }
      }
    };

    if ('DeviceOrientationEvent' in window) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(response => {
            if (response === 'granted') {
              window.addEventListener('deviceorientation', handleDeviceOrientation);
            }
          })
          .catch(() => {});
      } else {
        window.addEventListener('deviceorientation', handleDeviceOrientation);
      }
    }

    if ('DeviceMotionEvent' in window) {
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
          .then(response => {
            if (response === 'granted') {
              window.addEventListener('devicemotion', handleDeviceMotion);
            }
          })
          .catch(() => {});
      } else {
        window.addEventListener('devicemotion', handleDeviceMotion);
      }
    }

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
  }, []);

  // Combine orientation and accelerometer data
  const combinedDeviceMotion = {
    x: deviceMotion.x + (accelerometerData.x * 0.3),
    y: deviceMotion.y + (accelerometerData.y * 0.3)
  };

  const parallaxX = (mousePosition.x + combinedDeviceMotion.x) * 0.6;
  const parallaxY = (mousePosition.y + combinedDeviceMotion.y) * 0.6;

  const handleHomeClick = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    setFooterOpen(false);
    navigate('/');
  };

  // Handle footer toggle
  const handleFooterToggle = () => {
    setFooterOpen(!footerOpen);
    setMenuOpen(false);
  };

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    if (sidebarOpen) {
      setExpandedSection(null);
    }
    setSidebarOpen(!sidebarOpen);
  };

  const handlePreview = (component, title) => {
    setPreviewComponent({ component, title });
  };

  const closePreview = () => {
    setPreviewComponent(null);
  };

  // Navigation items (matching main site structure)
  const navigationItems = [
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/test-tubes-lab_j4cie7.png",
      label: "EXPERIMENTS",
      itemKey: "experiments",
      subItems: ["golden unknown", "being + rhyme", "cath3dral", "component library"]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684385/write-book_gfaiu8.png",
      label: "THOUGHTS",
      itemKey: "thoughts",
      subItems: ["blog"]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/face-profile_dxxbba.png",
      label: "ABOUT",
      itemKey: "about",
      subItems: ["about me", "about yellowcircle", "contact"]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/history-edu_nuazpv.png",
      label: "WORKS",
      itemKey: "works",
      subItems: ["consulting", "rho", "reddit", "cv"]
    }
  ];

  // Navigation Item Component
  const NavigationItem = ({ icon, label, subItems, itemKey, index }) => {
    const isExpanded = expandedSection === itemKey && sidebarOpen;

    let topPosition = index * 50;
    for (let i = 0; i < index; i++) {
      const prevItemKey = navigationItems[i]?.itemKey;
      if (expandedSection === prevItemKey && sidebarOpen) {
        const prevSubItems = navigationItems[i]?.subItems || [];
        topPosition += prevSubItems.length * 18 + 5;
      }
    }

    const handleClick = () => {
      if (!sidebarOpen) {
        setSidebarOpen(true);
        setExpandedSection(itemKey);
      } else {
        setExpandedSection(expandedSection === itemKey ? null : itemKey);
      }
    };

    return (
      <div style={{
        position: 'absolute',
        top: `${topPosition}px`,
        left: 0,
        width: '100%',
        transition: 'top 0.3s ease-out'
      }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 0',
            position: 'relative',
            minHeight: '40px',
            width: '100%'
          }}
        >
          <div
            className="clickable-element"
            onClick={handleClick}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleClick();
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              cursor: 'pointer',
              zIndex: 3,
              WebkitTapHighlightColor: 'transparent'
            }}
          />

          <div style={{
            position: 'absolute',
            left: '40px',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            pointerEvents: 'none'
          }}>
            <img
              src={icon}
              alt={label}
              width="24"
              height="24"
              style={{ display: 'block' }}
            />
          </div>

          {sidebarOpen && (
            <span style={{
              position: 'absolute',
              left: '60px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: isExpanded ? '#EECF00' : 'white',
              fontSize: '14px',
              fontWeight: isExpanded ? '700' : '600',
              letterSpacing: '0.2em',
              transition: 'color 0.3s ease-out, font-weight 0.3s ease-out',
              whiteSpace: 'nowrap',
              pointerEvents: 'none'
            }}>{label}</span>
          )}
        </div>

        {sidebarOpen && (
          <div style={{
            marginLeft: '75px',
            marginTop: '-5px',
            maxHeight: isExpanded ? `${(subItems?.length || 0) * 18 + 5}px` : '0px',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease-out'
          }}>
            {subItems && (
              <div style={{ paddingTop: '0px', paddingBottom: '0px' }}>
                {subItems.map((item, idx) => (
                  <a key={idx} href="#" className="clickable-element" style={{
                    display: 'block',
                    color: item === 'component library' ? '#EECF00' : 'rgba(255,255,255,0.7)',
                    fontSize: '12px',
                    fontWeight: item === 'component library' ? '600' : '500',
                    letterSpacing: '0.1em',
                    textDecoration: 'none',
                    padding: '1px 0',
                    transition: 'color 0.25s ease-in-out',
                    opacity: isExpanded ? 1 : 0,
                    transitionDelay: isExpanded ? `${idx * 0.05}s` : '0s'
                  }}
                  onMouseEnter={(e) => {
                    if (item !== 'component library') {
                      e.target.style.color = '#EECF00';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (item !== 'component library') {
                      e.target.style.color = 'rgba(255,255,255,0.7)';
                    }
                  }}
                  >{item}</a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      position: 'relative',
      overflow: 'auto',
      margin: 0,
      padding: 0,
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* FOUNDATION BACKGROUND LAYER - WHITE BASE */}
      <div
        className="foundation-background-layer"
        data-layer="foundation"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#FFFFFF',
          zIndex: -1000,
          pointerEvents: 'none'
        }}
        aria-hidden="true"
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 0.96; }
        }
        @keyframes slideInStagger {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes buttonFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .menu-item-1 { animation: slideInStagger 0.4s ease-out 0.1s both; }
        .menu-item-2 { animation: slideInStagger 0.4s ease-out 0.2s both; }
        .menu-item-3 { animation: slideInStagger 0.4s ease-out 0.3s both; }
        .menu-item-4 { animation: slideInStagger 0.4s ease-out 0.4s both; }
        .menu-button-5 { animation: buttonFadeIn 0.4s ease-out 0.6s both; }
        .menu-button-6 { animation: buttonFadeIn 0.4s ease-out 0.7s both; }

        .menu-link {
          color: black;
          transition: color 0.3s ease-in;
        }
        .menu-link:hover {
          color: white !important;
        }

        .works-btn {
          transition: background-color 0.3s ease-in;
        }
        .works-btn:hover {
          background-color: rgba(0,0,0,1) !important;
        }
        .works-btn:hover .works-text {
          color: #EECF00 !important;
          transition: color 0.3s ease-in;
        }

        .contact-btn {
          transition: background-color 0.3s ease-in;
        }
        .contact-btn:hover {
          background-color: white !important;
        }
      `}</style>

      {/* Dark mode enhanced gradient background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #111111 100%)',
        zIndex: 10
      }}></div>

      {/* Dark mode subtle texture overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(circle at 30% 20%, rgba(238, 207, 0, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(251, 191, 36, 0.05) 0%, transparent 50%)',
        zIndex: 11
      }}></div>

      {/* Yellow Circle with Parallax */}
      <div style={{
        position: 'fixed',
        top: `calc(20% + ${parallaxY}px)`,
        left: `calc(38% + ${parallaxX}px)`,
        width: '300px',
        height: '300px',
        backgroundColor: '#fbbf24',
        borderRadius: '50%',
        zIndex: 20,
        mixBlendMode: 'multiply',
        transition: 'all 0.1s ease-out',
        boxShadow: '0 20px 60px rgba(251,191,36,0.2)'
      }}></div>

      {/* Navigation Bar */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: '4.7vw',
        paddingRight: '40px'
      }}>
        <a
          href="#"
          onClick={handleHomeClick}
          style={{
            backgroundColor: 'black',
            padding: '10px 20px',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            textDecoration: 'none',
            cursor: 'pointer'
          }}
        >
          <h1 style={{
            fontSize: '16px',
            fontWeight: '600',
            letterSpacing: '0.2em',
            margin: 0
          }}>
            <span style={{ color: '#fbbf24', fontStyle: 'italic' }}>yellow</span>
            <span style={{ color: 'white' }}>CIRCLE</span>
          </h1>
        </a>
      </nav>

      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: sidebarOpen ? 'min(30vw, 450px)' : '80px',
        height: '100vh',
        backgroundColor: 'rgba(30, 30, 30, 0.96)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 50,
        transition: 'width 0.5s ease-out',
      }}>

        <div
          className="clickable-element"
          onClick={handleSidebarToggle}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleSidebarToggle();
          }}
          style={{
            position: 'absolute',
            top: '20px',
            left: '40px',
            transform: 'translateX(-50%)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            width: '40px',
            height: '40px',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 16 16">
            <path d="M14 2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h12zM2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2z"/>
            <path d="M3 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4z"/>
          </svg>
        </div>

        <div style={{
          position: 'absolute',
          top: '100px',
          left: '40px',
          transform: 'translateX(-50%) rotate(-90deg)',
          transformOrigin: 'center',
          whiteSpace: 'nowrap'
        }}>
          <span style={{
            color: '#EECF00',
            fontWeight: '600',
            letterSpacing: '0.3em',
            fontSize: '14px'
          }}>COMPONENT LIBRARY</span>
        </div>

        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            transform: 'translateY(-50%)',
            width: '100%',
            height: '240px'
          }}
        >
          {navigationItems.map((item, index) => (
            <NavigationItem
              key={item.itemKey}
              {...item}
              index={index}
              sidebarOpen={sidebarOpen}
              expandedSection={expandedSection}
              setExpandedSection={setExpandedSection}
              setSidebarOpen={setSidebarOpen}
            />
          ))}
        </div>

        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(40px, 8vw)',
          height: 'min(40px, 8vw)',
          minWidth: '30px',
          minHeight: '30px',
          borderRadius: '50%',
          overflow: 'hidden'
        }}>
          <img
            src="https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494388/yc-logo_xbntno.png"
            alt="YC Logo"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        position: 'fixed',
        left: isMobile ? 0 : (sidebarOpen ? 'min(30vw, 450px)' : '80px'),
        top: '0',
        right: '0',
        bottom: '0',
        overflowY: 'auto',
        transition: 'left 0.5s ease-out',
        zIndex: 30,
        backgroundColor: 'rgba(20, 20, 20, 0.95)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}>
        {/* Header Section */}
        <div style={{
          padding: '100px 40px 40px 40px',
          borderBottom: '1px solid rgba(238, 207, 0, 0.2)'
        }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3.5rem)',
            fontWeight: '700',
            color: 'white',
            marginBottom: '16px',
            letterSpacing: '0.02em'
          }}>
            <span style={{ color: '#EECF00' }}>COMPONENT</span> LIBRARY
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 1.5vw, 1.2rem)',
            color: 'rgba(255,255,255,0.7)',
            maxWidth: '600px',
            lineHeight: '1.6',
            marginBottom: '32px'
          }}>
            A comprehensive collection of reusable components for building consistent,
            professional interfaces across multiple brands and projects.
          </p>

          {/* Library Filter Tabs */}
          <div style={{
            background: 'rgba(40, 40, 40, 0.6)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <LibraryFilter
              activeLibrary={activeLibrary}
              onLibraryChange={setActiveLibrary}
              showDescriptions={false}
              layout="pills"
            />
          </div>

          {/* Search and Controls */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <div style={{ flex: '1', minWidth: '300px' }}>
              <input
                type="text"
                placeholder="Search components..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid rgba(238, 207, 0, 0.3)',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  transition: 'border-color 0.3s ease'
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = '#EECF00'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(238, 207, 0, 0.3)'}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: selectedCategory === category ? '#EECF00' : 'rgba(0,0,0,0.1)',
                    color: selectedCategory === category ? 'black' : 'rgba(0,0,0,0.7)'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategory !== category) {
                      e.target.style.backgroundColor = 'rgba(238, 207, 0, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== category) {
                      e.target.style.backgroundColor = 'rgba(0,0,0,0.1)';
                    }
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex',
            gap: '24px',
            fontSize: '14px',
            color: 'rgba(0,0,0,0.6)'
          }}>
            <span>Total: {allComponents.length}</span>
            <span>Filtered: {filteredComponents.length}</span>
            <span>Categories: {categories.length - 1}</span>
          </div>
        </div>

        {/* Component Grid */}
        <div style={{
          padding: '40px'
        }}>
          {filteredComponents.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'rgba(0,0,0,0.6)'
            }}>
              <div style={{
                fontSize: '24px',
                marginBottom: '8px'
              }}>No components found</div>
              <div style={{
                fontSize: '16px'
              }}>
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No components available for this library'
                }
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '24px'
            }}>
              {filteredComponents.map((component) => (
                <div key={component.id} style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(238, 207, 0, 0.2)',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                  e.currentTarget.style.borderColor = '#EECF00';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(238, 207, 0, 0.2)';
                }}>
                  <ComponentCard
                    title={component.title}
                    description={component.description}
                    category={component.category}
                    tags={component.tags}
                    component={component.component}
                    codeExample={component.codeExample}
                    props={component.props}
                    library={activeLibrary}
                    onPreview={handlePreview}
                    className="border-0 shadow-none bg-transparent p-0"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hamburger Menu */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          position: 'fixed',
          right: '50px',
          top: '20px',
          padding: '10px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          zIndex: 100
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '18px',
          position: 'relative'
        }}>
          {[0, 1, 2].map((index) => (
            <div key={index} style={{
              position: 'absolute',
              top: '50%',
              left: index === 1 ? '60%' : '50%',
              width: '40px',
              height: '3px',
              backgroundColor: 'black',
              transformOrigin: 'center',
              transform: menuOpen
                ? index === 0
                  ? 'translate(-50%, -50%) rotate(45deg)'
                  : index === 2
                    ? 'translate(-50%, -50%) rotate(-45deg)'
                    : 'translate(-50%, -50%)'
                : `translate(-50%, -50%) translateY(${(index - 1) * 6}px)`,
              opacity: menuOpen && index === 1 ? 0 : 1,
              transition: 'all 0.3s ease'
            }}></div>
          ))}
        </div>
      </button>

      {/* Menu Overlay */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#EECF00',
          opacity: 0.96,
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}>
            {['HOME', 'EXPERIMENTS', 'THOUGHTS', 'ABOUT'].map((item, index) => (
              <a key={item}
                href="#"
                onClick={item === 'HOME' ? handleHomeClick : undefined}
                className={`menu-item-${index + 1} menu-link`}
                style={{
                  textDecoration: 'none',
                  fontSize: '20px',
                  fontWeight: '600',
                  letterSpacing: '0.3em',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  color: 'black'
                }}
              >
                {item}
              </a>
            ))}

            <div className="menu-button-5 works-btn" style={{
              backgroundColor: 'rgba(0,0,0,0.1)',
              padding: '15px 40px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              <span className="works-text" style={{
                color: 'black',
                fontSize: '20px',
                fontWeight: '600',
                letterSpacing: '0.3em',
                transition: 'color 0.3s ease-in'
              }}>WORKS</span>
            </div>

            <div className="menu-button-6 contact-btn"
              onClick={handleFooterToggle}
              style={{
                border: '2px solid black',
                padding: '15px 40px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <span style={{
                color: 'black',
                fontSize: '20px',
                fontWeight: '600',
                letterSpacing: '0.3em'
              }}>CONTACT</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        position: 'fixed',
        bottom: footerOpen ? '0' : '-290px',
        left: '0',
        right: '0',
        height: '300px',
        zIndex: 60,
        transition: 'bottom 0.5s ease-out'
      }}>
        <div
          onClick={handleFooterToggle}
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            display: 'flex',
            cursor: footerOpen ? 'default' : 'pointer'
          }}
        >
          <div style={{
            flex: '1',
            backgroundColor: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
          }}>
            <h2 style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: '600',
              letterSpacing: '0.3em',
              margin: '0 0 20px 0',
              borderBottom: '2px solid white',
              paddingBottom: '10px'
            }}>CONTACT</h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              <a href="#" style={{
                color: 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}
              >EMAIL@YELLOWCIRCLE.IO</a>

              <a href="#" style={{
                color: 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}
              >LINKEDIN</a>

              <a href="#" style={{
                color: 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}
              >TWITTER</a>
            </div>
          </div>

          <div style={{
            flex: '1',
            backgroundColor: '#EECF00',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
          }}>
            <h2 style={{
              color: 'black',
              fontSize: '24px',
              fontWeight: '600',
              letterSpacing: '0.3em',
              margin: '0 0 20px 0',
              borderBottom: '2px solid black',
              paddingBottom: '10px'
            }}>PROJECTS</h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              <a href="#" style={{
                color: 'rgba(0,0,0,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'black'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(0,0,0,0.8)'}
              >COMPONENT LIBRARY</a>

              <a href="#" style={{
                color: 'rgba(0,0,0,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'black'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(0,0,0,0.8)'}
              >GOLDEN UNKNOWN</a>

              <a href="#" style={{
                color: 'rgba(0,0,0,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'black'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(0,0,0,0.8)'}
              >RHO CONSULTING</a>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewComponent && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-full max-h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {previewComponent.title} - Full Preview
              </h3>
              <button
                onClick={closePreview}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors duration-200"
              >
                Close
              </button>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <EmailPreviewFrame>
                {previewComponent.component}
              </EmailPreviewFrame>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComponentLibraryPage;