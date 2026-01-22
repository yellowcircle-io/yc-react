/**
 * UserMenu - Displays user avatar/login button and credits
 *
 * Shows:
 * - Login button when not authenticated
 * - User avatar, credits, and sign out when authenticated
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCredits } from '../../hooks/useCredits';
import { useNotifications } from '../../contexts/NotificationContext';
import AuthModal from './AuthModal';
import { Settings, Bookmark, Bell, Check, X, Shield, Map } from 'lucide-react';

const UserMenu = ({ compact = false, dropdownDirection = 'down' }) => {
  const navigate = useNavigate();
  const { user, userProfile, isAuthenticated, signOut, isAdmin } = useAuth();
  const { creditsRemaining, tier } = useCredits();
  const { notifications, unreadCount, markAsRead, dismissNotification } = useNotifications();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isAuthenticated) {
    return (
      <>
        <button
          onClick={() => setShowAuthModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: compact ? '6px 12px' : '8px 16px',
            backgroundColor: '#fbbf24',
            color: 'black',
            border: 'none',
            borderRadius: '8px',
            fontSize: compact ? '12px' : '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = '#f59e0b')}
          onMouseOut={(e) => (e.target.style.backgroundColor = '#fbbf24')}
        >
          Sign In
        </button>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* User Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px',
          paddingRight: '12px',
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          borderRadius: '24px',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.2)')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.1)')}
      >
        {/* Avatar */}
        {userProfile?.photoURL ? (
          <img
            src={userProfile.photoURL}
            alt={userProfile.displayName || 'User'}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '600',
              color: 'black'
            }}
          >
            {getInitials(userProfile?.displayName || user?.email)}
          </div>
        )}

        {/* Credits Badge */}
        <span
          style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#6b7280'
          }}
        >
          {tier === 'premium' ? (
            <span style={{ color: '#f59e0b' }}>PRO</span>
          ) : (
            `${creditsRemaining} credits`
          )}
        </span>

        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '18px',
              height: '18px',
              backgroundColor: '#ef4444',
              color: 'white',
              fontSize: '10px',
              fontWeight: '600',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid white'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999
            }}
            onClick={() => setShowDropdown(false)}
          />

          {/* Menu */}
          <div
            style={{
              position: 'absolute',
              ...(dropdownDirection === 'up'
                ? { bottom: '100%', marginBottom: '8px' }
                : { top: '100%', marginTop: '8px' }
              ),
              left: 0,
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
              minWidth: '200px',
              zIndex: 1000,
              overflow: 'hidden',
              animation: dropdownDirection === 'up' ? 'dropdownSlideUp 0.15s ease-out' : 'dropdownSlide 0.15s ease-out'
            }}
          >
            <style>{`
              @keyframes dropdownSlide {
                from { opacity: 0; transform: translateY(-8px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes dropdownSlideUp {
                from { opacity: 0; transform: translateY(8px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>

            {/* User Info */}
            <div
              style={{
                padding: '16px',
                borderBottom: '1px solid #f3f4f6'
              }}
            >
              <div style={{ fontWeight: '500', fontSize: '14px', marginBottom: '4px' }}>
                {userProfile?.displayName || 'User'}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{user?.email}</div>
            </div>

            {/* Credits */}
            <div
              style={{
                padding: '16px',
                borderBottom: '1px solid #f3f4f6',
                backgroundColor: 'rgba(251, 191, 36, 0.05)'
              }}
            >
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Credits</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#fbbf24'
                  }}
                >
                  {tier === 'premium' ? '∞' : creditsRemaining}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '500',
                    color: 'white',
                    backgroundColor: tier === 'premium' ? '#f59e0b' : '#6b7280',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    textTransform: 'uppercase'
                  }}
                >
                  {tier}
                </span>
              </div>
            </div>

            {/* Notifications Section */}
            <div style={{ borderBottom: '1px solid #f3f4f6' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background-color 0.15s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Bell size={16} color="#6b7280" />
                  Notifications
                  {unreadCount > 0 && (
                    <span
                      style={{
                        minWidth: '18px',
                        height: '18px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: '600',
                        borderRadius: '9px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px'
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </span>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                  {showNotifications ? '▲' : '▼'}
                </span>
              </button>

              {/* Expanded Notifications List */}
              {showNotifications && (
                <div style={{ maxHeight: '240px', overflowY: 'auto', backgroundColor: '#fafafa' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        style={{
                          padding: '12px 16px',
                          borderTop: '1px solid #f3f4f6',
                          backgroundColor: notification.read ? 'transparent' : 'rgba(251, 191, 36, 0.05)',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          if (!notification.read) markAsRead(notification.id);
                          if (notification.actionUrl) {
                            navigate(notification.actionUrl);
                            setShowDropdown(false);
                          }
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: notification.read ? '400' : '500',
                              color: '#374151',
                              marginBottom: '2px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {notification.title}
                            </div>
                            <div style={{
                              fontSize: '11px',
                              color: '#9ca3af',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {notification.message}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                style={{
                                  padding: '4px',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  color: '#9ca3af'
                                }}
                                title="Mark as read"
                              >
                                <Check size={14} />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(notification.id);
                              }}
                              style={{
                                padding: '4px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                color: '#9ca3af'
                              }}
                              title="Dismiss"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <div style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>
              <button
                onClick={() => {
                  navigate('/links');
                  setShowDropdown(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'background-color 0.15s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Bookmark size={16} color="#6b7280" />
                Link Saver
              </button>
              <button
                onClick={() => {
                  navigate('/account/settings');
                  setShowDropdown(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'background-color 0.15s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Settings size={16} color="#6b7280" />
                Settings
              </button>
            </div>

            {/* Admin Links (only for admins) */}
            {isAdmin && (
              <div style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ padding: '4px 12px', fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Admin
                </div>
                <button
                  onClick={() => {
                    navigate('/admin');
                    setShowDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Shield size={16} color="#6b7280" />
                  Admin Dashboard
                </button>
                <button
                  onClick={() => {
                    navigate('/sitemap');
                    setShowDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Map size={16} color="#6b7280" />
                  Sitemap
                </button>
              </div>
            )}

            {/* Actions */}
            <div style={{ padding: '8px' }}>
              <button
                onClick={() => {
                  signOut();
                  setShowDropdown(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#dc2626',
                  transition: 'background-color 0.15s'
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = '#fef2f2')}
                onMouseOut={(e) => (e.target.style.backgroundColor = 'transparent')}
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
