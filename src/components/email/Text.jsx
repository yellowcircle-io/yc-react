import React from 'react';
import { BRAND_CONFIG } from './index';

/**
 * Text - Typography components for email content
 *
 * Email-safe text components with proper inline styles.
 */

/**
 * Heading - H1, H2, H3 headings
 */
export function Heading({
  children,
  level = 1,
  color = BRAND_CONFIG.colors.black,
  align = 'left',
  padding = '0 40px',
  backgroundColor = BRAND_CONFIG.colors.white
}) {
  const sizes = {
    1: { fontSize: '32px', fontWeight: 700, lineHeight: 1.2, marginBottom: '16px' },
    2: { fontSize: '24px', fontWeight: 700, lineHeight: 1.3, marginBottom: '12px' },
    3: { fontSize: '18px', fontWeight: 600, lineHeight: 1.4, marginBottom: '10px' }
  };

  const style = sizes[level] || sizes[1];
  const Tag = `h${level}`;

  return (
    <tr>
      <td
        align={align}
        style={{ backgroundColor, padding }}
      >
        <Tag
          style={{
            margin: `0 0 ${style.marginBottom}`,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
            color,
            fontFamily: BRAND_CONFIG.fonts.heading,
            letterSpacing: '-0.01em'
          }}
        >
          {children}
        </Tag>
      </td>
    </tr>
  );
}

/**
 * Paragraph - Body text
 */
export function Paragraph({
  children,
  color = BRAND_CONFIG.colors.gray,
  align = 'left',
  padding = '0 40px',
  backgroundColor = BRAND_CONFIG.colors.white,
  size = 'medium'
}) {
  const sizes = {
    small: { fontSize: '13px', lineHeight: 1.5 },
    medium: { fontSize: '15px', lineHeight: 1.6 },
    large: { fontSize: '17px', lineHeight: 1.7 }
  };

  const style = sizes[size] || sizes.medium;

  return (
    <tr>
      <td
        align={align}
        style={{ backgroundColor, padding }}
      >
        <p
          style={{
            margin: '0 0 16px',
            fontSize: style.fontSize,
            lineHeight: style.lineHeight,
            color,
            fontFamily: BRAND_CONFIG.fonts.primary
          }}
        >
          {children}
        </p>
      </td>
    </tr>
  );
}

/**
 * Label - Small uppercase label text
 */
export function Label({
  children,
  color = BRAND_CONFIG.colors.lightGray,
  align = 'left',
  padding = '0 40px',
  backgroundColor = BRAND_CONFIG.colors.white
}) {
  return (
    <tr>
      <td
        align={align}
        style={{ backgroundColor, padding }}
      >
        <p
          style={{
            margin: '0 0 8px',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color,
            fontFamily: BRAND_CONFIG.fonts.primary
          }}
        >
          {children}
        </p>
      </td>
    </tr>
  );
}

/**
 * Link - Styled anchor text
 */
export function Link({
  children,
  href,
  color = BRAND_CONFIG.colors.yellow,
  underline = true
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color,
        textDecoration: underline ? 'underline' : 'none',
        fontWeight: 500
      }}
    >
      {children}
    </a>
  );
}

/**
 * Quote - Blockquote styling
 */
export function Quote({
  children,
  borderColor = BRAND_CONFIG.colors.yellow,
  padding = '0 40px',
  backgroundColor = BRAND_CONFIG.colors.white
}) {
  return (
    <tr>
      <td style={{ backgroundColor, padding }}>
        <table
          role="presentation"
          cellPadding="0"
          cellSpacing="0"
          style={{ width: '100%', borderCollapse: 'collapse' }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  borderLeft: `4px solid ${borderColor}`,
                  paddingLeft: '20px'
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    lineHeight: 1.6,
                    fontStyle: 'italic',
                    color: BRAND_CONFIG.colors.gray,
                    fontFamily: BRAND_CONFIG.fonts.primary
                  }}
                >
                  {children}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
}

/**
 * List - Bulleted or numbered list
 */
export function List({
  items = [],
  ordered = false,
  color = BRAND_CONFIG.colors.gray,
  padding = '0 40px',
  backgroundColor = BRAND_CONFIG.colors.white
}) {
  return (
    <tr>
      <td style={{ backgroundColor, padding }}>
        <table
          role="presentation"
          cellPadding="0"
          cellSpacing="0"
          style={{ width: '100%', borderCollapse: 'collapse' }}
        >
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td
                  valign="top"
                  width="24"
                  style={{
                    fontSize: '15px',
                    lineHeight: 1.6,
                    color,
                    fontFamily: BRAND_CONFIG.fonts.primary,
                    paddingBottom: '8px'
                  }}
                >
                  {ordered ? `${index + 1}.` : '•'}
                </td>
                <td
                  valign="top"
                  style={{
                    fontSize: '15px',
                    lineHeight: 1.6,
                    color,
                    fontFamily: BRAND_CONFIG.fonts.primary,
                    paddingBottom: '8px',
                    paddingLeft: '8px'
                  }}
                >
                  {item}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </td>
    </tr>
  );
}

// Default export
function Text({ children, ...props }) {
  return <Paragraph {...props}>{children}</Paragraph>;
}

export default Text;
