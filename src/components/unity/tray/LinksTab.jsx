/**
 * LinksTab - Display saved links from Link Saver in Canvas Overview
 *
 * Shows subtabs:
 * - Shared: Links shared to/from this canvas (coming soon)
 * - Starred: User's starred links
 * - Recent: Recently saved links
 *
 * Each link can be added to canvas as LinkNode
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getLinks, getSharedWithMeLinks, getCanvasSharedLinks, toggleStar, archiveLink } from '../../../utils/firestoreLinks';

const SUBTABS = [
  { id: 'shared', label: 'Shared', icon: 'users' },
  { id: 'starred', label: 'Starred', icon: 'star' },
  { id: 'recent', label: 'Recent', icon: 'clock' }
];

const LinksTab = ({ onAddLinkNode, canvasId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('starred');
  const [starredLinks, setStarredLinks] = useState([]);
  const [recentLinks, setRecentLinks] = useState([]);
  const [sharedLinks, setSharedLinks] = useState([]);
  const [sharedWithMeLinks, setSharedWithMeLinks] = useState([]);
  const [sharedToCanvasLinks, setSharedToCanvasLinks] = useState([]);
  const [sharedFilter, setSharedFilter] = useState('all'); // 'all', 'withMe', 'toCanvas'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLinks = async () => {
      if (!user?.uid) {
        console.log('[LinksTab] No user, skipping load');
        setLoading(false);
        return;
      }

      console.log('[LinksTab] Loading links for user:', user.uid, 'email:', user.email, 'canvasId:', canvasId);

      try {
        // Load starred links, recent links, and shared links in parallel
        // Use Promise.allSettled to handle individual query failures gracefully
        const starredPromise = getLinks(user.uid, {
          archived: false,
          starred: true,
          pageSize: 20,
          sortBy: 'savedAt',
          sortOrder: 'desc'
        }).catch(err => { console.error('[LinksTab] Starred query failed:', err); return { links: [] }; });

        const recentPromise = getLinks(user.uid, {
          archived: false,
          pageSize: 20,
          sortBy: 'savedAt',
          sortOrder: 'desc'
        }).catch(err => { console.error('[LinksTab] Recent query failed:', err); return { links: [] }; });

        const sharedWithMePromise = getSharedWithMeLinks(user.uid, {
          archived: false,
          pageSize: 20
        }).catch(err => { console.error('[LinksTab] SharedWithMe query failed:', err); return { links: [] }; });

        let canvasSharedPromise = Promise.resolve({ links: [] });
        if (canvasId) {
          console.log('[LinksTab] Also loading canvas-shared links for:', canvasId);
          canvasSharedPromise = getCanvasSharedLinks(canvasId, {
            archived: false,
            pageSize: 20
          }).catch(err => { console.error('[LinksTab] CanvasShared query failed:', err); return { links: [] }; });
        }

        const [starredResult, recentResult, sharedWithMeResult, canvasSharedResult] = await Promise.all([
          starredPromise, recentPromise, sharedWithMePromise, canvasSharedPromise
        ]);

        const counts = {
          starred: starredResult.links?.length || 0,
          recent: recentResult.links?.length || 0,
          sharedWithMe: sharedWithMeResult.links?.length || 0,
          canvasShared: canvasSharedResult?.links?.length || 0
        };
        console.log('[LinksTab] Results:', counts);

        // Debug: Log details of shared links
        if (sharedWithMeResult.links?.length > 0) {
          console.log('[LinksTab] SharedWithMe links:', sharedWithMeResult.links.map(l => ({
            id: l.id,
            title: l.title,
            sharedWithUserIds: l.sharedWithUserIds,
            sharedWith: l.sharedWith
          })));
        } else {
          console.log('[LinksTab] No shared links found for user:', user.uid);
        }

        if (canvasSharedResult?.links?.length > 0) {
          console.log('[LinksTab] Canvas shared links:', canvasSharedResult.links.map(l => ({
            id: l.id,
            title: l.title,
            sharedWithCanvasIds: l.sharedWithCanvasIds
          })));
        }

        // Debug tip for testing
        if (sharedWithMeResult.links?.length === 0 && canvasSharedResult?.links?.length === 0) {
          console.log('[LinksTab] DEBUG TIP: To test shared links, share a link TO this user from a different account, or share a link TO yourself (your own email).');
          console.log('[LinksTab] The link must have this userId in its sharedWithUserIds array:', user.uid);
        }

        setStarredLinks(starredResult.links || []);
        setRecentLinks(recentResult.links || []);

        // Combine shared links: links shared with user + links shared to canvas
        const sharedWithMe = sharedWithMeResult.links || [];
        const canvasShared = canvasSharedResult?.links || [];

        // Store separate arrays for filtering
        setSharedWithMeLinks(sharedWithMe);
        setSharedToCanvasLinks(canvasShared.map(link => ({ ...link, _sharedToCanvas: true })));

        // Dedupe by link ID and mark source
        const allSharedLinks = [...sharedWithMe];
        canvasShared.forEach(link => {
          if (!allSharedLinks.some(l => l.id === link.id)) {
            allSharedLinks.push({ ...link, _sharedToCanvas: true });
          }
        });

        setSharedLinks(allSharedLinks);
      } catch (err) {
        console.error('[LinksTab] Error loading links:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLinks();
  }, [user?.uid, canvasId]);

  // Handle star toggle
  const handleToggleStar = async (link, e) => {
    e.stopPropagation();
    const newStarred = !link.starred;

    try {
      await toggleStar(link.id, newStarred);

      // Update local state optimistically
      const updateLinkInList = (list, setter) => {
        setter(list.map(l =>
          l.id === link.id ? { ...l, starred: newStarred } : l
        ));
      };

      if (newStarred) {
        // Add to starred list
        setStarredLinks(prev => [{ ...link, starred: true }, ...prev.filter(l => l.id !== link.id)]);
      } else {
        // Remove from starred list
        setStarredLinks(prev => prev.filter(l => l.id !== link.id));
      }

      // Update recent list
      updateLinkInList(recentLinks, setRecentLinks);
      // Update shared lists
      updateLinkInList(sharedLinks, setSharedLinks);
      updateLinkInList(sharedWithMeLinks, setSharedWithMeLinks);
      updateLinkInList(sharedToCanvasLinks, setSharedToCanvasLinks);
    } catch (err) {
      console.error('[LinksTab] Failed to toggle star:', err);
    }
  };

  // Handle archive action
  const handleArchive = async (link, e) => {
    e.stopPropagation();

    try {
      await archiveLink(link.id, true);

      // Remove from all lists (archived links don't show in tray)
      setStarredLinks(prev => prev.filter(l => l.id !== link.id));
      setRecentLinks(prev => prev.filter(l => l.id !== link.id));
      setSharedLinks(prev => prev.filter(l => l.id !== link.id));
      setSharedWithMeLinks(prev => prev.filter(l => l.id !== link.id));
      setSharedToCanvasLinks(prev => prev.filter(l => l.id !== link.id));
    } catch (err) {
      console.error('[LinksTab] Failed to archive link:', err);
    }
  };

  // Get icon SVG for subtab
  const getTabIcon = (iconType, isActive) => {
    const color = isActive ? '#171717' : '#9ca3af';

    switch (iconType) {
      case 'users':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case 'star':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill={isActive ? '#fbbf24' : 'none'} stroke={isActive ? '#fbbf24' : color} strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      case 'clock':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Link item component
  const LinkItem = ({ link }) => (
    <div
      style={{
        padding: '10px 12px',
        borderBottom: '1px solid #f3f4f6',
        cursor: 'pointer',
        transition: 'background-color 0.15s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      onClick={() => window.open(link.url, '_blank')}
    >
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        {/* Favicon */}
        <img
          src={link.favicon || `https://www.google.com/s2/favicons?domain=${link.domain}&sz=32`}
          alt=""
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            objectFit: 'cover',
            flexShrink: 0,
            marginTop: '2px'
          }}
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239ca3af"><circle cx="12" cy="12" r="10"/></svg>';
          }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title */}
          <div style={{
            fontSize: '12px',
            fontWeight: '500',
            color: '#111827',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {link.title || 'Untitled'}
          </div>

          {/* Domain */}
          <div style={{
            fontSize: '10px',
            color: '#9ca3af',
            marginTop: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {link.domain}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          {/* Star toggle button */}
          <button
            onClick={(e) => handleToggleStar(link, e)}
            style={{
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef3c7'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title={link.starred ? 'Unstar' : 'Star'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={link.starred ? '#fbbf24' : 'none'} stroke={link.starred ? '#fbbf24' : '#9ca3af'} strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>

          {/* Archive button */}
          <button
            onClick={(e) => handleArchive(link, e)}
            style={{
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Archive"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
          </button>

          {/* Add to Canvas button */}
          {onAddLinkNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddLinkNode(link);
              }}
              style={{
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                backgroundColor: 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#6b7280',
                transition: 'all 0.15s',
                fontSize: '10px',
                fontWeight: '500'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#fbbf24';
                e.currentTarget.style.borderColor = '#fbbf24';
                e.currentTarget.style.color = '#171717';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.color = '#6b7280';
              }}
              title="Add to canvas"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Empty state for a tab
  const EmptyState = ({ message, submessage }) => (
    <div style={{ padding: '32px 16px', textAlign: 'center' }}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#d1d5db"
        strokeWidth="1.5"
        style={{ margin: '0 auto 12px' }}
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
        {message}
      </p>
      {submessage && (
        <p style={{ fontSize: '11px', color: '#9ca3af' }}>
          {submessage}
        </p>
      )}
    </div>
  );

  // Shared link item component with "shared by" info
  const SharedLinkItem = ({ link }) => {
    // Find who shared the link
    const sharer = link.sharedWith?.find(share =>
      share.type === 'user' && share.targetId === user?.uid
    ) || link.sharedWith?.[0];

    // sharerEmail could be used in future to show who shared
    const _sharerEmail = sharer?.sharedBy || 'someone';

    return (
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid #f3f4f6',
          cursor: 'pointer',
          transition: 'background-color 0.15s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        onClick={() => window.open(link.url, '_blank')}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          {/* Favicon */}
          <img
            src={link.favicon || `https://www.google.com/s2/favicons?domain=${link.domain}&sz=32`}
            alt=""
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              objectFit: 'cover',
              flexShrink: 0,
              marginTop: '2px'
            }}
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239ca3af"><circle cx="12" cy="12" r="10"/></svg>';
            }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title */}
            <div style={{
              fontSize: '12px',
              fontWeight: '500',
              color: '#111827',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {/* Shared indicator */}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {link.title || 'Untitled'}
              </span>
            </div>

            {/* Domain and shared by */}
            <div style={{
              fontSize: '10px',
              color: '#9ca3af',
              marginTop: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {link.domain}
              <span style={{ color: '#d1d5db' }}> • </span>
              <span style={{ color: '#f59e0b' }}>
                {link._sharedToCanvas ? 'Shared to canvas' : `Shared with you`}
              </span>
            </div>
          </div>

          {/* Add to Canvas button */}
          {onAddLinkNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddLinkNode(link);
              }}
              style={{
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                backgroundColor: 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#6b7280',
                flexShrink: 0,
                transition: 'all 0.15s',
                fontSize: '10px',
                fontWeight: '500'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#fbbf24';
                e.currentTarget.style.borderColor = '#fbbf24';
                e.currentTarget.style.color = '#171717';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.color = '#6b7280';
              }}
              title="Add to canvas"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  // Get filtered shared links based on current filter
  const getFilteredSharedLinks = () => {
    switch (sharedFilter) {
      case 'withMe':
        return sharedWithMeLinks;
      case 'toCanvas':
        return sharedToCanvasLinks;
      default:
        return sharedLinks;
    }
  };

  // Shared filter pill component
  const SharedFilterPill = ({ id, label, count }) => {
    const isActive = sharedFilter === id;
    return (
      <button
        onClick={() => setSharedFilter(id)}
        style={{
          padding: '4px 10px',
          fontSize: '10px',
          fontWeight: isActive ? '600' : '500',
          backgroundColor: isActive ? '#fef3c7' : '#f3f4f6',
          color: isActive ? '#92400e' : '#6b7280',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.15s'
        }}
      >
        {label}
        {count > 0 && (
          <span style={{
            fontSize: '9px',
            backgroundColor: isActive ? '#fbbf24' : '#e5e7eb',
            color: isActive ? '#171717' : '#6b7280',
            padding: '1px 4px',
            borderRadius: '6px',
            fontWeight: '600'
          }}>
            {count}
          </span>
        )}
      </button>
    );
  };

  // Shared tab content - shows links shared with user or to canvas
  const SharedTabContent = () => {
    const filteredLinks = getFilteredSharedLinks();
    const hasAnyShared = sharedLinks.length > 0;

    if (!hasAnyShared) {
      return (
        <div style={{ padding: '32px 16px', textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            margin: '0 auto 16px',
            backgroundColor: '#fef3c7',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#171717', marginBottom: '8px' }}>
            No Shared Links
          </p>
          <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.5', marginBottom: '16px' }}>
            Links shared with you or to this canvas will appear here.
          </p>
        </div>
      );
    }

    return (
      <>
        {/* Filter pills */}
        <div style={{
          padding: '8px 12px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap'
        }}>
          <SharedFilterPill id="all" label="All" count={sharedLinks.length} />
          <SharedFilterPill id="withMe" label="With Me" count={sharedWithMeLinks.length} />
          {canvasId && (
            <SharedFilterPill id="toCanvas" label="To Canvas" count={sharedToCanvasLinks.length} />
          )}
        </div>

        {/* Filtered links */}
        {filteredLinks.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>
              No links in this category
            </p>
          </div>
        ) : (
          filteredLinks.map((link) => (
            <SharedLinkItem key={`shared-${link.id}`} link={link} />
          ))
        )}
      </>
    );
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'shared':
        return <SharedTabContent />;

      case 'starred':
        if (starredLinks.length === 0) {
          return (
            <EmptyState
              message="No starred links"
              submessage="Star your favorite links in Link Saver to see them here"
            />
          );
        }
        return starredLinks.map((link) => (
          <LinkItem key={`starred-${link.id}`} link={link} />
        ));

      case 'recent':
        if (recentLinks.length === 0) {
          return (
            <EmptyState
              message="No saved links yet"
              submessage="Save links from the web to access them here"
            />
          );
        }
        return recentLinks.map((link) => (
          <LinkItem key={`recent-${link.id}`} link={link} />
        ));

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
          Sign in to see your saved links
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: '#9ca3af' }}>Loading links...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '0' }}>
      {/* View All Button */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6' }}>
        <button
          onClick={() => navigate('/links')}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: '#fbbf24',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            color: '#171717',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'background-color 0.15s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f59e0b'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fbbf24'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          Open Link Saver
        </button>
      </div>

      {/* Subtab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #f3f4f6',
        padding: '0 8px'
      }}>
        {SUBTABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tab.id === 'starred' ? starredLinks.length
                      : tab.id === 'recent' ? recentLinks.length
                      : sharedLinks.length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '10px 4px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #fbbf24' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.15s'
              }}
            >
              {getTabIcon(tab.icon, isActive)}
              <span style={{
                fontSize: '11px',
                fontWeight: isActive ? '600' : '500',
                color: isActive ? '#171717' : '#9ca3af'
              }}>
                {tab.label}
              </span>
              {count > 0 && tab.id !== 'shared' && (
                <span style={{
                  fontSize: '10px',
                  backgroundColor: isActive ? '#fef3c7' : '#f3f4f6',
                  color: isActive ? '#92400e' : '#6b7280',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  fontWeight: '500'
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default LinksTab;
