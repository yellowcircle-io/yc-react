import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Shared Tailwind Sidebar Component
 * Simplified sidebar for AboutPage, WorksPage, HandsPage
 * Uses Tailwind CSS classes for easy customization
 */
const TailwindSidebar = ({ isOpen, onClose, expandedItems, onToggleItem, currentPage }) => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
      path: '/',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        </svg>
      ),
      subItems: null
    },
    {
      id: 'experiments',
      label: 'Experiments',
      path: '/experiments',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4M9 11V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M9 11h6"></path>
        </svg>
      ),
      subItems: [
        { label: 'All Experiments', path: '/experiments' },
        { label: 'golden unknown', path: '/experiments/golden-unknown' },
        { label: 'being + rhyme', path: '/experiments/being-rhyme' },
        { label: 'cath3dral', path: '/experiments/cath3dral' }
      ]
    },
    {
      id: 'thoughts',
      label: 'Thoughts',
      path: '/thoughts',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
        </svg>
      ),
      subItems: [
        { label: 'All Thoughts', path: '/thoughts' },
        { label: 'blog', path: '/thoughts/blog' }
      ]
    },
    {
      id: 'about',
      label: 'About',
      path: '/about',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      ),
      subItems: [
        { label: 'Overview', path: '/about' },
        { label: 'timeline', path: '/about/timeline' },
        { label: 'services', path: '/about/services' },
        { label: 'contact', path: '/about/contact' }
      ]
    },
    {
      id: 'works',
      label: 'Works',
      path: '/works',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
      ),
      subItems: [
        { label: 'All Works', path: '/works' },
        { label: 'websites', path: '/works/websites' },
        { label: 'graphics', path: '/works/graphics' },
        { label: 'music', path: '/works/music' }
      ]
    },
    {
      id: 'hands',
      label: 'Hands',
      path: '/hands',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
          <line x1="16" y1="8" x2="2" y2="22"></line>
          <line x1="17.5" y1="15" x2="9" y2="15"></line>
        </svg>
      ),
      subItems: null
    }
  ];

  return (
    <div
      className={`fixed top-0 right-0 h-full bg-white/95 backdrop-blur-md border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-40 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ width: '320px' }}
    >
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold">Navigation</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            aria-label="Close sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = currentPage === item.id;
            const isExpanded = expandedItems.has(item.id);
            const hasSubItems = item.subItems && item.subItems.length > 0;

            return (
              <div key={item.id} className="space-y-1">
                {/* Main Item Button */}
                <button
                  onClick={() => {
                    if (hasSubItems) {
                      onToggleItem(item.id);
                    } else {
                      handleNavigation(item.path);
                    }
                  }}
                  className={`w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex items-center justify-between ${
                    isActive ? 'bg-yellow-50 border border-yellow-200' : ''
                  }`}
                  style={isActive ? { backgroundColor: 'rgba(251, 191, 36, 0.1)' } : {}}
                >
                  <div className="flex items-center space-x-3">
                    <span style={isActive ? { color: '#b45309' } : {}}>
                      {item.icon}
                    </span>
                    <span style={isActive ? { color: '#b45309' } : {}}>
                      {item.label}
                    </span>
                  </div>
                  {hasSubItems && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={isActive ? { color: '#b45309' } : {}}
                      className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6,9 12,15 18,9"></polyline>
                    </svg>
                  )}
                </button>

                {/* Sub Items */}
                {hasSubItems && isExpanded && (
                  <div className="ml-8 space-y-1 overflow-hidden">
                    {item.subItems.map((subItem, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleNavigation(subItem.path)}
                        className={`block w-full text-left p-2 text-sm hover:bg-gray-50 rounded transition-colors duration-200 ${
                          isActive && subItem.path === item.path
                            ? 'text-purple-600 hover:text-purple-900 hover:bg-purple-50'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default TailwindSidebar;
