<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# I'd like to push form data from an external tool into a HubSpot form. What is the best, fastest way to deploy such a solution?

The **fastest and most robust way to push form data from an external tool into a HubSpot form** is to use the **HubSpot Forms API**. This approach provides maximum flexibility, immediate deployment (no need to wait for HubSpot's tracking code to detect your form), and precise control over field mapping and consent handling.

Here’s how you can implement this solution:

**1. Create a HubSpot Form**

- In HubSpot, create the form you want to receive data.
- Note the form’s **GUID** and your **HubSpot Portal ID**—these are required for API submissions[^1].

**2. Prepare Your External Tool to Submit Data**

- Collect the form data in your external tool as usual.
- Format the data according to the HubSpot Forms API requirements: an array of field objects with `name` and `value` keys[^1].
- Include the **hubspotutk** cookie value (if available) to associate the submission with the visitor’s session. This is important for analytics and contact tracking[^2][^1][^3].
- Add a `context` object containing the `hutk` (the hubspotutk cookie value), `pageUri`, and `pageName`[^2][^1][^3].

**3. Make the API Request**

- Submit the data via a POST request to the endpoint:

```
https://forms.hubspot.com/uploads/form/v2/{portalId}/{formGuid}
```

- The request body should be JSON, containing your fields and context. Example structure:

```json
{
  "fields": [
    { "name": "firstname", "value": "John" },
    { "name": "email", "value": "john@example.com" }
  ],
  "context": {
    "hutk": "your-hubspotutk-cookie-value",
    "pageUri": "https://yourdomain.com/form-page",
    "pageName": "Contact Us"
  },
  "legalConsentOptions": {
    "consent": {
      "consentToProcess": true,
      "text": "I agree to allow Example Company to store and process my personal data.",
      "communications": [
        {
          "value": true,
          "subscriptionTypeId": 999,
          "text": "I agree to receive marketing communications from Example Company."
        }
      ]
    }
  }
}
```

Adjust the fields and consent options as needed for your use case[^1][^3][^4].

**4. Handle Responses and Errors**

- Check the API response for errors (e.g., missing required fields, consent issues, etc.)[^3][^4].
- If you need GDPR compliance or marketing opt-in, ensure you properly structure the `legalConsentOptions` object as shown above[^4].

**Alternative: Non-HubSpot Forms Tool**

If you prefer a no-code approach and your external form is on a website where you can add JavaScript, you can use HubSpot’s **non-HubSpot forms tool**:

- Install the HubSpot tracking code on your external page.
- Enable the non-HubSpot forms feature in your HubSpot account.
- HubSpot will automatically detect and collect submissions from standard HTML forms[^5][^4].

**Limitations of Non-HubSpot Forms:**

- Only works with standard HTML forms.
- Field mapping is limited to single-line text properties and cannot be manually adjusted.
- Submissions depend on the successful loading of the HubSpot tracking code and may not be as reliable as direct API integration[^5].

**Recommendation**

- **For maximum reliability, speed, and control:** Use the **HubSpot Forms API** with a server-side or client-side script in your external tool[^2][^1][^3][^4].
- **For basic, no-code integration:** Use the **non-HubSpot forms tool** by adding the HubSpot tracking code to your site[^5].

**References for Implementation:**

- Example JavaScript walkthrough: [^1]
- PHP POST example: [^3]
- Consent/checkbox handling: [^4]

If you need a code sample or further details for a specific programming language, let me know.
<span style="display:none">[^10][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://gist.github.com/robertainslie/b110b8275beee1b27255c4d6e2ba2e8c

[^2]: https://gist.github.com/robertainslie/b110b8275beee1b27255c4d6e2ba2e8c?permalink_comment_id=5081946

[^3]: https://community.hubspot.com/t5/Tips-Tricks-Best-Practices/Send-external-form-data-to-hubspot/m-p/302175

[^4]: https://www.reddit.com/r/hubspot/comments/1bl8gm5/sending_form_data_to_hubspot_from_a_nonhubspot/

[^5]: https://knowledge.hubspot.com/forms/use-non-hubspot-forms

[^6]: https://developers.hubspot.com/docs/reference/api/marketing/forms/v2

[^7]: https://insidea.com/blog/hubspot/how-to-pull-non-hubspot-form-submission-data-into-hubspot-crm/

[^8]: https://forms.app/en/help-center/hubspot-integration

[^9]: https://community.hubspot.com/t5/APIs-Integrations/Submitting-form-data-to-HubSpot/m-p/236937

[^10]: https://knowledge.hubspot.com/forms/how-can-i-share-a-hubspot-form-if-im-using-an-external-site

