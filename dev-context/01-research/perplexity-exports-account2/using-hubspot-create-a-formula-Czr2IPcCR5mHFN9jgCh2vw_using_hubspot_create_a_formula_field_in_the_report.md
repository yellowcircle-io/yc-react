<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Creating HubSpot Formula Field to Parse UTM Source from First Page Seen URL

Based on extensive research into HubSpot's formula capabilities and URL parameter extraction, here's a comprehensive guide for creating a formula field in HubSpot Reports that parses the utm_source from the "First Page Seen" URL when present.

## Understanding the Challenge

HubSpot's formula fields have **significant limitations** when it comes to string manipulation and URL parsing[^1][^2]. The available string functions are limited to:

- `contains(text, substring)` - checks if text contains substring[^2]
- `starts_with(text, substring)` - checks if text starts with substring[^2]
- `concatenate()` - combines strings[^2]
- Basic conditional logic with `if` statements[^2]

**Key Limitation**: HubSpot does **not** provide substring, indexOf, or regex functions that would make URL parameter extraction straightforward[^1][^2].

## Available Solutions

### Solution 1: Formula Field with Conditional Logic (Limited)

Since HubSpot Reports formula fields cannot dynamically extract URL parameters, you can only create conditional formulas that check for specific, known UTM source values:

#### Step 1: Access Formula Fields in Reports

1. Navigate to **Reports** > **Create Report** > **Custom Report Builder**[^3][^4]
2. Ensure you have the **Formula Fields beta** enabled by going to **Settings** > **Product Updates** > **All** > **"Formula Fields now in Custom Report Builder"**[^4][^5]
3. Add your data source (likely Contacts or Deals)
4. In the report builder, look for **"Create field"** or **"Formula field"** option[^3][^4]

#### Step 2: Create the Formula Field

Here's an example formula that can detect common UTM sources in the First Page Seen URL:

```
if(contains([CONTACT.hs_analytics_first_url], "utm_source=google"), "google",
if(contains([CONTACT.hs_analytics_first_url], "utm_source=facebook"), "facebook", 
if(contains([CONTACT.hs_analytics_first_url], "utm_source=linkedin"), "linkedin",
if(contains([CONTACT.hs_analytics_first_url], "utm_source=twitter"), "twitter",
if(contains([CONTACT.hs_analytics_first_url], "utm_source=email"), "email",
if(contains([CONTACT.hs_analytics_first_url], "utm_source="), "Other UTM Source", "No UTM Source"))))))
```

**Important Notes:**

- Replace `[CONTACT.hs_analytics_first_url]` with the correct property reference for "First Page Seen"[^6]
- This approach only works for predefined UTM source values
- You must manually add each UTM source you want to detect
- The formula becomes unwieldy with many sources


### Solution 2: Calculated Properties (Recommended Alternative)

Instead of using formula fields in reports, create a **calculated property** that can be used across HubSpot:

#### Step 1: Create Calculated Property

1. Go to **Settings** > **Properties** > **Contact Properties**[^7]
2. Click **Create Property**
3. Select **Calculation** as field type[^7]
4. Choose **Custom equation**[^7]
5. Set output type to **String**[^7]

#### Step 2: Use Similar Formula Logic

```
if(contains([properties.hs_analytics_first_url], "utm_source=google"), "google",
if(contains([properties.hs_analytics_first_url], "utm_source=facebook"), "facebook", 
if(contains([properties.hs_analytics_first_url], "utm_source=linkedin"), "linkedin",
"Other/Unknown")))
```


### Solution 3: Enhanced UTM Tracking Setup (Best Practice)

Instead of parsing URLs retroactively, implement proper UTM capture at form submission:

#### Create Custom UTM Properties

1. Go to **Settings** > **Properties** > **Contact Properties**[^8]
2. Create these properties with exact internal names:
    - `utm_source` (Internal name: utm_source)
    - `utm_medium` (Internal name: utm_medium)
    - `utm_campaign` (Internal name: utm_campaign)
    - `utm_content` (Internal name: utm_content)
    - `utm_term` (Internal name: utm_term)

#### Configure Forms to Capture UTM Parameters

1. Edit your HubSpot forms[^8]
2. Add hidden fields for each UTM parameter[^8]
3. Set the internal names to match exactly: `utm_source`, `utm_medium`, etc.[^8]
4. HubSpot will automatically populate these fields when forms are submitted with UTM parameters in the URL[^8][^9]

### Solution 4: Workflow-Based Parsing (Operations Hub Required)

For more sophisticated URL parsing, use workflows with custom code:

1. Create a workflow triggered by "First Page Seen" changes[^10]
2. Use **Format data** action with custom code to parse the URL[^10]
3. Extract utm_source using JavaScript-like functions[^10]
4. Update a custom property with the extracted value

Example custom code structure:

```javascript
// This would be in a workflow custom code action
const url = inputData.first_page_seen;
const urlParams = new URLSearchParams(url.split('?')[^1]);
const utmSource = urlParams.get('utm_source');
return utmSource || 'No UTM Source';
```


## Implementation Recommendations

