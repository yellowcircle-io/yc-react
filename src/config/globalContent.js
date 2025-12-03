/**
 * Global Content Configuration
 *
 * Centralized editable content for global components (Header, Footer, Theme)
 * Editable via .claude/automation/global-manager.js
 *
 * Usage from iPhone:
 *   cd .claude/automation && node global-manager.js --component=footer --section=contact --field=email --value="newemail@yellowcircle.io"
 *
 * YELLOW COLOR OPTIONS:
 * - Primary (current): rgb(251, 191, 36) / #fbbf24 - Warmer amber yellow
 * - Legacy:            rgb(238, 207, 0)  / #EECF00 - Original bright yellow
 * To switch back to legacy yellow, replace 'rgb(251, 191, 36)' with '#EECF00'
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
          text: 'info@yellowcircle.io',
          url: 'mailto:info@yellowcircle.io',
          type: 'email'
        },
        {
          text: '914.241.5524',
          url: 'tel:+19142415524',
          type: 'phone'
        },
        {
          text: 'LINKEDIN',
          url: 'https://www.linkedin.com/company/yellowcircle-io',
          type: 'social',
          icon: 'linkedin'
        },
        {
          text: 'INSTAGRAM',
          url: 'https://www.instagram.com/yellowcircle.io/',
          type: 'social',
          icon: 'instagram'
        },
        {
          text: 'FEEDBACK',
          url: '/feedback',
          type: 'link',
          route: '/feedback'
        },
        {
          text: 'PRIVACY',
          url: '/privacy',
          type: 'link',
          route: '/privacy'
        },
        {
          text: 'TERMS',
          url: '/terms',
          type: 'link',
          route: '/terms'
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
    resources: {
      title: 'RESOURCES',
      links: [
        {
          text: 'GROWTH HEALTH CHECK',
          url: '#',
          route: '/assessment'
        },
        {
          text: 'SERVICES',
          url: '#',
          route: '/services'
        },
        {
          text: 'OUTREACH GENERATOR',
          url: '#',
          route: '/experiments/outreach-generator'
        },
        {
          text: 'WHY YOUR GTM SUCKS',
          url: '#',
          route: '/thoughts/why-your-gtm-sucks'
        },
        {
          text: 'CLIENTS',
          url: '#',
          route: '/works'
        }
      ],
      colors: {
        backgroundColor: 'rgb(251, 191, 36)',
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
      primary: 'rgb(251, 191, 36)',   // Yellow (was #EECF00)
      primaryDark: '#d4a000',
      secondary: '#fbbf24',           // Amber
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
