<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# HubSpot Custom Modules and Block Elements Support

HubSpot Custom Modules **do not prevent** block elements such as horizontal rules (`<hr>` tags) from being used. In fact, HubSpot explicitly supports horizontal rules and other standard HTML block elements within both its Rich Text modules and Custom Modules.[^1]

## Horizontal Rules Are Explicitly Supported

HubSpot's Rich Text modules include built-in functionality for inserting horizontal lines. According to the official HubSpot Knowledge Base, users can "insert a horizontal line" by clicking the Insert dropdown menu and selecting "Horizontal line". This demonstrates that horizontal rules are not only permitted but are a standard feature within HubSpot's content editing system.[^1]

## Custom Modules Allow Full HTML Control

Custom Modules in HubSpot provide developers with comprehensive control over HTML structure through the `module.html` file. The documentation shows that developers can write any HTML content within this file, and there's evidence from community discussions of developers successfully using `<hr>` tags within custom modules. For example, one developer shared HTML code from their custom module that included:[^2][^3]

```html
<div class="blog-insert-horiz-rule">
<hr style="height:1px; ...">
```

This demonstrates that horizontal rules work perfectly fine within Custom Modules.

## HTML Element Architecture in Custom Modules

HubSpot Custom Modules consist of three main components:[^4]

- **module.html** - Contains HTML and HubL templating code
- **module.css** - Contains styling information
- **module.js** - Contains JavaScript functionality

```
The `module.html` file supports standard HTML elements and HubL templating language, giving developers the flexibility to use any legitimate HTML block elements, including `<div>`, `<p>`, `<section>`, `<header>`, `<footer>`, and `<hr>` tags.[^5]
```


## HTML Sanitization Focus

While HubSpot does implement HTML sanitization for security purposes, this primarily targets potentially dangerous elements rather than standard HTML block elements. The sanitization process focuses on removing:[^6]

- Script tags (`<script>`)
- Potentially malicious attributes
- XSS vulnerabilities

Standard block elements like horizontal rules are not considered security risks and are therefore not filtered out.

## Rich Text vs Custom Module Differences

It's important to distinguish between different contexts within HubSpot:

**Rich Text Modules**: Include a user-friendly interface with explicit support for horizontal lines through the toolbar.[^1]

**Custom Modules**: Provide raw HTML/HubL editing capabilities where developers have complete control over markup, including the ability to use `<hr>` tags directly in their code.[^2]

**Form Fields**: Have stricter HTML restrictions due to security concerns, but this doesn't apply to Custom Modules used for content display.[^7]

## Best Practices for Using Block Elements

When working with horizontal rules and other block elements in HubSpot Custom Modules:

1. **Use standard HTML syntax** - Standard `<hr>` tags work without issues
2. **Apply styling through CSS** - Use the `module.css` file or inline styles for customization
3. **Consider responsive design** - Ensure horizontal rules display properly across different screen sizes
4. **Test thoroughly** - Preview your modules to ensure proper rendering

## Conclusion

