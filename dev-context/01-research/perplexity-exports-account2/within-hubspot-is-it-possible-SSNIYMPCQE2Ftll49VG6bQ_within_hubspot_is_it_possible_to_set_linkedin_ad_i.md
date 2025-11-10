<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# LinkedIn Ad Interaction Properties in HubSpot: A Comparison with Google and Facebook

Based on my research, LinkedIn ads tracking in HubSpot has some significant limitations compared to Google and Facebook ads when it comes to storing ad interaction data as contact properties.

## Current LinkedIn Ad Tracking Capabilities

When you connect LinkedIn Ads to HubSpot and enable auto-tracking, HubSpot applies the following tracking parameters to LinkedIn ads:[^1][^2]

- `utm_source=linkedin`
- `utm_medium=paid`
- `utm_campaign={name of ad campaign}`
- `hsa_net=linkedin`
- `hsa_ver=3`
- `hsa_acc={accountid}`
- `hsa_cam={campaigngroupid}`
- `hsa_grp={campaignid}`
- `hsa_ad={creative}`


## Key Limitation: No LinkedIn Ad ID Property

**The short answer is no** - HubSpot does not currently provide a dedicated LinkedIn Ad ID property field on contact records, unlike Google and Facebook ads.[^3][^4]

For comparison:

- **Google Ads**: HubSpot provides a "Google ad click ID" contact property that stores the GCLID[^5][^6]
- **Facebook Ads**: HubSpot provides a "Facebook click ID" contact property that stores the FBCLID[^7][^5]
- **LinkedIn Ads**: No equivalent ad ID property exists


## Where LinkedIn Ad Interaction Data Lives

Instead of storing LinkedIn ad IDs as contact properties, HubSpot handles LinkedIn ad interactions differently:[^3]

1. **Contact Timeline**: Ad interaction data appears in the contact's activity timeline showing which LinkedIn ads they clicked
2. **List Filters Only**: You can create lists based on LinkedIn ad interactions using filters like:
    - LinkedIn ad ID
    - LinkedIn ad name
    - LinkedIn campaign ID
    - LinkedIn campaign name
    - LinkedIn campaign group ID
    - LinkedIn campaign group name
    - LinkedIn ad type
    - Occurred (date filter)
3. **Not Contact Properties**: As HubSpot's documentation explicitly states: "The ads interaction filters reflect the information in ads activities on contact timelines. This information is not reflected in any contact properties"[^3]

## Workarounds and Limitations

Several community members have identified this gap:[^4]

- The ad interaction data is visible on contact records but cannot be copied to custom properties via workflows
- There's no way to sync LinkedIn ad ID values to external systems like Salesforce
- Users have requested this feature as it would provide the granular tracking available with Google and Facebook ads


## Alternative Solutions

For businesses requiring LinkedIn ad ID tracking at the contact level, some third-party solutions like Attributer or Fibbler offer enhanced tracking capabilities that can capture and store LinkedIn ad data as contact properties.[^8][^9][^10]

## Conclusion

While HubSpot's LinkedIn ads integration provides comprehensive campaign tracking and lead syncing capabilities, it lacks the dedicated ad ID contact property fields that exist for Google and Facebook ads. The ad interaction data is tracked and accessible through contact timelines and list filters, but it cannot be stored as individual contact properties or easily exported to other systems.
<span style="display:none">[^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35][^36][^37][^38][^39][^40][^41][^42][^43][^44][^45][^46][^47][^48][^49][^50][^51][^52][^53][^54]</span>

<div align="center">⁂</div>

[^1]: https://knowledge.hubspot.com/ads/track-and-report-on-your-linkedin-ads-in-hubspot

[^2]: https://community.hubspot.com/t5/Ads/Hubspot-LinkedIn-and-Facebook-Ads-Tracking-UTM-parameters/m-p/691310

[^3]: https://knowledge.hubspot.com/ads/segment-contacts-based-on-ads-interactions

[^4]: https://community.hubspot.com/t5/HubSpot-Ideas/Ad-ID-as-a-stored-contact-property/idi-p/890717

[^5]: https://community.hubspot.com/t5/Ads/Ads-Offline-Conversion-Tracking-Get-GCLID-amp-FB-Lead-ID/m-p/397922

[^6]: https://knowledge.hubspot.com/properties/hubspots-default-contact-properties

[^7]: https://help.chartmogul.com/hc/en-us/articles/17815313714588-HubSpot-properties-available-for-import

[^8]: https://fibbler.co/blog/hubspot-linkedin-ads-integration

[^9]: https://www.youtube.com/watch?v=IA7FtzORMgk

[^10]: https://attributer.io/blog/track-linkedin-ads-hubspot

[^11]: https://www.hublead.io/hubspot-linkedin-guide/hubspot-linkedin-ads-integration

[^12]: https://www.youtube.com/watch?v=3sBrr5m4XYY

[^13]: https://knowledge.hubspot.com/ads/track-facebook-ads-in-hubspot

[^14]: https://zapier.com/apps/hubspot/integrations/linkedin-ads/1807653/update-linkedin-ads-audience-with-new-hubspot-contact-properties-changes

