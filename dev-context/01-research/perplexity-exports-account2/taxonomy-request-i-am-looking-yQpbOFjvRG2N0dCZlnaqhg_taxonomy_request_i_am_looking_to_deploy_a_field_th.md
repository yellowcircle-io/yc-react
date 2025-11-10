<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Field Naming and Taxonomy Framework for Contact Conversion Attribution

## Recommended Field Name: **"Acquisition Channel"**

Based on extensive research into CRM best practices and attribution modeling, **"Acquisition Channel"** emerges as the optimal field name for tracking contact conversion pathways. This terminology avoids the confusion inherent in "campaign" and "event" while providing intuitive clarity about the field's purpose.[^1][^2][^3]

## Hierarchical Taxonomy Structure

### Primary Channel Categories (Level 1)

The taxonomy should employ a three-tiered hierarchical structure starting with primary acquisition channels:

**Marketing-Driven Channels:**

- Paid Digital Advertising
- Organic Search \& SEO
- Content Marketing
- Social Media
- Email Marketing
- Referral \& Partnership

**Sales-Driven Channels:**

- Direct Sales Outreach
- Account-Based Marketing (ABM)
- Sales Development Representative (SDR) Activity
- Cold Outreach

**Event \& Engagement Channels:**

- Webinars \& Virtual Events
- Trade Shows \& Conferences
- Product Demos
- Free Trials


### Secondary Attribution (Level 2)

Each primary channel should support secondary classification based on UTM parameters and form submissions:

**UTM Source Integration:**

- utm_source → maps to specific platform (Facebook, Google, LinkedIn)
- utm_medium → maps to channel type (cpc, email, social, organic)
- utm_campaign → maps to specific initiative or campaign name[^2][^4]

**Form Submission Context:**

- Landing page type (demo request, whitepaper download, newsletter signup)
- Content offer classification
- Lead magnet category[^5][^6]


### Tertiary Qualification (Level 3)

The finest level should capture campaign-specific details and attribution timing:

**Campaign Attribution:**

- First-touch vs. Last-touch designation
- Multi-touch attribution weights for complex journeys
- Time-decay consideration for longer sales cycles[^7][^8][^9]


## Implementation Framework

### Field Configuration Requirements

**Data Type:** Picklist (dropdown) for primary level with dependent picklists for secondary classification[^10]

**Validation Rules:**

- Required field completion for all new contacts
- Automated population based on UTM parameter mapping
- Form submission triggers for attribution assignment[^11][^3]

**Integration Specifications:**
For Salesforce/HubSpot compatibility, ensure field mapping consistency:

- Use identical API names across both systems
- Implement two-way sync rules for attribution updates
- Avoid conflicts with existing "Lead Source" fields[^12][^13][^5]


### Attribution Logic and Rules

**UTM-Based Attribution:**

```
IF utm_campaign EXISTS → Primary Channel = "Paid Digital Advertising"
AND utm_source = "facebook" → Secondary = "Facebook Ads" 
AND utm_medium = "cpc" → Tertiary = "Paid Social - CPC"
```

**Form-Based Attribution:**

```
IF form_type = "demo_request" → Primary Channel = "Direct Sales Outreach"
AND referrer_source = "organic_search" → Secondary = "SEO-Driven Demo"
AND landing_page_campaign = "product_trial" → Tertiary = "Free Trial Conversion"
```

**Sales Activity Attribution:**

```
IF contact_source = "sales_outreach" → Primary Channel = "Direct Sales Outreach"
AND activity_type = "cold_email" → Secondary = "SDR Email Campaign"  
AND response_status = "meeting_booked" → Tertiary = "Qualified Prospect"
```


## Operational Guidelines

### Population and Maintenance Rules

**Automated Population Priority:**

1. UTM parameters (highest priority for digital touchpoints)
2. Form submission context (second priority for inbound leads)
3. CRM activity records (third priority for sales-driven contacts)
4. Manual entry (lowest priority, exception handling only)[^14][^15]

**Update Logic:**

- First-touch attribution: Lock initial value, create separate field for attribution history
- Last-touch attribution: Allow overwriting with more recent qualifying activities
- Multi-touch attribution: Maintain chronological record of all touchpoints[^6][^16]


### Reporting and Analytics Framework

**Standard Reports:**

- Acquisition Channel Performance Dashboard
- Attribution ROI Analysis by Channel
- Multi-touch Journey Mapping
- Campaign Effectiveness Scoring[^17][^18]

**KPI Alignment:**

- Customer Acquisition Cost (CAC) by channel
- Lead-to-customer conversion rates
- Channel attribution accuracy metrics
- Sales velocity by acquisition source[^19][^20]

