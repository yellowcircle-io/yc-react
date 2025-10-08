import React from 'react';

// Rho Brand Color Definitions
export const RhoColors = {
  primary: "#00ECC0",      // Rho Green - Primary CTA and accent color
  black: "#000000",        // Primary text and strong elements
  gray: "#d9dfdf",         // Borders, dividers, and subtle elements
  lightGray: "#f8f9fa",    // Background sections and cards
  darkGray: "#555555",     // Secondary text and muted content
  white: "#FFFFFF",        // Background and contrast text
  success: "#10B981",      // Success states and confirmations
  warning: "#F59E0B",      // Warning states and attention
  error: "#EF4444",        // Error states and critical actions
  info: "#3B82F6"          // Information and links
};

// Color usage guidelines
export const ColorUsage = {
  primary: "Main CTA buttons, key interactive elements, brand accents",
  black: "Headlines, body text, navigation, primary content",
  gray: "Borders, dividers, form inputs, subtle separations",
  lightGray: "Card backgrounds, section backgrounds, disabled states",
  darkGray: "Secondary text, captions, metadata, muted content",
  white: "Page backgrounds, card content, reverse text on dark backgrounds",
  success: "Success messages, confirmations, positive feedback",
  warning: "Warnings, caution messages, pending states",
  error: "Error messages, form validation, critical alerts",
  info: "Links, information callouts, helper text"
};

const ColorPalette = ({
  showUsage = false,
  layout = "grid",  // "grid" or "list"
  showHex = true,
  showNames = true,
  interactive = true
}) => {
  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  const ColorSwatch = ({ name, value, usage }) => {
    const isLight = value === "#FFFFFF" || value === "#f8f9fa";

    return (
      <div
        className={`${interactive ? 'cursor-pointer hover:scale-105' : ''} transition-transform duration-200`}
        onClick={() => interactive && copyToClipboard(value)}
        title={interactive ? `Click to copy ${value}` : value}
      >
        <div
          className={`w-16 h-16 border ${isLight ? 'border-gray-300' : 'border-gray-200'} rounded-lg mb-2 shadow-sm`}
          style={{ backgroundColor: value }}
        />
        {showNames && (
          <div className="text-sm font-medium capitalize mb-1">{name}</div>
        )}
        {showHex && (
          <div className="text-xs text-gray-500 font-mono">{value}</div>
        )}
        {showUsage && usage && (
          <div className="text-xs text-gray-400 mt-1 leading-tight">{usage}</div>
        )}
      </div>
    );
  };

  if (layout === "list") {
    return (
      <div className="space-y-4">
        {Object.entries(RhoColors).map(([name, value]) => (
          <div key={name} className="flex items-center space-x-4">
            <div
              className="w-12 h-12 border border-gray-200 rounded-lg shadow-sm flex-shrink-0"
              style={{ backgroundColor: value }}
            />
            <div className="flex-1">
              <div className="font-medium capitalize">{name}</div>
              <div className="text-sm text-gray-500 font-mono">{value}</div>
              {showUsage && ColorUsage[name] && (
                <div className="text-sm text-gray-400 mt-1">{ColorUsage[name]}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {Object.entries(RhoColors).map(([name, value]) => (
        <ColorSwatch
          key={name}
          name={name}
          value={value}
          usage={ColorUsage[name]}
        />
      ))}
    </div>
  );
};

// Utility component for displaying single color with details
export const ColorDetail = ({ colorName, showCSS = false }) => {
  const color = RhoColors[colorName];
  const usage = ColorUsage[colorName];

  if (!color) return null;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-start space-x-4">
        <div
          className="w-20 h-20 border border-gray-200 rounded-lg shadow-sm flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1">
          <h3 className="font-semibold text-lg capitalize mb-2">{colorName}</h3>
          <p className="text-gray-600 font-mono text-sm mb-2">{color}</p>
          {usage && (
            <p className="text-gray-500 text-sm mb-3">{usage}</p>
          )}
          {showCSS && (
            <div className="text-xs bg-gray-50 p-3 rounded border font-mono">
              <div>color: {color};</div>
              <div>background-color: {color};</div>
              <div>border-color: {color};</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// CSS Variables export for easy integration
export const generateCSSVariables = () => {
  return Object.entries(RhoColors)
    .map(([name, value]) => `  --rho-${name}: ${value};`)
    .join('\n');
};

export default ColorPalette;