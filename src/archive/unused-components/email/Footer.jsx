import React from 'react';
import { BRAND_CONFIG } from './index';
import SocialIcons from './SocialIcons';

/**
 * Footer - Email footer with nav links, social icons, and copyright
 *
 * Standard email footer with:
 * - Navigation links (BROWSE, LABS, CONTACT)
 * - Social media icons
 * - Copyright and unsubscribe
 *
 * @param {Array} navLinks - Array of { label, href } objects
 * @param {boolean} showSocial - Show social media icons
 * @param {string} companyName - Company name for copyright
 * @param {string} unsubscribeUrl - Unsubscribe link URL
 * @param {string} backgroundColor - Footer background color
 */
function Footer({
  navLinks,
  showSocial = true,
  companyName = 'yellowCircle',
  unsubscribeUrl = '#',
  backgroundColor = BRAND_CONFIG.colors.black,
  address = ''
}) {
  const defaultNavLinks = [
    { label: 'BROWSE', href: BRAND_CONFIG.links.browse },
    { label: 'LABS', href: BRAND_CONFIG.links.labs },
    { label: 'CONTACT', href: BRAND_CONFIG.links.contact }
  ];

  const links = navLinks || defaultNavLinks;
  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* Navigation Links */}
      <tr>
        <td
          align="center"
          style={{
            backgroundColor,
            padding: '40px 40px 20px'
          }}
        >
          <table
            role="presentation"
            cellPadding="0"
            cellSpacing="0"
            style={{ borderCollapse: 'collapse' }}
          >
            <tbody>
              <tr>
                {links.map((link, index) => (
                  <td
                    key={index}
                    style={{
                      paddingLeft: index > 0 ? '30px' : 0
                    }}
                  >
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        letterSpacing: '0.15em',
                        color: BRAND_CONFIG.colors.white,
                        textDecoration: 'none',
                        fontFamily: BRAND_CONFIG.fonts.primary,
                        textTransform: 'uppercase'
                      }}
                    >
                      {link.label}
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </td>
      </tr>

      {/* Social Icons */}
      {showSocial && (
        <tr>
          <td
            align="center"
            style={{
              backgroundColor,
              padding: '20px 40px'
            }}
          >
            <SocialIcons
              twitter={BRAND_CONFIG.social.twitter}
              instagram={BRAND_CONFIG.social.instagram}
              linkedin={BRAND_CONFIG.social.linkedin}
              iconColor="white"
            />
          </td>
        </tr>
      )}

      {/* Copyright & Unsubscribe */}
      <tr>
        <td
          align="center"
          style={{
            backgroundColor,
            padding: '20px 40px 40px'
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '11px',
              lineHeight: 1.6,
              color: BRAND_CONFIG.colors.lightGray,
              fontFamily: BRAND_CONFIG.fonts.primary
            }}
          >
            &copy; {currentYear} {companyName}. All rights reserved.
            {address && (
              <>
                <br />
                {address}
              </>
            )}
          </p>
          {unsubscribeUrl && (
            <p
              style={{
                margin: '12px 0 0',
                fontSize: '11px',
                color: BRAND_CONFIG.colors.lightGray,
                fontFamily: BRAND_CONFIG.fonts.primary
              }}
            >
              <a
                href={unsubscribeUrl}
                style={{
                  color: BRAND_CONFIG.colors.lightGray,
                  textDecoration: 'underline'
                }}
              >
                Unsubscribe
              </a>
              {' | '}
              <a
                href="#"
                style={{
                  color: BRAND_CONFIG.colors.lightGray,
                  textDecoration: 'underline'
                }}
              >
                View in browser
              </a>
            </p>
          )}
        </td>
      </tr>
    </>
  );
}

/**
 * FooterMinimal - Simplified footer with just copyright
 */
export function FooterMinimal({
  companyName = 'yellowCircle',
  backgroundColor = BRAND_CONFIG.colors.white,
  textColor = BRAND_CONFIG.colors.gray
}) {
  const currentYear = new Date().getFullYear();

  return (
    <tr>
      <td
        align="center"
        style={{
          backgroundColor,
          padding: '30px 40px'
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '12px',
            color: textColor,
            fontFamily: BRAND_CONFIG.fonts.primary
          }}
        >
          &copy; {currentYear} {companyName}
        </p>
      </td>
    </tr>
  );
}

export default Footer;
