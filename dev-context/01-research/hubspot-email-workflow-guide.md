# HubSpot Email Development & Modern Workflow Comprehensive Guide

## Table of Contents
1. [HubSpot Custom Modules & HTML Element Support](#hubspot-custom-modules--html-element-support)
2. [Email Accessibility & Client Compatibility](#email-accessibility--client-compatibility)
3. [Email Development Tools & Frameworks](#email-development-tools--frameworks)
4. [ARIA Attributes in Email Context](#aria-attributes-in-email-context)
5. [HubSpot HTML Sanitization](#hubspot-html-sanitization)
6. [Modern Email Snippet Workflows](#modern-email-snippet-workflows)
7. [Advanced Automation Solutions](#advanced-automation-solutions)
8. [Key Takeaways & Recommendations](#key-takeaways--recommendations)

---

## HubSpot Custom Modules & HTML Element Support

### The Horizontal Rule Problem

**Key Finding**: HubSpot's Rich Text editor **removes `<hr>` tags from source code when "Save Changes" is clicked**. This is part of HubSpot's HTML sanitization system.

#### Why HubSpot Sanitizes `<hr>` Tags

1. **Security & XSS Prevention**: HubSpot uses a restrictive allowlist approach for HTML elements
2. **Email Client Compatibility**: Outlook versions strip or modify `<hr>` styling inconsistently
3. **WYSIWYG Consistency**: Ensures predictable rendering across platforms
4. **Semantic vs Visual Approach**: Encourages CSS-based solutions over problematic HTML elements

#### Solutions for Horizontal Dividers

**Custom Modules** (Recommended):
```html
<!-- Works in Custom Modules -->
<hr style="border: 2px solid #333; margin: 20px 0;">
```

**CSS-Based Alternatives**:
```html
<div style="border-top: 1px solid #ccc; margin: 20px 0;"></div>
```

**Important Distinction**:
- **Rich Text Modules**: Strict HTML sanitization removes many elements
- **Custom Modules**: Full HTML control through `module.html` file
- **Page Head/Footer**: More permissive but designed for scripts/metadata

---

## Email Accessibility & Client Compatibility

### CSS Margin Support Issues

**Critical Problem**: The CSS div solution `<div style="border-top: 1px solid #ccc; margin: 20px 0;"></div>` has significant limitations:

#### Accessibility Issues
- **Not screen reader friendly**: Lacks semantic meaning of `<hr>` element
- **Missing ARIA role**: Should include `role="separator"` or `aria-hidden="true"`
- **No semantic context**: Screen readers may ignore or misinterpret

#### Email Client Support Problems
- **Outlook.com**: No longer supports margin CSS properties
- **Outlook 2007-2016**: Inconsistent margin support, especially with width properties
- **Legacy Outlook**: Uses Microsoft Word rendering engine, poor CSS support

#### Recommended Alternatives
```html
<!-- Better for email clients -->
<table role="presentation" cellpadding="0" cellspacing="0">
  <tr>
    <td style="padding: 20px 0; border-top: 1px solid #ccc;">&nbsp;</td>
  </tr>
</table>
```

### Div vs Table Support

**Email Client Reality**:
- **Tables**: Universal support across all email clients
- **Divs**: Limited support, especially in Outlook versions
- **CSS positioning**: Not supported in most email clients
- **Recommendation**: Use tables for email layout structure

---

## Email Development Tools & Frameworks

### HubSpot HTML Processing

HubSpot performs several HTML optimizations:
- **HTML minification** for performance
- **Automatic element injection** (viewport meta tags, HubSpot markup)
- **Responsive framework integration** using `hse-column` and `hse-size` classes
- **MSO/IE conditional comments** for Outlook compatibility

**Important**: HubSpot does NOT automatically convert divs to tables like Zurb Foundation.

### Figma Plugin Ecosystem

#### Email Love Plugin
- **Direct Figma to HubSpot integration**
- **One-click export to HubSpot Marketing Hub**
- **Automatic HubSpot footer generation**
- **API-based connection using HubSpot private apps**

#### Emailify Plugin
- **Figma to HubSpot export capability**
- **Automatic image hosting and optimization**
- **HubSpot-specific template requirements built-in**
- **Custom footer templates with compliance elements**

#### Mark Plugin
- **HTML email export from Figma to HubSpot**
- **Private app integration with content scope requirements**
- **Template deployment directly to Design Manager**

### MJML Framework Integration

#### MJML Benefits
- **Semantic markup language** for responsive email
- **Automatic client-specific optimizations** including Outlook fallbacks
- **Component-based structure** with reusable elements
- **Superior mobile-first approach** with automatic stacking

#### HubSpot + MJML Workflow
1. **Design in MJML** using semantic components
2. **Compile to responsive HTML** with built-in client compatibility
3. **Import to HubSpot** as custom coded templates or modules
4. **Utilize HubSpot's personalization** and automation features

#### Alternative Frameworks
- **Foundation for Emails**: Inky templating language, more designer-centric
- **Stripo.email**: Drag-and-drop builder with MJML support and direct HubSpot export
- **Blocks Edit**: Modern editor supporting both MJML and Foundation frameworks

---

## ARIA Attributes in Email Context

### `aria-hidden="true"` Support

**Reality Check**: Limited and inconsistent support across email clients.

#### Email Client Support Issues
- **Outlook.com, Yahoo.com, Yahoo app**: Poor ARIA implementation
- **Apple Mail with VoiceOver**: Inconsistent ARIA support
- **Most email clients**: Don't properly implement ARIA specifications

#### HubSpot Sanitization Treatment
**Good News**: HubSpot appears to retain ARIA attributes in sanitization process.

**Evidence**:
- HubSpot's accessibility documentation mentions ARIA attributes
- Community examples show ARIA attributes in HubSpot interface
- ARIA attributes not mentioned in restricted elements documentation

#### Best Practices
```html
<!-- Appropriate use -->
<div aria-hidden="true" style="border-top: 1px solid #ccc;"></div>

<!-- Alternative approaches -->
<img src="divider.png" alt="" role="presentation">
```

**Critical Rule**: Never use `aria-hidden="true"` on focusable elements.

---

## HubSpot HTML Sanitization

### Sanitization Rationale

#### Security Considerations
- **XSS prevention**: Removes potentially malicious elements and attributes
- **Script tag removal**: No `<script>` tags allowed in content areas
- **Attribute filtering**: Only allowlisted attributes permitted

#### Platform Consistency
- **WYSIWYG reliability**: Ensures consistent rendering across browsers
- **Email client compatibility**: Prevents elements that break in various clients
- **Design system enforcement**: Maintains visual consistency

### What Gets Removed vs Retained

**Commonly Removed**:
- `<hr>` tags
- `<script>` tags
- Custom HTML attributes not on allowlist
- Various block-level elements deemed non-essential

**Generally Retained**:
- Standard semantic elements (`<div>`, `<p>`, `<table>`)
- ARIA attributes
- Standard styling attributes
- Image and link elements

---

## Modern Email Snippet Workflows

### Basic Workflow Requirements

**Designer/Developer Process**:
1. Create email components in design/code tools (Figma, Sublime, etc.)
2. Export as production-ready HTML with placeholder content
3. Make snippets accessible to end users via repository or component library
4. Enable easy copy/paste or direct integration into email platforms

### Simple Implementation Solutions

#### Figma + Emailify Workflow
```
1. Design email component in Figma
2. Click "Export to Code" in Emailify plugin  
3. Download ZIP file with HTML/CSS/images
4. Share HTML code with end users
```

#### Repository Organization
```
📁 Email Component Library
├── 📄 Headers/
│   ├── Newsletter Header (with logo)
│   ├── Announcement Header
│   └── Event Header
├── 📄 Content Blocks/
│   ├── Two-column text + image
│   ├── Three-column feature grid
│   └── Testimonial block
├── 📄 CTAs/
│   ├── Primary button
│   ├── Secondary button
│   └── Text link
└── 📄 Footers/
    ├── Standard footer
    ├── Social media footer
    └── Unsubscribe footer
```

#### Snippet Template Example
```html
<!-- Newsletter Header Template -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="background-color: #f8f9fa; padding: 40px 0; text-align: center;">
      <img src="[LOGO_URL]" alt="[COMPANY_NAME]" style="max-width: 200px;">
      <h1 style="margin: 20px 0; color: #333;">[NEWSLETTER_TITLE]</h1>
      <p style="color: #666; font-size: 16px;">[DATE] | Issue #[NUMBER]</p>
    </td>
  </tr>
</table>
```

### HubSpot-Specific Solutions

#### Custom Modules with Editable Regions
```json
// fields.json
{
  "name": "custom_content",
  "label": "Custom Content", 
  "type": "richtext",
  "default": "<div class='editable-region'>Edit this content</div>"
}
```

```html
<!-- module.html -->
<div class="custom-structure">
  {{ module.custom_content }}
</div>
```

#### HubSpot Snippets Feature
- Create text snippets in HubSpot (Marketing → Snippets)
- Include HTML code blocks as snippet content
- Insert via dropdown in email editor
- Team-wide access to approved snippets

---

## Advanced Automation Solutions

### Streamlined Direct Integration

#### Emailify with API Integration
**Workflow Optimization**:
```
1. Design email component in Figma
2. Select platform (HubSpot/Klaviyo/etc.) in Emailify export
3. Template automatically appears in your MAP
```

**Supported Platforms**: 30+ including HubSpot, Klaviyo, Salesforce, Braze

#### Email Love with Braze Integration
- API-driven export directly to Braze template library
- Automatic unsubscribe link injection for compliance
- Instant template availability for campaign use

### Visual Component Libraries

#### Interactive Click-to-Copy Interface
```html
<div class="component-library">
  <div class="component-card" onclick="copyToClipboard('cta-button-html')">
    <div class="visual-preview">[Visual Button Preview]</div>
    <button class="copy-btn">Copy HTML</button>
  </div>
</div>

<script>
function copyToClipboard(componentId) {
  const htmlContent = document.getElementById(componentId).innerHTML;
  navigator.clipboard.writeText(htmlContent);
}
</script>
```

### Complete Automation Architecture

#### Figma API + Custom Integration
```javascript
const workflow = {
  // Monitor Figma files for changes
  watchFigmaFile: (fileId) => {
    // Use Figma API to detect updates
    // Trigger export when components change
  },
  
  // Extract and process components  
  processComponents: (figmaData) => {
    // Convert Figma layers to HTML
    // Apply email-specific optimizations
  },
  
  // Deploy to multiple platforms
  deployToMAPs: (htmlComponents) => {
    // HubSpot API integration
    // Klaviyo API integration
    // Salesforce API integration
  },
  
  // Update component library
  updateRepository: (components) => {
    // Visual component library
    // Click-to-copy functionality
    // Team notifications
  }
};
```

#### Transformation Goal
**From**: `Design → Export → Download → Share → Manual Deploy`
**To**: `Design → One-Click → Automatically Available Everywhere`

---

## Key Takeaways & Recommendations

### Email Development Best Practices

1. **Use table-based layouts** for maximum email client compatibility
2. **Avoid CSS margins** in favor of padding and spacer cells
3. **Include `role="presentation"`** on layout tables for accessibility
4. **Test thoroughly** across multiple email clients and screen readers
5. **Use semantic HTML** where possible, with proper fallbacks

### HubSpot-Specific Guidelines

1. **Custom Modules** provide full HTML control without Rich Text sanitization
2. **Rich Text Modules** have strict HTML sanitization that removes many elements
3. **ARIA attributes** are generally retained by HubSpot's sanitization
4. **Direct API integration** possible with tools like Emailify for streamlined workflows

### Workflow Optimization Strategy

#### Phase 1: Direct Integration (Immediate)
- Implement Emailify Pro with API integration to primary MAP
- Configure one-click export from Figma to live platform
- Eliminate manual download/upload steps

#### Phase 2: Visual Component Library (Enhanced UX)
- Build visual repository with click-to-copy functionality
- Organize components by categories with search capabilities
- Implement visual previews to prevent copy-paste errors

#### Phase 3: Full Automation (Advanced)
- Develop bidirectional sync between design tools and MAPs
- Implement automated repository organization
- Enable team notifications and change tracking

### Technology Stack Recommendations

**For Immediate Implementation**:
- **Figma + Emailify**: Direct platform integration
- **MJML framework**: Email client compatibility
- **Table-based HTML**: Universal email support

**For Advanced Workflows**:
- **Custom API integrations**: Platform-specific optimizations
- **Visual component libraries**: User-friendly interfaces
- **Automated deployment pipelines**: Reduced manual intervention

### Critical Success Factors

1. **Email client compatibility** must be prioritized over modern web standards
2. **Accessibility considerations** require semantic HTML and proper ARIA usage
3. **Team adoption** depends on user-friendly interfaces and minimal friction
4. **Maintenance efficiency** requires automated processes and version control
5. **Platform integration** should eliminate manual steps wherever possible

---

*This guide represents a comprehensive analysis of modern email development workflows, HubSpot platform capabilities, and automation strategies for efficient email marketing operations.*