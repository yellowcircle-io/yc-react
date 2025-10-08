# MVP Component Library System - Claude Code Instructions

## Project Overview
Create a sophisticated component library system within the yellowCircle portfolio website that serves both personal projects and work use cases, with copy/paste functionality similar to tailwindui.com.

## Architecture Requirements

### 1. Main Directory Structure
Create a new section under `/experiments` called **Component Library** with the following structure:

```
/experiments/component-library/
├── index.jsx (main library dashboard)
├── components/
│   ├── LibraryFilter.jsx (filter/search component)
│   ├── ComponentCard.jsx (individual component display)
│   ├── CodeBlock.jsx (copy/paste code display)
│   └── PreviewFrame.jsx (component preview)
├── libraries/
│   ├── yellowcircle/
│   ├── cath3dral/
│   ├── golden-unknown/
│   └── rho/
│       ├── index.jsx
│       ├── email-components/
│       └── atoms/
└── utils/
    └── copyToClipboard.js
```

### 2. Component Library Dashboard (`/experiments/component-library/index.jsx`)

#### Key Features:
- **Library Filter Tabs**: Four primary filters (yellowCircle, Cath3dral, Golden Unknown, Rho)
- **Search Functionality**: Search components by name, type, or category
- **Copy/Paste Interface**: Click-to-copy functionality with visual feedback
- **Preview Mode**: Live component previews with responsive testing
- **Category Filters**: Buttons, Cards, Forms, Email Components, etc.

#### UI Layout:
```jsx
// Main dashboard layout structure
<div className="min-h-screen bg-gray-50">
  <header className="bg-white shadow-sm border-b">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center py-6">
        <h1 className="text-3xl font-bold text-gray-900">Component Library</h1>
        <div className="flex space-x-4">
          {/* Library Filter Tabs */}
        </div>
      </div>
    </div>
  </header>
  
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="flex flex-col lg:flex-row gap-8">
      <aside className="lg:w-64">
        {/* Category Sidebar */}
      </aside>
      <div className="flex-1">
        {/* Component Grid */}
      </div>
    </div>
  </main>
</div>
```

### 3. Rho Email Library Implementation

#### Email Components Structure:
Based on the analyzed Rho email template, create these six main partials:

##### A. Header Component (`/libraries/rho/email-components/Header.jsx`)
```jsx
// Template structure with logo left, date/kicker right
const Header = ({ date = "10.02.2025", kicker = "Event Recap" }) => {
  return (
    <table role="presentation" width="100%" cellSpacing="0" style={{ background: "#FFFFFF", border: 0, borderBottom: "0.5px solid #d9dfdf" }}>
      <tbody>
        <tr>
          <td style={{ padding: "20px 0" }}>
            <table role="presentation" width="100%" cellSpacing="0" style={{ border: 0 }}>
              <tbody>
                <tr>
                  <td style={{ paddingLeft: "20px" }} valign="middle">
                    <img src="https://39998325.fs1.hubspotusercontent-na1.net/hubfs/39998325/Rho-logo-25.png" 
                         width="110" height="50" alt="Rho Logo" style={{ display: "block", height: "auto", maxWidth: "110px", width: "110px" }} />
                  </td>
                  <td style={{ paddingRight: "20px" }} align="right" valign="middle">
                    <div style={{ fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif", fontSize: "14px", lineHeight: "20px", fontWeight: "bold", color: "#000" }}>
                      {date}
                    </div>
                    <div style={{ fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif", fontSize: "14px", lineHeight: "20px", fontWeight: "bold", color: "#000" }}>
                      {kicker}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
};
```

