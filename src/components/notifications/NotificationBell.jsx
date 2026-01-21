import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, X, Folder, Link2, Layout, Info } from 'lucide-react';
import { useNotifications, NOTIFICATION_TYPES } from '../../contexts/NotificationContext';

/**
 * NotificationBell - Header component showing notification count and dropdown
 *
 * Features:
 * - Bell icon with unread count badge
 * - Dropdown with notification list
 * - Mark as read / dismiss actions
 * - Click to navigate to action URL
 */

const COLORS = {
  primary: '#fbbf24',
  text: '#1f2937',
  textMuted: '#6b7280',
  textLight: '#9ca3af',
  bg: '#ffffff',
  bgHover: '#f9fafb',
  border: '#e5e7eb',
  danger: '#ef4444',
  info: '#3b82f6',
  success: '#10b981'
};

// Get icon for notification type
const getNotificationIcon = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.FOLDER_SHARED:
      return <Folder size={16} color={COLORS.primary} />;
    case NOTIFICATION_TYPES.LINK_SHARED:
    case NOTIFICATION_TYPES.LINK_ADDED_TO_SHARED_FOLDER:
      return <Link2 size={16} color={COLORS.info} />;
    case NOTIFICATION_TYPES.CANVAS_SHARED:
      return <Layout size={16} color={COLORS.success} />;
    default:
      return <Info size={16} color={COLORS.textMuted} />;
  }
};

// Format relative time
const formatRelativeTime = (date) => {
  if (!date) return '';

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

export default function NotificationBell({ style = {} }) {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    dismissNotification
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate if action URL provided
    if (notification.actionUrl) {
      setIsOpen(false);
      navigate(notification.actionUrl);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', ...style }}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
      >
        <Bell size={20} color={COLORS.text} />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            backgroundColor: COLORS.danger,
            color: '#fff',
            fontSize: '10px',
            fontWeight: '600',
            minWidth: '16px',
            height: '16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          width: '360px',
          maxHeight: '480px',
          backgroundColor: COLORS.bg,
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          border: `1px solid ${COLORS.border}`,
          overflow: 'hidden',
          zIndex: 1000
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${COLORS.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{
              fontWeight: '600',
              fontSize: '14px',
              color: COLORS.text
            }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: COLORS.info,
                  fontSize: '12px',
                  fontWeight: '500',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {loading ? (
              <div style={{
                padding: '40px 16px',
                textAlign: 'center',
                color: COLORS.textMuted
              }}>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{
                padding: '40px 16px',
                textAlign: 'center',
                color: COLORS.textMuted
              }}>
                <Bell size={32} color={COLORS.textLight} style={{ marginBottom: '8px' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${COLORS.border}`,
                    display: 'flex',
                    gap: '12px',
                    backgroundColor: notification.read ? COLORS.bg : 'rgba(59, 130, 246, 0.05)',
                    cursor: notification.actionUrl ? 'pointer' : 'default',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => handleNotificationClick(notification)}
                  onMouseEnter={(e) => {
                    if (notification.actionUrl) {
                      e.currentTarget.style.backgroundColor = notification.read
                        ? COLORS.bgHover
                        : 'rgba(59, 130, 246, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notification.read
                      ? COLORS.bg
                      : 'rgba(59, 130, 246, 0.05)';
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: COLORS.bgHover,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: notification.read ? '400' : '600',
                      fontSize: '13px',
                      color: COLORS.text,
                      marginBottom: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {notification.title}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: COLORS.textMuted,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {notification.message}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: COLORS.textLight,
                      marginTop: '4px'
                    }}>
                      {formatRelativeTime(notification.createdAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    flexShrink: 0
                  }}>
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          color: COLORS.textMuted
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
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        color: COLORS.textMuted
                      }}
                      title="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
