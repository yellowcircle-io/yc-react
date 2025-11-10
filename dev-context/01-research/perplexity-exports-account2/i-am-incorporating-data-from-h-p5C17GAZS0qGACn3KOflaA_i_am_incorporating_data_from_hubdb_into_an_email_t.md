<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# I am incorporating data from HubDB into an email template.

The template in question is build via custom modules.

However, the email is only rendering the table's information properly within HubSpots proprietary modules rather than the custom modules despite the checkbox for "use module for programmable email" value being set to true.

The HubDB logic is as follows:

{% set rows = hubdb_table_rows(119957807, "orderBy=-date") %}{% if rows|length > 0 %}{% set latest = rows[0] %}{{ latest.name|striptags }}{% else %}
Hello! The Treasury value is currently unavailable. 
{% endif %}

Based on your description, you are encountering a scenario where HubDB data renders correctly in HubSpot’s proprietary (built-in) modules but not in your custom modules—even though the "use module for programmable email" option is enabled. Here’s a breakdown of what might be happening and how to troubleshoot:

## Key Points and Troubleshooting

**1. Programmable Email Module Support**

- **Custom modules in email templates must be specifically enabled for programmable emails.** You mentioned you have checked the box for "use module for programmable email"—this is correct and necessary[^2][^5].
- **However, simply enabling the checkbox does not guarantee that HubL (the templating language) will function the same way in custom modules as in proprietary ones.** There may be differences in the context or available variables.

**2. HubL Logic and Syntax**

- The logic you provided is correct for querying a HubDB table and displaying the latest entry by date:

```hubl
{% set rows = hubdb_table_rows(119957807, "orderBy=-date") %}
{% if rows|length > 0 %}
  {% set latest = rows[^0] %}
  {{ latest.name|striptags }}
{% else %}
  Hello! The Treasury value is currently unavailable.
{% endif %}
```

- **If this code works in proprietary modules but not in custom modules, it suggests a context or permissions issue with custom modules in the email editor[^1][^2].**

**3. Module Context and Available Variables**

- **In custom modules, not all HubSpot context variables (such as `content`, `request`, or even some HubL functions) are available by default in all email contexts.** Proprietary modules are built by HubSpot and may have access to additional context or functions that are not exposed to custom modules[^1][^9].
- **Check if your custom module is being rendered in the email preview or only at send time.** Some custom modules may not render dynamic content in the preview but will work when the email is sent[^4][^5].

**4. Module Export and Template Context**

- **If you need to share data between modules or make HubDB data available to other parts of your template, you may need to set `export_to_template_context=True` in your module definition.** This allows other modules to access the data exported by your custom module[^9].
- **Example:**

```hubl
{% module "my_hubdb_module" path="/path/to/module", label="My HubDB Module", export_to_template_context=True %}
```

- **However, this is more relevant for web pages than for emails, but it's worth checking if your module is exporting data as expected.**

**5. Debugging Steps**

- **Test the module in a web page first to ensure the HubL logic works as expected.** If it works on a web page but not in the email, the issue is likely with the email context[^11].
- **Check for any errors in the HubSpot logs or in the email preview.** Sometimes, errors are silent in the preview but logged elsewhere.
- **Try hardcoding a value in your custom module to see if it renders.** If it does, the issue is with the HubDB query or context[^1].
- **Ensure that the HubDB table is published and that the user sending the email has the necessary permissions to access the table.**


## Summary Table

| Issue Area | Proprietary Module | Custom Module (with checkbox) |
| :-- | :-- | :-- |
| HubDB data renders | Yes | No |
| "Programmable email" set | N/A | Yes |
| Context variables | Full | Possibly limited |
| Module export available | N/A | Maybe (web only) |

## Recommendations

- **Double-check the module’s settings in the Design Manager.** Ensure the module is truly enabled for programmable emails and that the correct checkboxes are selected[^2][^5].
- **Test the module in a web page to isolate the issue.** If it works there, the problem is with the email context.
- **Try a simpler HubL expression in the custom module** (e.g., just displaying a static value) to verify that the module itself is being rendered.
- **Consult HubSpot’s documentation or support for any known limitations** regarding custom modules and programmable emails, as some features may not be fully supported in all contexts[^1][^2][^5].

If you have done all of the above and the issue persists, it may be a limitation or bug in HubSpot’s current implementation of custom modules for programmable emails. In that case, reaching out to HubSpot support with your specific use case and code is recommended.
<span style="display:none">[^10][^12][^13][^14][^15][^16][^17][^18][^19][^20][^21][^22][^23][^3][^6][^7][^8]</span>

<div align="center">⁂</div>

[^1]: https://community.hubspot.com/t5/APIs-Integrations/HubDB-query-access-for-custom-email-module/m-p/1029474

[^2]: https://www.babelquest.co.uk/en/hubspot-hacks/how-to-create-a-related-content-programmable-email-module

[^3]: https://community.hubspot.com/t5/CMS-Development/Weird-Hubl-HubDB-loop-issue/m-p/1108190

[^4]: https://huble.com/blog/hubspot-programmable-email

[^5]: https://community.hubspot.com/t5/CMS-Development/Custom-Modules-for-Email/td-p/1002425

[^6]: https://www.30dps.com/hubspot-gurus-tech-talk/hubdb-dynamic-pages

[^7]: https://community.hubspot.com/t5/CMS-Development/HubDB-Filter-and-sort-as-a-module/m-p/932808

[^8]: https://community.hubspot.com/t5/CMS-Development/Creating-an-email-daily-digest-using-HubDB/m-p/557600

[^9]: https://community.hubspot.com/t5/CMS-Development/Global-control-for-multiple-modules-that-use-HubDB/m-p/476890

[^10]: https://community.hubspot.com/t5/CMS-Development/Custom-Modules-for-Email/m-p/1002425

[^11]: https://www.30dps.com/hubspot-gurus-tech-talk/display-a-hubdb-in-a-module

[^12]: https://community.hubspot.com/t5/CMS-Development/hubDB-resources-data-not-displaying/m-p/664396

[^13]: https://community.hubspot.com/t5/CMS-Development/Getting-Vague-Error-Messages-in-Json-Modules/m-p/1059472

[^14]: https://bootstrapcreative.com/what-size-is-a-hubspot-email-header-image/

[^15]: https://developers.hubspot.com/docs/guides/cms/content/data-driven-content/emails-with-programmable-content

[^16]: https://knowledge.hubspot.com/marketing-email/create-programmable-emails

[^17]: https://developers.hubspot.com/docs/guides/cms/storage/hubdb/overview

[^18]: https://community.hubspot.com/t5/CMS-Development/Using-HubDB-and-Custom-Modules-for-the-first-time/m-p/256088

[^19]: https://stackoverflow.com/questions/68007244/google-sheets-send-email-when-checkbox-is-changed-to-true

[^20]: https://stackoverflow.com/questions/70128619/hubspot-custom-module-to-display-data-from-hubdb-and-search-filter

[^21]: https://www.badsender.com/en/2023/07/28/hubspot-email-template/

[^22]: https://community.hubspot.com/t5/CMS-Development/HTML-in-contact-property-to-render-email/m-p/677078

[^23]: https://www.youtube.com/watch?v=ez8vlSWhstw

