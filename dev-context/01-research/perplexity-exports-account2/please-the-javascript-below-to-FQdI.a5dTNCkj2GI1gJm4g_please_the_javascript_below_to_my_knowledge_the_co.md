<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## JavaScript Code Analysis: UTM Parameter Validation Issue

You are **correct** in your assessment. The JavaScript code you provided has a **significant bug** in the UTM parameter assignment logic, specifically on **line 27**:

```javascript
if (utm_funnel) outputFields.utm_ref = utm_funnel;
```

This line incorrectly assigns the `utm_funnel` value to the `utm_ref` field instead of the intended `utm_funnel` field. It should be:

```javascript
if (utm_funnel) outputFields.utm_funnel = utm_funnel;
```


### Analysis of UTM Parameter Checking

Regarding your specific question about checking for UTM parameters not part of the URL, the code **does** include checks for UTM parameters that are actually present in the URL:

#### Current Validation Logic:

1. **Basic substring check**: `firstPageSeen.includes('utm_')` - This checks if the string "utm_" appears anywhere in the URL
2. **Proper URL parameter extraction**: Uses `url.searchParams.get()` to extract actual URL parameters
3. **Conditional assignment**: Only assigns values if they exist using truthiness checks

#### What the Code Does Well:

- **Validates URL structure**: Uses `try-catch` with `new URL()` to handle malformed URLs[^1][^2]
- **Extracts standard UTM parameters**: Correctly extracts utm_source, utm_medium, utm_campaign, utm_content, and utm_term[^1][^2]
- **Handles non-existent parameters**: Returns `null` for parameters that don't exist, which is handled by the conditional checks[^2]


#### Limitations and Issues:

**1. Naive String Check**: The `includes('utm_')` check is somewhat simplistic - it would match any string containing "utm_" even if it's not actually a parameter[^1]

**2. URL-Only Scope**: The code only processes UTM parameters that are literally present in the URL. It doesn't handle UTM parameters from other sources like:

- Browser cookies
- Session storage
- Local storage
- Hidden form fields
- Server-side session data

**3. HubSpot Context**: In HubSpot Operations Hub workflows, this approach works for tracking "First Page Seen" URLs, but UTM parameters typically only persist for the initial page load unless specifically preserved[^3][^4]

### Recommended Improvements:

```javascript
// Improved UTM validation
exports.main = (event, callback) => {
  const firstPageSeen = event.inputFields.first_page_seen;
  const outputFields = {};
  
  // Check if URL exists and is valid
  if (firstPageSeen) {
    try {
      const url = new URL(firstPageSeen);
      
      // Check if any UTM parameters exist
      const hasUTMParams = Array.from(url.searchParams.keys())
        .some(key => key.startsWith('utm_'));
      
      if (hasUTMParams) {
        // Extract UTM parameters
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
        if (utm_funnel) outputFields.utm_funnel = utm_funnel; // Fixed assignment
      }
    } catch (error) {
      console.error('Error parsing URL:', error);
    }
  }
  
  callback({
    outputFields: outputFields
  });
};
```


### Key Takeaways:

- **Your observation is correct**: The code has a critical bug in the utm_funnel assignment
- **The validation logic works**: It properly checks for UTM parameters in the URL using modern JavaScript APIs
- **Scope is limited**: The code only handles URL-based UTM parameters, not those stored elsewhere
- **HubSpot best practices**: For comprehensive UTM tracking in HubSpot, consider implementing cookie-based persistence or hidden form fields for cross-page tracking[^3][^4][^5]

The code serves its purpose for initial UTM capture from the "First Page Seen" URL in HubSpot workflows, but the assignment bug needs to be fixed for proper utm_funnel tracking.
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://builtin.com/articles/urlsearchparams

[^2]: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/get

[^3]: https://community.hubspot.com/t5/Reporting-Analytics/Track-UTM-Parameters/m-p/776761

[^4]: https://community.hubspot.com/t5/Tips-Tricks-Best-Practices/How-to-pass-UTM-parameters-to-HubSpot-form/m-p/491554

[^5]: https://www.waseembashir.com/post/pass-utm-parameters-to-next-page

[^6]: https://docs.calibermind.com/system-configuration/utm-parameters-formatting-and-best-practices/

[^7]: https://stackoverflow.com/questions/74376327/need-to-find-multiple-utm-paramater-present-in-url-or-not

[^8]: https://www.leadstreet.be/en/blog/hubspot-utms-traffic-sources-ad-tracking

[^9]: https://www.geeksforgeeks.org/node-js/node-js-urlsearchparams-get-method/

[^10]: https://web.utm.io/blog/utm-parameters-best-practices/

[^11]: https://checkoutlinks.com/blog/utm-tracking-best-practices

[^12]: https://avantahub.com/blog/mastering-utm-tracking-urls-in-hubspot

[^13]: https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript

[^14]: https://stackoverflow.com/questions/486896/adding-a-parameter-to-the-url-with-javascript

[^15]: https://community.hubspot.com/t5/Email-Marketing-Tool/How-to-update-automated-UTM-codes/m-p/974714

[^16]: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/getAll

[^17]: https://www.ercule.co/blog/utm-parameters-best-practices

[^18]: https://knowledge.hubspot.com/settings/how-do-i-create-a-tracking-url

[^19]: https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams

[^20]: https://community.hubspot.com/t5/CRM/What-s-the-best-way-to-track-UTM-parameters-in-HubSpot-for/td-p/1166630

