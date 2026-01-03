import React, { useState } from 'react';

/**
 * UserAvatar Component
 *
 * Displays a user's avatar with fallback to initials
 * Supports different sizes and status indicators
 *
 * @param {object} user - User object with displayName, photoURL, email
 * @param {string} size - Size variant: 'small' (24px) or 'medium' (32px)
 * @param {string} status - User status: 'active' or 'idle'
 * @param {string} className - Additional CSS classes
 */
const UserAvatar = ({ user, size = 'small', status = 'active', className = '' }) => {
  const [imageError, setImageError] = useState(false);

  // Determine size in pixels
  const sizeMap = {
    small: 24,
    medium: 32
  };
  const sizePx = sizeMap[size] || sizeMap.small;

  // Get user initials from displayName or email
  const getInitials = () => {
    if (user.displayName) {
      const names = user.displayName.trim().split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return user.displayName.substring(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  // Generate consistent color from userId
  const getBackgroundColor = () => {
    if (!user.userId && !user.id) return '#6B7280';

    const id = user.userId || user.id;
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate pastel colors
    const hue = hash % 360;
    return `hsl(${hue}, 65%, 60%)`;
  };

  const avatarStyle = {
    width: sizePx,
    height: sizePx,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size === 'small' ? '10px' : '12px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: getBackgroundColor(),
    border: '2px solid #fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    flexShrink: 0,
    position: 'relative',
    opacity: status === 'idle' ? 0.6 : 1,
    transition: 'opacity 0.3s ease'
  };

  const imageStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover'
  };

  // Status indicator dot
  const statusDotStyle = {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: size === 'small' ? 8 : 10,
    height: size === 'small' ? 8 : 10,
    borderRadius: '50%',
    backgroundColor: status === 'active' ? '#10B981' : '#F59E0B',
    border: '2px solid #fff',
    animation: status === 'active' ? 'pulse 2s infinite' : 'none'
  };

  return (
    <div className={`user-avatar ${className}`} style={avatarStyle} title={user.displayName || user.email}>
      {user.photoURL && !imageError ? (
        <img
          src={user.photoURL}
          alt={user.displayName || 'User'}
          style={imageStyle}
          onError={() => setImageError(true)}
        />
      ) : (
        <span>{getInitials()}</span>
      )}
      <div style={statusDotStyle} />
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default UserAvatar;
