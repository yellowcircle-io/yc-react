import React, { useState } from 'react';
import { Users, Eye } from 'lucide-react';

/**
 * ActiveUsersIndicator Component
 *
 * Displays avatars/badges of users currently viewing the same capsule.
 * Shows in the toolbar with hover tooltip showing user details.
 *
 * @param {Array} activeUsers - Array of user objects with uid, displayName, email, photoURL
 * @param {string} currentUserId - Current user's UID to highlight self
 */
const ActiveUsersIndicator = ({ activeUsers = [], currentUserId }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!activeUsers || activeUsers.length === 0) {
    return null;
  }

  // Sort: current user first, then alphabetically
  const sortedUsers = [...activeUsers].sort((a, b) => {
    if (a.uid === currentUserId) return -1;
    if (b.uid === currentUserId) return 1;
    return (a.displayName || '').localeCompare(b.displayName || '');
  });

  const maxAvatarsShown = 5;
  const visibleUsers = sortedUsers.slice(0, maxAvatarsShown);
  const additionalCount = Math.max(0, sortedUsers.length - maxAvatarsShown);

  return (
    <div className="relative flex items-center">
      {/* Active Users Icon + Counter */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Eye className="w-4 h-4 text-green-600" />
        <span className="text-sm font-medium text-gray-700">
          {activeUsers.length}
        </span>

        {/* Avatar Stack */}
        <div className="flex -space-x-2">
          {visibleUsers.map((user, index) => (
            <div
              key={user.uid}
              className={`relative inline-block h-7 w-7 rounded-full border-2 ${
                user.uid === currentUserId
                  ? 'border-yellow-400 ring-2 ring-yellow-200'
                  : 'border-white'
              }`}
              style={{ zIndex: maxAvatarsShown - index }}
              title={user.displayName}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-xs font-semibold text-white">
                  {(user.displayName || user.email || '?')[0].toUpperCase()}
                </div>
              )}

              {/* Online status dot */}
              <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white bg-green-500" />
            </div>
          ))}

          {/* Additional users counter */}
          {additionalCount > 0 && (
            <div
              className="relative inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-semibold text-gray-600"
              title={`+${additionalCount} more`}
            >
              +{additionalCount}
            </div>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-xl">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">
              Active Viewers ({activeUsers.length})
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sortedUsers.map((user) => (
              <div
                key={user.uid}
                className={`flex items-center gap-2 p-2 rounded ${
                  user.uid === currentUserId
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-sm font-semibold text-white">
                      {(user.displayName || user.email || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {user.displayName}
                    {user.uid === currentUserId && (
                      <span className="ml-1 text-xs text-yellow-600">(You)</span>
                    )}
                  </div>
                  {user.email && (
                    <div className="text-xs text-gray-500 truncate">
                      {user.email}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer hint */}
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              Real-time presence tracking
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveUsersIndicator;
