import React from 'react';
import { BRAND_CONFIG } from './index';

/**
 * Hero - Two-column hero section with headline and image
 *
 * Displays a large headline on the left and an image on the right.
 * Responsive: stacks vertically on mobile via media query.
 *
 * @param {string} headline - Main headline text
 * @param {string} subheadline - Optional subheadline text
 * @param {string} imageUrl - Hero image URL
 * @param {string} imageAlt - Image alt text
 * @param {string} backgroundColor - Section background color
 * @param {string} headlineColor - Headline text color
 * @param {boolean} reversed - Swap image/text positions
 */
function Hero({
  headline = 'OWN YOUR STORY',
  subheadline = '',
  imageUrl,
  imageAlt = 'Hero image',
  backgroundColor = BRAND_CONFIG.colors.yellow,
  headlineColor = BRAND_CONFIG.colors.black,
  reversed = false
}) {
  const textCell = (
    <td
      width="50%"
      valign="middle"
      style={{
        padding: '40px 30px',
        backgroundColor
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: '42px',
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: headlineColor,
          fontFamily: BRAND_CONFIG.fonts.heading
        }}
      >
        {headline}
      </h1>
      {subheadline && (
        <p
          style={{
            margin: '16px 0 0',
            fontSize: '16px',
            lineHeight: 1.5,
            color: headlineColor,
            fontFamily: BRAND_CONFIG.fonts.primary,
            opacity: 0.8
          }}
        >
          {subheadline}
        </p>
      )}
    </td>
  );

  const imageCell = imageUrl ? (
    <td
      width="50%"
      valign="middle"
      style={{
        padding: 0,
        backgroundColor
      }}
    >
      <img
        src={imageUrl}
        alt={imageAlt}
        width="300"
        style={{
          display: 'block',
          width: '100%',
          maxWidth: '300px',
          height: 'auto'
        }}
      />
    </td>
  ) : null;

  return (
    <tr>
      <td style={{ padding: 0 }}>
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
              {reversed ? (
                <>
                  {imageCell}
                  {textCell}
                </>
              ) : (
                <>
                  {textCell}
                  {imageCell}
                </>
              )}
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
}

/**
 * HeroFullWidth - Single column hero with centered content
 */
export function HeroFullWidth({
  headline,
  subheadline,
  backgroundColor = BRAND_CONFIG.colors.yellow,
  headlineColor = BRAND_CONFIG.colors.black,
  align = 'center'
}) {
  return (
    <tr>
      <td
        align={align}
        style={{
          backgroundColor,
          padding: '60px 40px'
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '48px',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: headlineColor,
            fontFamily: BRAND_CONFIG.fonts.heading
          }}
        >
          {headline}
        </h1>
        {subheadline && (
          <p
            style={{
              margin: '20px 0 0',
              fontSize: '18px',
              lineHeight: 1.5,
              color: headlineColor,
              fontFamily: BRAND_CONFIG.fonts.primary,
              opacity: 0.8,
              maxWidth: '500px'
            }}
          >
            {subheadline}
          </p>
        )}
      </td>
    </tr>
  );
}

export default Hero;
