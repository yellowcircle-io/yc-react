import React, { useState } from 'react';
import { logEvent, analytics } from '../config/firebase';

const FeedbackPage = () => {
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
      // Log feedback event to analytics
      if (analytics) {
        logEvent(analytics, 'feedback_submitted', {
          category: formData.category,
          device: formData.device,
          browser: formData.browser
        });
      }

      // In a real implementation, you would send this to your backend/Firebase
      console.log('Feedback submitted:', formData);

      // For now, we'll just simulate a successful submission
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

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F2F2F2',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '500px',
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#EECF00',
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
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '12px',
            color: '#000'
          }}>
            Thank You!
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'rgba(0,0,0,0.7)',
            lineHeight: '1.6',
            marginBottom: '24px'
          }}>
            Your feedback has been received. We appreciate you taking the time to help us improve YellowCircle.
          </p>
          <button
            onClick={() => window.history.back()}
            style={{
              backgroundColor: '#EECF00',
              color: '#000',
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
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F2F2F2',
      padding: '40px 20px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          marginBottom: '8px',
          color: '#000'
        }}>
          Alpha Feedback
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'rgba(0,0,0,0.6)',
          marginBottom: '32px',
          lineHeight: '1.6'
        }}>
          Help us improve YellowCircle by sharing your experience. All fields are optional except your message.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '6px',
              color: '#000'
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
                fontFamily: 'inherit'
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
              color: '#000'
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
                fontFamily: 'inherit'
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
              color: '#000'
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
                backgroundColor: 'white'
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
              color: '#000'
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
                resize: 'vertical'
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
              backgroundColor: formData.message.trim() ? '#EECF00' : '#ccc',
              color: '#000',
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
      </div>
    </div>
  );
};

export default FeedbackPage;
