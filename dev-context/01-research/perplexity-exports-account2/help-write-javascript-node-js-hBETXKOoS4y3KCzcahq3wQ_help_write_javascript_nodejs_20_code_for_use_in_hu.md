<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# HubSpot Custom Code for Event Sync Logging Implementation

This guide provides a comprehensive approach to implementing a custom code solution in HubSpot Operations Hub that appends event tracking data to maintain a historical log of events.

## Overview of the Solution

The custom code will track events by appending the current value of `event_sync_luma` to `event_sync_luma_log`, allowing you to maintain a chronological history of all events with semicolon separation.

## JavaScript Code (Node.js 20)

```javascript
// Custom code for appending event_sync_luma to event_sync_luma_log
// This code appends the current value to the log, separated by semicolons

exports.main = (event, callback) => {
  // Access the properties from inputFields
  const eventSyncLuma = event.inputFields['event_sync_luma'];
  const eventSyncLumaLog = event.inputFields['event_sync_luma_log'];
  
  // Initialize the variable to hold the updated log
  let updatedLog;
  
  // Check if the log is empty
  if (!eventSyncLumaLog) {
    // If empty, just use the current value
    updatedLog = eventSyncLuma;
  } else {
    // If not empty, append with semicolon separator
    updatedLog = `${eventSyncLumaLog};${eventSyncLuma}`;
  }
  
  // Return the updated log via the callback
  callback({
    outputFields: {
      event_sync_luma_log: updatedLog
    }
  });
};
```


## Configuration Steps in HubSpot

### Step 1: Set Up the Custom Code Action

1. Create a new workflow or edit an existing one in HubSpot
2. Click the "+" button to add a new action
3. Select "Custom code" from the actions list
4. Select "JavaScript" as the language (HubSpot now uses Node.js 20 by default)[^5]

### Step 2: Configure "Properties to include in code"

1. Click on the "Properties to include in code" dropdown
2. Search for and select the following properties:
    - `event_sync_luma` (single-line text property)
    - `event_sync_luma_log` (multi-line text property)
3. Ensure the variable names match exactly as they appear in the code[^10][^12]

### Step 3: Configure "Data Outputs"

1. Scroll down to the "Data outputs" section
2. Click "Add output" if needed
3. Set up the following output:
    - Output name: `event_sync_luma_log`
    - Type: Text (String)
4. This output will contain the updated log with the appended value[^4]

### Step 4: Secrets Configuration (Not Required)

For this specific implementation, no secrets are needed since we're only manipulating internal HubSpot properties. Secrets are typically used when connecting to external APIs or services that require authentication[^13].

## How the Code Works

The code follows a simple but effective logic:

1. It retrieves the current values of both `event_sync_luma` and `event_sync_luma_log` properties
2. It checks if the log property is empty or undefined
3. If the log is empty, it sets the log value to just the current event value
4. If the log already contains data, it appends the new event value with a semicolon separator
5. Finally, it returns the updated log through the callback function

## Testing Your Implementation

After deploying the code, you should test it with different scenarios:

1. **Test Case 1:** When `event_sync_luma_log` is empty
    - Expected result: `event_sync_luma_log` is set to the value of `event_sync_luma`
2. **Test Case 2:** When `event_sync_luma_log` already contains a value
    - Expected result: `event_sync_luma_log` will have the new value appended with a semicolon separator
3. **Test Case 3:** When multiple events are logged over time
    - Expected result: `event_sync_luma_log` will contain a semicolon-separated list of all events in chronological order

## Maintaining and Updating the Code

Given that HubSpot is sunsetting older Node.js versions, this implementation using Node.js 20 ensures your code will remain supported well into the future. HubSpot has indicated they will end support for Node.js v18 on October 1, 2025, but Node.js 20 (which this code uses) will continue to be supported[^5][^6].

## Conclusion

This custom code solution provides a robust way to maintain a historical log of events in HubSpot by appending new values to an existing log property. The implementation is straightforward yet powerful, allowing you to track and analyze event history over time.
<span style="display:none">[^1][^11][^14][^15][^16][^17][^18][^19][^2][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^3][^30][^31][^32][^33][^34][^35][^36][^37][^38][^39][^40][^41][^42][^43][^44][^45][^46][^47][^48][^49][^50][^51][^52][^53][^54][^55][^56][^57][^58][^59][^60][^61][^62][^63][^64][^65][^66][^67][^68][^69][^7][^70][^71][^72][^73][^74][^75][^76][^77][^78][^79][^8][^80][^81][^82][^83][^9]</span>

<div align="center">⁂</div>

[^1]: https://developers.hubspot.com/docs/reference/api/automation/custom-code-actions

[^2]: https://developers.hubspot.com/blog/3-ways-to-use-custom-coded-workflow-actions-with-operations-hub

[^3]: https://argondigital.com/blog/general/debugging-custom-code-in-hubspot-workflows/

[^4]: https://community.hubspot.com/t5/9881-Operations-Hub/Data-types-for-outputs-with-sample-code/m-p/408127

