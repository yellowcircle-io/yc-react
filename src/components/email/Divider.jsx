import React from 'react';
import { BRAND_CONFIG } from './index';

/**
 * Divider - Horizontal line separator
 *
 * Simple horizontal rule for separating email sections.
 *
 * @param {string} color - Line color
 * @param {number} height - Line height in pixels
 * @param {string} padding - Container padding
 * @param {string} backgroundColor - Container background
 */
function Divider({
  color = '#e5e7eb',
  height = 1,
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
          style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  height: `${height}px`,
                  backgroundColor: color,
                  fontSize: '1px',
                  lineHeight: '1px'
                }}
              >
                &nbsp;
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
}

/**
 * Spacer - Vertical spacing
 */
export function Spacer({
  height = 20,
  backgroundColor = BRAND_CONFIG.colors.white
}) {
  return (
    <tr>
      <td
        style={{
          height: `${height}px`,
          backgroundColor,
          fontSize: '1px',
          lineHeight: '1px'
        }}
      >
        &nbsp;
      </td>
    </tr>
  );
}

export default Divider;
