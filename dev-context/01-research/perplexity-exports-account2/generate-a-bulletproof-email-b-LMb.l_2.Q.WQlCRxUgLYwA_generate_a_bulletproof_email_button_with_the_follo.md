<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Generate a bulletproof email button with the following:

background-color: \#00ECC0
border-radius: 4px
padding-top, bottom: 12px
padding-left, right: 18px
min-width: 180px
min-height: 50px

Here's a bulletproof email button with the specifications you requested:

```html
<table width="100%" border="0" cellspacing="0" cellpadding="0">
  <tr>
    <td>
      <table border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center" style="border-radius: 4px;" bgcolor="#00ECC0">
            <a href="https://your-link-here.com" target="_blank" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 4px; padding: 12px 18px; border: 1px solid #00ECC0; display: inline-block; min-width: 180px; min-height: 50px; line-height: 50px;">Your Button Text</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

This HTML code creates a bulletproof email button that should work across various email clients. Here's a breakdown of how it meets your requirements:

1. Background color: `bgcolor="#00ECC0"`
2. Border radius: `border-radius: 4px;`
3. Padding: `padding: 12px 18px;`
4. Minimum width: `min-width: 180px;`
5. Minimum height: `min-height: 50px;`

To use this button in your email:

1. Replace `https://your-link-here.com` with your desired URL.
2. Change `Your Button Text` to your preferred button text.
3. Adjust the font size, family, and color as needed.
4. If you want to change the button's width or height, modify the `min-width` and `min-height` values.

This code uses nested tables for maximum compatibility across email clients and includes fallback options for clients that don't support certain CSS properties.

