<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Are there any ways to automatically assign picklist values between Salesforce and HubSpot

Yes, picklist values between Salesforce and HubSpot can be automatically assigned using a combination of field mapping, workflow automation, and careful configuration. Here’s how to achieve this:

---

### **1. Ensure Internal Values Match API Names**

For seamless syncing:

- **HubSpot’s internal values** must exactly match **Salesforce’s API names** for picklist options. The integration compares these identifiers, not the display labels[^1][^3][^5].
    - Example: If Salesforce uses `US` as the API name for "United States," HubSpot’s internal value for the same option must also be `US`.
- Modify mismatched values by editing dropdown properties in HubSpot or adjusting Salesforce picklist API names[^2][^3].

---

### **2. Use HubSpot Workflows to Map Picklists**

For complex scenarios (e.g., state picklists tied to specific countries):

- **Create country-specific state dropdowns** in HubSpot (e.g., "US States," "Canada Provinces")[^1].
- Build a workflow to consolidate state values into a single field for Salesforce sync:
    - **Enrollment trigger**: When a country is selected.
    - **Conditional logic**: Check if a state-specific picklist (e.g., "US States") is populated.
    - **Copy actions**: Transfer the state value to a consolidated "State/Region" field mapped to Salesforce[^1][^5].
    - *Note*: HubSpot workflows have a 20-branch limit, so multiple nested workflows may be needed for larger picklists[^1].

---

### **3. Configure Sync Rules in the Integration**

In **HubSpot Settings > Integrations > Salesforce**:

- **Two-way sync**: Updates values in both systems based on the most recent change[^1][^4].
- **Prefer Salesforce unless blank**: Salesforce values take priority, but HubSpot can fill empty fields[^3][^4].
- **Always use Salesforce**: HubSpot never overwrites Salesforce data[^3][^4].

---

### **4. Automate Picklist Creation**

For recurring updates:

- Use **third-party tools** like Zapier or custom scripts to:
    - Detect new picklist values in Salesforce.
    - Programmatically add matching options to HubSpot dropdowns[^5].
- *Alternative*: Schedule manual reviews to align picklists during integration maintenance[^2][^3].

---

### **Common Pitfalls to Avoid**

- **Mismatched field types**: Ensure both systems use dropdowns (not text fields) for picklists[^3][^5].
- **Overwriting conflicts**: Test sync rules in a sandbox before deploying[^5].
- **Ignoring API names**: Always verify Salesforce’s API names (e.g., ISO codes vs. full country names)[^1][^3].

By following these steps, you can maintain consistent picklist values across both platforms and automate updates without manual intervention[^1][^3][^5].
<span style="display:none">[^10][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://www.coastalconsulting.co/blog/sync-salesforce-state-and-country-picklists-with-hubspot

[^2]: https://community.hubspot.com/t5/Sales-Integrations/Salesforce-Picklist-on-Task-Property-Not-Syncing-w-HS/m-p/914439

[^3]: https://www.coastalconsulting.co/blog/hubspot-salesforce-integration-9-things-to-consider-if-you-want-to-succeed

[^4]: https://www.getsmartacre.com/salesforce-and-hubspot-integration/

[^5]: https://blog.revpartners.io/en/revops-articles/an-expert-guide-to-a-hubspot-salesforce-integration

[^6]: https://community.hubspot.com/t5/Marketing-Integrations/Sync-HubSpot-drop-down-menu-field-to-a-Salesforce-text-field/m-p/924944

[^7]: https://www.lairedigital.com/blog/hubspot-salesforce-integration

[^8]: https://knowledge.hubspot.com/salesforce/sync-salesforce-state-and-country-picklists-with-hubspot-state-region-and-country-properties

[^9]: https://knowledge.hubspot.com/salesforce/manage-your-salesforce-integration-settings

[^10]: https://community.hubspot.com/t5/CRM/Hubspot-Salesforce-Integration-Picklist-Problem/m-p/421175

