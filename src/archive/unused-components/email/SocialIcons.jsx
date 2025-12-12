import React from 'react';
import { BRAND_CONFIG } from './index';

/**
 * SocialIcons - Social media icon links
 *
 * Displays horizontal row of social media icons.
 * Uses inline SVG data URIs for maximum compatibility.
 *
 * @param {string} twitter - Twitter/X profile URL
 * @param {string} instagram - Instagram profile URL
 * @param {string} linkedin - LinkedIn profile URL
 * @param {string} facebook - Facebook profile URL
 * @param {string} iconColor - 'white' | 'black' | 'yellow'
 * @param {number} iconSize - Icon size in pixels
 */
function SocialIcons({
  twitter,
  instagram,
  linkedin,
  facebook,
  iconColor = 'white',
  iconSize = 24
}) {
  // SVG icons encoded as data URIs for email compatibility
  const icons = {
    twitter: {
      url: twitter,
      white: 'https://res.cloudinary.com/yellowcircle-io/image/upload/v1735952878/icon-twitter-white_rdgnoe.png',
      black: 'https://res.cloudinary.com/yellowcircle-io/image/upload/v1735952878/icon-twitter-black_rdgnoe.png',
      alt: 'Twitter'
    },
    instagram: {
      url: instagram,
      white: 'https://res.cloudinary.com/yellowcircle-io/image/upload/v1735952878/icon-instagram-white_rdgnoe.png',
      black: 'https://res.cloudinary.com/yellowcircle-io/image/upload/v1735952878/icon-instagram-black_rdgnoe.png',
      alt: 'Instagram'
    },
    linkedin: {
      url: linkedin,
      white: 'https://res.cloudinary.com/yellowcircle-io/image/upload/v1735952878/icon-linkedin-white_rdgnoe.png',
      black: 'https://res.cloudinary.com/yellowcircle-io/image/upload/v1735952878/icon-linkedin-black_rdgnoe.png',
      alt: 'LinkedIn'
    },
    facebook: {
      url: facebook,
      white: 'https://res.cloudinary.com/yellowcircle-io/image/upload/v1735952878/icon-facebook-white_rdgnoe.png',
      black: 'https://res.cloudinary.com/yellowcircle-io/image/upload/v1735952878/icon-facebook-black_rdgnoe.png',
      alt: 'Facebook'
    }
  };

  const activeIcons = Object.entries(icons).filter(([, data]) => data.url);

  if (activeIcons.length === 0) return null;

  return (
    <table
      role="presentation"
      cellPadding="0"
      cellSpacing="0"
      style={{ borderCollapse: 'collapse' }}
    >
      <tbody>
        <tr>
          {activeIcons.map(([key, data], index) => (
            <td
              key={key}
              style={{ paddingLeft: index > 0 ? '16px' : 0 }}
            >
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <img
                  src={data[iconColor] || data.white}
                  alt={data.alt}
                  width={iconSize}
                  height={iconSize}
                  style={{
                    display: 'block',
                    width: `${iconSize}px`,
                    height: `${iconSize}px`
                  }}
                />
              </a>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

/**
 * SocialIconsInline - Inline SVG version (for web preview)
 * Note: Many email clients don't support inline SVG, use hosted images in production
 */
export function SocialIconsInline({
  twitter,
  instagram,
  linkedin,
  color = '#FFFFFF',
  size = 24
}) {
  const icons = [
    {
      url: twitter,
      name: 'Twitter',
      path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'
    },
    {
      url: instagram,
      name: 'Instagram',
      path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z'
    },
    {
      url: linkedin,
      name: 'LinkedIn',
      path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'
    }
  ].filter(icon => icon.url);

  return (
    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
      {icons.map((icon) => (
        <a
          key={icon.name}
          href={icon.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none' }}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={color}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d={icon.path} />
          </svg>
        </a>
      ))}
    </div>
  );
}

export default SocialIcons;
