import React from 'react';

// yellowCircle Brand Colors
export const YellowCircleColors = {
  primary: "#EECF00",      // yellowCircle Yellow - Primary brand color
  black: "#000000",        // Primary text and strong elements
  white: "#FFFFFF",        // Background and contrast text
  gray: "#6B7280",         // Secondary text and borders
  lightGray: "#F3F4F6",    // Background sections
  darkGray: "#374151"      // Dark text variations
};

// Sample yellowCircle components (placeholders for future development)
const YellowCircleButton = ({
  text = "Click here",
  variant = "primary",
  ...props
}) => {
  const variants = {
    primary: {
      backgroundColor: YellowCircleColors.primary,
      color: YellowCircleColors.black,
      border: `2px solid ${YellowCircleColors.primary}`
    },
    secondary: {
      backgroundColor: "transparent",
      color: YellowCircleColors.primary,
      border: `2px solid ${YellowCircleColors.primary}`
    }
  };

  return (
    <button
      style={{
        padding: "12px 24px",
        borderRadius: "8px",
        fontWeight: "600",
        fontSize: "16px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        ...variants[variant]
      }}
      {...props}
    >
      {text}
    </button>
  );
};

const YellowCircleCard = ({
  title = "Card Title",
  content = "This is a sample card component for the yellowCircle design system.",
  ...props
}) => {
  return (
    <div
      style={{
        backgroundColor: YellowCircleColors.white,
        border: `1px solid ${YellowCircleColors.lightGray}`,
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
      }}
      {...props}
    >
      <h3 style={{
        color: YellowCircleColors.black,
        fontSize: "20px",
        fontWeight: "700",
        marginBottom: "12px"
      }}>
        {title}
      </h3>
      <p style={{
        color: YellowCircleColors.darkGray,
        fontSize: "16px",
        lineHeight: "1.6"
      }}>
        {content}
      </p>
    </div>
  );
};

const YellowCircleHero = ({
  headline = "Creative Experiments & Digital Innovation",
  subheadline = "Pushing boundaries through technology and artistic expression",
  ...props
}) => {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${YellowCircleColors.primary} 0%, #FFE55C 100%)`,
        padding: "60px 40px",
        textAlign: "center",
        borderRadius: "16px"
      }}
      {...props}
    >
      <h1 style={{
        color: YellowCircleColors.black,
        fontSize: "48px",
        fontWeight: "700",
        marginBottom: "16px",
        letterSpacing: "-0.02em"
      }}>
        {headline}
      </h1>
      <p style={{
        color: YellowCircleColors.darkGray,
        fontSize: "20px",
        fontWeight: "400",
        maxWidth: "600px",
        margin: "0 auto"
      }}>
        {subheadline}
      </p>
    </div>
  );
};

// Component registry for yellowCircle library
export const yellowCircleComponents = {
  'ui-components': [
    {
      id: 'button',
      title: 'YellowCircle Button',
      description: 'Brand-consistent button component with primary and secondary variants',
      category: 'UI',
      tags: ['button', 'interactive', 'branding'],
      component: (
        <div className="space-y-4">
          <YellowCircleButton text="Primary Button" variant="primary" />
          <YellowCircleButton text="Secondary Button" variant="secondary" />
        </div>
      ),
      codeExample: `import { YellowCircleButton } from './yellowCircle';

<YellowCircleButton
  text="Primary Button"
  variant="primary"
/>
<YellowCircleButton
  text="Secondary Button"
  variant="secondary"
/>`,
      props: {
        text: "Click here",
        variant: "primary"
      }
    },
    {
      id: 'card',
      title: 'YellowCircle Card',
      description: 'Content card component with yellowCircle styling',
      category: 'UI',
      tags: ['card', 'content', 'layout'],
      component: (
        <YellowCircleCard
          title="Featured Project"
          content="This card showcases the yellowCircle design system with consistent spacing, typography, and color usage."
        />
      ),
      codeExample: `import { YellowCircleCard } from './yellowCircle';

<YellowCircleCard
  title="Featured Project"
  content="This card showcases the yellowCircle design system..."
/>`,
      props: {
        title: "Card Title",
        content: "Card content goes here..."
      }
    },
    {
      id: 'hero',
      title: 'YellowCircle Hero',
      description: 'Hero section component for landing pages and features',
      category: 'Sections',
      tags: ['hero', 'landing', 'header'],
      component: (
        <YellowCircleHero />
      ),
      codeExample: `import { YellowCircleHero } from './yellowCircle';

<YellowCircleHero
  headline="Creative Experiments & Digital Innovation"
  subheadline="Pushing boundaries through technology and artistic expression"
/>`,
      props: {
        headline: "Your headline here",
        subheadline: "Your subheadline here"
      }
    }
  ]
};

export {
  YellowCircleButton,
  YellowCircleCard,
  YellowCircleHero
};