/**
 * Email Header Component
 * yellowCircle branding - email-safe HTML
 */

export default function Header({ date, tagline }) {
  const formattedDate = date || new Date().toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '.');

  return `
<table role="presentation" cellSpacing="0" cellPadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
  <tr>
    <td style="padding: 30px 20px 20px 20px; background-color: #000000;">
      <!-- Logo -->
      <table role="presentation" cellSpacing="0" cellPadding="0" border="0" width="100%">
        <tr>
          <td style="text-align: left;">
            <!-- Yellow Circle Logo -->
            <div style="
              width: 48px;
              height: 48px;
              background-color: #FFD700;
              border-radius: 50%;
              display: inline-block;
            "></div>
          </td>
          <td style="text-align: right; vertical-align: middle;">
            <span style="
              font-family: Helvetica, Arial, sans-serif;
              font-size: 12px;
              color: #888888;
              letter-spacing: 1px;
            ">${formattedDate}</span>
          </td>
        </tr>
      </table>

      <!-- Tagline -->
      ${tagline ? `
      <table role="presentation" cellSpacing="0" cellPadding="0" border="0" width="100%">
        <tr>
          <td style="padding-top: 15px;">
            <span style="
              font-family: Helvetica, Arial, sans-serif;
              font-size: 11px;
              color: #FFD700;
              text-transform: uppercase;
              letter-spacing: 2px;
            ">${tagline}</span>
          </td>
        </tr>
      </table>
      ` : ''}
    </td>
  </tr>
</table>
`;
}

// Brand colors
export const COLORS = {
  yellow: '#FFD700',      // Primary yellow
  black: '#000000',       // Background
  white: '#FFFFFF',       // Text on dark
  gray: '#888888',        // Secondary text
  lightGray: '#F5F5F5'    // Light background
};
