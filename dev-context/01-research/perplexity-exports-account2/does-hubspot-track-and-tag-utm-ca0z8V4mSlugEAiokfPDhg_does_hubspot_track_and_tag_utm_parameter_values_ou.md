<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## HubSpot and UTM Parameter Tracking: Out-of-the-Box Capabilities

**Summary:**
HubSpot does **not** track and tag individual UTM parameter values for each contact "out of the box" in a granular, reportable way. While HubSpot natively uses UTM parameters for traffic source attribution and campaign tracking, capturing and storing the specific UTM values (like `utm_source`, `utm_medium`, `utm_campaign`) as contact properties requires additional setup.

---

**How HubSpot Handles UTM Parameters by Default**

- HubSpot automatically uses UTM parameters in URLs to help categorize and attribute traffic sources in its analytics and reporting tools. For example, it will bucket contacts into "Paid Search" or "Paid Social" based on UTM values, and populate "Original source" and "Drill-down" properties for contacts[^8].
- However, HubSpot does **not** automatically store the raw UTM parameter values (e.g., the exact value of `utm_campaign`) as individual contact properties without further configuration[^1][^5][^6][^16].

---

**What Is Required to Track UTM Values per Contact?**

To capture and retain UTM parameter values at the contact level, you need to:

- **Create custom properties** in HubSpot for each UTM parameter you want to track (e.g., `utm_source`, `utm_medium`, `utm_campaign`)[^1][^5][^16].
- **Add hidden fields** to your HubSpot forms that correspond to these custom properties. When a visitor submits a form, these hidden fields can be populated with the UTM values from the URL and stored in the contact record[^1][^5][^16].
- Optionally, use scripts or third-party tools to persist UTM parameters across sessions or multiple pages, ensuring attribution even if the form is not on the original landing page[^6][^14].

---

**Limitations and Considerations**

- **Session Persistence:** Out-of-the-box, HubSpot does not persist UTM parameter values across sessions or pages. If a user navigates away from the landing page before submitting a form, UTM values may be lost unless you implement a custom solution (e.g., using cookies and scripts)[^6].
- **Reporting:** While HubSpot can report on "Original source" and similar properties, there is no out-of-the-box report that shows the exact UTM parameter values for each contact. Custom reports require the setup described above[^1][^8][^16][^18].
- **Channels Not Using UTMs:** For channels like organic search, direct, or referral, HubSpot uses its own attribution logic and does not rely on UTM parameters, so hidden field tracking is not applicable for those sources[^6].

---

**Comparison Table: Out-of-the-Box vs. Custom UTM Tracking in HubSpot**


| Feature | Out-of-the-Box | Requires Custom Setup |
| :-- | :--: | :--: |
| Traffic source attribution using UTMs | Yes | – |
| Storing raw UTM values per contact | No | Yes |
| Reporting on UTM values per contact | No | Yes |
| Persisting UTM values across sessions | No | Yes |
| Hidden form fields for UTM capture | No | Yes |


---

**Conclusion**

HubSpot does not automatically track and tag UTM parameter values as contact properties "out of the box." To achieve granular UTM tracking and reporting, you must set up custom properties and hidden form fields, or use a third-party solution to persist and capture UTM values throughout the user journey[^1][^5][^6][^16].
<span style="display:none">[^10][^11][^12][^13][^15][^17][^19][^2][^3][^4][^7][^9]</span>

<div align="center">⁂</div>

[^1]: https://community.hubspot.com/t5/Reporting-Analytics/Track-UTM-Parameters/m-p/776761

[^2]: https://blog.hubspot.com/marketing/what-are-utm-tracking-codes-ht

[^3]: https://knowledge.hubspot.com/settings/how-do-i-create-a-tracking-url

[^4]: https://community.hubspot.com/t5/Tips-Tricks-Best-Practices/How-to-pass-UTM-parameters-to-HubSpot-form/m-p/491554

[^5]: https://www.terminusapp.com/blog/utm-parameters-in-hubspot/

[^6]: https://www.obilityb2b.com/blog/our-work/case-studies/integrating-hubspot-lead-metrics-with-ads-and-analytics-data/

[^7]: https://offers.hubspot.com/utm-link-generator

[^8]: https://answers.microsoft.com/en-us/msadvs/forum/all/connect-hubspot-to-bing-utm/5b555230-5841-41d2-94ad-a997c49de1c5

[^9]: https://www.hq-digital.com/blog/capturing-and-reporting-utms-in-hubspot-with-custom-properties-and-forms

[^10]: https://checkoutpage.co/help/articles/utm-tracking-parameters

[^11]: https://community.hubspot.com/t5/Reporting-Analytics/UTM-Fields-and-tracking/m-p/638896

[^12]: https://www.campaigntrackly.com/utm-parameters/

[^13]: https://www.hublead.io/blog/hubspot-tracking-url

[^14]: https://forms.utmgrabber.com/maximize-utm-tracking-campaign-tracking-with-hubspot-embed-form/

[^15]: https://www.youtube.com/watch?v=57g1kZo6i98

[^16]: https://aptitude8.com/blog/custom-properties-you-should-be-using-for-hubspot-attribution

[^17]: https://community.hubspot.com/t5/Reporting-Analytics/How-to-pass-UTM-Parameters-in-Hidden-Fields-of-Hubspot-Form/m-p/844737

[^18]: https://community.hubspot.com/t5/Ads/How-do-I-view-traffic-contacts-generated-by-Microsoft-Ads-in/m-p/551862?profile.language=fr

[^19]: https://cxl.com/blog/utm-parameters/

