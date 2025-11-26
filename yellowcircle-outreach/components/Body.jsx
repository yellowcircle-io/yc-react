/**
 * Email Body Component
 * yellowCircle branding - email-safe HTML
 */

export default function Body({
  greeting = 'Hi there,',
  content,
  ctaText,
  ctaUrl,
  signature = '— Chris'
}) {
  return `
<table role="presentation" cellSpacing="0" cellPadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
  <tr>
    <td style="padding: 30px 20px; background-color: #FFFFFF;">

      <!-- Greeting -->
      <p style="
        font-family: Helvetica, Arial, sans-serif;
        font-size: 16px;
        line-height: 24px;
        color: #000000;
        margin: 0 0 20px 0;
      ">${greeting}</p>

      <!-- Main Content -->
      <div style="
        font-family: Helvetica, Arial, sans-serif;
        font-size: 16px;
        line-height: 26px;
        color: #333333;
      ">
        ${formatContent(content)}
      </div>

      ${ctaText && ctaUrl ? renderCTA(ctaText, ctaUrl) : ''}

      <!-- Signature -->
      <p style="
        font-family: Helvetica, Arial, sans-serif;
        font-size: 16px;
        line-height: 24px;
        color: #000000;
        margin: 30px 0 0 0;
      ">${signature}</p>

    </td>
  </tr>
</table>
`;
}

function formatContent(content) {
  if (!content) return '';

  // Convert markdown-style formatting to HTML
  return content
    .split('\n\n')
    .map(paragraph => {
      // Handle bullet points
      if (paragraph.includes('\n- ')) {
        const lines = paragraph.split('\n');
        const intro = lines[0];
        const bullets = lines.slice(1).filter(l => l.startsWith('- '));

        return `
          <p style="margin: 0 0 15px 0;">${intro}</p>
          <ul style="margin: 0 0 20px 0; padding-left: 20px;">
            ${bullets.map(b => `<li style="margin-bottom: 8px;">${b.replace('- ', '')}</li>`).join('')}
          </ul>
        `;
      }

      // Handle numbered lists
      if (paragraph.match(/^\d\./m)) {
        const lines = paragraph.split('\n').filter(l => l.match(/^\d\./));
        return `
          <ol style="margin: 0 0 20px 0; padding-left: 20px;">
            ${lines.map(l => `<li style="margin-bottom: 8px;">${l.replace(/^\d\.\s*/, '')}</li>`).join('')}
          </ol>
        `;
      }

      // Regular paragraph
      return `<p style="margin: 0 0 20px 0;">${paragraph}</p>`;
    })
    .join('');
}

function renderCTA(text, url) {
  return `
      <!-- CTA Button -->
      <table role="presentation" cellSpacing="0" cellPadding="0" border="0" style="margin: 30px 0;">
        <tr>
          <td>
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml"
                         xmlns:w="urn:schemas-microsoft-com:office:word"
                         href="${url}"
                         style="height:48px;v-text-anchor:middle;width:200px;"
                         arcsize="8%"
                         fillcolor="#FFD700"
                         strokecolor="#FFD700">
              <w:anchorlock/>
              <center style="color:#000000;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;">
                ${text}
              </center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="${url}" style="
              display: inline-block;
              background-color: #FFD700;
              color: #000000;
              font-family: Helvetica, Arial, sans-serif;
              font-size: 16px;
              font-weight: 700;
              text-decoration: none;
              padding: 14px 28px;
              border-radius: 4px;
              border: 2px solid #FFD700;
            ">${text}</a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>
  `;
}