### For Immediate Implementation:

1. **Use Solution 2 (Calculated Properties)** with conditional logic for your most common UTM sources[^7]
2. **Implement Solution 3 (Enhanced UTM Tracking)** for all new traffic going forward[^8]

### For Advanced Implementation:

1. Consider **Solution 4 (Workflow-Based)** if you have Operations Hub and need comprehensive URL parsing[^10]
2. Use external tools or integrations that specialize in UTM parameter management[^1]

## Important Considerations

- **First Page Seen Property**: This property captures the first page a visitor sees when they become a contact, not their very first website visit[^11][^12]
- **Formula Field Limitations**: Current formula fields in reports are in beta and have significant restrictions[^13][^5]
- **Performance**: Complex conditional formulas can impact report performance
- **Maintenance**: Adding new UTM sources requires updating the formula manually


## Alternative Approaches

If HubSpot's native capabilities are insufficient:

1. **Export and Process**: Export data and use Excel/Google Sheets for URL parsing[^14][^1]
2. **Third-Party Tools**: Use tools like Zapier or custom integrations for URL parameter extraction[^15]
3. **External BI Tools**: Connect HubSpot to business intelligence tools with advanced string manipulation capabilities[^1]

This approach provides the most practical solution given HubSpot's current formula field limitations while setting up better UTM tracking for future data collection.
<span style="display:none">[^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35][^36][^37][^38][^39][^40][^41][^42][^43][^44][^45][^46][^47][^48][^49][^50][^51][^52][^53][^54][^55][^56][^57][^58][^59][^60][^61][^62][^63][^64][^65][^66][^67][^68][^69][^70][^71]</span>

<div align="center">⁂</div>

[^1]: https://coefficient.io/use-cases/hubspot-workflow-string-manipulation-limitations

[^2]: https://www.youtube.com/watch?v=fn_nzYIUuWk

[^3]: https://community.hubspot.com/t5/CRM/How-to-create-a-formula/m-p/892427

[^4]: https://community.hubspot.com/t5/Dashboards-Reporting/Calculate-a-value-based-on-2-other-values-in-a-table-report/m-p/737207

[^5]: https://blog.coupler.io/hubspot-report-templates/

[^6]: https://knowledge.hubspot.com/properties/hubspots-default-contact-properties

[^7]: https://knowledge.hubspot.com/properties/create-calculation-properties

[^8]: https://www.youtube.com/watch?v=XckNsxYxXGk

[^9]: https://community.hubspot.com/t5/Reporting-Analytics/UTM-Fields-and-tracking/m-p/638833

[^10]: https://knowledge.hubspot.com/workflows/custom-formula-functions

[^11]: https://community.hubspot.com/t5/APIs-Integrations/Understanding-of-First-and-Last-page-seen/m-p/288186

[^12]: https://community.hubspot.com/t5/CRM/First-Page-Seen-amp-amp-Last-Page-Seen-Population-Need-Help/m-p/999767

[^13]: https://knowledge.hubspot.com/reports/create-reports-with-the-custom-report-builder

[^14]: https://community.hubspot.com/t5/Dashboards-Reporting/Custom-Report-Builder-Formula-Fields/m-p/1142392

[^15]: https://community.zapier.com/how-do-i-3/how-to-extract-parameters-attributers-from-url-21517

[^16]: https://cdn2.hubspot.net/hubfs/223944/Customizing_Fields_and_Managing_Data.pdf?t=1505143560237

[^17]: https://www.youtube.com/watch?v=GHmasQ1Q-zw

[^18]: https://www.youtube.com/watch?v=hIwUqxYBuRI

[^19]: https://www.youtube.com/watch?v=ygDCIpyCaTk

[^20]: https://community.hubspot.com/t5/Dashboards-Reporting/Formula-fields-not-showing-up-in-report-builder/m-p/1037642

[^21]: https://www.youtube.com/watch?v=-yDwpRDkTp4

[^22]: https://community.hubspot.com/t5/128172-RevOps-Discussions/Using-Hubspot-Formulas-in-Reports-for-Conversion-Rates/m-p/1123998

[^23]: https://community.hubspot.com/t5/Dashboards-Reporting/Formula-Fields-on-Report/m-p/540073

[^24]: https://community.hubspot.com/t5/CRM/Custom-calculation-property-field-IF-logic-not-working/m-p/936289

[^25]: https://community.hubspot.com/t5/Dashboards-Reporting/Making-calculations-within-reports-or-dashboards/m-p/584322

[^26]: https://www.linkedin.com/posts/craigbailey_hubspot-activity-7139047530998218752-_fQM

[^27]: https://knowledge.hubspot.com/reports/create-custom-reports

[^28]: https://www.craigbailey.net/using-formula-fields-in-hubspot-custom-reports/

[^29]: https://community.hubspot.com/t5/Tips-Tricks-Best-Practices/Line-items-formula-fields/m-p/888516

[^30]: https://community.hubspot.com/t5/Dashboards-Reporting/Formula-Fields-on-Report/m-p/540073?profile.language=en

[^31]: https://community.hubspot.com/t5/CRM/Calculated-field/m-p/1048557