[^5]: https://developers.hubspot.com/changelog/deprecation-of-node-v18-in-all-serverless-functions-and-cli

[^6]: https://developers.hubspot.com/changelog/deprecation-of-node-v16-in-all-serverless-functions

[^7]: https://www.scopiousdigital.com/faq/update-hubspot-custom-code-from-node16x-supported-version

[^8]: https://community.hubspot.com/t5/CRM/Auto-append-form-submission-value-Multi-line-text-property/m-p/1009655

[^9]: https://community.hubspot.com/t5/Lists-Lead-Scoring-Workflows/Add-quot-Append-to-current-value-s-quot-option-when-copying-to-a/m-p/190222

[^10]: https://community.hubspot.com/t5/APIs-Integrations/Workflows-Accessing-Properties-to-include-in-code/m-p/945500

[^11]: https://www.antoinebrossault.com/write-you-first-hubspot-operation-hub-custom-code/

[^12]: https://community.hubspot.com/t5/APIs-Integrations/How-to-reference-use-value-of-deal-custom-property-in-workflow/m-p/595050

[^13]: https://community.hubspot.com/t5/APIs-Integrations/How-to-use-Secrets-with-Python-custom-code-automation/m-p/661839

[^14]: https://databox.com/hubspot-custom-coded-workflow-actions

[^15]: https://community.hubspot.com/t5/APIs-Integrations/Is-There-any-way-to-write-custom-node-js-code-inside-HubSpot/m-p/811765

[^16]: https://www.antoinebrossault.com/use-any-module-within-operations-hub-custom-code/

[^17]: https://knowledge.hubspot.com/properties/create-and-edit-properties

[^18]: https://community.hubspot.com/t5/9881-Operations-Hub/Custom-code-for-v1-API-Lists/m-p/677375

[^19]: https://community.zapier.com/how-do-i-3/append-the-value-when-zaping-the-field-to-hubspot-properties-that-already-had-existing-values-without-overwriting-it-3217

[^20]: https://knowledge.hubspot.com/properties/create-calculation-properties

[^21]: https://community.hubspot.com/t5/APIs-Integrations/Custom-Code-Action-event-object-structure-dealstage/m-p/873304

[^22]: https://community.hubspot.com/t5/APIs-Integrations/How-to-add-options-of-HubSpot-property-into-workflow-custom/m-p/1037334

[^23]: https://community.hubspot.com/t5/9881-Operations-Hub/Workflow-Custom-Code-Data-output/td-p/519671

[^24]: https://community.hubspot.com/t5/9881-Operations-Hub/Q-amp-A-Follow-up-Custom-Automation-Workshop-on-creating-a/m-p/580245/highlight/true

[^25]: https://community.hubspot.com/t5/9881-Operations-Hub/Custom-Code-to-contact-text-property/m-p/725882

[^26]: https://community.hubspot.com/t5/9881-Operations-Hub/Workflow-Custom-Code-Data-output/m-p/520406

[^27]: https://developers.hubspot.com/blog/why-ml-recommendations-matter-building-a-custom-solution-with-hubspot-and-aws-part-2-inference-phase

[^28]: https://knowledge.hubspot.com/properties/property-field-types-in-hubspot

[^29]: https://knowledge.hubspot.com/workflows/format-your-data-with-workflows

[^30]: https://developers.hubspot.com/docs/reference/api/overview

[^31]: https://developers.hubspot.com/changelog/cli-requires-node-v18-or-higher

[^32]: https://community.hubspot.com/t5/9881-Operations-Hub/Submit-your-ideas-What-custom-code-actions-should-we-build-next/m-p/481186

[^33]: https://developers.hubspot.com/changelog/deprecation-of-node-v12-in-all-serverless-functions

[^34]: https://community.hubspot.com/t5/CMS-Development/Custom-code-to-connect-HubSpot-to-an-external-platform/td-p/1092284

[^35]: https://github.com/HubSpot/hubspot-api-nodejs

[^36]: https://community.hubspot.com/t5/APIs-Integrations/Post-Call-Custom-Code-Error/m-p/909273

[^37]: https://community.hubspot.com/t5/9881-Operations-Hub/Associate-Deal-to-Company/m-p/819040

[^38]: https://community.hubspot.com/t5/APIs-Integrations/Node-js-and-client-documentation/m-p/410505

[^39]: https://www.youtube.com/watch?v=WRdDQqTeU5c

[^40]: https://developers.hubspot.com/changelog/deprecation-of-node-v14-in-all-serverless-functions

[^41]: https://community.hubspot.com/t5/APIs-Integrations/Custom-workflow-code-Node-js-ERROR-hubspotClient-crm-contacts/m-p/1093167

[^42]: https://community.hubspot.com/t5/9881-Operations-Hub/Custom-Code-Make-a-form-submission-create-a-ticket-and-associate/m-p/810411

[^43]: https://github.com/HubSpot/hubspot-api-nodejs/blob/master/CHANGELOG.md

[^44]: https://community.hubspot.com/t5/9881-Operations-Hub/Custom-code-Workflow-Insert-hyperlink-inside-rich-text/m-p/789285