HubSpot Custom Modules do not prevent the use of block elements like horizontal rules. The platform explicitly supports horizontal rules through its Rich Text editor interface, and Custom Modules provide developers with full HTML control. Any restrictions that exist are focused on security-related elements rather than standard HTML block elements. Developers can confidently use `<hr>` tags and other block elements within their Custom Module implementations.
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35][^36][^37][^38][^39][^40][^41][^42][^43][^44][^45][^46][^47][^48][^49][^50][^51][^52][^53][^54][^55][^56][^57][^58][^59][^60][^61][^62][^63][^64][^65][^66][^67][^68][^69][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://knowledge.hubspot.com/website-pages/edit-content-in-a-rich-text-module

[^2]: https://developers.hubspot.com/docs/cms/reference/modules/files

[^3]: https://community.hubspot.com/t5/CMS-Development/Link-style-issues-in-a-custom-module/m-p/995627

[^4]: https://www.30dps.com/hubspot-gurus-tech-talk/the-basics-of-custom-modules

[^5]: https://developers.hubspot.com/docs/cms/start-building/building-blocks/modules/quickstart

[^6]: https://developers.hubspot.com/changelog/xss-sanitization-for-crm-properties-containing-html

[^7]: https://knowledge.hubspot.com/forms/troubleshoot-hubspot-forms

[^8]: https://www.youtube.com/watch?v=Sg6l7579Qb8\&vl=en-US

[^9]: https://developers.hubspot.com/docs/cms/start-building/building-blocks/modules/content-search

[^10]: https://community.hubspot.com/t5/CMS-Development/help-with-using-module-block/m-p/724273

[^11]: https://knowledge.hubspot.com/design-manager/use-default-modules-in-the-layout-editor

[^12]: https://developers.hubspot.com/docs/guides/cms/content/performance/speed

[^13]: https://community.hubspot.com/t5/CMS-Development/Help-with-understanding-docs-for-module-block/m-p/724361

[^14]: https://www.maka-agency.com/hubspot-common-modules/divider

[^15]: https://developers.hubspot.com/blog/coding-for-marketers-your-guide-to-coding-on-hubspots-cms-hub

[^16]: https://www.badsender.com/en/2023/07/28/hubspot-email-template/

[^17]: https://community.hubspot.com/t5/CMS-Development/Creating-horizontal-breaks-on-a-landing-page/td-p/35312

[^18]: https://blog.djolt.co/hubspot-cms-modules

[^19]: https://community.hubspot.com/t5/CMS-Development/Variable-widths-and-responsive-related-issues-with-custom-module/m-p/495612

[^20]: https://knowledge.hubspot.com/website-pages/use-common-modules

[^21]: https://www.mediasource.mx/en/blog/cms-hub-what-can-and-cant-i-do-for-my-website

[^22]: https://www.prami.fi/en/blog/hubspot-cms-themes-templates-and-modules-what-is-the-difference

[^23]: https://knowledge.hubspot.com/design-manager/structure-and-customize-template-layouts

[^24]: https://developers.hubspot.com/docs/cms/start-building/building-blocks/drag-and-drop/overview

[^25]: https://community.hubspot.com/t5/HubSpot-Ideas/Smart-rule-for-email-content-block/idi-p/407953

[^26]: https://community.hubspot.com/t5/Blog-Website-Page-Publishing/How-do-I-lock-or-unlock-a-web-page-template-for-adding-modules/m-p/434751

[^27]: https://bootstrapcreative.com/how-to-create-and-edit-hubspot-cms-modules/

[^28]: https://community.hubspot.com/t5/CMS-Development/HubSpot-Custom-Module-Starter-Code-Snippet/td-p/1129251

[^29]: https://developers.hubspot.com/docs/cms/marketplace-guidelines/module-requirements

[^30]: https://www.maka-agency.com/documentation/hubspot-theme-custom-modules

[^31]: https://nexalab.io/blog/development/huspot-modules/

[^32]: https://ecosystem.hubspot.com/marketplace/modules/horizontal-timeline-module-by-leadstreet

[^33]: https://community.hubspot.com/t5/Blog-Website-Page-Publishing/Creating-a-custom-HTML-module/m-p/750966

[^34]: https://designers.hubspot.com/blog/user-friendly-site-custom-modules

[^35]: https://knowledge.hubspot.com/design-manager/create-and-edit-modules

[^36]: https://community.hubspot.com/t5/HubSpot-Ideas/Add-and-Remove-Modules-in-Email-Builder/idi-p/30888

[^37]: https://community.hubspot.com/t5/CMS-Development/Prevent-custom-module-CSS-from-being-affected-by-theme-CSS-and/td-p/972456

[^38]: https://community.hubspot.com/t5/CMS-Development/HTML-Tags-instead-of-Span-Styles/m-p/710534

[^39]: https://community.latenode.com/t/how-to-include-raw-html-field-in-hubspot-custom-module/38127

[^40]: https://www.vye.agency/blog/creating-powerful-custom-modules-in-hubspot

[^41]: https://community.hubspot.com/t5/CMS-Development/Add-blog-tag-URL-s-and-limit-post-summary-characters-in-JS/m-p/787368

[^42]: https://community.hubspot.com/t5/APIs-Integrations/sanitize-data-retrieved-from-hubDB/m-p/835883

[^43]: https://community.hubspot.com/t5/CMS-Development/H1-amp-H2-Tags/m-p/660101

[^44]: https://knowledge.hubspot.com/seo/prevent-content-from-appearing-in-search-results

[^45]: https://community.hubspot.com/t5/HubSpot-Ideas/Sanitize-blog-post-featured-image-alt-text-to-automatically/idi-p/903555

[^46]: https://community.hubspot.com/t5/CMS-Development/Variable-widths-and-responsive-related-issues-with-custom-module/m-p/495056

[^47]: https://www.youtube.com/watch?v=sCndYxScxlI

[^48]: https://community.hubspot.com/t5/CMS-Development/Custom-Modules-for-Email/m-p/1002425

[^49]: https://community.hubspot.com/t5/APIs-Integrations/Content-Security-Policy-without-unsafe-inline-or-unsafe-hashes/m-p/1068354

[^50]: https://developers.hubspot.com/docs/cms/reference/modules/using-modules-in-templates

[^51]: https://developers.hubspot.com/docs/cms/building-blocks/templates/html-hubl-templates

[^52]: https://knowledge.hubspot.com/domains-and-urls/ssl-and-domain-security-in-hubspot

[^53]: https://developers.hubspot.com/docs/cms/building-blocks/modules

[^54]: https://developers.hubspot.com/docs/guides/cms/marketplace/module-requirements

[^55]: https://community.hubspot.com/t5/CMS-Development/Use-rich-text-editor-without-adding-extra-lt-p-gt-tags/m-p/342027

[^56]: https://github.com/apostrophecms/sanitize-html

[^57]: https://github.com/cure53/DOMPurify/issues/507

[^58]: https://developers.hubspot.com/docs/api-reference/cms-hubdb-v3/guide

[^59]: https://community.hubspot.com/t5/Tips-Tricks-Best-Practices/Import-HTML-or-formatted-rich-text-into-a-custom-richtext-field/m-p/719094

[^60]: https://help.aristotlemetadata.com/creating-and-editing/html-sanitization

[^61]: https://developers.hubspot.com/docs/api-reference/conversations-custom-channels-v3/guide

[^62]: https://community.hubspot.com/t5/HubSpot-Ideas/Allow-rich-text-or-HTML-in-knowledge-base-category-descriptions/idi-p/436071

[^63]: https://developers.hubspot.com/docs/cms/hubl/variables

[^64]: https://community.hubspot.com/t5/Email-Marketing-Tool/SECURITY-ISSUE-Forms-seems-to-be-subject-to-input-validation/m-p/892165

[^65]: https://community.hubspot.com/t5/HubSpot-Ideas/Allow-further-formatting-in-rich-text-area-columns-in-HubDB/idi-p/316791

[^66]: https://community.hubspot.com/t5/HubSpot-Ideas/Increase-the-number-of-allowed-tags-per-object-gt-10/idi-p/835031

[^67]: https://developers.hubspot.com/docs/cms/marketplace-guidelines/template-marketplace-policies

[^68]: https://community.hubspot.com/t5/CMS-Development/because-in-the-rich-text-or-strings-properties-the-html-tags-are/m-p/706792

[^69]: https://stackoverflow.com/questions/10134696/html-sanitize-a-set-of-tags-but-allow-all-tags-in-code-blocks

