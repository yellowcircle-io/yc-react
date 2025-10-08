import React from 'react';

// Cath3dral Brand Colors - Architectural & Sacred Geometry Theme
export const Cath3dralColors = {
  primary: "#2D3748",      // Deep slate for primary elements
  secondary: "#4A5568",    // Medium slate for secondary elements
  accent: "#E2E8F0",       // Light accent for highlights
  stone: "#718096",        // Stone gray for architectural elements
  gold: "#D69E2E",         // Sacred gold for special accents
  white: "#FFFFFF",        // Pure white for contrast
  black: "#1A202C",        // Deep black for text
  shadow: "rgba(45, 55, 72, 0.1)" // Subtle shadows
};

// Sample Cath3dral components (placeholders for future development)
const Cath3dralArchButton = ({
  text = "Enter",
  variant = "stone",
  ...props
}) => {
  const variants = {
    stone: {
      backgroundColor: Cath3dralColors.stone,
      color: Cath3dralColors.white,
      border: `2px solid ${Cath3dralColors.stone}`,
      boxShadow: `0 4px 8px ${Cath3dralColors.shadow}`
    },
    gold: {
      backgroundColor: Cath3dralColors.gold,
      color: Cath3dralColors.black,
      border: `2px solid ${Cath3dralColors.gold}`,
      boxShadow: `0 4px 8px rgba(214, 158, 46, 0.3)`
    },
    outline: {
      backgroundColor: "transparent",
      color: Cath3dralColors.primary,
      border: `2px solid ${Cath3dralColors.primary}`
    }
  };

  return (
    <button
      style={{
        padding: "16px 32px",
        borderRadius: "4px",
        fontWeight: "600",
        fontSize: "16px",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "all 0.3s ease",
        fontFamily: "serif",
        ...variants[variant]
      }}
      {...props}
    >
      {text}
    </button>
  );
};

const Cath3dralGeometryCard = ({
  title = "Sacred Geometry",
  content = "Exploring the intersection of mathematical precision and spiritual architecture through digital mediums.",
  pattern = "circle",
  ...props
}) => {
  const patterns = {
    circle: "radial-gradient(circle at center, rgba(214, 158, 46, 0.1) 0%, transparent 70%)",
    triangle: "linear-gradient(45deg, rgba(45, 55, 72, 0.05) 25%, transparent 25%, transparent 75%, rgba(45, 55, 72, 0.05) 75%)",
    square: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(45, 55, 72, 0.03) 10px, rgba(45, 55, 72, 0.03) 20px)"
  };

  return (
    <div
      style={{
        backgroundColor: Cath3dralColors.white,
        border: `1px solid ${Cath3dralColors.accent}`,
        borderRadius: "8px",
        padding: "32px",
        boxShadow: `0 8px 24px ${Cath3dralColors.shadow}`,
        background: `${Cath3dralColors.white} ${patterns[pattern]}`,
        position: "relative",
        overflow: "hidden"
      }}
      {...props}
    >
      <div style={{
        position: "absolute",
        top: "16px",
        right: "16px",
        width: "24px",
        height: "24px",
        border: `2px solid ${Cath3dralColors.gold}`,
        borderRadius: pattern === "circle" ? "50%" : "4px",
        transform: pattern === "triangle" ? "rotate(45deg)" : "none"
      }} />
      <h3 style={{
        color: Cath3dralColors.primary,
        fontSize: "24px",
        fontWeight: "700",
        marginBottom: "16px",
        fontFamily: "serif",
        letterSpacing: "0.02em"
      }}>
        {title}
      </h3>
      <p style={{
        color: Cath3dralColors.secondary,
        fontSize: "16px",
        lineHeight: "1.7",
        fontFamily: "serif"
      }}>
        {content}
      </p>
    </div>
  );
};

