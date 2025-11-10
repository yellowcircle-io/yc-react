<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## HubSpot Operations Hub Recent Changes and Custom Code Issues

Based on my research of recent HubSpot Operations Hub updates and analysis of your custom code, I've identified several key developments and a critical bug in your workflow script.

### **Recent Operations Hub Platform Changes**

**Node.js Version Update (2025)**
The most significant change affecting custom code functionality is HubSpot's **Node.js version upgrade to version 20**[^1][^2][^3]. HubSpot deprecated Node.js v18 support across all serverless functions and CLI tools, with the transition occurring in April 2025. While custom coded workflow actions were already upgraded to Node.js v20, this platform-wide update may have introduced compatibility issues with existing code patterns.

**Developer Platform Updates**
HubSpot introduced **Platform Version 2025.1** in April 2025, which sets Node.js v20 as the minimum required version for all serverless and endpoint functions[^1]. This update ensures compatibility with the latest tooling and improved functionality but may have affected how certain JavaScript APIs behave in the workflow environment.

**Enhanced Error Handling and Monitoring**
Recent updates have improved workflow error reporting and **automation issue management**[^4][^5]. HubSpot now provides better visibility into workflow failures and has expanded automation overview capabilities, which may explain why you're seeing more detailed error messages than before.

### **Critical Bug in Your Code**

I've identified a **critical bug** in your UTM parameter parsing code:

```javascript
if (utm_funnel) outputFields.utm_ref = utm_funnel;  // BUG: Should be utm_funnel
```

This line incorrectly assigns the `utm_funnel` value to the `utm_ref` output field instead of `utm_funnel`. This means your `utm_funnel` parameter data is being overwritten and lost.

### **Additional Code Issues**

**Formatting Inconsistencies**
Your code has inconsistent spacing in variable declarations, particularly with the `utm_ref` and `utm_funnel` variables, which could indicate copy-paste errors.

**Limited Error Handling**
While your code includes basic error handling, it doesn't properly communicate failures back to the workflow system using HubSpot's `hs_execution_state` parameter[^6]. This could explain why errors aren't being properly logged or reported.

### **Corrected Code Solution**

Here's the corrected version of your code with improvements:

```javascript
// Custom code in Operations Hub workflow
exports.main = (event, callback) => {
  // Get the First Page Seen URL
  const firstPageSeen = event.inputFields.first_page_seen;
  const outputFields = {};
  
  // Check if URL exists and contains UTM parameters
  if (firstPageSeen && firstPageSeen.includes('utm_')) {
    // Extract UTM parameters using URL API
    try {
      const url = new URL(firstPageSeen);
      const utm_source = url.searchParams.get('utm_source');
      const utm_medium = url.searchParams.get('utm_medium');
      const utm_campaign = url.searchParams.get('utm_campaign');
      const utm_content = url.searchParams.get('utm_content');
      const utm_term = url.searchParams.get('utm_term');
      const utm_ref = url.searchParams.get('utm_ref');
      const utm_funnel = url.searchParams.get('utm_funnel');
      
      // Only set values if they exist
      if (utm_source) outputFields.utm_source = utm_source;
      if (utm_medium) outputFields.utm_medium = utm_medium;
      if (utm_campaign) outputFields.utm_campaign = utm_campaign;
      if (utm_content) outputFields.utm_content = utm_content;
      if (utm_term) outputFields.utm_term = utm_term;
      if (utm_ref) outputFields.utm_ref = utm_ref;
      if (utm_funnel) outputFields.utm_funnel = utm_funnel;  // FIXED
    } catch (error) {
      console.error('Error parsing URL:', error);
      // Set execution state to indicate failure
      outputFields.hs_execution_state = 'Failed';
    }
  }
  
  callback({
    outputFields: outputFields
  });
};
```


### **Additional Recommendations**

**Rate Limiting Considerations**
If you're experiencing errors with large workflow enrollments, consider implementing **exponential backoff delays** in your custom code[^7][^8]. HubSpot's concurrent execution model can trigger rate limits when many objects are processed simultaneously.

**Error Monitoring**
Take advantage of HubSpot's improved **workflow action logs** and **automation overview** features[^4][^5] to better monitor your custom code performance and identify specific failure patterns.

