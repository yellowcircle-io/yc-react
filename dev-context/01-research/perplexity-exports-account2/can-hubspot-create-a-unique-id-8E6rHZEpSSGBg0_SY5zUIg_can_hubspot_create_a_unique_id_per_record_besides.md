<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## **HubSpot Unique Record Identifiers: Beyond Default IDs**

Yes, HubSpot can create unique IDs per record in addition to the default system-generated Record IDs. The platform offers several approaches to implement custom unique identifiers across different objects.

### **Default Record IDs**

Every record in HubSpot automatically receives a **Record ID** upon creation. This is HubSpot's built-in unique identifier that:[^1][^2][^3]

- Is automatically assigned by the system and cannot be modified
- Remains unique only within each object type (contacts, deals, companies, etc.)
- Can be found by viewing all properties on a record or as the last number in the record URL[^3]
- Serves as the most reliable identifier for API integrations and data synchronization[^1]


### **Custom Unique Value Properties**

HubSpot introduced the ability to create **custom unique value properties**, which allow you to establish your own unique identifiers beyond the default Record ID.[^4][^5][^6]

#### **Implementation Requirements**

To create a custom unique identifier property:[^5][^6]

1. Navigate to **Settings > Properties** in your HubSpot account
2. Select the desired object type (Contacts, Companies, Deals, Tickets, Products, or Custom Objects)
3. Click **Create Property**
4. Choose either **Single-line text** or **Number** as the field type
5. Check the **"Require each value for this property to be unique"** checkbox
6. Complete the property creation

#### **Key Limitations and Considerations**

**Property Limits**: You can create up to **10 unique value properties per object**.[^6][^7]

**Creation Timing**: The unique value requirement can only be set during property creation, not added to existing properties. This is a current limitation that has generated significant user feedback requesting the ability to modify existing properties.[^8][^5]

**Supported Objects**: Custom unique identifiers are available for:[^7][^5]

- Contacts (rolled out September 2023)
- Companies
- Deals
- Tickets
- Products
- Custom Objects

**Unsupported Objects**: Not currently available for feedback submissions, marketing events, or products.[^6]

### **Practical Use Cases**

#### **Data Migration and Integration**

Custom unique identifiers are particularly valuable when migrating from other CRM systems. For example:[^9][^4]

- Importing Salesforce Opportunity IDs as unique identifiers for HubSpot deals
- Maintaining external system IDs for seamless data synchronization
- Using internal customer numbers or account IDs from legacy systems


#### **Import and Deduplication**

When importing data, custom unique properties can be used for:[^10]

- Identifying and updating existing records during imports
- Preventing duplicate record creation
- Associating records across multiple import files


### **Workflow Integration**

Custom unique identifiers work seamlessly with HubSpot's automation features. They can be referenced in workflows, used for record associations, and integrated with external systems through APIs.[^9]

### **Best Practices**

**Planning Phase**: Determine your unique identifier needs before creating properties, as the unique requirement cannot be added retroactively.[^8]

**Data Quality**: Establish consistent formatting and validation rules for your custom identifiers to maintain data integrity.

**Documentation**: Maintain clear documentation of your custom identifier scheme, especially when working with multiple systems or team members.

The custom unique identifier feature represents a significant enhancement to HubSpot's data management capabilities, providing the flexibility needed for complex business processes while maintaining the platform's user-friendly approach to CRM management.
<span style="display:none">[^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28]</span>

<div align="center">⁂</div>

[^1]: https://community.hubspot.com/t5/CRM/Record-ID-Vs-Deal-ID/m-p/1131887

[^2]: https://knowledge.hubspot.com/properties/hubspot-crm-default-company-properties

[^3]: https://community.hubspot.com/t5/Sales-Hub-Onboarding/Where-to-find-unique-identifier-of-a-deal/m-p/807091

[^4]: https://antidote71.com/hubspot-tips/introducing-custom-unique-ids-for-contacts-in-hubspot

[^5]: https://community.hubspot.com/t5/Tips-Tricks-Best-Practices/Custom-unique-property/m-p/683119

[^6]: https://knowledge.hubspot.com/properties/set-validation-rules-for-properties

[^7]: https://developers.hubspot.com/changelog/unique-properties-for-contacts

[^8]: https://community.hubspot.com/t5/HubSpot-Ideas/Change-property-to-Unique-Value-after-field-creation/idi-p/732511

[^9]: https://www.mediajunction.com/blog/custom-unique-identifier

[^10]: https://knowledge.hubspot.com/records/deduplication-of-records

[^11]: https://coefficient.io/hubspot-data-management/add-custom-fields-in-hubspot

[^12]: https://knowledge.hubspot.com/properties/create-and-edit-properties

[^13]: https://community.hubspot.com/t5/CRM/Custom-Unique-Identifier/m-p/653111

[^14]: https://community.hubspot.com/t5/HubSpot-Ideas/Primary-identifier-for-Custom-Objects/idi-p/604288

[^15]: https://community.hubspot.com/t5/CRM/Is-Record-ID-unique-among-different-objects/m-p/734191

[^16]: https://community.hubspot.com/t5/CRM/Custom-unique-identifier-and-forms/m-p/962975

[^17]: https://community.make.com/t/hubspot-create-associations-fields-with-custom-objects/14204

[^18]: https://community.hubspot.com/t5/Lead-Capture-Tools/Deduplicate-records-by-custom-unique-value-properties-when/m-p/1145877

[^19]: https://community.hubspot.com/t5/CRM/Generate-unique-account-customer-ID-via-workflow/m-p/709521

[^20]: https://www.youtube.com/watch?v=vbK_ZkGxkJM

[^21]: https://community.hubspot.com/t5/CRM/Creating-custom-object-with-unique-ID/m-p/818864

[^22]: https://community.hubspot.com/t5/CRM/Require-unique-value-for-two-deal-properties/m-p/932971

[^23]: https://community.hubspot.com/t5/CRM/Adding-Unique-Identifier-to-an-existing-Custom-Object/m-p/575269

[^24]: https://community.hubspot.com/t5/HubSpot-Ideas/Require-a-property-to-be-a-unique-value/idi-p/324225

[^25]: https://community.hubspot.com/t5/CMS-Development/Add-new-record-in-hubspot-with-the-custom-numeric-record-id/m-p/909913

[^26]: https://community.hubspot.com/t5/HubSpot-Ideas/Remove-the-maximum-of-only-allowing-1000-custom-properties/idi-p/478756

[^27]: https://community.hubspot.com/t5/APIs-Integrations/Custom-Objects-Unique-Key/m-p/747700

[^28]: https://argondigital.com/blog/business-process-automation/creating-custom-objects-and-properties-using-the-hubspot-rest-api/

