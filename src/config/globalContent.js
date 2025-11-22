/**
 * Global Content Configuration
 *
 * Centralized editable content for global components (Header, Footer, Theme)
 * Editable via .claude/automation/global-manager.js
 *
 * Usage from iPhone:
 *   cd .claude/automation && node global-manager.js --component=footer --section=contact --field=email --value="newemail@yellowcircle.io"
 */

const globalContent = {
  // Header Configuration
  header: {
    logoText: {
      part1: 'yellow',
      part2: 'CIRCLE'
    },
    colors: {
      part1Color: '#fbbf24',      // Yellow/amber color
      part2Color: 'white',
      backgroundColor: 'black'
    },
    styling: {
      fontSize: '16px',
      fontWeight: '600',
      letterSpacing: '0.2em',
      part1Style: 'italic'        // 'normal' or 'italic'
    }
  },

  // Footer Configuration
  footer: {
    contact: {
      title: 'CONTACT',
      links: [
        {
          text: 'EMAIL@YELLOWCIRCLE.IO',
          url: '#',
          type: 'email'
        },
        {
          text: 'LINKEDIN',
          url: '#',
          type: 'social'
        },
        {
          text: 'TWITTER',
          url: '#',
          type: 'social'
        }
      ],
      colors: {
        backgroundColor: 'rgba(0,0,0,0.9)',
        titleColor: 'white',
        linkColor: 'rgba(255,255,255,0.8)',
        linkHoverColor: 'white',
        borderColor: 'white'
      }
    },
    projects: {
      title: 'PROJECTS',
      links: [
        {
          text: 'GOLDEN UNKNOWN',
          url: '#',
          route: null
        },
        {
          text: 'BEING + RHYME',
          url: '#',
          route: null
        },
        {
          text: 'CATH3DRAL',
          url: '#',
          route: null
        },
        {
          text: 'RHO CONSULTING',
          url: '#',
          route: null
        },
        {
          text: 'TRAVEL MEMORIES',
          url: '#',
          route: '/uk-memories'
        }
      ],
      colors: {
        backgroundColor: '#EECF00',
        titleColor: 'black',
        linkColor: 'rgba(0,0,0,0.8)',
        linkHoverColor: 'black',
        borderColor: 'black'
      }
    }
  },

  // Theme Configuration
  theme: {
    colors: {
      primary: '#EECF00',         // Yellow
      primaryDark: '#d4b800',
      secondary: '#fbbf24',       // Amber
      accent: '#f59e0b',
      background: 'black',
      text: 'white',
      textMuted: 'rgba(255,255,255,0.8)'
    },
    typography: {
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      headingWeight: '900',
      bodyWeight: '400',
      letterSpacing: '0.1em'
    }
  }
};

export default globalContent;
