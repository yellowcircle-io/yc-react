import { useState, useCallback } from 'react';

/**
 * Custom hook for sidebar state management
 * Handles open/close state and accordion navigation
 * @param {boolean} initialOpen Initial sidebar open state (default: false)
 * @returns {Object} Sidebar state and handlers
 */
export const useSidebar = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedSubSection, setExpandedSubSection] = useState(null);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleSection = useCallback((sectionKey) => {
    setExpandedSection(prev => {
      const newSection = prev === sectionKey ? null : sectionKey;
      // Reset sub-section when changing main section
      if (newSection !== prev) {
        setExpandedSubSection(null);
      }
      return newSection;
    });
  }, []);

  const toggleSubSection = useCallback((subSectionKey) => {
    setExpandedSubSection(prev => prev === subSectionKey ? null : subSectionKey);
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedSection(null);
    setExpandedSubSection(null);
  }, []);

  const isExpanded = useCallback((sectionKey) => {
    return expandedSection === sectionKey && isOpen;
  }, [expandedSection, isOpen]);

  const isSubExpanded = useCallback((subSectionKey) => {
    return expandedSubSection === subSectionKey;
  }, [expandedSubSection]);

  return {
    isOpen,
    expandedSection,
    expandedSubSection,
    toggle,
    open,
    close,
    toggleSection,
    toggleSubSection,
    collapseAll,
    isExpanded,
    isSubExpanded
  };
};

export default useSidebar;
