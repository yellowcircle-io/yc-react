/**
 * yellowCircle Email Component Library
 *
 * Email-safe React components using table-based layouts and inline styles.
 * Designed for maximum email client compatibility.
 *
 * Usage:
 * import { EmailWrapper, Header, Hero, Button, IconRow, Footer } from '../components/email';
 */

export { default as EmailWrapper } from './EmailWrapper';
export { default as Header } from './Header';
export { default as Hero } from './Hero';
export { default as Button } from './Button';
export { default as IconRow } from './IconRow';
export { default as Footer } from './Footer';
export { default as SocialIcons } from './SocialIcons';
export { default as Divider } from './Divider';
export { default as Text } from './Text';
export { Heading, Paragraph, Label, Quote, List, Link } from './Text';
export { Spacer } from './Divider';
export { HeroFullWidth } from './Hero';
export { FooterMinimal } from './Footer';
export { ButtonRow } from './Button';
export { FeatureGrid } from './IconRow';

// Templates
export { default as EmailPreview, MarketingTemplate, SalesTemplate, NewsletterTemplate, AnnouncementTemplate } from './EmailPreview';

// Brand configuration
export const BRAND_CONFIG = {
  colors: {
    yellow: '#EECF00',
    black: '#000000',
    white: '#FFFFFF',
    gray: '#666666',
    lightGray: '#999999'
  },
  fonts: {
    primary: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    heading: "'Helvetica Neue', Helvetica, Arial, sans-serif"
  },
  logo: {
    url: 'https://res.cloudinary.com/yellowcircle-io/image/upload/v1735952878/yc-email-logo-horizontal_rdgnoe.png',
    width: 180,
    height: 40,
    alt: 'yellowCircle'
  },
  social: {
    twitter: 'https://twitter.com/yellowcircle_io',
    instagram: 'https://instagram.com/yellowcircle.io',
    linkedin: 'https://linkedin.com/company/yellowcircle-io'
  },
  links: {
    browse: 'https://yellowcircle-app.web.app/works',
    labs: 'https://yellowcircle-app.web.app/experiments',
    contact: 'https://yellowcircle-app.web.app/about'
  }
};