This structured approach provides the **rigid framework** needed for consistent data collection while maintaining **flexibility** through hierarchical classification and rule-based automation. The "Acquisition Channel" field name reduces friction by clearly communicating its purpose without the ambiguity of traditional CRM terminology, while the three-tier taxonomy accommodates both simple and complex attribution scenarios essential for modern marketing and sales operations.
<span style="display:none">[^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35][^36][^37][^38][^39][^40]</span>

<div align="center">⁂</div>

[^1]: https://www.greminders.com/articles/data-classification-in-wealthbox-crm-best-practices-for-financial-advisors/

[^2]: https://funnel.io/blog/utm-and-utm-convention-best-practices

[^3]: https://www.insightly.com/blog/key-crm-fields/

[^4]: https://web.utm.io/blog/utm-naming-conventions-guide/

[^5]: https://community.hubspot.com/t5/Lists-Lead-Scoring-Workflows/Lead-Source-Best-Prictices/m-p/218864

[^6]: https://community.hubspot.com/t5/Tips-Tricks-Best-Practices/How-to-Populate-a-First-and-Last-Lead-Source-Field/m-p/444344

[^7]: https://amplitude.com/blog/attribution-model-frameworks

[^8]: https://www.salesforce.com/blog/what-is-marketing-attribution-model/

[^9]: https://www.triplewhale.com/blog/attribution-modeling

[^10]: https://zenatta.com/zoho-crm-best-practices-for-lead-management/

[^11]: https://www.nimble.com/blog/crm-best-practices-for-contacts-management-for-small-business/

[^12]: https://www.youtube.com/watch?v=2KWkz_kfWHU

[^13]: https://community.hubspot.com/t5/Marketing-Integrations/How-do-I-map-Hubspot-Contact-fields-to-Salesforce-Lead-fields/m-p/631196

[^14]: https://nation.marketo.com/t5/marketo-whisperer-blogs/a-deep-dive-on-marketo-measure-touchpoints/ba-p/316316

[^15]: https://experienceleague.adobe.com/en/docs/marketo-measure/using/advanced-marketo-measure-features/touchpoint-fields/touchpoint-fields

[^16]: https://business.adobe.com/blog/basics/marketing-attribution

[^17]: https://www.hyperke.com/blog/lead-source-attribution-models

[^18]: https://blog.propellocloud.com/customer-acquisition-channels

[^19]: https://dripify.com/customer-acquisition-channels/

[^20]: https://www.northbeam.io/post/a-beginners-guide-to-marketing-attribution

[^21]: https://www.yardi.com/documents/multi-touch-lead-attribution-ebook.pdf

[^22]: https://www.greminders.com/articles/data-classification-explained-for-redtail-crm/

[^23]: https://www.trackingplan.com/blog/effective-monitoring-of-utm-naming-conventions-best-tracking-practices

[^24]: https://knowandconnect.com/crm-taxonomy-guide/

[^25]: https://payproglobal.com/answers/what-are-saas-acquisition-channels/

[^26]: https://advertising.amazon.com/library/guides/marketing-attribution

[^27]: https://help.sap.com/docs/SAP_MARKETING/0204678aad934e5da0ecf4d40ba38ca9/93382ebc55d449c29b11d6bfc2ea063f.html

[^28]: https://www.taboola.com/help/en/articles/3878132-how-to-set-up-and-track-crm-based-conversions

[^29]: https://eprints.bournemouth.ac.uk/34765/3/Buhalis and Volchek Attribution Paper Submitted .pdf

[^30]: https://www.census.gov/naics/napcs/

[^31]: https://help.salesforce.com/s/articleView?id=ind.sf_contracts_naming_conventions_for_custom_source_fields_in_contract.htm\&language=en_US\&type=5

[^32]: https://ustr.gov/sites/default/files/files/agreements/FTA/USMCA/Text/04-Rules-of-Origin.pdf

[^33]: https://www.esd.whs.mil/Portals/54/Documents/DD/issuances/dodi/500087p.PDF

[^34]: https://publicwebuploads.uwec.edu/documents/211012Saltmarsh-Johnson-2020-Elective-Carnegie-Classification-for-Community-Engagement.pdf

[^35]: https://www.dhs.gov/sites/default/files/publications/dods_software_acquisition_pathway_brady_macgregor.pdf

[^36]: https://nerche.org/carnegie-engagement-classification/

[^37]: https://thatcrm.com/2019/03/17/managing-taxonomies-like-a-pro/

[^38]: https://www.eis.army.mil/newsroom/news/peo-enterprise-wide/two-vastly-different-army-programs-prepare-software-acquisition

[^39]: https://learn.givepulse.com/blog/applying-for-the-carnegie-community-engagement-classification

[^40]: https://www.earley.com/insights/why-taxonomy-critical-master-data-management-mdm

