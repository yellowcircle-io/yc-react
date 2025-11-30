import React from 'react';
import { BRAND_CONFIG } from './index';

/**
 * Button - Email-safe CTA button
 *
 * Uses bulletproof button technique for maximum email client compatibility.
 * Supports primary (yellow) and secondary (outline) variants.
 *
 * @param {string} text - Button text
 * @param {string} href - Button link URL
 * @param {string} variant - 'primary' | 'secondary' | 'dark'
 * @param {string} align - 'left' | 'center' | 'right'
 * @param {boolean} fullWidth - Make button full width
 * @param {string} padding - Container padding
 */
function Button({
  text = 'Learn More',
  href = '#',
  variant = 'primary',
  align = 'center',
  fullWidth = false,
  padding = '30px 40px'
}) {
  const variants = {
    primary: {
      backgroundColor: BRAND_CONFIG.colors.yellow,
      textColor: BRAND_CONFIG.colors.black,
      borderColor: BRAND_CONFIG.colors.yellow
    },
    secondary: {
      backgroundColor: 'transparent',
      textColor: BRAND_CONFIG.colors.black,
      borderColor: BRAND_CONFIG.colors.black
    },
    dark: {
      backgroundColor: BRAND_CONFIG.colors.black,
      textColor: BRAND_CONFIG.colors.white,
      borderColor: BRAND_CONFIG.colors.black
    }
  };

  const style = variants[variant] || variants.primary;

  return (
    <tr>
      <td align={align} style={{ padding }}>
        <table
          role="presentation"
          cellPadding="0"
          cellSpacing="0"
          style={{
            borderCollapse: 'collapse',
            width: fullWidth ? '100%' : 'auto'
          }}
        >
          <tbody>
            <tr>
              <td
                align="center"
                style={{
                  backgroundColor: style.backgroundColor,
                  border: `2px solid ${style.borderColor}`,
                  borderRadius: '4px',
                  padding: 0
                }}
              >
                {/* Bulletproof button technique */}
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '14px 32px',
                    fontSize: '14px',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: style.textColor,
                    textDecoration: 'none',
                    fontFamily: BRAND_CONFIG.fonts.primary,
                    width: fullWidth ? '100%' : 'auto',
                    boxSizing: 'border-box',
                    textAlign: 'center'
                  }}
                >
                  {text}
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
}

/**
 * ButtonRow - Multiple buttons in a row
 */
export function ButtonRow({ buttons = [], align = 'center', padding = '30px 40px' }) {
  return (
    <tr>
      <td align={align} style={{ padding }}>
        <table
          role="presentation"
          cellPadding="0"
          cellSpacing="0"
          style={{ borderCollapse: 'collapse' }}
        >
          <tbody>
            <tr>
              {buttons.map((btn, index) => (
                <td
                  key={index}
                  style={{ paddingRight: index < buttons.length - 1 ? '16px' : 0 }}
                >
                  <Button {...btn} padding="0" />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
}

export default Button;
