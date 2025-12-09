/**
 * UserMenu - Displays user avatar/login button and credits
 *
 * Shows:
 * - Login button when not authenticated
 * - User avatar, credits, and sign out when authenticated
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCredits } from '../../hooks/useCredits';
import AuthModal from './AuthModal';

const UserMenu = ({ compact = false, dropdownDirection = 'down' }) => {
  const { user, userProfile, isAuthenticated, signOut } = useAuth();
  const { creditsRemaining, tier } = useCredits();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

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
