import React, { useState, memo } from 'react';
import BookmarksTab from './tray/BookmarksTab';
import NodesTab from './tray/NodesTab';
import NotificationsTab from './tray/NotificationsTab';
import LinksTab from './tray/LinksTab';

/**
 * OverviewTray - Right-side slide-out panel for Unity Notes
 *
 * Features:
 * - Bookmarks tab: Saved capsules/canvases
 * - Nodes tab: All nodes on current canvas (filterable)
 * - Notifications tab: Comments with @mentions, activity
 */

// SVG icons for tabs (matching app brand)
const TabIcons = {
  bookmarks: (active) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? '#fbbf24' : 'none'} stroke={active ? '#fbbf24' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  nodes: (active) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#3b82f6' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  links: (active) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#22c55e' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  notifications: (active) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#3b82f6' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
};

const TABS = [
  { id: 'bookmarks', label: 'Saved', showLabel: true },
  { id: 'nodes', label: 'Nodes', showLabel: true },
  { id: 'links', label: 'Links', showLabel: true },
  { id: 'notifications', label: 'Activity', showLabel: false }, // Icon only
];

const OverviewTray = memo(({
  isOpen,
  onClose,
  nodes = [],
  starredNodes = [],
  bookmarkedCapsules = [],
  notifications = [],
  canvasId = null,
  onNodeClick,
  onCapsuleLoad,
  onNotificationClick,
  onUnstar,
  onUnstarNode,
  onRenameCapsule,
  onAddLinkNode,
}) => {
  const [activeTab, setActiveTab] = useState('nodes');

  // Count unread notifications for badge
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            zIndex: 99,
            display: window.innerWidth < 768 ? 'block' : 'none',
          }}
        />
      )}

      {/* Tray Panel - 65% viewport height, offset from top and right */}
      <div
        style={{
          position: 'fixed',
          right: isOpen ? 80 : -320, // Moved left to avoid zoom panel obstruction
          top: '20vh', // 20% from top to avoid hamburger menu
          height: '65vh', // Reduced height
          width: 300,
          backgroundColor: '#ffffff',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          borderRadius: '12px',
          transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #f3f4f6',
            backgroundColor: '#fafafa',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827', letterSpacing: '-0.01em' }}>
            Canvas Overview
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#9ca3af',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.color = '#6b7280';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#9ca3af';
            }}
            title="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Bar - Equalized buttons with icon-only Activity */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            padding: '8px 12px',
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #f3f4f6',
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const isIconOnly = !tab.showLabel;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: isIconOnly ? '0 0 40px' : 1, // Icon-only tabs fixed width
                  padding: isIconOnly ? '8px' : '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  backgroundColor: isActive ? '#ffffff' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                  position: 'relative',
                }}
                title={tab.label}
              >
                {TabIcons[tab.id](isActive)}
                {tab.showLabel && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: isActive ? '600' : '500',
                      color: isActive ? '#111827' : '#6b7280',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {tab.label}
                  </span>
                )}
                {/* Notification badge */}
                {tab.id === 'notifications' && unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      minWidth: '14px',
                      height: '14px',
                      backgroundColor: '#ef4444',
                      borderRadius: '7px',
                      fontSize: '9px',
                      fontWeight: '700',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 3px',
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {activeTab === 'bookmarks' && (
            <BookmarksTab
              capsules={bookmarkedCapsules}
              starredNodes={starredNodes}
              onLoad={onCapsuleLoad}
              onUnstar={onUnstar}
              onNodeClick={onNodeClick}
              onUnstarNode={onUnstarNode}
              onRename={onRenameCapsule}
            />
          )}
          {activeTab === 'nodes' && (
            <NodesTab
              nodes={nodes}
              onNodeClick={onNodeClick}
            />
          )}
          {activeTab === 'links' && (
            <LinksTab onAddLinkNode={onAddLinkNode} canvasId={canvasId} />
          )}
          {activeTab === 'notifications' && (
            <NotificationsTab
              notifications={notifications}
              onClick={onNotificationClick}
            />
          )}
        </div>

        {/* Footer with node count */}
        <div
          style={{
            padding: '8px 12px',
            borderTop: '1px solid #f3f4f6',
            backgroundColor: '#fafafa',
            fontSize: '10px',
            color: '#9ca3af',
            textAlign: 'center',
          }}
        >
          {nodes.length} nodes on canvas
        </div>
      </div>
    </>
  );
});

OverviewTray.displayName = 'OverviewTray';

export default OverviewTray;
