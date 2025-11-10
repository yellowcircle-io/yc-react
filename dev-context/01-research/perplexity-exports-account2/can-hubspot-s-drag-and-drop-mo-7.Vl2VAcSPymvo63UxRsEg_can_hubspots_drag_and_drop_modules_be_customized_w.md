<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Can HubSpot's drag-and-drop modules be customized with persistent custom HTML

Yes, HubSpot's drag-and-drop modules can be customized with persistent custom HTML by creating custom modules. Here’s how this works and what you can achieve:

## Custom Modules and Persistent HTML

- **Custom Module Creation:** HubSpot allows you to build custom modules using the Design Manager or via local development tools. When you create a custom module, you have full access to an *HTML + HubL* editor, where you can write any HTML, HubL (HubSpot’s templating language), CSS, and JavaScript you need[^1][^7][^6].
- **Persistent HTML:** The HTML you write in the custom module’s editor is persistent—meaning it becomes part of the module’s structure and will remain consistent wherever the module is used. You can define static HTML, dynamic fields, and even default content that stays unless specifically changed by a content editor[^1][^6][^10].
- **Field Integration:** You can add module fields (such as text, images, or rich text) and reference them in your HTML using HubL variables. This lets you combine editable content with persistent custom HTML structure[^1][^6].
- **Reusable Across Templates:** Once published, your custom module can be dragged and dropped into any compatible template or page, and the custom HTML will persist as part of the module wherever it’s used[^1][^7][^10].


## Example Workflow

1. **Create a Custom Module:** Use the Design Manager or CLI tools to create a new module. This generates files like `module.html`, `module.css`, and `fields.json`[^6].
2. **Write Persistent HTML:** In `module.html`, add your custom HTML structure. You can mix in HubL variables to insert dynamic content from module fields.
3. **Add Fields:** In `fields.json`, define any fields you want editors to control (e.g., text, images). These can have default values that appear as persistent content until changed[^6].
4. **Publish and Use:** Publish your module. It becomes available for drag-and-drop use in templates and pages, with your custom HTML always present unless you edit the module itself[^1][^10].

## Editing and Flexibility

- **Editable vs. Static Content:** Content editors can only change what you expose via module fields. The underlying HTML structure you code in the module remains persistent and uneditable from the page editor, ensuring your custom HTML is always present[^1][^6][^10].
- **Advanced Customization:** You can include advanced HTML, CSS, and JavaScript, and even use frameworks like Bootstrap within your module’s persistent code[^10].


## Summary Table

| Feature | Supported in Custom Modules? |
| :-- | :--: |
| Persistent custom HTML | Yes |
| Drag-and-drop usage | Yes |
| Editable fields | Yes |
| Full HTML/CSS/JS access | Yes |

**In conclusion:** HubSpot’s drag-and-drop modules can absolutely be customized with persistent custom HTML by building custom modules. This approach gives you full control over the module’s underlying HTML, ensuring your custom code remains consistent and reusable across your site[^1][^6][^10].
<span style="display:none">[^11][^12][^13][^14][^15][^16][^17][^18][^19][^2][^20][^3][^4][^5][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://knowledge.hubspot.com/design-manager/create-and-edit-modules

[^2]: https://developers.hubspot.com/docs/guides/cms/content/templates/drag-and-drop/tutorial

[^3]: https://developers.hubspot.com/docs/guides/cms/content/templates/types/drag-and-drop-templates

[^4]: https://community.hubspot.com/t5/CMS-Development/Problem-with-drag-n-drop-custom-modules-after-swapping-design/m-p/760639

[^5]: https://www.lyntonweb.com/inbound-marketing-blog/your-guide-to-hubspots-drag-and-drop-editor

[^6]: https://community.hubspot.com/t5/CMS-Development/Building-Editable-Modules-Efficiently/m-p/478178

[^7]: https://www.signitysolutions.com/hubspot-knowledge-base/create-and-edit-modules-in-hubspot

[^8]: https://community.hubspot.com/t5/CMS-Development/How-to-code-custom-drag-amp-drop-email-templates-in-HubSpot-2023/m-p/758452

[^9]: https://community.hubspot.com/t5/CMS-Development/Modules-html-editing/m-p/812332

[^10]: https://www.hubbase.io/blog/custom-modules-for-hubspot-design

[^11]: https://knowledge.hubspot.com/website-pages/edit-page-content-in-a-drag-and-drop-area

[^12]: https://community.hubspot.com/t5/Blog-Website-Page-Publishing/Creating-a-custom-HTML-module/m-p/750966

[^13]: https://addendanalytics.com/blog/hubspot-cms-drag-drop-templates

[^14]: https://community.hubspot.com/t5/CMS-Development/Custom-Email-Module-Drag-and-Drop/m-p/465765

[^15]: https://developers.hubspot.com/docs/reference/cms/modules/files

[^16]: https://www.youtube.com/watch?v=8yXE6UFS6yo

[^17]: https://community.hubspot.com/t5/HubSpot-Ideas/Drag-and-Drop-for-Customizing-Quote-Templates/idi-p/829418

[^18]: https://developers.hubspot.com/docs/guides/cms/content/modules/quickstart

[^19]: https://www.maka-agency.com/frequently-asked-questions-new/developer-guide-best-practices-for-customizing-a-hubspot-theme

[^20]: https://community.hubspot.com/t5/CMS-Development/How-to-code-custom-drag-amp-drop-email-templates-in-HubSpot/td-p/427327

