<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Is the Salesforce Inclusion List in HubSpot dependent on API calls to process continously?

Based on my research, I can now provide a comprehensive answer about whether the Salesforce Inclusion List in HubSpot depends on API calls for continuous processing.

# Salesforce Inclusion List in HubSpot: API Call Dependency for Continuous Processing

**Yes, the Salesforce Inclusion List in HubSpot does depend on API calls for continuous processing**, but not in the way you might expect. The system operates on a scheduled sync interval rather than true real-time continuous processing.

## How the Inclusion List Works

The **HubSpot Inclusion List is an active list** that controls which contacts can sync from HubSpot to Salesforce. This list serves as a filter mechanism that determines when contacts meeting specific criteria are allowed to be created in Salesforce or continue syncing between the two systems.[^1][^2]

## Sync Processing and Timing

### 15-Minute Sync Intervals

The HubSpot-Salesforce integration **operates on a 15-minute sync interval**, not continuous real-time processing. Updated data in "triggering" fields updates between systems every 15 minutes, but this is not a bulk refresh of all data. The system only syncs when certain properties trigger a sync event.[^3]

### API Call Consumption

The integration typically makes **7,000 to 8,000 API calls per day** to Salesforce instances for organizations with substantial data volumes. HubSpot checks for changes every 5-10 minutes on contacts and deals, depending on sync settings.[^4][^5]

## API Dependencies for Inclusion List Processing

### Active List Updates

Since inclusion lists are **active lists that automatically update based on criteria**, any changes to contact properties that affect list membership will trigger API calls when the sync interval occurs. When contacts are added to or removed from the inclusion list, this triggers synchronization with Salesforce.[^6][^7]

### Sync Triggers

The inclusion list triggers API calls in two main scenarios:[^8]

1. **New record creation**: When a contact meets inclusion criteria and needs to be created in Salesforce
2. **Ongoing synchronization**: Maintaining sync for existing records that remain on the inclusion list

## Optimization to Reduce API Usage

### Managing API Consumption

Organizations can optimize API usage through several strategies:[^9]

- **Use inclusion lists strategically** to limit which records sync
- **Limit field syncing** by choosing only essential fields for synchronization
- **Configure sync frequency** for non-critical data to occur less frequently
- **Implement two-way sync settings** appropriately to avoid unnecessary calls


### API Limits and Monitoring

HubSpot allocates specific **Salesforce API calls available each day** for the integration. Users can monitor and adjust these limits through the integration settings. The system includes safeguards where if API limits are exceeded, the integration temporarily suspends until the limit resets.[^10][^3]

## Technical Architecture

The inclusion list doesn't require continuous API calls for "always-on" processing. Instead, it operates on a **scheduled polling model** where HubSpot periodically checks for changes and processes updates in batches during the 15-minute intervals. This approach optimizes API usage while maintaining data synchronization.[^3]

The system is designed to **minimize API consumption** by only syncing triggering properties and essential data changes, rather than performing continuous real-time updates that would rapidly exhaust API limits.[^3]

In summary, while the Salesforce Inclusion List does depend on API calls for processing, it operates on a scheduled interval system rather than continuous processing, making it an efficient approach for managing data synchronization between HubSpot and Salesforce.
<span style="display:none">[^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35][^36][^37][^38][^39][^40][^41][^42][^43][^44][^45][^46][^47][^48][^49][^50][^51][^52][^53][^54][^55][^56][^57][^58][^59][^60][^61][^62][^63][^64][^65][^66][^67][^68][^69]</span>

<div align="center">⁂</div>

[^1]: https://www.coastalconsulting.co/blog/inclusion-list-vs.-selective-sync-in-the-hubspot-salesforce-integration

[^2]: https://www.coastalconsulting.co/blog/how-to-manage-the-hubspot-salesforce-inclusion-list

[^3]: https://www.coastalconsulting.co/blog/5-common-pitfalls-of-the-hubspot-salesforce-integration-and-how-to-fix-them

[^4]: https://community.latenode.com/t/reducing-api-call-frequency-between-hubspot-and-salesforce-integration/23737

[^5]: https://community.latenode.com/t/managing-api-call-frequency-between-hubspot-and-salesforce-integration/39572

[^6]: https://knowledge.hubspot.com/salesforce/salesforce-integration-sync-triggers

[^7]: https://knowledge.vested.marketing/knowledge/how-to-create-and-edit-lists

[^8]: https://www.youtube.com/watch?v=4-Z_QxxKpQc

[^9]: https://help.webstacks.com/understanding-api-call-limits-hubspot-salesforce-integration

[^10]: https://www.mugo.ca/Blog/Managing-Salesforce-and-HubSpot-storage-and-API-limits

[^11]: https://blog.skyvia.com/hubspot-salesforce-integration/

[^12]: https://routine-automation.com/blog/hubspot-salesforce-integration/

[^13]: https://www.reddit.com/r/hubspot/comments/1232tp1/is_there_something_i_need_to_do_to_turn_on/

[^14]: https://www.newbreedrevenue.com/blog/how-to-integrate-hubspot-crm-with-salesforce

[^15]: https://www.manobyte.com/growth-strategy/how-to-guide-for-integrating-hubspot-and-salesforce

[^16]: https://blog.revpartners.io/en/revops-articles/an-expert-guide-to-a-hubspot-salesforce-integration

[^17]: https://knowledge.hubspot.com/salesforce/create-a-salesforce-inclusion-list

[^18]: https://community.hubspot.com/t5/Tips-Tricks-Best-Practices/A-Step-by-Step-Guide-to-setting-up-your-SFDC-integration/m-p/370930

[^19]: https://www.smartbugmedia.com/blog/hubspot-salesforce-integration-5-prerequisites-to-prepare-before-an-integration

