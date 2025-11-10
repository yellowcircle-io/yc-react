<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Help write JavaScript (Node.js 20) code for use in HubSpot (Operations Hub / Custom Code) that allows for appending event_sync_luma (single-line text) to event_sync_luma_picklist (multi-line text). If event_sync_luma_picklist is empty, it should add the value of event_sync_luma; however, if there is a value present, the current value of event_sync_luma should then be appended and separated by a semi-colon

Here's a JavaScript solution for HubSpot's Operations Hub that appends values to a multi-line text property with semicolon separation:

```javascript
const hubspot = require('@hubspot/api-client');

exports.main = async (context, send) => {
  try {
    const hubspotClient = new hubspot.Client({
      accessToken: context.secrets.PRIVATE_APP_ACCESS_TOKEN
    });

    const contactId = context.properties.hs_object_id;
    
    // Get current values
    const currentContact = await hubspotClient.crm.contacts.basicApi.getById(
      contactId,
      ['event_sync_luma', 'event_sync_luma_picklist']
    );

    const currentLuma = currentContact.properties.event_sync_luma || '';
    const currentPicklist = (currentContact.properties.event_sync_luma_picklist || '').trim();

    // Only proceed if there's a value to append
    if (currentLuma) {
      let updatedValue;
      
      if (!currentPicklist) {
        updatedValue = currentLuma;
      } else {
        updatedValue = `${currentPicklist}; ${currentLuma}`;
      }

      // Update the contact property
      await hubspotClient.crm.contacts.basicApi.update(contactId, {
        properties: {
          event_sync_luma_picklist: updatedValue
        }
      });

      return { 
        status: 'success', 
        message: `Appended "${currentLuma}" to picklist property`
      };
    }

    return { 
      status: 'skipped', 
      message: 'No value to append in event_sync_luma'
    };

  } catch (error) {
    return {
      status: 'error',
      message: `Failed to update: ${error.message}`
    };
  }
};
```

**Key features:**

1. Uses HubSpot's Node.js API client[^5]
2. Handles empty initial values gracefully[^3]
3. Maintains proper semicolon separation between values[^2]
4. Includes error handling and status reporting
5. Only updates when there's new data to append

**Implementation steps:**

1. Create a new custom code action in HubSpot Operations Hub
2. Set input properties to include `hs_object_id`
3. Add the required `event_sync_luma` and `event_sync_luma_picklist` properties as context properties
4. Configure a Private App access token in the secrets manager[^5]
5. Add this code to your workflow's custom code action

This solution will append new values while preserving existing data, using standard HubSpot API patterns[^5]. The semi-colon separation matches common HubSpot data handling practices[^2].
<span style="display:none">[^1][^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^4][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://community.hubspot.com/t5/9881-Operations-Hub/Custom-Code-to-contact-text-property/m-p/725882

[^2]: https://community.hubspot.com/t5/HubSpot-Ideas/Update-Overwrite-Append-Data-Options-for-Contact-Property-Fields/idi-p/5166/page/4

[^3]: https://community.hubspot.com/t5/CRM/Auto-append-form-submission-value-Multi-line-text-property/m-p/1009655

[^4]: https://github.com/hubspotdev/aws-hubspot-integrations/blob/main/hubspot-snowflake-aws-ml-insights/development-guide/inference-phase.md

[^5]: https://developers.hubspot.com/docs/reference/api/automation/custom-code-actions

[^6]: https://www.bardeen.ai/answers/how-to-add-new-fields-in-a-company-hubspot

[^7]: https://community.hubspot.com/t5/APIs-Integrations/append-info-instead-of-overwriting/m-p/623980

[^8]: https://knowledge.hubspot.com/properties/property-field-types-in-hubspot

[^9]: https://wpforms.com/docs/how-to-add-extra-text-and-descriptions-to-forms/

[^10]: https://developers.hubspot.com/docs/guides/api/crm/properties

[^11]: https://www.hq-digital.com/blog/revenue-operations-for-hubspot

[^12]: https://community.zapier.com/how-do-i-3/appending-to-a-hubspot-property-9120

[^13]: https://community.hubspot.com/t5/CMS-Development/lt-textarea-gt-to-display-and-update-multiline-text-with/m-p/964754

[^14]: https://www.molestreet.com/blog/custom-code-hubspot-operations-hub

[^15]: https://support.ecwid.com/hc/en-us/articles/8751424680988-Adding-text-input-fields-calendar-or-file-uploader-to-product-pages

[^16]: https://community.hubspot.com/t5/CRM/Append-a-multi-checkbox-field-from-a-form-input/m-p/617119

[^17]: https://stackoverflow.com/questions/10384340/how-to-append-to-new-line-in-node-js

[^18]: https://stackoverflow.com/questions/6220420/how-do-i-do-a-multi-line-string-in-node-js

[^19]: https://www.youtube.com/watch?v=9AYhNWPzbFE

[^20]: https://sharepoint.stackexchange.com/questions/22594/how-to-insert-javascript-html-code-into-multi-line-sharepoint-2007-text-field

