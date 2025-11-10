<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# I need to develop a process to sync records that originate in Luma to sync to HubSpot and Salesforce. The records that eventually sync through must fulfill the following criteria:

• Records that are added to a Luma calendar must be retained in HubSpot indefinitely, unless they take an action that enables them to be associated with an opportunity
• Records that are added to Luma via an event must also be held until the date of the event, OR if the records are (or become) associated with an Opportunity
• When a record is eligible to sync to Salesforce from HubSpot, a specific field will be set to trigger (which already exists [Salesforce Inclusion: Yes])
• Upon syncing to Salesforce, a record must be able to be associated with a campaign and campaign ID, which may OR may not be pre-existing.
• Accordingly, there needs to be a mechanism to have records retain both multiple values and the most recent values for events in Luma and Salesforce
• There is currently a workflow that can ingest Luma's most recent event and calendar signups and add them to Hubspot. Those records can be held based on the date of the event.

NOTES:
-Luma is limited in the values that can be sent over based on its documentation.
-HubSpot has access to Marketing Enterprise and Operations Hub Professional
-There is currently no mechanism to directly connect HubSpot events to Salesforce beyond the standard integration on contacts
-There is also a Zapier integration that is currently set up to push Luma information into HubSpot
-Zapier is not integrated with Salesforce

To sync records from Luma to HubSpot and Salesforce while meeting the specified criteria, here’s a structured approach leveraging existing integrations and addressing limitations:

---

### **1. Luma-to-HubSpot Sync Workflow**

**Existing Setup**:

- Use the **Zapier integration** to push Luma event/calendar data to HubSpot. Configure triggers for:
    - New Luma calendar entries → Create/update HubSpot contacts.
    - Event date changes → Update HubSpot contact properties.

**Retention Logic in HubSpot**:

- Create a **HubSpot workflow** to hold records until:
    - The event date passes, **or**
    - The `Salesforce Inclusion: Yes` field is triggered.
- Use **HubSpot lists** to segment records based on event dates or opportunity associations.

---

### **2. HubSpot-to-Salesforce Sync**

**Native Integration Limitations**:

- The standard HubSpot-Salesforce connector syncs contacts/companies but lacks support for:
    - Campaign associations.
    - Multi-value field retention (e.g., multiple campaign IDs).

**Solutions**:

1. **Campaign Associations**:
    - Use **Salesforce Connected Campaigns** to map HubSpot campaigns to Salesforce campaigns[^15].
    - For ad-hoc campaign creation, use Salesforce’s **REST API** to dynamically create campaigns when syncing[^6].
2. **Multi-Value Handling**:
    - Create a **custom junction object** (e.g., `Campaign_Member__c`) in Salesforce to store multiple campaign IDs per contact[^14].
    - Use Salesforce’s **Composite API** to batch-create records[^6]:

```json
{
  "records": [{
    "attributes": {"type": "Campaign_Member__c"},
    "Contact__c": "003XXXXXXXXXXXX",
    "Campaign__c": "701XXXXXXXXXXXX",
    "Sync_Date__c": "2025-05-01"
  }]
}
```

3. **Triggering Syncs**:
    - Configure a **HubSpot workflow** to activate when `Salesforce Inclusion: Yes` is set.
    - Use **Salesforce Data Loader** or **Marketing Cloud Account Engagement** for bulk syncs of campaign metadata[^15].

---

### **3. Handling Event Date Logic**

- In HubSpot, use **date-based workflows** to release records for Salesforce sync after the event date.
- For records linked to opportunities, add a **HubSpot enrollment trigger** when `Associated Opportunity ID` is populated.

---

### **4. Addressing System Limitations**

| **System** | **Limitation** | **Workaround** |
| :-- | :-- | :-- |
| Luma | Limited API fields | Map only essential fields (e.g., email, event ID) via Zapier[^5][^13]. |
| HubSpot | No direct campaign sync to Salesforce | Use **Engagement History** and **Einstein Campaign Insights** for attribution[^9][^15]. |
| Salesforce | No native multi-campaign field | Store historical campaign IDs in a custom object with timestamps[^14]. |


---

### **Implementation Steps**

1. **Zapier Configuration**:
    - Trigger: Luma event → Action: Update HubSpot contact with `Event_ID` and `Event_Date`[^10][^16].
    - Add conditional logic in Zapier to skip syncs if `Salesforce Inclusion: Yes` is not set.
