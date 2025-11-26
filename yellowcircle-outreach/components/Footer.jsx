/**
 * Email Footer Component
 * yellowCircle branding - email-safe HTML
 */

export default function Footer({
  includeLinks = true,
  unsubscribeUrl = '#unsubscribe'
}) {
  return `
<table role="presentation" cellSpacing="0" cellPadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
  <tr>
    <td style="padding: 30px 20px; background-color: #000000; text-align: center;">

      <!-- Logo -->
      <div style="
        width: 32px;
        height: 32px;
        background-color: #FFD700;
        border-radius: 50%;
        display: inline-block;
        margin-bottom: 15px;
      "></div>

      <!-- Company Name -->
      <p style="
        font-family: Helvetica, Arial, sans-serif;
        font-size: 14px;
        font-weight: 700;
        color: #FFFFFF;
        margin: 0 0 5px 0;
      ">yellowCircle</p>

      <p style="
        font-family: Helvetica, Arial, sans-serif;
        font-size: 12px;
        color: #888888;
        margin: 0 0 20px 0;
      ">GTM Strategy & Marketing Operations</p>

      ${includeLinks ? `
      <!-- Social Links -->
      <table role="presentation" cellSpacing="0" cellPadding="0" border="0" style="margin: 0 auto 20px auto;">
        <tr>
          <td style="padding: 0 10px;">
            <a href="https://linkedin.com/in/christophercooper" style="
              font-family: Helvetica, Arial, sans-serif;
              font-size: 12px;
              color: #FFD700;
              text-decoration: none;
            ">LinkedIn</a>
          </td>
          <td style="padding: 0 10px;">
            <a href="https://yellowcircle-app.web.app" style="
              font-family: Helvetica, Arial, sans-serif;
              font-size: 12px;
              color: #FFD700;
              text-decoration: none;
            ">Website</a>
          </td>
          <td style="padding: 0 10px;">
            <a href="https://yellowcircle-app.web.app/thoughts" style="
              font-family: Helvetica, Arial, sans-serif;
              font-size: 12px;
              color: #FFD700;
              text-decoration: none;
            ">Articles</a>
          </td>
        </tr>
      </table>
      ` : ''}

      <!-- Legal -->
      <p style="
        font-family: Helvetica, Arial, sans-serif;
        font-size: 11px;
        color: #666666;
        margin: 0;
        line-height: 18px;
      ">
        Christopher Cooper / yellowCircle<br>
        Los Angeles, CA
      </p>

      ${unsubscribeUrl !== '#unsubscribe' ? `
      <p style="
        font-family: Helvetica, Arial, sans-serif;
        font-size: 11px;
        color: #666666;
        margin: 15px 0 0 0;
      ">
        <a href="${unsubscribeUrl}" style="color: #666666; text-decoration: underline;">Unsubscribe</a>
      </p>
      ` : ''}

    </td>
  </tr>
</table>
`;
}
