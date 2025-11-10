<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## Zapier's "Create Company" Action with HubSpot: Update vs. Create

**Does the "Create Company" action update a company if it already exists?**

No, Zapier’s standard "Create Company" action for HubSpot will always create a new company record, even if a company with matching information already exists. It does not automatically update an existing company or check for duplicates based on fields like company name or domain[^3][^5].

**How to Ensure an Existing Company Is Updated Instead of Creating a Duplicate**

To avoid duplicate companies and ensure updates to existing records, you should use a combination of Zapier actions:

- **Find Company**: Use the "Find Company" action to search HubSpot for an existing company. You can search by fields such as company name, domain, or even company ID[^1][^2][^5].
- **Update Company**: If the company is found, use the "Update Company" action to update its details. This action requires the company ID, which is returned by the "Find Company" step[^1][^2][^3][^4].
- **Create Company**: If no company is found, you can proceed to create a new one.

This pattern is commonly referred to as "Find or Create," and it is supported by Zapier for HubSpot integrations. Here’s how it works in practice:

1. **Find Company**: Searches for a company by a unique identifier (such as domain or name).
2. **If found**: Use the returned company ID to update the existing company.
3. **If not found**: Create a new company record.

**Example Workflow**

- Trigger: New event (e.g., form submission, new lead).
- Action: Find Company in HubSpot (by domain, name, or ID).
- Action: If found, Update Company in HubSpot (using the company ID).
- Action: If not found, Create Company in HubSpot.

This approach ensures that you update existing companies when possible and only create new ones when necessary, preventing duplicates and keeping your HubSpot data clean[^1][^2][^3][^5].

**Summary Table**


| Action | Updates Existing Company? | Creates New Company? | Uses Company ID/Other Field? |
| :-- | :--: | :--: | :--: |
| Create Company | No | Yes | No |
| Update Company | Yes | No | Yes (requires Company ID) |
| Find or Create Company | Yes (if found) | Yes (if not found) | Yes (by name, domain, or ID) |

**Conclusion**

- The "Create Company" action alone does not update existing companies.
- Use the "Find Company" and "Update Company" actions in combination to update if a company exists, or create if it does not, using unique fields such as company ID, name, or domain[^1][^2][^3][^5].
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35][^36][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://zapier.com/apps/hubspot/integrations/salesviewer/125109/create-and-update-companies-in-hubspot-from-new-visits-in-salesviewer

[^2]: https://zapier.com/apps/hubspot/integrations/hubspot/36554/update-new-hubspot-companies-with-company-data-from-powrbot

[^3]: https://zapier.com/blog/updates/1027/updates-hubspot-crm-automatically-add-information-companies-and-deals

[^4]: https://zapier.com/apps/hubspot/integrations/workamajig/101650/update-company-details-in-hubspot-for-new-company-updates-in-workamajig

[^5]: https://community.hubspot.com/t5/APIs-Integrations/How-to-use-Zapier-to-Create-a-Contact-and-associated-Company/m-p/452931

[^6]: https://zapier.com/apps/front-app/integrations/hubspot

[^7]: https://zapier.com/apps/hubspot/integrations/hubspot/190166/create-or-update-contacts-for-new-form-submissions-in-hubspot

[^8]: https://zapier.com/apps/hubspot/integrations/hubspot/1379896/update-hubspot-companies-when-new-company-property-changes-occur-in-hubspot

[^9]: https://zapier.com/apps/chatbase/integrations/hubspot

[^10]: https://community.hubspot.com/t5/APIs-Integrations/Help-Zapier-to-New-Contact-to-New-Deal/m-p/306822

[^11]: https://zapier.com/apps/hubspot/integrations

[^12]: https://community.zapier.com/how-do-i-3/create-a-hubspot-task-when-a-new-hubspot-deal-is-created-38570

[^13]: https://community.hubspot.com/t5/HubSpot-Ideas/Adding-Notes-from-other-sources-via-Zapier-would-save-tons-of/idi-p/270954

[^14]: https://ecosystem.hubspot.com/marketplace/apps/zapier

[^15]: https://community.zapier.com/how-do-i-3/how-do-i-create-a-get-list-custom-action-in-hubspot-33578

[^16]: https://community.zapier.com/how-do-i-3/setup-a-hubspot-property-modification-trigger-19956

[^17]: https://community.hubspot.com/t5/APIs-Integrations/How-to-use-Zapier-to-Create-a-Contact-and-associated-Company/m-p/452931

[^18]: https://www.youtube.com/watch?v=Fpml5Cblm2g

[^19]: https://knowledge.hubspot.com/integrations/how-to-use-zapier-and-hubspot

[^20]: https://community.zapier.com/how-do-i-3/how-do-i-update-company-and-person-category-fields-in-scoro-via-zapier-without-updating-the-required-name-fields-24156

[^21]: https://zapier.com/apps/hubspot/integrations/hubspot/1451211/create-engagements-in-hubspot-for-recently-created-or-updated-companies

[^22]: https://zapier.com/apps/hubspot/integrations/salesviewer/125109/create-and-update-companies-in-hubspot-from-new-visits-in-salesviewer

[^23]: https://community.zapier.com/how-do-i-3/update-deal-in-hubspot-if-not-exist-9027

[^24]: https://community.zapier.com/how-do-i-3/update-company-in-hubspot-when-deal-in-pipedrive-is-updated-14601

[^25]: https://zapier.com/apps/hubspot/integrations/webhook/63534/create-or-update-hubspot-contacts-using-new-webhooks

[^26]: https://community.zapier.com/how-do-i-3/update-contact-in-hubspot-how-to-set-the-hubspot-id-11132

[^27]: https://community.zapier.com/featured-articles-65/how-to-update-a-record-if-it-exists-and-create-one-if-it-doesn-t-9036

[^28]: https://zapier.com/apps/customer-fields/integrations/hubspot

[^29]: https://community.hubspot.com/t5/APIs-Integrations/How-to-use-Zapier-to-Create-a-Contact-and-associated-Company/m-p/453538

[^30]: https://zapier.com/apps/hubspot/integrations/hubspot/1733586/update-hubspot-companies-when-new-company-properties-change-in-hubspot

[^31]: https://zapier.com/apps/hubspot/integrations/instantly

[^32]: https://zapier.com/apps/actionstep/integrations/hubspot/1448270/create-matters-in-actionstep-for-newly-created-or-updated-hubspot-companies

[^33]: https://zapier.com/apps/hubspot/integrations/workamajig/101650/update-company-details-in-hubspot-for-new-company-updates-in-workamajig

[^34]: https://community.zapier.com/how-do-i-3/find-a-hubspot-deal-by-hubspot-company-id-25236

[^35]: https://community.intercom.com/contacts-companies-14/updating-company-attribute-with-zapier-6794

[^36]: https://www.youtube.com/watch?v=uEXpl0AOJJM

