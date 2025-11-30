import React from 'react';
import { BRAND_CONFIG } from './index';

/**
 * Header - Email header with logo
 *
 * Displays the yellowCircle logo centered with proper padding.
 * Can optionally include navigation links.
 *
 * @param {string} logoUrl - Custom logo URL (default: yellowCircle logo)
 * @param {string} logoAlt - Logo alt text
 * @param {number} logoWidth - Logo width in pixels
 * @param {string} backgroundColor - Header background color
 * @param {string} linkUrl - URL when logo is clicked
 */
function Header({
  logoUrl = BRAND_CONFIG.logo.url,
  logoAlt = BRAND_CONFIG.logo.alt,
  logoWidth = BRAND_CONFIG.logo.width,
  backgroundColor = BRAND_CONFIG.colors.white,
  linkUrl = 'https://yellowcircle-app.web.app'
}) {
  const logoContent = (
    <img
      src={logoUrl}
      alt={logoAlt}
      width={logoWidth}
      style={{
        display: 'block',
        maxWidth: '100%',
        height: 'auto'
      }}
    />
  );

  return (
    <tr>
      <td
        align="center"
        style={{
          backgroundColor,
          padding: '30px 40px'
        }}
      >
        {linkUrl ? (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            {logoContent}
          </a>
        ) : (
          logoContent
        )}
      </td>
    </tr>
  );
}

export default Header;