2. **HubSpot Automation**:
    - Create a **property** `Salesforce Inclusion` (default: `No`).
    - Build workflows to set `Salesforce Inclusion: Yes` when:
        - Event date is in the past, **or**
        - Contact is associated with an opportunity.
3. **Salesforce Integration**:
    - Use **Marketing Cloud Account Engagement** to sync HubSpot campaign data[^15].
    - For custom campaign associations, deploy an **Apex trigger** to update `Campaign_Member__c` records when contacts sync.

---

### **Validation \& Monitoring**

- **HubSpot**: Audit lists for records stuck in retention.
- **Salesforce**: Use **Campaign Influence Reports** to verify campaign associations[^7][^12].
- **Error Handling**: Log sync failures in a **Salesforce custom object** and retry via batch jobs.

This approach balances automation with scalability, leveraging existing tools while addressing gaps through custom objects and APIs.
<span style="display:none">[^1][^11][^17][^18][^19][^2][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^3][^30][^31][^32][^33][^34][^35][^36][^37][^38][^39][^4][^40][^41][^42][^43][^44][^45][^46][^47][^48][^49][^50][^51][^52][^53][^54][^55][^56][^57][^58][^59][^60][^61][^62][^63][^64][^65][^66][^67][^68][^69][^70][^71][^8]</span>

<div align="center">⁂</div>

[^1]: https://help.lu.ma/p/helpart-DEoeClW9qOdiRuj/integrations

[^2]: https://knowledge.hubspot.com/integrations/connect-and-use-hubspot-data-sync

[^3]: https://support.ironcladapp.com/hc/en-us/articles/12285816881559-Use-Salesforce-Record-Sync

[^4]: https://trailhead.salesforce.com/trailblazer-community/feed/0D54V00007T4UOZSA3

[^5]: https://www.workload.co/api/luma/integrations/salesforce/

[^6]: https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/dome_composite_sobject_tree_flat.htm

[^7]: https://help.salesforce.com/s/articleView?id=sales.campaigns_def.htm\&type=5

[^8]: https://salesforce.stackexchange.com/questions/358550/best-practice-and-security-question-send-salesforce-record-id-to-external-syste

[^9]: https://syncari.com/blog/hubspot-salesforce-integration/

[^10]: https://zapier.com/apps/luma/integrations/hubspot

[^11]: https://trailhead.salesforce.com/content/learn/modules/multirecord-elements-and-transforms-in-flows/update-and-retrieve-multiple-records

[^12]: https://trailhead.salesforce.com/trailblazer-community/feed/0D54S00000K0EBnSAN

[^13]: https://zapier.com/apps/luma/integrations/salesforce

[^14]: https://salesforce.stackexchange.com/questions/149745/how-to-add-more-than-one-value-in-a-single-field

[^15]: https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/pardot_connected_campaigns_implementation_guide.pdf

[^16]: https://stackreaction.com/luma/integrations/hubspot

[^17]: https://www.reddit.com/r/SalesforceDeveloper/comments/14wqddt/how_to_integrate_hubspot_with_salesforce_crm/

[^18]: https://www.coastalconsulting.co/blog/5-limitations-of-the-hubspot-salesforce-integration

[^19]: https://zapier.com/apps/hubspot/integrations/luma/1743595/create-new-hubspot-objects-whenever-events-are-created-in-luma

[^20]: https://trailhead.salesforce.com/trailblazer-community/feed/0D54V00007RJ9xgSAD

[^21]: https://help.talkbase.io/luma-integration

[^22]: https://knowledge.hubspot.com/meetings-tool/use-meetings

[^23]: https://salesforce.stackexchange.com/questions/10394/sync-records-with-marketo-based-on-condition

[^24]: https://www.airslate.com/integrations/456-luma-and-salesforce-integrations

[^25]: https://community.hubspot.com/t5/9881-Operations-Hub/Tips-Tricks-and-Best-Practices-for-Data-Sync/m-p/430793

[^26]: https://community.hubspot.com/t5/Sales-Email/Salesforce-Selective-Sync-record-types/m-p/207096

[^27]: https://efficient.app/integrations/hubspot-luma

[^28]: https://knowledge.hubspot.com/integrations/match-records-in-data-sync

[^29]: https://help.salesforce.com/s/articleView?id=sf.fsc_admin_custom_record_types_for_sync.htm\&language=en_US\&type=5

[^30]: https://trailhead.salesforce.com/trailblazer-community/feed/0D54S00000Bs7AYSAZ

[^31]: https://zapier.com/apps/luma/integrations/salesforce