[^15]: https://www.leadstreet.be/en/blog/hubspot-utms-traffic-sources-ad-tracking

[^16]: https://www.linkedin.com/posts/harriskenny_how-am-i-just-seeing-this-hubspot-now-has-activity-7245460658320818177-huhS

[^17]: https://ecosystem.hubspot.com/marketplace/apps/linkedin-ads

[^18]: https://community.hubspot.com/t5/Ads/Tracking-Facebook-Click-to-Chat-Campaigns-in-HubSpot-via-API/td-p/1027261

[^19]: https://business.linkedin.com/content/dam/me/business/en-us/marketing-solutions/resources/pdfs/linkedIn_hubspot_better_together.pdf

[^20]: https://knowledge.hubspot.com/ads/analyze-ad-campaigns-in-hubspot

[^21]: https://zapier.com/apps/hubspot/integrations/linkedin-ads

[^22]: https://knowledge.hubspot.com/properties/understand-traffic-source-properties

[^23]: https://knowledge.hubspot.com/ads/ad-tracking-in-hubspot

[^24]: https://knowledge.hubspot.com/ads/connect-your-linkedin-ads-account-to-hubspot

[^25]: https://knowledge.hubspot.com/reports/understand-hubspots-traffic-sources-in-the-traffic-analytics-tool

[^26]: https://knowledge.hubspot.com/ads/create-and-sync-ad-conversion-events-with-your-linkedin-ads-account

[^27]: https://community.hubspot.com/t5/Tips-Tricks-Best-Practices/Get-contact-who-quot-like-quot-our-linkedin-posts/m-p/440702

[^28]: https://coefficient.io/hubspot-data-management/linkedin-ads-to-hubspot

[^29]: https://www.hublead.io/blog/hubspot-contact-properties

[^30]: https://community.hubspot.com/t5/APIs-Integrations/LinkedIn-integration-Where-to-map-properties/m-p/1089039

[^31]: https://zapier.com/apps/hubspot/integrations/linkedin-ads/15775/create-or-update-contacts-on-hubspot-from-new-linkedin-ads-leads

[^32]: https://knowledge.hubspot.com/ads/lead-ads-field-mappings-to-hubspot

[^33]: https://community.hubspot.com/t5/CRM/There-is-no-field-available-for-LinkedIn-URL-in-Hubspot-Contacts/m-p/964364

[^34]: https://zapier.com/apps/hubspot/integrations/linkedin-ads/1635437/add-new-hubspot-contacts-in-list-to-linkedin-ads-audience-companies

[^35]: https://community.hubspot.com/t5/Ads/LinkedIn-ad-values-in-fields/m-p/772378

[^36]: https://knowledge.hubspot.com/ads/sync-leads-from-your-facebook-page-or-linkedin-ads-account-to-hubspot

[^37]: https://community.hubspot.com/t5/Marketing-Integrations/Hubspot-tracking-Linkedin/td-p/955355

[^38]: https://www.youtube.com/watch?v=NZbgBKDTxOI

[^39]: https://community.hubspot.com/t5/APIs-Integrations/Cannot-Find-quot-LinkedIn-URL-quot-Property-in-Contact-Columns/m-p/1024533

[^40]: https://www.linkedin.com/business/marketing/blog/linkedin-ads/leveraging-hubspot-for-inkedin-ads

[^41]: https://www.reddit.com/r/hubspot/comments/1ga82eu/help_needed_url_error_for_linkedin_ads_due_to/

[^42]: https://community.hubspot.com/t5/Ads/No-contact-tracking-for-Facebook-Ads-linked-to-website/m-p/825249

[^43]: https://www.youtube.com/watch?v=US-FTuqjB_o

[^44]: https://www.youtube.com/watch?v=xBmiCgZTRVg

[^45]: https://knowledge.hubspot.com/ads/troubleshoot-ad-tracking-issues

[^46]: https://community.hubspot.com/t5/Ads/HubSpot-Tracking-URL-and-LinkedIn-Ads/m-p/959376

[^47]: https://www.jordandigitalmarketing.com/blog/utm-tracking-in-hubspot-for-google-linkedin-facebook

[^48]: https://www.youtube.com/watch?v=0HT4Zn6kGPc

[^49]: https://zapier.com/apps/hubspot/integrations/linkedin-ads/15779/add-new-linkedin-ads-leads-to-hubspot-crm

[^50]: https://henrywang.nl/hubspot-contact-properties-list/

[^51]: https://community.hubspot.com/t5/CRM/Adding-LinkedIn-profile-URL-company-name-and-title-in-contact/m-p/28724

[^52]: https://community.hubspot.com/t5/Ads/Tracking-Facebook-Click-to-Chat-Campaigns-in-HubSpot-via-API/m-p/1027261/highlight/true

[^53]: https://community.hubspot.com/t5/Ads/Workflow-enrollment-based-on-Website-URL-of-the-LinkedIn-ad/m-p/753871

[^54]: https://community.hubspot.com/t5/Ads/Ad-interaction-list/m-p/887042

