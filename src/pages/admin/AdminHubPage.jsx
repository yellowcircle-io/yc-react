/**
 * Admin Hub Page
 *
 * Central dashboard for all yellowCircle admin tools.
 * Provides quick access to all admin functionality.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/global/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { adminNavigationItems } from '../../config/adminNavigationItems';
import {
  FileText,
  Users,
  Zap,
  Link2,
  Settings,
  BarChart3,
  Home,
  ExternalLink,
  Shield,
  Map,
  Brain,
  Mail,
  Trash2,
  Bookmark
} from 'lucide-react';

// ============================================================
// Brand Colors (yellowCircle)
// ============================================================
const COLORS = {
  primary: '#fbbf24',
  primaryDark: '#d4a000',
  text: '#171717',
  textMuted: '#737373',
  textLight: '#a3a3a3',
  border: 'rgba(0, 0, 0, 0.1)',
  white: '#ffffff',
  cardBg: '#fafafa'
};

// ============================================================
// Admin Tools Configuration
// ============================================================
const ADMIN_TOOLS = [
  {
    id: 'articles',
    title: 'Articles',
    description: 'Manage blog posts and thought leadership content',
    icon: FileText,
    route: '/admin/articles',
    color: '#f59e0b',
    bgColor: '#fef3c7'
  },
  {
    id: 'contacts',
    title: 'Contacts',
    description: 'View and manage contacts and lead submissions',
    icon: Users,
    route: '/admin/contacts',
    color: '#3b82f6',
    bgColor: '#dbeafe'
  },
  {
    id: 'triggers',
    title: 'Trigger Rules',
    description: 'Configure automation rules for lead processing',
    icon: Zap,
    route: '/admin/trigger-rules',
    color: '#8b5cf6',
    bgColor: '#ede9fe'
  },
  {
    id: 'shortlinks',
    title: 'Shortlinks',
    description: 'Create and manage URL shortlinks with tracking',
    icon: Link2,
    route: '/shortlinks',
    color: '#10b981',
    bgColor: '#d1fae5'
  },
  {
    id: 'unity-notes',
    title: 'UnityNOTES',
    description: 'Visual canvas for notes and journey mapping',
    icon: Brain,
    route: '/unity-notes',
    color: '#ec4899',
    bgColor: '#fce7f3'
  },
  {
    id: 'unity-map',
    title: 'UnityMAP',
    description: 'Machine-assisted email outreach and templates',
    icon: Mail,
    route: '/outreach',
    color: '#06b6d4',
    bgColor: '#cffafe'
  },
  {
    id: 'journeys',
    title: 'Journeys',
    description: 'Email journey builder and automation flows',
    icon: Map,
    route: '/journeys',
    color: '#84cc16',
    bgColor: '#ecfccb'
  },
  {
    id: 'storage-cleanup',
    title: 'Storage Cleanup',
    description: 'View collection stats and clean up old Firestore data',
    icon: Trash2,
    route: '/admin/storage-cleanup',
    color: '#ef4444',
    bgColor: '#fee2e2'
  },
  {
    id: 'link-saver',
    title: 'Link Saver',
    description: 'Save and organize links - Pocket alternative with AI summaries',
    icon: Bookmark,
    route: '/links',
    color: '#f97316',
    bgColor: '#ffedd5'
  }
];

// ============================================================
// Styles
// ============================================================
const styles = {
  card: {
    backgroundColor: COLORS.white,
    border: `2px solid ${COLORS.border}`,
    borderRadius: '16px',
    padding: '24px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};

const AdminHubPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/unity-notes');
    }
  }, [authLoading, isAdmin, navigate]);

  // Layout callbacks
  const handleHomeClick = () => navigate('/');

  if (authLoading) {
    return (
      <Layout
        hideParallaxCircle={true}
        hideCircleNav={true}
        sidebarVariant="standard"
        allowScroll={true}
        pageLabel="ADMIN HUB"
        navigationItems={adminNavigationItems}
        onHomeClick={handleHomeClick}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: COLORS.white,
          paddingTop: '80px',
          paddingLeft: '100px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: `3px solid ${COLORS.border}`,
            borderTopColor: COLORS.primary,
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout
      hideParallaxCircle={true}
      hideCircleNav={true}
      sidebarVariant="standard"
      allowScroll={true}
      pageLabel="ADMIN HUB"
      navigationItems={adminNavigationItems}
      onHomeClick={handleHomeClick}
    >
      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .admin-hub-container {
            padding: 80px 16px 16px 16px !important;
          }
        }
        @media (max-width: 480px) {
          .admin-hub-container {
            padding: 70px 12px 12px 12px !important;
          }
        }
      `}</style>
      <div className="admin-hub-container" style={{
        minHeight: '100vh',
        backgroundColor: COLORS.white,
        padding: '100px 40px 40px 120px'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '40px'
          }}>
            <div>
              <h1 style={{
                color: COLORS.text,
                fontSize: '32px',
                fontWeight: '700',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Shield style={{ color: COLORS.primary }} size={32} />
                Admin Hub
              </h1>
              <p style={{
                color: COLORS.textMuted,
                fontSize: '16px',
                marginTop: '8px'
              }}>
                Manage yellowCircle tools and content
              </p>
            </div>

            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '8px',
                border: `2px solid ${COLORS.border}`,
                backgroundColor: COLORS.cardBg,
                color: COLORS.text,
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <Home size={18} />
              Back to Site
            </button>
          </div>

          {/* Welcome Card */}
          <div style={{
            backgroundColor: COLORS.primary,
            borderRadius: '16px',
            padding: '28px 32px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h2 style={{
                color: '#000',
                fontSize: '20px',
                fontWeight: '600',
                margin: '0 0 8px 0'
              }}>
                Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'Admin'}
              </h2>
              <p style={{
                color: 'rgba(0,0,0,0.7)',
                fontSize: '14px',
                margin: 0
              }}>
                Select a tool below to get started
              </p>
            </div>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BarChart3 size={28} style={{ color: '#000' }} />
            </div>
          </div>

          {/* Tools Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {ADMIN_TOOLS.map(tool => {
              const IconComponent = tool.icon;
              return (
                <div
                  key={tool.id}
                  onClick={() => navigate(tool.route)}
                  style={styles.card}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = tool.color;
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = `0 8px 24px ${tool.color}22`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = COLORS.border;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px'
                  }}>
                    <div style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '12px',
                      backgroundColor: tool.bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <IconComponent size={24} style={{ color: tool.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        color: COLORS.text,
                        fontSize: '18px',
                        fontWeight: '600',
                        margin: '0 0 6px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {tool.title}
                        <ExternalLink size={14} style={{ color: COLORS.textLight }} />
                      </h3>
                      <p style={{
                        color: COLORS.textMuted,
                        fontSize: '13px',
                        margin: 0,
                        lineHeight: '1.5'
                      }}>
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div style={{
            marginTop: '40px',
            padding: '24px',
            backgroundColor: COLORS.cardBg,
            borderRadius: '12px',
            border: `1px solid ${COLORS.border}`
          }}>
            <h3 style={{
              color: COLORS.textMuted,
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              margin: '0 0 16px 0'
            }}>
              Quick Access
            </h3>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <a
                href="/admin/articles/new"
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: COLORS.white,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.text,
                  fontSize: '13px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FileText size={14} /> New Article
              </a>
              <a
                href="/shortlinks"
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: COLORS.white,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.text,
                  fontSize: '13px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Link2 size={14} /> Create Shortlink
              </a>
              <a
                href="/directory"
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: COLORS.white,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.text,
                  fontSize: '13px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Settings size={14} /> Site Directory
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminHubPage;
