import React from 'react';

// Golden Unknown Brand Colors - Mysterious & Artistic Theme
export const GoldenUnknownColors = {
  primary: "#FFD700",      // Pure gold for primary elements
  amber: "#FFA500",        // Warm amber for highlights
  bronze: "#CD7F32",       // Bronze for secondary elements
  darkGold: "#B8860B",     // Dark gold for depth
  mystery: "#2F1B14",      // Deep brown for mysterious elements
  shadow: "#1A1A1A",       // Near black for shadows
  mist: "#F5F5DC",         // Beige mist for backgrounds
  white: "#FFFFFF",        // Pure white for contrast
  glow: "rgba(255, 215, 0, 0.3)" // Golden glow effect
};

// Sample Golden Unknown components (placeholders for future development)
const GoldenMysteryButton = ({
  text = "Discover",
  variant = "golden",
  hasGlow = true,
  ...props
}) => {
  const variants = {
    golden: {
      background: `linear-gradient(135deg, ${GoldenUnknownColors.primary} 0%, ${GoldenUnknownColors.amber} 100%)`,
      color: GoldenUnknownColors.mystery,
      border: `2px solid ${GoldenUnknownColors.darkGold}`,
      boxShadow: hasGlow ? `0 0 20px ${GoldenUnknownColors.glow}, 0 4px 8px rgba(0,0,0,0.2)` : `0 4px 8px rgba(0,0,0,0.2)`
    },
    mystery: {
      backgroundColor: GoldenUnknownColors.mystery,
      color: GoldenUnknownColors.primary,
      border: `2px solid ${GoldenUnknownColors.primary}`,
      boxShadow: hasGlow ? `0 0 15px ${GoldenUnknownColors.glow}` : "none"
    },
    ethereal: {
      backgroundColor: "transparent",
      color: GoldenUnknownColors.primary,
      border: `2px solid ${GoldenUnknownColors.primary}`,
      backdropFilter: "blur(8px)",
      background: `rgba(255, 215, 0, 0.1)`
    }
  };

  return (
    <button
      style={{
        padding: "14px 28px",
        borderRadius: "25px",
        fontWeight: "600",
        fontSize: "16px",
        letterSpacing: "0.1em",
        cursor: "pointer",
        transition: "all 0.4s ease",
        fontFamily: "serif",
        textTransform: "capitalize",
        position: "relative",
        overflow: "hidden",
        ...variants[variant]
      }}
      onMouseEnter={(e) => {
        if (hasGlow) {
          e.target.style.boxShadow = `0 0 30px ${GoldenUnknownColors.glow}, 0 6px 12px rgba(0,0,0,0.3)`;
          e.target.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        e.target.style.boxShadow = variants[variant].boxShadow;
        e.target.style.transform = "translateY(0)";
      }}
      {...props}
    >
      {text}
    </button>
  );
};

const GoldenArtifactCard = ({
  title = "Ancient Artifact",
  content = "A mysterious object whose purpose remains unknown, radiating an otherworldly golden aura that defies explanation.",
  rarity = "legendary",
  showAura = true,
  ...props
}) => {
  const rarityStyles = {
    common: { borderColor: GoldenUnknownColors.bronze, glowColor: "rgba(205, 127, 50, 0.2)" },
    rare: { borderColor: GoldenUnknownColors.amber, glowColor: "rgba(255, 165, 0, 0.3)" },
    legendary: { borderColor: GoldenUnknownColors.primary, glowColor: GoldenUnknownColors.glow }
  };

  const currentRarity = rarityStyles[rarity];

  return (
    <div
      style={{
        backgroundColor: GoldenUnknownColors.mist,
        border: `2px solid ${currentRarity.borderColor}`,
        borderRadius: "16px",
        padding: "32px",
        boxShadow: showAura ?
          `0 0 25px ${currentRarity.glowColor}, 0 8px 32px rgba(0,0,0,0.1)` :
          `0 8px 32px rgba(0,0,0,0.1)`,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.4s ease"
      }}
      {...props}
    >
      {showAura && (
        <div style={{
          position: "absolute",
          top: "-50%",
          left: "-50%",
          right: "-50%",
          bottom: "-50%",
          background: `radial-gradient(circle at center, ${currentRarity.glowColor} 0%, transparent 70%)`,
          animation: "float 6s ease-in-out infinite",
          pointerEvents: "none"
        }} />
      )}

      <div style={{
        position: "absolute",
        top: "16px",
        right: "16px",
        padding: "4px 12px",
        backgroundColor: currentRarity.borderColor,
        color: GoldenUnknownColors.white,
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: "0.05em"
      }}>
        {rarity}
      </div>

      <h3 style={{
        color: GoldenUnknownColors.mystery,
        fontSize: "28px",
        fontWeight: "700",
        marginBottom: "16px",
        fontFamily: "serif",
        letterSpacing: "0.02em",
        textShadow: `1px 1px 2px ${GoldenUnknownColors.glow}`
      }}>
        {title}
      </h3>
      <p style={{
        color: GoldenUnknownColors.shadow,
        fontSize: "16px",
        lineHeight: "1.8",
        fontFamily: "serif",
        fontStyle: "italic"
      }}>
        {content}
      </p>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(1deg); }
          66% { transform: translateY(5px) rotate(-1deg); }
        }
      `}</style>
    </div>
  );
};

const GoldenMysteryHero = ({
  title = "The Golden Unknown",
  subtitle = "Enter a realm where mystery meets magnificence",
  showParticles = true,
  ...props
}) => {
  return (
    <div
      style={{
        background: `
          radial-gradient(circle at 30% 20%, ${GoldenUnknownColors.glow} 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(255, 165, 0, 0.2) 0%, transparent 50%),
          linear-gradient(135deg, ${GoldenUnknownColors.mystery} 0%, #1A1A1A 50%, ${GoldenUnknownColors.mystery} 100%)
        `,
        padding: "100px 40px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        minHeight: "400px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      }}
      {...props}
    >
      {showParticles && (
        <>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: "4px",
                height: "4px",
                backgroundColor: GoldenUnknownColors.primary,
                borderRadius: "50%",
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `twinkle ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                boxShadow: `0 0 10px ${GoldenUnknownColors.glow}`
              }}
            />
          ))}
        </>
      )}

      <h1 style={{
        color: GoldenUnknownColors.primary,
        fontSize: "64px",
        fontWeight: "300",
        marginBottom: "24px",
        letterSpacing: "0.05em",
        fontFamily: "serif",
        textShadow: `0 0 20px ${GoldenUnknownColors.glow}, 2px 2px 4px rgba(0,0,0,0.5)`,
        background: `linear-gradient(135deg, ${GoldenUnknownColors.primary} 0%, ${GoldenUnknownColors.amber} 100%)`,
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        {title}
      </h1>
      <p style={{
        color: GoldenUnknownColors.mist,
        fontSize: "22px",
        fontWeight: "400",
        maxWidth: "600px",
        margin: "0 auto",
        fontFamily: "serif",
        letterSpacing: "0.02em",
        fontStyle: "italic",
        textShadow: "1px 1px 2px rgba(0,0,0,0.7)"
      }}>
        {subtitle}
      </p>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
};

// Component registry for Golden Unknown library
export const goldenUnknownComponents = {
  'mystical-ui': [
    {
      id: 'mystery-button',
      title: 'Mystery Button',
      description: 'Enchanted button component with golden glow effects and mystical styling',
      category: 'UI',
      tags: ['button', 'mystical', 'golden', 'glow'],
      component: (
        <div className="space-y-4">
          <GoldenMysteryButton text="Discover" variant="golden" />
          <GoldenMysteryButton text="Explore" variant="mystery" />
          <GoldenMysteryButton text="Unveil" variant="ethereal" hasGlow={false} />
        </div>
      ),
      codeExample: `import { GoldenMysteryButton } from './golden-unknown';

<GoldenMysteryButton
  text="Discover the Unknown"
  variant="golden"
  hasGlow={true}
/>`,
      props: {
        text: "Discover",
        variant: "golden",
        hasGlow: true
      }
    },
    {
      id: 'artifact-card',
      title: 'Artifact Card',
      description: 'Mystical content card with rarity indicators and ethereal glow effects',
      category: 'Layout',
      tags: ['card', 'artifact', 'rarity', 'mystical'],
      component: (
        <div className="space-y-4">
          <GoldenArtifactCard rarity="legendary" />
          <GoldenArtifactCard
            title="Forgotten Scroll"
            content="Ancient writings that shimmer with hidden knowledge, waiting to be deciphered by worthy souls."
            rarity="rare"
          />
        </div>
      ),
      codeExample: `import { GoldenArtifactCard } from './golden-unknown';

<GoldenArtifactCard
  title="Ancient Artifact"
  content="A mysterious object whose purpose remains unknown..."
  rarity="legendary"
  showAura={true}
/>`,
      props: {
        title: "Ancient Artifact",
        rarity: "legendary",
        showAura: true
      }
    },
    {
      id: 'mystery-hero',
      title: 'Mystery Hero',
      description: 'Enchanting hero section with floating particles and golden gradients',
      category: 'Sections',
      tags: ['hero', 'mystical', 'particles', 'golden'],
      component: (
        <GoldenMysteryHero />
      ),
      codeExample: `import { GoldenMysteryHero } from './golden-unknown';

<GoldenMysteryHero
  title="The Golden Unknown"
  subtitle="Enter a realm where mystery meets magnificence"
  showParticles={true}
/>`,
      props: {
        title: "The Golden Unknown",
        subtitle: "Enter a realm where mystery meets magnificence",
        showParticles: true
      }
    }
  ]
};

export {
  GoldenMysteryButton,
  GoldenArtifactCard,
  GoldenMysteryHero
};