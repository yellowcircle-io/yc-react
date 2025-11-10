<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# give me javascript to a extract referral code from a URL parameter that follows the pattern referralCode={code} (e.g. referralCode=xhk3sk1) for use in HubSpot's operations hub. The code needs to be able to utilize HubSpot's field for first page or last page seen

Below is JavaScript code to extract a referral code from a URL parameter matching the pattern `referralCode={code}` (such as `referralCode=xhk3sk1`), for use in HubSpot's Operations Hub workflows. The code is designed to work with either the `hs_analytics_first_url` or `hs_analytics_last_url` fields, which store the first or last page seen by a contact[^1][^2].

You can use this code in a HubSpot workflow custom code action. The code uses the `URLSearchParams` API for robust parsing[^3].

```javascript
exports.main = async (event, callback) => {
  // Get the relevant URL from HubSpot's field (e.g., first or last page seen)
  const url = event.inputFields['hs_analytics_first_url'] || event.inputFields['hs_analytics_last_url'];
  if (!url) {
    callback({
      outputFields: {
        referral_code: ''
      }
    });
    return;
  }

  // Extract the query string from the URL
  const queryStart = url.indexOf('?');
  let queryString = '';
  if (queryStart !== -1) {
    queryString = url.substring(queryStart + 1);
  }

  // Parse the query string for the referral code
  const params = new URLSearchParams(queryString);
  const referralCode = params.get('referralCode') || '';

  callback({
    outputFields: {
      referral_code: referralCode
    }
  });
};
```

**How it works:**

- **Input**: The code reads the URL from either `hs_analytics_first_url` or `hs_analytics_last_url` (whichever is available).
- **Extraction**: It parses the query string of the URL and extracts the value of the `referralCode` parameter.
- **Output**: The extracted referral code is returned as `referral_code` for use in your HubSpot workflow.

This approach is robust and handles both the first and last page seen fields, as well as invalid or missing URLs[^3][^2].
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^4][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://knowledge.hubspot.com/properties/hubspots-default-contact-properties

[^2]: https://community.hubspot.com/t5/CMS-Development/Pull-Query-String-from-First-Page-Seen/td-p/849227

[^3]: https://ryfarlane.com/article/get-and-set-url-parameter-vanilla-javascript

[^4]: https://www.sitepoint.com/get-url-parameters-with-javascript/

[^5]: https://stackoverflow.com/questions/19491336/how-to-get-url-parameter-using-jquery-or-plain-javascript

[^6]: https://community.hubspot.com/t5/APIs-Integrations/Understanding-of-First-and-Last-page-seen/m-p/288186

[^7]: https://stackoverflow.com/questions/979975/get-the-values-from-the-get-parameters-javascript

[^8]: https://docs.vultr.com/javascript/examples/get-the-current-url

[^9]: https://stackoverflow.com/questions/6588977/how-to-to-extract-a-javascript-function-from-a-javascript-file

[^10]: https://community.hubspot.com/t5/Dashboards-Reporting/I-want-to-pull-log-activity-into-a-report-of-a-field-or-fields/td-p/1170426

[^11]: https://www.gkogan.co/save-url-parameters/

[^12]: https://community.latenode.com/t/extract-and-send-referral-code-from-telegram-bot-start-parameter-to-laravel-backend-using-javascript/14211

[^13]: https://www.accordbox.com/blog/scrapy-tutorial-11-how-to-extract-data-from-native-javascript-statement/

[^14]: https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript/24079713

[^15]: https://community.hubspot.com/t5/CRM/First-Page-Seen-amp-amp-Last-Page-Seen-Population-Need-Help/m-p/999767

[^16]: https://community.hubspot.com/t5/Tips-Tricks-Best-Practices/Last-page-seen-missing-in-workflow-after-form-submit/m-p/1069734

[^17]: https://community.hubspot.com/t5/APIs-Integrations/Understanding-of-First-and-Last-page-seen/td-p/288186?profile.language=es

[^18]: https://community.hubspot.com/t5/CRM/Content-of-last-booking-in-meetings-tool/m-p/1036587

[^19]: https://community.hubspot.com/t5/APIs-Integrations/Understanding-of-First-and-Last-page-seen/m-p/288186?profile.language=fr

[^20]: https://www.youtube.com/watch?v=qb8tdBK4SUU

