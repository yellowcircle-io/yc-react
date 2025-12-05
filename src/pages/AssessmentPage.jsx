import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../styles/constants';
import { navigationItems } from '../config/navigationItems';
import { submitAssessment } from '../utils/formSubmit';
import { sendLeadCapture } from '../config/integrations';

// Category to Service mapping for recommendations
const CATEGORY_SERVICE_MAP = {
  'Data Architecture': {
    service: 'Data Architecture Assessment',
    serviceId: 'data-architecture',
    price: '$3,000 - $4,000'
  },
  'Attribution': {
    service: 'Attribution System Audit',
    serviceId: 'attribution-audit',
    price: '$2,000 - $3,000'
  },
  'Marketing Automation': {
    service: 'Marketing Systems Audit',
    serviceId: 'marketing-systems',
    price: '$2,500 - $4,000'
  },
  'Integration Health': {
    service: 'Technical Debt Quantification',
    serviceId: 'technical-debt',
    price: '$2,500 - $3,500'
  },
  'Team Alignment': {
    service: 'Hire-or-Build Assessment',
    serviceId: 'role-alignment',
    price: '$1,500 - $2,500'
  },
  'Technical Debt': {
    service: 'Technical Debt Quantification',
    serviceId: 'technical-debt',
    price: '$2,500 - $3,500'
  },
  'Reporting': {
    service: 'Marketing Systems Audit',
    serviceId: 'marketing-systems',
    price: '$2,500 - $4,000'
  },
  'Sales-Marketing Alignment': {
    service: 'Growth Infrastructure Audit',
    serviceId: 'gtm-audit',
    price: '$4,000 - $5,000'
  }
};

/**
 * GTM Health Assessment - Interactive Quiz
 *
 * Captures lead information while providing value
 * Surfaces pain points before discovery call
 */

const QUESTIONS = [
  {
    id: 'data-lag',
    category: 'Data Architecture',
    question: 'How long does it take for a lead to sync from your website form to your CRM?',
    options: [
      { value: 5, label: 'Under 5 minutes', score: 'healthy' },
      { value: 3, label: '5-30 minutes', score: 'warning' },
      { value: 1, label: '30+ minutes or batch/daily sync', score: 'critical' },
      { value: 0, label: "I don't know", score: 'unknown' }
    ]
  },
  {
    id: 'attribution',
    category: 'Attribution',
    question: 'If asked "which channel drove last month\'s revenue," how confident are you in your answer?',
    options: [
      { value: 5, label: 'Very confident - single source of truth', score: 'healthy' },
      { value: 3, label: 'Somewhat confident - multiple reports exist', score: 'warning' },
      { value: 1, label: 'Not confident - everyone has different numbers', score: 'critical' },
      { value: 0, label: 'We don\'t track this', score: 'unknown' }
    ]
  },
  {
    id: 'workflows',
    category: 'Marketing Automation',
    question: 'How many active workflows/automations do you have in your marketing platform?',
    options: [
      { value: 5, label: 'Under 50, all documented', score: 'healthy' },
      { value: 3, label: '50-150, some documentation', score: 'warning' },
      { value: 1, label: '150+, limited documentation', score: 'critical' },
      { value: 2, label: "I don't know the exact number", score: 'unknown' }
    ]
  },
  {
    id: 'integration-errors',
    category: 'Integration Health',
    question: 'How often do you see sync errors between your CRM and marketing tools?',
    options: [
      { value: 5, label: 'Rarely (less than 1% of records)', score: 'healthy' },
      { value: 3, label: 'Sometimes (1-5% of records)', score: 'warning' },
      { value: 1, label: 'Frequently (5%+ of records)', score: 'critical' },
      { value: 0, label: "We don't monitor this", score: 'unknown' }
    ]
  },
  {
    id: 'role-clarity',
    category: 'Team Alignment',
    question: 'Does your marketing ops person also handle creative, analytics, AND strategy?',
    options: [
      { value: 5, label: 'No - roles are clearly defined', score: 'healthy' },
      { value: 3, label: 'Some overlap, but manageable', score: 'warning' },
      { value: 1, label: 'Yes - one person does everything', score: 'critical' },
      { value: 2, label: "We don't have dedicated marketing ops", score: 'unknown' }
    ]
  },
  {
    id: 'tech-debt',
    category: 'Technical Debt',
    question: 'When was the last time someone audited your unused workflows, fields, or integrations?',
    options: [
      { value: 5, label: 'Within the last 6 months', score: 'healthy' },
      { value: 3, label: '6-12 months ago', score: 'warning' },
      { value: 1, label: 'Over a year ago or never', score: 'critical' },
      { value: 0, label: "I don't know", score: 'unknown' }
    ]
  },
  {
    id: 'reporting',
    category: 'Reporting',
    question: 'How long does it take to pull a campaign performance report?',
    options: [
      { value: 5, label: 'Minutes - dashboards are ready', score: 'healthy' },
      { value: 3, label: 'Hours - some manual work needed', score: 'warning' },
      { value: 1, label: 'Days - significant manual effort', score: 'critical' },
      { value: 0, label: "We don't have standardized reports", score: 'unknown' }
    ]
  },
  {
    id: 'handoff',
    category: 'Sales-Marketing Alignment',
    question: 'How would you describe the lead handoff from marketing to sales?',
    options: [
      { value: 5, label: 'Smooth - clear SLA and process', score: 'healthy' },
      { value: 3, label: 'Okay - occasional friction', score: 'warning' },
      { value: 1, label: 'Painful - constant complaints', score: 'critical' },
      { value: 0, label: 'No formal handoff process', score: 'unknown' }
    ]
  }
];