**Platform Updates**
Stay updated with HubSpot's monthly developer changelogs[^9][^10] as the platform continues to evolve rapidly, particularly around AI features and workflow automation capabilities.

The primary issue appears to be the bug in your code rather than platform changes, though the recent Node.js upgrade may have made error reporting more sensitive, causing previously silent failures to become visible.
<span style="display:none">[^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34]</span>

<div align="center">⁂</div>

[^1]: https://community.hubspot.com/t5/Releases-and-Updates/April-2025-Product-Updates/ba-p/1152561

[^2]: https://community.hubspot.com/t5/Developer-Announcements/Deprecation-of-Node-v18-in-all-serverless-functions-and-CLI/m-p/1136841

[^3]: https://developers.hubspot.com/changelog/deprecation-of-node-v18-in-all-serverless-functions-and-cli

[^4]: https://martech.org/14-hubspot-updates-from-april-2025-you-dont-want-to-miss/

[^5]: https://martech.org/the-14-best-hubspot-updates-from-may-2025/

[^6]: https://community.hubspot.com/t5/9881-Operations-Hub/No-documentation-on-Custom-Code-Error-handling-hs-execution/m-p/926169

[^7]: https://community.hubspot.com/t5/APIs-Integrations/Errors-when-enrolling-many-objects-into-a-custom-code-workflow/m-p/637181

[^8]: https://community.hubspot.com/t5/APIs-Integrations/Large-enrollment-Workflows-with-custom-code/m-p/714260

[^9]: https://developers.hubspot.com/changelog/may-2025-rollup

[^10]: https://www.youtube.com/watch?v=7kTH33_QBok

[^11]: https://www.protocol80.com/blog/hubspot-operations-hub-features

[^12]: https://ir.hubspot.com/news-releases/news-release-details/hubspot-expands-its-crm-platform-launch-operations-hub

[^13]: https://developers.hubspot.com/docs/api/workflows/custom-code-actions

[^14]: https://www.growth-ninjas.com/en/hubspot-news-operations-hub-data-sync-updates-and-new-apps-in-the-marketplace/

[^15]: https://www.coastalconsulting.co/blog/inbound-2022-3-new-operation-hub-features-announced

[^16]: https://blog.elixir-solutions.net/8-key-june-2025-hubspot-updates

[^17]: https://help.timelines.ai/en/article/hubspot-workflows-custom-actions-troubleshooting-bjwzr0/

[^18]: https://community.hubspot.com/t5/Releases-and-Updates/bg-p/releases-updates

[^19]: https://blog.elixir-solutions.net/10-key-may-2025-hubspot-updates

[^20]: https://community.hubspot.com/t5/APIs-Integrations/Handling-a-Custom-Code-if-it-fails/m-p/795637

[^21]: https://developers.hubspot.com/changelog/cli-requires-node-v18-or-higher

[^22]: https://www.youtube.com/watch?v=m4VUCrlD8cs

[^23]: https://community.hubspot.com/t5/CMS-Development/Pull-Query-String-from-First-Page-Seen/td-p/849227

[^24]: https://github.com/Webflow-Examples/utm-params-with-native-hubspot-integration

[^25]: https://dev.to/amitkumar13/mastering-urlsearchparams-in-javascript-the-smart-way-to-handle-query-strings-3g20

[^26]: https://community.hubspot.com/t5/APIs-Integrations/Understanding-of-First-and-Last-page-seen/m-p/288186

[^27]: https://www.hubdev.in/references/how-to-track-and-utilize-utm-parameters-in-hubspot-for-personalized-campaigns

[^28]: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams

[^29]: https://developers.hubspot.com/docs/reference/api/overview

[^30]: https://www.weberlo.com/guides/hubspot-utm-parameters

[^31]: https://community.hubspot.com/t5/9881-Operations-Hub/30-second-limit-in-workflow-custom-code/td-p/581400

[^32]: https://developers.hubspot.com/changelog/june-2025-rollup

[^33]: https://sentry.io/answers/how-to-get-values-from-urls-in-javascript/

[^34]: https://designers.hubspot.com/blog/url-and-link-fields-now-available-in-custom-modules

