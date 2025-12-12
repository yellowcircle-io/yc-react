import React from 'react';
import { BRAND_CONFIG } from './index';

/**
 * IconRow - Row of icons with labels (e.g., SCALE, SHIP, GROW)
 *
 * Displays a horizontal row of icons with text labels below.
 * Common use: feature highlights, value propositions.
 *
 * @param {Array} items - Array of { icon, label, description } objects
 * @param {string} backgroundColor - Row background color
 * @param {string} iconSize - Icon width/height in pixels
 */
function IconRow({
  items = [],
  backgroundColor = BRAND_CONFIG.colors.white,
  iconSize = 40
}) {
  if (!items || items.length === 0) {
    // Default yellowCircle icons
    items = [
      {
        icon: 'https://res.cloudinary.com/yellowcircle-io/image/upload/v1735952878/icon-scale_rdgnoe.png',
        label: 'SCALE'
      },
      {
        icon: 'https://res.cloudinary.com/yellowcircle-io/image/upload/v1735952878/icon-ship_rdgnoe.png',
        label: 'SHIP'
      },
      {
        icon: 'https://res.cloudinary.com/yellowcircle-io/image/upload/v1735952878/icon-grow_rdgnoe.png',
        label: 'GROW'
      }
    ];
  }

  return (
    <tr>
      <td style={{ backgroundColor, padding: '40px 20px' }}>
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
              {items.map((item, index) => (
                <td
                  key={index}
                  align="center"
                  valign="top"
                  width={`${100 / items.length}%`}
                  style={{ padding: '0 10px' }}
                >
                  {item.icon && (
                    <img
                      src={item.icon}
                      alt={item.label || ''}
                      width={iconSize}
                      height={iconSize}
                      style={{
                        display: 'block',
                        margin: '0 auto 12px',
                        width: `${iconSize}px`,
                        height: `${iconSize}px`
                      }}
                    />
                  )}
                  {item.label && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        color: BRAND_CONFIG.colors.black,
                        fontFamily: BRAND_CONFIG.fonts.primary,
                        textTransform: 'uppercase'
                      }}
                    >
                      {item.label}
                    </p>
                  )}
                  {item.description && (
                    <p
                      style={{
                        margin: '8px 0 0',
                        fontSize: '13px',
                        lineHeight: 1.5,
                        color: BRAND_CONFIG.colors.gray,
                        fontFamily: BRAND_CONFIG.fonts.primary
                      }}
                    >
                      {item.description}
                    </p>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
}

/**
 * FeatureGrid - 2x2 or 3x2 grid of features
 */
export function FeatureGrid({
  items = [],
  columns = 3,
  backgroundColor = BRAND_CONFIG.colors.white
}) {
  const rows = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }

  return (
    <>
      {rows.map((row, rowIndex) => (
        <tr key={rowIndex}>
          <td style={{ backgroundColor, padding: '20px 20px' }}>
            <table
              role="presentation"
              cellPadding="0"
              cellSpacing="0"
              style={{ width: '100%', borderCollapse: 'collapse' }}
            >
              <tbody>
                <tr>
                  {row.map((item, colIndex) => (
                    <td
                      key={colIndex}
                      align="center"
                      valign="top"
                      width={`${100 / columns}%`}
                      style={{ padding: '20px 15px' }}
                    >
                      {item.icon && (
                        <img
                          src={item.icon}
                          alt={item.label || ''}
                          width="48"
                          height="48"
                          style={{ display: 'block', margin: '0 auto 16px' }}
                        />
                      )}
                      {item.label && (
                        <h3
                          style={{
                            margin: '0 0 8px',
                            fontSize: '16px',
                            fontWeight: 700,
                            color: BRAND_CONFIG.colors.black,
                            fontFamily: BRAND_CONFIG.fonts.heading
                          }}
                        >
                          {item.label}
                        </h3>
                      )}
                      {item.description && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: '14px',
                            lineHeight: 1.5,
                            color: BRAND_CONFIG.colors.gray,
                            fontFamily: BRAND_CONFIG.fonts.primary
                          }}
                        >
                          {item.description}
                        </p>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      ))}
    </>
  );
}

export default IconRow;
