import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../styles/constants';
import { logEvent, analytics } from '../config/firebase';

function FeedbackPage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle } = useLayout();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'bug',
    message: '',
    browser: '',
    device: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Detect browser and device
  React.useEffect(() => {
    const detectBrowser = () => {
      const userAgent = navigator.userAgent;
      let browser = 'Unknown';
      if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Safari')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';
      return browser + ' ' + (userAgent.match(/\d+\.\d+/)?.[0] || '');
    };

    const detectDevice = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      return isMobile ? 'Mobile' : 'Desktop';
    };

    setFormData(prev => ({
      ...prev,
      browser: detectBrowser(),
      device: detectDevice()
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (analytics) {
        logEvent(analytics, 'feedback_submitted', {
          category: formData.category,
          device: formData.device,
          browser: formData.browser
        });
      }

      console.log('Feedback submitted:', formData);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSubmitted(true);
      setSubmitting(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitting(false);
      alert('Failed to submit feedback. Please try again or email us directly.');
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const navigationItems = [
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/history-edu_nuazpv.png",
      label: "STORIES",
      itemKey: "stories",
      subItems: [
        { label: "Projects", key: "projects", subItems: ["Brand Development", "Marketing Architecture", "Email Development"] },
        { label: "Golden Unknown", key: "golden-unknown" },
        { label: "Cath3dral", key: "cath3dral", subItems: ["Being + Rhyme"] },
        { label: "Thoughts", key: "thoughts" }
      ]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/test-tubes-lab_j4cie7.png",
      label: "LABS",
      itemKey: "labs",
      subItems: [
        { label: "UK-Memories", key: "uk-memories" },
        { label: "Home-17", key: "home-17" },
        { label: "Visual Noteboard", key: "visual-noteboard" },
        { label: "Component Library", key: "component-library" }
      ]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/face-profile_dxxbba.png",
      label: "ABOUT",
      itemKey: "about",
      subItems: []
    }
  ];

  if (submitted) {
    return (
      <Layout
        onHomeClick={handleHomeClick}
        onFooterToggle={handleFooterToggle}
        onMenuToggle={handleMenuToggle}
        navigationItems={navigationItems}
        pageLabel="FEEDBACK"
      >
        <div style={{
          position: 'fixed',
          top: '50%',
          left: sidebarOpen ? 'max(calc(min(35vw, 472px) + 100px), 15vw)' : 'max(200px, 15vw)',
          transform: 'translateY(-50%)',
          maxWidth: '500px',
          zIndex: 61,
          transition: 'left 0.5s ease-out'
        }}>
          <div style={{
            backgroundColor: COLORS.backgroundLight,
            ...EFFECTS.blur,
            padding: '40px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: COLORS.yellow,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '30px'
            }}>
              ✓
            </div>
            <h1 style={{
              ...TYPOGRAPHY.h2,
              marginBottom: '12px',
              color: COLORS.black
            }}>
              Thank You!
            </h1>
            <p style={{
              ...TYPOGRAPHY.body,
              marginBottom: '24px'
            }}>
              Your feedback has been received. We appreciate you taking the time to help us improve yellowCIRCLE.
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                backgroundColor: COLORS.yellow,
                color: COLORS.black,
                padding: '12px 24px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              Back to Site
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={navigationItems}
      pageLabel="FEEDBACK"
    >
      <div style={{
        position: 'fixed',
        top: '100px',
        bottom: footerOpen ? '400px' : '40px',
        left: sidebarOpen ? 'max(calc(min(35vw, 472px) + 20px), 12vw)' : 'max(100px, 8vw)',
        right: '100px',
        zIndex: 61,
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'left 0.5s ease-out, bottom 0.5s ease-out',
        paddingRight: '20px'
      }}>
        <div style={{
          ...TYPOGRAPHY.container,
          maxWidth: '600px'
        }}>
          <h1 style={{
            ...TYPOGRAPHY.h1Scaled,
            color: COLORS.yellow,
            ...EFFECTS.blurLight,
            display: 'inline-block',
            marginBottom: '10px'
          }}>
            FEEDBACK
          </h1>

          <p style={{
            ...TYPOGRAPHY.h2,
            color: COLORS.black,
            backgroundColor: COLORS.backgroundLight,
            ...EFFECTS.blur,
            display: 'inline-block',
            padding: '2px 6px',
            marginBottom: '32px'
          }}>
            Help us improve yellowCIRCLE
          </p>

          <form onSubmit={handleSubmit} style={{ marginBottom: '40px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '6px',
                color: COLORS.black
              }}>
                Name (optional)
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)'
                }}
                placeholder="Your name"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '6px',
                color: COLORS.black
              }}>
                Email (optional)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)'
                }}
                placeholder="your@email.com"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '6px',
                color: COLORS.black
              }}>
                Feedback Type
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)'
                }}
              >
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="ux">UX/Design Feedback</option>
                <option value="performance">Performance Issue</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '6px',
                color: COLORS.black
              }}>
                Your Feedback *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)'
                }}
                placeholder="Please describe your feedback in detail..."
              />
            </div>

            <div style={{
              backgroundColor: 'rgba(238, 207, 0, 0.1)',
              padding: '16px',
              borderRadius: '4px',
              marginBottom: '24px',
              fontSize: '12px',
              color: 'rgba(0,0,0,0.7)'
            }}>
              <strong>System Info:</strong><br />
              Browser: {formData.browser}<br />
              Device: {formData.device}
            </div>

            <button
              type="submit"
              disabled={submitting || !formData.message.trim()}
              style={{
                width: '100%',
                backgroundColor: formData.message.trim() ? COLORS.yellow : '#ccc',
                color: COLORS.black,
                padding: '14px 24px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '15px',
                fontWeight: '600',
                cursor: formData.message.trim() ? 'pointer' : 'not-allowed',
                transition: 'transform 0.2s ease, background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (formData.message.trim()) {
                  e.target.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>

          <div style={{ height: '80px' }}></div>
        </div>
      </div>
    </Layout>
  );
}

export default FeedbackPage;
