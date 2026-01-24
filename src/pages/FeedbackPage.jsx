import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../styles/constants';
import { logEvent, analytics } from '../config/firebase';
import { navigationItems } from '../config/navigationItems';

function FeedbackPage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle } = useLayout();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Mobile detection
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'bug',
    message: '',
    browser: '',
    device: '',
    // UTM tracking
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    utm_term: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Detect browser, device, and capture UTM parameters
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

    // Capture UTM parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams = {
      utm_source: urlParams.get('utm_source') || '',
      utm_medium: urlParams.get('utm_medium') || '',
      utm_campaign: urlParams.get('utm_campaign') || '',
      utm_content: urlParams.get('utm_content') || '',
      utm_term: urlParams.get('utm_term') || ''
    };

    setFormData(prev => ({
      ...prev,
      browser: detectBrowser(),
      device: detectDevice(),
      ...utmParams
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
          browser: formData.browser,
          utm_source: formData.utm_source,
          utm_medium: formData.utm_medium,
          utm_campaign: formData.utm_campaign
        });
      }

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
          top: '80px',
          bottom: footerOpen ? '320px' : '40px',
          left: isMobile ? 0 : (sidebarOpen ? 'min(35vw, 472px)' : '80px'),
          right: 0,
          padding: isMobile ? '0 20px' : '0 80px',
          display: 'flex',
          alignItems: 'center',
          zIndex: 61,
          transition: 'left 0.5s ease-out, bottom 0.5s ease-out'
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
        top: '80px',
        bottom: footerOpen ? '320px' : '40px',
        left: isMobile ? 0 : (sidebarOpen ? 'min(35vw, 472px)' : '80px'),
        right: 0,
        padding: isMobile ? '0 20px' : '0 80px',
        zIndex: 61,
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'left 0.5s ease-out, bottom 0.5s ease-out'
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
                  maxWidth: '500px',
                  padding: '12px 14px',
                  border: '1px solid rgba(0,0,0,0.3)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  backgroundColor: 'white',
                  boxSizing: 'border-box',
                  color: COLORS.black
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
                  maxWidth: '500px',
                  padding: '12px 14px',
                  border: '1px solid rgba(0,0,0,0.3)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  backgroundColor: 'white',
                  boxSizing: 'border-box',
                  color: COLORS.black
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
                  maxWidth: '500px',
                  padding: '12px 14px',
                  border: '1px solid rgba(0,0,0,0.3)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  backgroundColor: 'white',
                  boxSizing: 'border-box',
                  color: COLORS.black,
                  cursor: 'pointer'
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
                  maxWidth: '500px',
                  padding: '12px 14px',
                  border: '1px solid rgba(0,0,0,0.3)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  backgroundColor: 'white',
                  boxSizing: 'border-box',
                  color: COLORS.black
                }}
                placeholder="Please describe your feedback in detail..."
              />
            </div>

            <div style={{
              backgroundColor: 'rgba(251, 191, 36, 0.15)',
              padding: '16px',
              borderRadius: '6px',
              marginBottom: '24px',
              fontSize: '12px',
              color: COLORS.black,
              maxWidth: '500px',
              boxSizing: 'border-box'
            }}>
              <strong>System Info:</strong><br />
              Browser: {formData.browser}<br />
              Device: {formData.device}
            </div>

            {/* Hidden UTM tracking fields */}
            <input type="hidden" name="utm_source" value={formData.utm_source} />
            <input type="hidden" name="utm_medium" value={formData.utm_medium} />
            <input type="hidden" name="utm_campaign" value={formData.utm_campaign} />
            <input type="hidden" name="utm_content" value={formData.utm_content} />
            <input type="hidden" name="utm_term" value={formData.utm_term} />

            <button
              type="submit"
              disabled={submitting || !formData.message.trim()}
              style={{
                width: '100%',
                maxWidth: '500px',
                backgroundColor: formData.message.trim() ? COLORS.yellow : '#ccc',
                color: COLORS.black,
                padding: '14px 24px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '15px',
                fontWeight: '600',
                cursor: formData.message.trim() ? 'pointer' : 'not-allowed',
                transition: 'transform 0.2s ease, background-color 0.2s ease',
                boxSizing: 'border-box'
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