##### B. Body with CTA Component (`/libraries/rho/email-components/BodyWithCTA.jsx`)
```jsx
// Body content with paragraph styling and CTA button
const BodyWithCTA = ({ greeting, content, ctaText = "Keep me updated", ctaUrl = "#" }) => {
  return (
    <table role="presentation" width="100%" cellSpacing="0" style={{ background: "#FFFFFF", border: 0, borderBottom: "0.5px solid #d9dfdf" }}>
      <tbody>
        <tr>
          <td style={{ padding: "24px 24px 8px 24px" }}>
            <p style={{ padding: "24px 0", margin: 0, fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif", fontSize: "14px", lineHeight: "20px", color: "#000", fontWeight: 400 }}>
              <span style={{ fontSize: "16px" }}>{greeting}</span>
            </p>
            {content.map((paragraph, index) => (
              <p key={index} style={{ margin: "16px 0 0 0", fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif", fontSize: "14px", lineHeight: "20px", color: "#000", fontWeight: 400 }}>
                <span style={{ fontSize: "16px" }}>{paragraph}</span>
              </p>
            ))}
            <div style={{ padding: "24px 0" }}>
              <a href={ctaUrl} 
                 style={{ display: "inline-block", background: "#00ECC0", borderRadius: "2px", padding: "12px 20px", fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif", fontSize: "16px", lineHeight: "20px", fontWeight: "bold", color: "#000", textDecoration: "none" }}>
                {ctaText}
              </a>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
};
```

##### C. Highlight Section (`/libraries/rho/email-components/Highlight.jsx`)
```jsx
// Large headline with supporting text
const Highlight = ({ headline, description }) => {
  return (
    <table role="presentation" width="100%" cellSpacing="0" style={{ background: "#ffffff", border: "0px 0px 0.5px", borderColor: "#d9dfdf", borderStyle: "solid", height: "156px" }}>
      <tbody>
        <tr style={{ height: "96px" }}>
          <td style={{ padding: "24px 24px 8px 24px", height: "96px" }}>
            <div style={{ fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif", fontSize: "42px", lineHeight: "48px", fontWeight: "lighter", color: "#000" }}>
              {headline}
            </div>
          </td>
        </tr>
        <tr style={{ height: "60px" }}>
          <td style={{ padding: "0px 24px 24px 24px", height: "60px" }}>
            <div style={{ maxWidth: "560px", fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif", fontSize: "14px", lineHeight: "20px", color: "#000", fontWeight: 400 }}>
              {description}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
};
```

##### D. Two Column Cards (`/libraries/rho/email-components/TwoColumnCards.jsx`)
```jsx
// Side-by-side card layout for showcasing items
const TwoColumnCards = ({ cards }) => {
  return (
    <table role="presentation" width="100%" cellSpacing="0" style={{ background: "#FFFFFF", border: 0, borderBottom: "0.5px solid #d9dfdf" }}>
      <tbody>
        <tr>
          <td style={{ padding: "24px 24px 0px 24px" }}>
            <table role="presentation" width="100%" cellSpacing="0" style={{ border: 0 }}>
              <tbody>
                <tr>
                  {cards.map((card, index) => (
                    <td key={index} style={{ padding: "0 5px 0 0", width: "50%" }} valign="top">
                      <table role="presentation" width="100%" style={{ border: "1px solid #CCCCCC", borderRadius: "6px", overflow: "hidden" }}>
                        <tbody>
                          <tr>
                            <td>
                              <img src={card.image} width="100%" height="120" alt={card.alt} style={{ display: "block", height: "120px", objectFit: "cover" }} />
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: "16px" }}>
                              <div style={{ fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif", fontSize: "18px", fontWeight: "bold", color: "#000", marginBottom: "8px" }}>
                                {card.title}
                              </div>
                              <div style={{ fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif", fontSize: "14px", color: "#000", marginBottom: "16px" }}>
                                {card.description}
                              </div>
                              <a href={card.url} style={{ display: "inline-block", color: "#000", textDecoration: "underline", fontSize: "14px" }}>
                                {card.linkText}
                              </a>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
};
```

