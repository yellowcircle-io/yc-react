import React, { memo } from 'react';

/**
 * NotificationsTab - Displays comments, mentions, and activity
 */

const NotificationsTab = memo(({ notifications = [], onClick }) => {
  if (notifications.length === 0) {
    return (
      <div
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#6b7280',
        }}
      >
        <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.5 }}>🔔</div>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>No notifications</p>
        <p style={{ margin: '8px 0 0', fontSize: '12px', opacity: 0.7 }}>
          @mentions and comments will appear here
        </p>
      </div>
    );
  }

  // Group by date
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const grouped = notifications.reduce((acc, notification) => {
    const date = new Date(notification.createdAt).toDateString();
    let label = date;
    if (date === today) label = 'Today';
    else if (date === yesterday) label = 'Yesterday';

    if (!acc[label]) acc[label] = [];
    acc[label].push(notification);
    return acc;
  }, {});

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'mention': return '💬';
      case 'comment': return '🗨️';
      case 'share': return '🔗';
      case 'update': return '✏️';
      default: return '🔔';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ padding: '12px' }}>
      {Object.entries(grouped).map(([label, items]) => (
        <div key={label}>
          {/* Date header */}
          <div
            style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '8px 0',
              marginTop: label === 'Today' ? 0 : '12px',
            }}
          >
            {label}
          </div>

          {/* Notifications for this date */}
          {items.map((notification, index) => (
            <div
              key={notification.id || index}
              onClick={() => onClick?.(notification)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px',
                backgroundColor: notification.read ? '#f9fafb' : '#eff6ff',
                borderRadius: '8px',
                marginBottom: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
                borderLeft: notification.read ? 'none' : '3px solid #3b82f6',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = notification.read ? '#f3f4f6' : '#dbeafe';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = notification.read ? '#f9fafb' : '#eff6ff';
              }}
            >
              {/* Icon */}
              <span
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '50%',
                  fontSize: '14px',
                  flexShrink: 0,
                }}
              >
                {getNotificationIcon(notification.type)}
              </span>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#111827',
                    fontWeight: notification.read ? '400' : '500',
                  }}
                >
                  {notification.type === 'mention' && (
                    <>
                      <span style={{ fontWeight: '600' }}>{notification.fromName || 'Someone'}</span>
                      {' mentioned you'}
                    </>
                  )}
                  {notification.type === 'comment' && (
                    <>
                      <span style={{ fontWeight: '600' }}>{notification.fromName || 'Someone'}</span>
                      {' commented'}
                    </>
                  )}
                  {notification.type === 'share' && (
                    <>
                      <span style={{ fontWeight: '600' }}>{notification.fromName || 'Someone'}</span>
                      {' shared a capsule with you'}
                    </>
                  )}
                  {!['mention', 'comment', 'share'].includes(notification.type) && (
                    notification.message || 'New notification'
                  )}
                </div>

                {/* Preview text */}
                {notification.preview && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginTop: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    "{notification.preview}"
                  </div>
                )}

                {/* Time */}
                <div
                  style={{
                    fontSize: '11px',
                    color: '#9ca3af',
                    marginTop: '4px',
                  }}
                >
                  {formatTime(notification.createdAt)}
                </div>
              </div>

              {/* Unread indicator */}
              {!notification.read && (
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '50%',
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});

NotificationsTab.displayName = 'NotificationsTab';

export default NotificationsTab;