[^32]: https://alex.zappa.dev/blog/track-utm-parameters-for-hubspot-forms-like-a-boss/

[^33]: https://community.hubspot.com/t5/Reporting-Analytics/Help-with-Setting-Up-UTM-Parameters-for-Lead-Source-Tracking-in/td-p/1069368

[^34]: https://community.hubspot.com/t5/CMS-Development/Passing-url-parameters-from-one-hubspot-page-to-another-hubspot/m-p/409471

[^35]: https://www.youtube.com/watch?v=fQiWz8oQWAA

[^36]: https://cdn.cdata.com/help/DHH/ado/pg_hubspottable-urlmappings.htm

[^37]: https://community.hubspot.com/t5/HubSpot-Ideas/Make-First-page-seen-hs-analytics-first-url-Property-writeable/idi-p/1073588

[^38]: https://stackoverflow.com/questions/78221335/extracting-parameters-from-a-url

[^39]: https://www.youtube.com/watch?v=Nvxk4H_1jMQ

[^40]: https://www.youtube.com/watch?v=SIjbZoc3tZ4

[^41]: https://www.youtube.com/watch?v=qb8tdBK4SUU

[^42]: https://www.youtube.com/watch?v=u7_zPTUsYrw

[^43]: https://knowledge.hubspot.com/forms/can-i-auto-populate-form-fields-through-a-query-string

[^44]: https://community.hubspot.com/t5/HubSpot-Ideas/New-Contact-property-First-page-seen-in-recent-session/idi-p/359403

[^45]: https://www.youtube.com/watch?v=57g1kZo6i98

[^46]: https://www.youtube.com/watch?v=Q0S2MnbEwmc

[^47]: https://community.hubspot.com/t5/CRM/How-to-pull-text-strings-into-a-HubSpot-field/m-p/944340

[^48]: https://community.hubspot.com/t5/APIs-Integrations/Passing-URL-data-through-a-form-submission/m-p/239617

[^49]: https://help.salesforce.com/s/articleView?id=sf.bi_integrate_data_prep_recipe_formula_field_stringFunctions.htm\&language=en_US\&type=5

[^50]: https://www.youtube.com/watch?v=CANcoCYuhOs

[^51]: https://community.hubspot.com/t5/Tips-Tricks-Best-Practices/Parsing-data-from-a-field-with-a-string/m-p/610417

[^52]: https://gist.github.com/derekcavaliero/f79007a21233d8358636faa5199da165

[^53]: https://community.hubspot.com/t5/Tips-Tricks-Best-Practices/quot-Can-I-concatenate-String-Date-and-Number-properties-in/m-p/1095900

[^54]: https://www.simplemachinesmarketing.com/blog/seven-powerful-hubspot-calculated-property-formulas-for-better-reporting/

[^55]: https://community.hubspot.com/t5/Reporting-Analytics/Custom-field-for-calculations-mainly-at-reports/td-p/1152795

[^56]: https://community.hubspot.com/t5/Dashboards-Reporting/How-are-report-formulas-still-in-beta/m-p/1098095

[^57]: https://blog.hubspot.com/customers/6-simple-hubspot-reports-your-dashboard-needs

[^58]: https://community.hubspot.com/t5/Reporting-Analytics/Calculations-in-reports/m-p/1173425

[^59]: https://databox.com/hubspot-reporting

[^60]: https://support.supermetrics.com/support/solutions/articles/19000132120-hubspot-report-building-guide

[^61]: https://community.hubspot.com/t5/Dashboards-Reporting/Calculated-Property-CTR-in-Custom-Reports/m-p/1132306

[^62]: https://community.hubspot.com/t5/Reporting-Analytics/Report-custom-formula-fields/m-p/1136920

[^63]: https://community.hubspot.com/t5/APIs-Integrations/How-can-I-pull-the-ID-from-a-URL-into-a-hidden-field-on-a-HS/m-p/974096

[^64]: https://coefficient.io/use-cases/hubspot-workflow-substring-split-phone-segments

[^65]: https://community.hubspot.com/t5/APIs-Integrations/Search-by-exact-substring-with-special-characters/m-p/849099

[^66]: https://community.hubspot.com/t5/CMS-Development/Show-if-content-has-matching-string-s-in-sequence/m-p/22056

[^67]: https://community.hubspot.com/t5/APIs-Integrations/How-to-pass-e-mail-address-as-URL-parameter-from-an-HubSpot-Form/m-p/438958

[^68]: https://community.hubspot.com/t5/APIs-Integrations/Understanding-CONTAINS-TOKEN-operator-for-CRM-Search/m-p/401966

[^69]: https://community.hubspot.com/t5/9881-Operations-Hub/Extracting-Param-Value-From-URL-Path-Using-Custom-Code/m-p/958946

[^70]: https://community.hubspot.com/t5/HubSpot-Ideas/Substring-Function-in-Custom-Datasets/idi-p/659534

[^71]: https://community.hubspot.com/t5/HubSpot-Ideas/Capture-URL-parameter-in-hidden-form-field/idi-p/762401