[^45]: https://community.hubspot.com/t5/9881-Operations-Hub/Extracting-Param-Value-From-URL-Path-Using-Custom-Code/m-p/958946

[^46]: https://knowledge.hubspot.com/workflows/custom-formula-functions

[^47]: https://community.hubspot.com/t5/APIs-Integrations/Workflow-Custom-Code-Write-to-Contact-Property/m-p/915137

[^48]: https://community.hubspot.com/t5/CMS-Development/How-do-I-concatenate-strings-with-HUBL/m-p/251698

[^49]: https://community.hubspot.com/t5/128172-RevOps-Discussions/Converting-a-string-property-to-an-int-using-custom-code-in/td-p/785144

[^50]: https://knowledge.hubspot.com/workflows/choose-your-workflow-actions

[^51]: https://developers.hubspot.com/docs/guides/api/crm/properties

[^52]: https://community.hubspot.com/t5/9881-Operations-Hub/Custom-Code-Actions-extracting-first-three-digits-from-a-phone/m-p/1066195

[^53]: https://community.hubspot.com/t5/APIs-Integrations/Custom-coded-Action-in-Workflow-Not-Updating-Output-Property/m-p/1056283

[^54]: https://knowledge.hubspot.com/reports/create-custom-behavioral-events-with-the-code-wizard

[^55]: https://community.hubspot.com/t5/APIs-Integrations/HELP-Custom-Coded-Workflow-Actions/m-p/926656

[^56]: https://knowledge.hubspot.com/forms/can-i-auto-populate-form-fields-through-a-query-string

[^57]: https://community.hubspot.com/t5/9881-Operations-Hub/Custom-Code-Action-Look-up-the-associated-contact-on-a-deal/m-p/786894

[^58]: https://community.hubspot.com/t5/9881-Operations-Hub/Custom-Code-to-contact-text-property/m-p/725866

[^59]: https://www.youtube.com/watch?v=JKK-NhenEpE

[^60]: https://www.youtube.com/watch?v=yYSBbIBFI8M

[^61]: https://community.hubspot.com/t5/CRM/Workflow-Check-if-one-field-value-is-contained-in-another-field/m-p/329642

[^62]: https://community.hubspot.com/t5/APIs-Integrations/Use-workflow-property-in-custom-action/m-p/982683

[^63]: https://community.hubspot.com/t5/APIs-Integrations/Issue-in-creating-a-workflow-using-custom-code-automations/m-p/689564

[^64]: https://community.hubspot.com/t5/9881-Operations-Hub/Custom-Code-action-not-copying-into-Custum-Property/m-p/436949

[^65]: https://velocitymedia.agency/latest-news/hubspot-operations-hub-explained

[^66]: https://community.hubspot.com/t5/9881-Operations-Hub/Custom-code-Format-Data-split-full-name-property/m-p/740086

[^67]: https://www.youtube.com/watch?v=AvtH-KSykq0

[^68]: https://community.hubspot.com/t5/9881-Operations-Hub/Refreshing-custom-code-secrets/m-p/560302

[^69]: https://community.hubspot.com/t5/HubSpot-Ideas/Refreshing-custom-code-secrets/idi-p/561010

[^70]: https://community.hubspot.com/t5/APIs-Integrations/WorkFlow-Custom-Code-Update-Javascript-code-through-API/m-p/786462

[^71]: https://huble.com/blog/hubspot-security-compliance

[^72]: https://community.hubspot.com/t5/APIs-Integrations/Workflow-Custom-Code-POST-API-Registered-contact-in-external-3rd/m-p/644981

[^73]: https://blog.pearagon.com/unlocking-the-power-of-custom-code-actions-in-hubspot-workflows

[^74]: https://community.hubspot.com/t5/APIs-Integrations/Update-secrets-value-using-custom-code/m-p/656333

[^75]: https://www.reddit.com/r/hubspot/comments/zksa9x/persist_an_external_api_key_in_hubspot_apps/

[^76]: https://blog.origin63.com/advanced-customization-hubspot-operations-hub

[^77]: https://community.hubspot.com/t5/APIs-Integrations/Add-code-into-workflow-step-using-API/m-p/991237

[^78]: https://community.hubspot.com/t5/APIs-Integrations/Managing-Rate-Limiting-in-Workflows-with-Custom-Code-Actions/m-p/1141484

[^79]: https://community.hubspot.com/t5/9881-Operations-Hub/Can-t-get-quot-Property-to-include-in-code-quot-to-work/m-p/798636

[^80]: https://community.hubspot.com/t5/9881-Operations-Hub/Custom-Workflow-action-not-showing-outputs/m-p/597025

[^81]: https://community.hubspot.com/t5/APIs-Integrations/Custom-Code-Action-for-Form-Submission/m-p/994228

[^82]: https://community.hubspot.com/t5/APIs-Integrations/Custom-action-workflow-Getting-started/m-p/939374

[^83]: https://developers.hubspot.com/docs/guides/api/automation/custom-workflow-actions