[^32]: https://www.youtube.com/watch?v=5xhR5sfcvrA

[^33]: https://trailhead.salesforce.com/trailblazer-community/feed/0D54V00007X91whSAB

[^34]: https://salesforce.stackexchange.com/questions/392793/how-to-send-a-large-number-of-records-to-an-external-system-in-multiple-callouts

[^35]: https://help.salesforce.com/s/articleView?id=release-notes.rn_mfg_aaf_mass_update.htm\&language=en_US\&release=240\&type=5

[^36]: https://efficient.app/integrations/salesforce-luma

[^37]: https://trailhead.salesforce.com/trailblazer-community/feed/0D54S00000JeZInSAN

[^38]: https://trailhead.salesforce.com/trailblazer-community/feed/0D54V00007XIcCOSA1

[^39]: https://albato.com/apps/luma

[^40]: https://help.salesforce.com/s/articleView?id=platform.ls_multi_attendee_event.htm\&language=en_US\&type=5

[^41]: https://www.salesforceben.com/salesforce-activities/

[^42]: https://connect.act-on.com/hc/en-us/articles/4415590931991-Add-Records-to-Salesforce-Campaigns-from-an-Automated-Program

[^43]: https://www.saasguru.co/external-id-in-salesforce/

[^44]: https://www.salesforceben.com/salesforce-campaigns/

[^45]: https://help.salesforce.com/s/articleView?id=000380898\&language=en_US\&type=1

[^46]: https://help.salesforce.com/s/articleView?id=sf.mc_dm_configure_external_integration_component.htm\&language=en_US\&type=5

[^47]: https://trailhead.salesforce.com/trailblazer-community/feed/0D54S00000A8S3bSAF

[^48]: https://trailhead.salesforce.com/trailblazer-community/feed/0D54V00007epHptSAE

[^49]: https://support.teamsupport.com/knowledgeBase/30982627

[^50]: https://help.salesforce.com/s/articleView?id=sales.campaigns_add_individual_members.htm\&language=en_US\&type=5

[^51]: https://community.hubspot.com/t5/APIs-Integrations/Salesforce-Campaigns-Sync/m-p/887650

[^52]: https://trailhead.salesforce.com/trailblazer-community/feed/0D54V00007T4Ho4SAF

[^53]: https://help.salesforce.com/s/articleView?id=sales.campaigns_account_campaign_member.htm\&type=5

[^54]: https://zapier.com/apps/luma/integrations

[^55]: https://satvasolutions.com/blog/hubspot-salesforce-integration-guide

[^56]: https://community.hubspot.com/t5/HubSpot-Ideas/Integrate-with-Luma/idi-p/568991

[^57]: https://knowledge.hubspot.com/salesforce/sync-activities-and-tasks-between-hubspot-and-salesforce

[^58]: https://zapier.com/apps/hubspot/integrations/luna

[^59]: https://knowledge.hubspot.com/salesforce/install-the-hubspot-salesforce-integration

[^60]: https://community.hubspot.com/t5/HubSpot-Native-Apps/Problems-Hubspot-and-Zapier/m-p/1101649

[^61]: https://help.salesforce.com/s/articleView?language=en_US\&id=sf.bi_integrate_connectors_hubspot.htm\&type=5

[^62]: https://knowledge.hubspot.com/integrations/sync-salesforce-leads-and-contacts-to-hubspot

[^63]: https://help.zoominfo.com/s/article/Overview-of-Salesforce-Surviving-Field-Values-Rules

[^64]: https://trailhead.salesforce.com/trailblazer-community/feed/0D54S00000A7ZiWSAV

[^65]: https://help.salesforce.com/s/articleView?id=release-notes.rn_automate_flow_builder_retain_values_in_lightning_web_components_after_state_changes.htm\&language=en_US\&release=246\&type=5

[^66]: https://help.salesforce.com/s/articleView?id=mktg.pardot_campaigns_prospects_associate.htm\&language=en_US\&type=5

[^67]: https://trailhead.salesforce.com/trailblazer-community/feed/0D54V00007Uu9jeSAB

[^68]: https://www.beaufort12.com/campaignmonitor/support/salesforce-campaigns

[^69]: https://nation.marketo.com/t5/product-discussions/using-salesforce-campaign-id-to-assign-to-salesforce-campaign/td-p/119762

[^70]: https://zapier.com/apps/convertkit/integrations/hubspot--luma

[^71]: https://www.youtube.com/watch?v=EuUTdw219Tg