##### E. Pre-Footer (`/libraries/rho/email-components/PreFooter.jsx`)
```jsx
// Testimonial/quote section with CTA
const PreFooter = ({ headline, description, testimonials, ctaText, ctaUrl }) => {
  return (
    <table role="presentation" width="100%" cellSpacing="0" style={{ background: "#FFFFFF", border: 0 }}>
      <tbody>
        <tr>
          <td style={{ padding: "24px 24px 8px 24px" }}>
            <div style={{ fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif", fontSize: "42px", lineHeight: "48px", fontWeight: "lighter", color: "#000" }}>
              {headline}
            </div>
          </td>
        </tr>
        <tr>
          <td style={{ padding: "0 24px 12px 24px" }}>
            <div style={{ maxWidth: "560px", fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif", fontSize: "16px", lineHeight: "20px", color: "#000", fontWeight: 400 }}>
              {description}
            </div>
          </td>
        </tr>
        <tr>
          <td style={{ padding: "24px 24px 20px 24px" }}>
            <table role="presentation" width="100%" cellSpacing="0" style={{ border: 0 }}>
              <tbody>
                <tr>
                  {testimonials.map((testimonial, index) => (
                    <td key={index} style={{ padding: "0 5px 0 0", width: "50%" }} valign="top">
                      <div style={{ background: "#d9dfdf", borderRadius: "10px", padding: "20px" }}>
                        <div style={{ fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif", fontSize: "14px", color: "#000", marginBottom: "16px" }}>
                          "{testimonial.quote}"
                        </div>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <img src={testimonial.avatar} width="40" height="40" style={{ borderRadius: "50%", marginRight: "12px" }} />
                          <div>
                            <div style={{ fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif", fontSize: "14px", fontWeight: "bold", color: "#000" }}>
                              {testimonial.name}
                            </div>
                            <div style={{ fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif", fontSize: "12px", color: "#555" }}>
                              {testimonial.title}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
        {ctaText && (
          <tr>
            <td style={{ padding: "0 24px 24px 24px" }}>
              <a href={ctaUrl} style={{ display: "inline-block", background: "#00ECC0", borderRadius: "2px", padding: "12px 20px", fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif", fontSize: "16px", lineHeight: "20px", fontWeight: "bold", color: "#000", textDecoration: "none" }}>
                {ctaText}
              </a>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};
```

##### F. Footer Component (`/libraries/rho/email-components/Footer.jsx`)
```jsx
// Company footer with contact information
const Footer = ({ companyName = "Rho Technologies", address = "100 Crosby Street", city = "New York", state = "NY", zip = "10012" }) => {
  return (
    <table role="presentation" width="100%" cellSpacing="0" style={{ background: "#FFFFFF", border: 0 }}>
      <tbody>
        <tr>
          <td style={{ padding: "24px", textAlign: "center" }}>
            <div style={{ fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif", fontSize: "14px", color: "#000", fontWeight: "bold" }}>
              {companyName}
            </div>
            <div style={{ fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif", fontSize: "14px", color: "#000" }}>
              {address}
            </div>
            <div style={{ fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif", fontSize: "14px", color: "#000" }}>
              {city}, {state} {zip}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
};
```

#### Atomic Components (`/libraries/rho/atoms/`)

##### A. Button Component (`Button.jsx`)
```jsx
const Button = ({ 
  text, 
  href = "#", 
  backgroundColor = "#00ECC0", 
  textColor = "#000", 
  padding = "12px 20px",
  borderRadius = "2px",
  fontSize = "16px"
}) => {
  return (
    <a href={href} 
       style={{ 
         display: "inline-block", 
         background: backgroundColor, 
         borderRadius: borderRadius, 
         padding: padding, 
         fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif", 
         fontSize: fontSize, 
         lineHeight: "20px", 
         fontWeight: "bold", 
         color: textColor, 
         textDecoration: "none" 
       }}>
      {text}
    </a>
  );
};
```

##### B. Horizontal Rule (`HorizontalRule.jsx`)
```jsx
const HorizontalRule = ({ color = "#d9dfdf", thickness = "0.5px" }) => {
  return (
    <div style={{ 
      borderBottom: `${thickness} solid ${color}`, 
      width: "100%", 
      margin: "0" 
    }} />
  );
};
```

##### C. Color Palette (`ColorPalette.jsx`)
```jsx
const RhoColors = {
  primary: "#00ECC0",      // Rho Green
  black: "#000000",        // Primary text
  gray: "#d9dfdf",         // Borders/dividers
  lightGray: "#f8f9fa",    // Background
  darkGray: "#555555",     // Secondary text
  white: "#FFFFFF"         // Background/text
};

const ColorPalette = () => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Object.entries(RhoColors).map(([name, value]) => (
        <div key={name} className="flex flex-col items-center">
          <div 
            className="w-16 h-16 border border-gray-200 rounded-lg mb-2"
            style={{ backgroundColor: value }}
          />
          <span className="text-sm font-medium">{name}</span>
          <span className="text-xs text-gray-500">{value}</span>
        </div>
      ))}
    </div>
  );
};
```