const RESULTS_CONFIG = {
  healthy: {
    range: [32, 40],
    title: 'Your GTM is in Good Shape',
    color: '#22c55e',
    description: 'Your marketing operations foundation is solid. Focus on optimization and scaling.',
    recommendation: 'Consider a targeted audit to identify hidden efficiency gains.'
  },
  warning: {
    range: [20, 31],
    title: 'Room for Improvement',
    color: COLORS.yellow,
    description: 'You have a working system but there are gaps creating friction and inefficiency.',
    recommendation: 'A GTM Strategic Audit would help prioritize fixes and quantify the cost of inaction.'
  },
  critical: {
    range: [0, 19],
    title: 'Significant Infrastructure Gaps',
    color: '#ef4444',
    description: 'Your GTM infrastructure is creating drag on your team and limiting growth.',
    recommendation: 'Immediate assessment recommended. Technical debt is likely costing more than you realize.'
  }
};

function AssessmentPage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle, openContactModal } = useLayout();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [submitted, setSubmitted] = useState(false);

  // Calculate score
  const calculateScore = () => {
    return Object.values(answers).reduce((sum, val) => sum + val, 0);
  };

  const getResultLevel = (score) => {
    if (score >= 32) return 'healthy';
    if (score >= 20) return 'warning';
    return 'critical';
  };

  const handleAnswer = (value) => {
    const newAnswers = { ...answers, [QUESTIONS[currentQuestion].id]: value };
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Calculate category scores for recommendations
  const getCategoryScores = () => {
    const categoryScores = {};
    QUESTIONS.forEach(q => {
      if (!categoryScores[q.category]) {
        categoryScores[q.category] = { total: 0, count: 0, maxPossible: 0 };
      }
      categoryScores[q.category].total += answers[q.id] || 0;
      categoryScores[q.category].count += 1;
      categoryScores[q.category].maxPossible += 5;
    });
    return categoryScores;
  };

  // Get recommended services based on lowest scoring categories
  const getRecommendedServices = () => {
    const categoryScores = getCategoryScores();

    // Calculate percentage score for each category
    const categoryPercentages = Object.entries(categoryScores)
      .map(([category, data]) => ({
        category,
        percentage: (data.total / data.maxPossible) * 100,
        ...CATEGORY_SERVICE_MAP[category]
      }))
      .filter(item => item.serviceId) // Only categories with mapped services
      .sort((a, b) => a.percentage - b.percentage); // Sort by lowest score first

    // Return top 2 weakest areas (unique services)
    const seen = new Set();
    const recommendations = [];
    for (const item of categoryPercentages) {
      if (!seen.has(item.serviceId) && recommendations.length < 2) {
        seen.add(item.serviceId);
        recommendations.push(item);
      }
    }
    return recommendations;
  };

  const handleSubmitResults = async (e) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);

    try {
      const score = calculateScore();
      const level = getResultLevel(score);
      const categoryScores = getCategoryScores();
      const recommendations = getRecommendedServices().map(r => r.service);

      // Use shared form submission utility
      await submitAssessment({
        email,
        name,
        company,
        score,
        level,
        categoryScores,
        recommendations
      });

      // Send to n8n for Airtable + Slack automation (fire and forget)
      sendLeadCapture(
        { email, name, company, score, service: recommendations.join(', ') },
        'assessment',
        'Assessment Complete'
      );

      // Store in localStorage for Contact Modal autofill
      localStorage.setItem('yc_assessment_data', JSON.stringify({
        email,
        name,
        company,
        timestamp: new Date().toISOString()
      }));

      // Track conversion in Google Ads + GA4
      if (typeof gtag === 'function') {
        gtag('event', 'conversion', {
          'send_to': 'AW-17772974519/assessment',
          'event_category': 'assessment',
          'event_label': level,
          'value': score
        });
        gtag('event', 'generate_lead', {
          'event_category': 'assessment',
          'event_label': `score_${score}_${level}`
        });
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Assessment submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const handleStartOver = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setEmail('');
    setName('');
    setCompany('');
    setSubmitted(false);
  };

  const score = calculateScore();
  const level = getResultLevel(score);
  const result = RESULTS_CONFIG[level];
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  // Inject animations
  React.useEffect(() => {
    const styleId = 'assessment-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <Layout
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={navigationItems}
      pageLabel="ASSESSMENT"
    >
      {/* Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(255, 255, 255, 1) 50%, rgba(251, 191, 36, 0.1) 100%)',
        zIndex: 1
      }}></div>

      {/* Main Content */}
      <div style={{
        position: 'fixed',
        top: '80px',
        bottom: footerOpen ? '320px' : '40px',
        left: sidebarOpen ? 'min(35vw, 472px)' : '80px',
        right: 0,
        padding: isMobile ? '0 20px' : '0 80px',
        overflow: 'auto',
        zIndex: 61,
        transition: 'left 0.5s ease-out, bottom 0.5s ease-out'
      }}>
        <div style={{
          ...TYPOGRAPHY.container,
          maxWidth: '700px'
        }}>
          {/* Header */}
          <h1 style={{
            ...TYPOGRAPHY.h1,
            color: COLORS.yellow,
            ...EFFECTS.blurLight,
            display: 'inline-block',
            animation: 'fadeInUp 0.6s ease-in-out 0.2s both',
            marginBottom: '10px'
          }}>GTM HEALTH CHECK</h1>

          <p style={{
            ...TYPOGRAPHY.body,
            backgroundColor: COLORS.backgroundLight,
            ...EFFECTS.blur,
            display: 'inline-block',
            padding: '4px 8px',
            animation: 'fadeInUp 0.6s ease-in-out 0.4s both',
            marginBottom: '30px'
          }}>
            8 questions to diagnose your go-to-market infrastructure
          </p>

          {!showResults ? (
            /* Question View */
            <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
              {/* Progress Bar */}
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: '4px',
                height: '8px',
                marginBottom: '30px',
                overflow: 'hidden'
              }}>
                <div style={{
                  backgroundColor: COLORS.yellow,
                  height: '100%',
                  width: `${progress}%`,
                  transition: 'width 0.3s ease-out',
                  borderRadius: '4px'
                }}></div>
              </div>

              {/* Question */}
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.9)',
                borderRadius: '12px',
                padding: isMobile ? '16px' : '30px',
                marginBottom: isMobile ? '12px' : '20px'
              }}>
                <p style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: COLORS.yellow,
                  letterSpacing: '0.15em',
                  marginBottom: '12px',
                  textTransform: 'uppercase'
                }}>
                  {QUESTIONS[currentQuestion].category} • Question {currentQuestion + 1} of {QUESTIONS.length}
                </p>
                <h2 style={{
                  fontSize: 'clamp(18px, 3vw, 24px)',
                  fontWeight: '600',
                  color: 'white',
                  lineHeight: '1.4',
                  margin: 0
                }}>
                  {QUESTIONS[currentQuestion].question}
                </h2>
              </div>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {QUESTIONS[currentQuestion].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(option.value)}
                    style={{
                      padding: isMobile ? '14px 16px' : '16px 20px',
                      minHeight: '44px',
                      backgroundColor: 'white',
                      border: '2px solid rgba(0,0,0,0.1)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: isMobile ? '14px' : '15px',
                      fontWeight: '500',
                      color: 'black',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = COLORS.yellow;
                      e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.1)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Back Button */}
              {currentQuestion > 0 && (
                <button
                  onClick={handleBack}
                  style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'rgba(0,0,0,0.5)',
                    letterSpacing: '0.05em'
                  }}
                >
                  ← PREVIOUS QUESTION
                </button>
              )}
            </div>
          ) : (
            /* Results View */
            <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
              {/* Score Card */}
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.9)',
                borderRadius: '12px',
                padding: isMobile ? '20px' : '30px',
                marginBottom: isMobile ? '16px' : '24px',
                textAlign: 'center'
              }}>
                <div style={{
                  width: isMobile ? '80px' : '100px',
                  height: isMobile ? '80px' : '100px',
                  borderRadius: '50%',
                  backgroundColor: result.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: isMobile ? '0 auto 16px' : '0 auto 20px',
                  animation: 'pulse 2s ease-in-out infinite'
                }}>
                  <span style={{
                    fontSize: isMobile ? '24px' : '32px',
                    fontWeight: '700',
                    color: level === 'warning' ? 'black' : 'white'
                  }}>{score}</span>
                </div>
                <p style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.1em',
                  marginBottom: '8px'
                }}>
                  OUT OF 40 POINTS
                </p>
                <h2 style={{
                  fontSize: 'clamp(20px, 4vw, 28px)',
                  fontWeight: '700',
                  color: result.color,
                  margin: '0 0 12px 0'
                }}>
                  {result.title}
                </h2>
                <p style={{
                  fontSize: '15px',
                  color: 'rgba(255,255,255,0.8)',
                  lineHeight: '1.5',
                  maxWidth: '500px',
                  margin: '0 auto'
                }}>
                  {result.description}
                </p>
              </div>

              {/* Recommendation */}
              <div style={{
                backgroundColor: 'rgba(251, 191, 36, 0.15)',
                border: `2px solid ${COLORS.yellow}`,
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <p style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: COLORS.yellow,
                  letterSpacing: '0.1em',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>
                  RECOMMENDATION
                </p>
                <p style={{
                  fontSize: '15px',
                  color: 'black',
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  {result.recommendation}
                </p>
              </div>

              {/* Email Capture */}
              {!submitted ? (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: 'black',
                    marginBottom: '8px'
                  }}>
                    Get Your Full Report
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: 'rgba(0,0,0,0.6)',
                    marginBottom: '20px'
                  }}>
                    We'll send a detailed breakdown with specific recommendations.
                  </p>

                  <form onSubmit={handleSubmitResults}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Work email *"
                        required
                        style={{
                          padding: '12px 16px',
                          fontSize: '15px',
                          border: '2px solid rgba(0,0,0,0.1)',
                          borderRadius: '6px',
                          outline: 'none'
                        }}
                      />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        style={{
                          padding: '12px 16px',
                          fontSize: '15px',
                          border: '2px solid rgba(0,0,0,0.1)',
                          borderRadius: '6px',
                          outline: 'none'
                        }}
                      />
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Company"
                        style={{
                          padding: '12px 16px',
                          fontSize: '15px',
                          border: '2px solid rgba(0,0,0,0.1)',
                          borderRadius: '6px',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        style={{
                          padding: '14px 24px',
                          backgroundColor: COLORS.yellow,
                          color: 'black',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '700',
                          letterSpacing: '0.05em',
                          cursor: 'pointer',
                          opacity: submitting ? 0.7 : 1
                        }}
                      >
                        {submitting ? 'SENDING...' : 'GET MY REPORT'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  border: '2px solid #22c55e',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: '#22c55e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: '24px',
                    color: 'white'
                  }}>✓</div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: 'black',
                    marginBottom: '8px'
                  }}>
                    Report Sent!
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: 'rgba(0,0,0,0.6)',
                    marginBottom: '20px'
                  }}>
                    Check your inbox for your detailed GTM assessment.
                  </p>

                  {/* Recommended Services based on assessment */}
                  {getRecommendedServices().length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <p style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        letterSpacing: '0.05em',
                        color: 'rgba(0,0,0,0.5)',
                        marginBottom: '12px'
                      }}>
                        RECOMMENDED FOR YOU:
                      </p>
                      {getRecommendedServices().map((rec, idx) => (
                        <div
                          key={idx}
                          onClick={() => navigate(`/services/${rec.serviceId}`)}
                          style={{
                            padding: '12px 16px',
                            backgroundColor: idx === 0 ? COLORS.yellow : 'rgba(0,0,0,0.05)',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            cursor: 'pointer',
                            transition: 'transform 0.2s ease'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <p style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: 'black',
                                margin: '0 0 4px 0'
                              }}>
                                {rec.service}
                              </p>
                              <p style={{
                                fontSize: '12px',
                                color: 'rgba(0,0,0,0.6)',
                                margin: 0
                              }}>
                                Addresses: {rec.category}
                              </p>
                            </div>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: 'black'
                            }}>
                              {rec.price} →
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => openContactModal(email)}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: 'black',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '700',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    SCHEDULE A CALL
                  </button>
                </div>
              )}

              {/* Start Over */}
              <button
                onClick={handleStartOver}
                style={{
                  marginTop: '20px',
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'rgba(0,0,0,0.5)',
                  letterSpacing: '0.05em',
                  display: 'block'
                }}
              >
                ← START OVER
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default AssessmentPage;