[^20]: https://community.hubspot.com/t5/Lists-Lead-Scoring-Workflows/Create-a-Salesforce-inclusion-list-procedure/m-p/860267

[^21]: https://knowledge.hubspot.com/salesforce/resolve-salesforce-integration-sync-errors

[^22]: https://www.coastalconsulting.co/blog/hubspot-administrators-guide-to-a-healthy-salesforce-hubspot-integration

[^23]: https://knowledge.hubspot.com/salesforce/manage-your-salesforce-integration-settings

[^24]: https://knowledge.hubspot.com/salesforce/manually-sync-records-to-salesforce

[^25]: https://gurussolutions.com/integrations/salesforce/hubspot

[^26]: https://community.latenode.com/t/integration-frequency-and-api-call-reduction-for-salesforce-hubspot-sync/16737

[^27]: https://community.hubspot.com/t5/APIs-Integrations/Rate-limits-API/m-p/1002704

[^28]: https://coefficient.io/use-cases/hubspot-api-rate-limits-looker-studio-sync

[^29]: https://www.bridgerev.com/blog/hubspot-api-limits

[^30]: https://developer.salesforce.com/developer-centers/integration-apis

[^31]: https://developers.hubspot.com/docs/api/usage-details

[^32]: https://help.zoominfo.com/s/article/How-to-Use-Inclusion-and-Exclusion-Lists

[^33]: https://community.hubspot.com/t5/Marketing-Integrations/Sync-API-limit/m-p/887910

[^34]: https://www.salesforceben.com/salesforce-and-hubspot-integration-an-admins-guide/

[^35]: https://www.stacksync.com/blog/hubspot-netsuite-sync-real-time-api-limit-recovery

[^36]: https://community.hubspot.com/t5/Marketing-Integrations/Excessive-number-of-Salesforce-API-calls-being-used-up-in-email/m-p/211983

[^37]: https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_rest_compatible_editions.htm

[^38]: https://community.hubspot.com/t5/APIs-Integrations/Contact-List-status-update-delay-for-static-list/m-p/781165

[^39]: https://legacydocs.hubspot.com/docs/methods/lists/get_list_contacts_recent

[^40]: https://developers.hubspot.com/docs/guides/api/crm/lists/overview

[^41]: https://www.insycle.com/hubspot/hubspot-salesforce-sync/

[^42]: https://www.youtube.com/watch?v=cidAxtTx7yE

[^43]: https://www.atakinteractive.com/hubspot-and-salesforce-integration

[^44]: https://developers.hubspot.com/docs/api/app-marketplace-listing-requirements

[^45]: https://www.coastalconsulting.co/blog/sync-hubspot-contacts-with-salesforce-leads-and-contacts

[^46]: https://www.bardeen.ai/answers/how-to-add-contacts-to-an-active-list-in-hubspot

[^47]: https://community.hubspot.com/t5/Tips-Tricks-Best-Practices/Best-Practices-for-Company-Sync-with-Salesforce-Integration/m-p/1038981

[^48]: https://legacydocs.hubspot.com/apps/api_guidelines

[^49]: https://community.hubspot.com/t5/APIs-Integrations/Errors-using-Update-List-Filters-API/m-p/963981

[^50]: https://www.processproconsulting.com/resources/common-hubspot-salesforce-sync-issues-and-how-to-solve-them

[^51]: https://developers.hubspot.com/docs/guides/api/crm/objects/contacts

[^52]: https://www.reddit.com/r/hubspot/comments/1eqlnt7/syncing_hubspot_and_salesforce_environments_with/

[^53]: https://developers.hubspot.com/changelog/changes-to-list-membership-actions-in-the-v4-automation-api

[^54]: https://success.mixmax.com/en/articles/8113086-how-to-enable-salesforce-real-time-sync

[^55]: https://www.ksolves.com/case-studies/crm/mulesoft-salesforce-data-sync

[^56]: https://community.hubspot.com/t5/Marketing-Integrations/Integration-sync-timing/m-p/211847

[^57]: https://community.hubspot.com/t5/Developer-Announcements/Changes-to-list-membership-actions-in-the-v4-Automation-API/td-p/1121703?profile.language=fr

[^58]: https://help.salesforce.com/s/articleView?id=ind.tpm_foundation_sync_data_overview.htm\&language=en_US\&type=5

[^59]: https://community.hubspot.com/t5/APIs-Integrations/Zapier-zaps-using-quot-contact-property-change-quot-are-delayed/m-p/1050138

[^60]: https://community.hubspot.com/t5/Developer-Announcements/Changes-to-list-membership-actions-in-the-v4-Automation-API/m-p/1121703

[^61]: https://www.stacksync.com/blog/real-time-data-sync-for-salesforce-postgres-integration

[^62]: https://www.moesif.com/docs/extensions/hubspot/

[^63]: https://community.hubspot.com/t5/APIs-Integrations/API-v3-GET-recent-list-members/m-p/1081722

[^64]: https://www.stacksync.com/blog/master-real-time-bi-directional-salesforce-netsuite-sync

[^65]: https://community.hubspot.com/t5/APIs-Integrations/Batch-Deals-Update-API-Limit/m-p/678230

[^66]: https://community.latenode.com/t/how-to-track-hubspot-contact-list-member-count-changes-through-api/26554

[^67]: https://developer.salesforce.com/docs/atlas.en-us.integration_patterns_and_practices.meta/integration_patterns_and_practices/integ_pat_batch_data_sync.htm

[^68]: https://community.hubspot.com/t5/Marketing-Integrations/Salesforce-integration-Inclusion-List/m-p/720971

[^69]: https://www.reddit.com/r/dataengineering/comments/1isd1wl/syncing_salesforce/

