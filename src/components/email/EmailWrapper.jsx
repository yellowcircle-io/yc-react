import React from 'react';
import { BRAND_CONFIG } from './index';

/**
 * EmailWrapper - Main container for email templates
 *
 * Provides the outer table structure, background, and responsive container.
 * All email content should be wrapped in this component.
 *
 * @param {React.ReactNode} children - Email content
 * @param {string} backgroundColor - Outer background color (default: #f4f4f4)
 * @param {number} width - Content width in pixels (default: 600)
 * @param {boolean} preheader - Optional preheader text (hidden preview text)
 */
function EmailWrapper({
  children,
  backgroundColor = '#f4f4f4',
  width = 600,
  preheader = ''
}) {
  return (
    <table
      role="presentation"
      cellPadding="0"
      cellSpacing="0"
      style={{
        width: '100%',
        backgroundColor,
        margin: 0,
        padding: 0,
        borderCollapse: 'collapse'
      }}
    >
      <tbody>
        <tr>
          <td align="center" style={{ padding: '40px 20px' }}>
            {/* Preheader - Hidden text that appears in email previews */}
            {preheader && (
              <div
                style={{
                  display: 'none',
                  fontSize: '1px',
                  color: backgroundColor,
                  lineHeight: '1px',
                  maxHeight: 0,
                  maxWidth: 0,
                  opacity: 0,
                  overflow: 'hidden'
                }}
              >
                {preheader}
              </div>
            )}

            {/* Main content container */}
            <table
              role="presentation"
              cellPadding="0"
              cellSpacing="0"
              style={{
                width: '100%',
                maxWidth: `${width}px`,
                backgroundColor: BRAND_CONFIG.colors.white,
                borderCollapse: 'collapse'
              }}
            >
              <tbody>
                {children}
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default EmailWrapper;
