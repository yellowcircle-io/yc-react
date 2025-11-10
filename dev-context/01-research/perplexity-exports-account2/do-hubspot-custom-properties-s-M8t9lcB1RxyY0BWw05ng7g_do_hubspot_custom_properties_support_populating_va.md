<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Do HubSpot custom properties support populating values on non-HubSpot landing pages/webpages

HubSpot custom properties can be populated from non-HubSpot landing pages or webpages, but there are important limitations and requirements:

- **Non-HubSpot Forms:** HubSpot can capture data from forms on external (non-HubSpot) webpages if the HubSpot tracking code is installed. When a visitor submits a non-HubSpot form, HubSpot attempts to map the form fields to existing contact properties, including custom properties, but only if those properties are of the "single-line text" field type[^6]. Other field types (like dropdowns, checkboxes, etc.) are not supported for mapping from non-HubSpot forms[^6].
- **Automatic Mapping:** HubSpot will automatically try to match the form field name or label to the internal name or label of a HubSpot contact property (including custom properties), but you cannot manually map non-HubSpot form fields to properties[^6].
- **Limitations:** If there is no matching single-line text property, the data will not be stored in the contact record, though it will appear in the form submission data[^6].
- **HubSpot-Hosted Pages:** On HubSpot-hosted pages (landing pages, website pages), you have full support for using and displaying custom property values, including for personalization and dynamic content[^12].

**Summary Table**


| Scenario | Custom Property Support | Notes |
| :-- | :-- | :-- |
| Non-HubSpot webpages with forms | Yes, but only single-line text | Requires tracking code; automatic mapping only[^6] |
| HubSpot-hosted landing/website pages | Full support | All property types supported for personalization[^12] |

If you need to capture more complex property types from external pages, you would need to use HubSpot's API or embed HubSpot forms directly, as these approaches allow for more flexibility.

Would you like guidance on how to set up non-HubSpot forms to map to HubSpot custom properties, or information on using the API for more advanced integrations?
<span style="display:none">[^1][^10][^11][^13][^14][^15][^16][^17][^18][^2][^3][^4][^5][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://knowledge.hubspot.com/properties/create-and-edit-properties

[^2]: https://community.hubspot.com/t5/CMS-Development/Personalize-an-external-website-page-based-on-contact-property/m-p/703230

[^3]: https://community.hubspot.com/t5/APIs-Integrations/Custom-properties-for-products-and-line-items/m-p/319122

[^4]: https://www.youtube.com/watch?v=NDlzibUcgFg

[^5]: https://www.smartbugmedia.com/blog/hubspot-custom-properties

[^6]: https://knowledge.hubspot.com/forms/use-non-hubspot-forms

[^7]: https://www.youtube.com/watch?v=xB2EwaMDVQk

[^8]: https://www.struto.io/blog/an-introduction-to-hubspot-custom-objects

[^9]: https://community.hubspot.com/t5/Lead-Capture-Tools/how-to-capture-external-page-url-and-store-it-in-a-hidden/m-p/937890

[^10]: https://community.hubspot.com/t5/Lead-Capture-Tools/Collect-information-on-landing-page-without-custom-fields/td-p/860020

[^11]: https://community.hubspot.com/t5/CRM/Create-Custom-Property-for-Line-Items/m-p/452693

[^12]: https://knowledge.hubspot.com/website-pages/personalize-your-content

[^13]: https://cta9.com/blog/how-to-add-external-website-pages-in-hubspot-campaigns

[^14]: https://www.reddit.com/r/hubspot/comments/1iv1t4q/insert_property_values_on_weblanding_pages/

[^15]: https://community.hubspot.com/t5/Sales-Integrations/Sync-contact-properties-from-external-database-or-csv/m-p/180210

[^16]: https://blog.hubspot.com/customers/using-custom-properties-in-hubspot-crm

[^17]: https://www.hublead.io/blog/hubspot-contact-properties

[^18]: https://knowledge.hubspot.com/properties/property-field-types-in-hubspot

