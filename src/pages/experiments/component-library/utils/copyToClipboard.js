export const copyToClipboard = async (text, elementRef = null) => {
  try {
    await navigator.clipboard.writeText(text);

    // Visual feedback
    if (elementRef) {
      const originalText = elementRef.textContent;
      const originalBackground = elementRef.style.background;
      elementRef.textContent = 'Copied!';
      elementRef.style.background = '#10B981';
      elementRef.style.color = 'white';

      setTimeout(() => {
        elementRef.textContent = originalText;
        elementRef.style.background = originalBackground;
        elementRef.style.color = '';
      }, 2000);
    }

    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

export const generateComponentCode = (componentName, props) => {
  // Generate React component code with proper formatting
  const propsString = Object.entries(props)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}="${value}"`;
      } else if (typeof value === 'boolean') {
        return value ? key : `${key}={false}`;
      } else if (Array.isArray(value)) {
        return `${key}={${JSON.stringify(value)}}`;
      } else if (typeof value === 'object') {
        return `${key}={${JSON.stringify(value)}}`;
      }
      return `${key}={${value}}`;
    })
    .join(' ');

  return `<${componentName}${propsString ? ' ' + propsString : ''} />`;
};

export const generateHTMLCode = (componentHTML) => {
  // Format and return clean HTML for email templates
  return componentHTML
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
};

export const formatJSXCode = (code) => {
  // Basic JSX formatting for better readability
  return code
    .replace(/></g, '>\n<')
    .replace(/(\w+)="/g, '\n  $1="')
    .replace(/^(\s*)<(\w+)/gm, '$1<$2')
    .trim();
};

export const generateEmailTemplate = (components) => {
  // Generate complete email template from components
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff;">
    <tbody>
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%;">
            <tbody>
              ${components.join('\n              ')}
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
};