const Cath3dralArchHeader = ({
  title = "Cathedral of Code",
  subtitle = "Where Architecture Meets Algorithm",
  showPillars = true,
  ...props
}) => {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${Cath3dralColors.primary} 0%, ${Cath3dralColors.secondary} 100%)`,
        padding: "80px 40px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
      }}
      {...props}
    >
      {showPillars && (
        <>
          <div style={{
            position: "absolute",
            left: "10%",
            top: "0",
            bottom: "0",
            width: "4px",
            background: `linear-gradient(to bottom, transparent 0%, ${Cath3dralColors.gold} 20%, ${Cath3dralColors.gold} 80%, transparent 100%)`,
            opacity: 0.6
          }} />
          <div style={{
            position: "absolute",
            right: "10%",
            top: "0",
            bottom: "0",
            width: "4px",
            background: `linear-gradient(to bottom, transparent 0%, ${Cath3dralColors.gold} 20%, ${Cath3dralColors.gold} 80%, transparent 100%)`,
            opacity: 0.6
          }} />
        </>
      )}
      <h1 style={{
        color: Cath3dralColors.white,
        fontSize: "56px",
        fontWeight: "300",
        marginBottom: "16px",
        letterSpacing: "0.02em",
        fontFamily: "serif",
        textShadow: `2px 2px 4px ${Cath3dralColors.shadow}`
      }}>
        {title}
      </h1>
      <p style={{
        color: Cath3dralColors.accent,
        fontSize: "20px",
        fontWeight: "400",
        maxWidth: "600px",
        margin: "0 auto",
        fontFamily: "serif",
        letterSpacing: "0.05em"
      }}>
        {subtitle}
      </p>
    </div>
  );
};

// Component registry for Cath3dral library
export const cath3dralComponents = {
  'architectural-ui': [
    {
      id: 'arch-button',
      title: 'Architectural Button',
      description: 'Button component inspired by cathedral stonework and sacred geometry',
      category: 'UI',
      tags: ['button', 'architectural', 'sacred-geometry'],
      component: (
        <div className="space-y-4">
          <Cath3dralArchButton text="Stone" variant="stone" />
          <Cath3dralArchButton text="Gold" variant="gold" />
          <Cath3dralArchButton text="Outline" variant="outline" />
        </div>
      ),
      codeExample: `import { Cath3dralArchButton } from './cath3dral';

<Cath3dralArchButton
  text="Enter Sacred Space"
  variant="stone"
/>`,
      props: {
        text: "Enter",
        variant: "stone"
      }
    },
    {
      id: 'geometry-card',
      title: 'Sacred Geometry Card',
      description: 'Content card with geometric patterns and architectural styling',
      category: 'Layout',
      tags: ['card', 'geometry', 'pattern'],
      component: (
        <div className="space-y-4">
          <Cath3dralGeometryCard pattern="circle" />
          <Cath3dralGeometryCard
            title="Divine Proportion"
            content="The golden ratio manifests in both natural forms and architectural masterpieces."
            pattern="triangle"
          />
        </div>
      ),
      codeExample: `import { Cath3dralGeometryCard } from './cath3dral';

<Cath3dralGeometryCard
  title="Sacred Geometry"
  content="Exploring mathematical precision..."
  pattern="circle"
/>`,
      props: {
        title: "Sacred Geometry",
        pattern: "circle"
      }
    },
    {
      id: 'arch-header',
      title: 'Cathedral Header',
      description: 'Monumental header component with architectural pillar elements',
      category: 'Sections',
      tags: ['header', 'cathedral', 'pillars'],
      component: (
        <Cath3dralArchHeader />
      ),
      codeExample: `import { Cath3dralArchHeader } from './cath3dral';

<Cath3dralArchHeader
  title="Cathedral of Code"
  subtitle="Where Architecture Meets Algorithm"
  showPillars={true}
/>`,
      props: {
        title: "Cathedral of Code",
        subtitle: "Where Architecture Meets Algorithm",
        showPillars: true
      }
    }
  ]
};

export {
  Cath3dralArchButton,
  Cath3dralGeometryCard,
  Cath3dralArchHeader
};