### 4. Personal Library Placeholders

#### Create placeholder structures for:
- **yellowCircle**: Use yellow (#EECF00) as primary color
- **Cath3dral**: Use architectural/cathedral imagery, dark theme
- **Golden Unknown**: Use gold/amber colors (#FFD700)

Each should have basic component structures ready for future expansion.

### 5. Copy/Paste Functionality

#### Implementation (`/utils/copyToClipboard.js`)
```javascript
export const copyToClipboard = async (text, elementRef = null) => {
  try {
    await navigator.clipboard.writeText(text);
    
    // Visual feedback
    if (elementRef) {
      const originalText = elementRef.textContent;
      elementRef.textContent = 'Copied!';
      elementRef.style.background = '#10B981';
      
      setTimeout(() => {
        elementRef.textContent = originalText;
        elementRef.style.background = '';
      }, 2000);
    }
    
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

export const generateComponentCode = (componentName, props) => {
  // Generate React component code with proper formatting
  const propsString = Object.entries(props)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
    
  return `<${componentName} ${propsString} />`;
};

export const generateHTMLCode = (componentHTML) => {
  // Format and return clean HTML for email templates
  return componentHTML.replace(/\s+/g, ' ').trim();
};
```

### 6. Standalone Rho Export

#### Create Standalone Export (`/libraries/rho/standalone/index.html`)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rho Email Component Library</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    /* Tailwind CSS CDN or inline styles */
    /* Component library specific styles */
  </style>
</head>
<body>
  <div id="root"></div>
  
  <script type="text/babel">
    // Standalone Rho component library app
    // Include all email components and atoms
    // Provide copy/paste functionality
    // No references to yellowCircle branding
  </script>
</body>
</html>
```

### 7. Routing Integration

#### Update RouterApp.jsx to include:
```jsx
// Add to existing experiments routes
{
  path: "component-library",
  element: <ComponentLibraryPage />
},
{
  path: "component-library/rho",
  element: <RhoLibraryPage />
}
```

### 8. Development Instructions for Claude Code

#### Execution Steps:
1. **Analyze Existing Structure**: Review current yellowCircle website structure and routing
2. **Create Directory Structure**: Set up all folders and base files
3. **Implement Main Dashboard**: Build the central component library interface
4. **Build Rho Email Components**: Create all six email partials with exact styling from templates
5. **Develop Atomic Components**: Build reusable button, color, and layout atoms
6. **Add Copy/Paste Functionality**: Implement clipboard operations with visual feedback
7. **Create Personal Library Placeholders**: Set up yellowCircle, Cath3dral, Golden Unknown sections
8. **Build Standalone Export**: Create isolated Rho library version
9. **Test Integration**: Ensure all components work within existing site architecture
10. **Optimize Performance**: Lazy load components, optimize bundle sizes

#### Key Requirements:
- **Responsive Design**: All components must work on mobile/desktop
- **Copy/Paste Ready**: Clean, formatted code output for easy implementation
- **Brand Consistency**: Maintain Rho styling exactly as specified
- **Modular Architecture**: Each component should be independently usable
- **Error Handling**: Graceful fallbacks for missing props or data
- **Performance Optimized**: Fast loading, minimal re-renders

#### Testing Checklist:
- [ ] All six Rho email components render correctly
- [ ] Copy/paste functionality works for all components
- [ ] Responsive design works on mobile devices  
- [ ] Search and filtering work properly
- [ ] Standalone Rho export functions independently
- [ ] Integration with existing yellowCircle site is seamless
- [ ] All atomic components render with proper styling
- [ ] Personal library placeholders display correctly

#### Claude Code Autonomous Instructions:
Work through each step methodically, testing components as you build them. Fix any errors immediately and ensure each component matches the provided specifications exactly. Use the existing yellowCircle tech stack (React, Tailwind, Vite) and maintain consistency with the current site architecture. Generate clean, production-ready code that can be immediately deployed.