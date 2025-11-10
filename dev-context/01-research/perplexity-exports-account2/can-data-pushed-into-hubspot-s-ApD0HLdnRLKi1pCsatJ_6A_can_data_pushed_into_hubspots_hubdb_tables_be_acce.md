<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## Accessing HubDB Data via API and Webhook

**HubDB tables in HubSpot are designed to store structured data, and accessing or manipulating this data is a common integration requirement. Here’s how you can work with HubDB data using webhooks and APIs:**

---

### Accessing HubDB Data via API

- **Yes, you can access (read, write, update, delete) data in HubSpot’s HubDB tables via the HubDB API.**
    - The HubDB API is RESTful, supports authentication via API keys or private app tokens, and returns data in JSON format.
    - You can programmatically create, read, update, and delete rows in HubDB tables, as well as query and filter data using SQL-like syntax[^2][^5].
    - This makes it possible to build custom applications, integrations, or automations that leverage your HubDB data directly[^2].

---

### Accessing HubDB Data via Webhook

- **Direct access to HubDB data via webhook is not supported.**
    - HubSpot webhooks are primarily designed for sending or receiving notifications about CRM events (like contact updates) or for integrating with external systems in real time[^3][^6].
    - You cannot directly update or retrieve HubDB table data using a webhook action in a workflow. Webhook actions in HubSpot workflows do not provide the flexibility to structure the request body to interact with the HubDB API directly[^1].
    - If you need to manipulate HubDB data as part of a workflow, you must use a custom code action (e.g., with Node.js or Python) that makes API calls to the HubDB API[^1][^5].

---

### Workflow Integration Patterns

- **To integrate HubDB data changes with workflows:**
    - Use a custom code action within a workflow to call the HubDB API for reading or updating data[^1][^5].
    - Webhooks in workflows are best used for notifying external systems or triggering actions elsewhere, not for direct HubDB manipulation[^1][^6].
    - If you want to trigger a workflow in HubSpot based on external changes (such as new data pushed to HubDB from another system), you can use a webhook to trigger the workflow, but the workflow itself would still need to use a custom code action to interact with HubDB[^6].

---

### Summary Table

| Method | Can Access/Modify HubDB Data? | Typical Use Case |
| :-- | :-- | :-- |
| HubDB API | Yes | Programmatic CRUD operations on HubDB tables |
| Webhook | No (not directly) | Real-time notifications, event-driven triggers |
| Workflow | Indirectly (via custom code) | Automations that require API calls to HubDB |


---

**In conclusion:**

- Use the HubDB API for all direct data operations on HubDB tables[^2][^5].
- Use webhooks for event notifications or triggering external actions, not for direct HubDB data access[^1][^3].
- To manipulate HubDB data within workflows, implement a custom code action that calls the HubDB API[^1][^5].
<span style="display:none">[^10][^4][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://community.hubspot.com/t5/APIs-Integrations/Can-I-update-hubdb-table-row-using-the-Webhook-inside-the/m-p/636225

[^2]: https://www.lpd-themes.com/en/blog/hubdb-api

[^3]: https://developers.hubspot.com/blog/when-is-it-best-to-use-a-webhook-vs.-an-api-with-hubspot

[^4]: https://community.hubspot.com/t5/APIs-Integrations/Newbie-Question-Custom-Webhooks/m-p/867056

[^5]: https://community.hubspot.com/t5/APIs-Integrations/Invoke-an-external-GET-API-and-store-the-data-retrieved-from-API/m-p/660296

[^6]: https://knowledge.hubspot.com/workflows/how-do-i-use-webhooks-with-hubspot-workflows

[^7]: https://developers.hubspot.com/docs/guides/api/app-management/webhooks

[^8]: https://community.zapier.com/code-webhooks-52/google-sheets-to-hubdb-using-custom-request-in-webhook-31949

[^9]: https://community.hubspot.com/t5/APIs-Integrations/Update-HubDb-row-via-API/td-p/1091452

[^10]: https://developers.hubspot.com/docs/guides/api/cms/hubdb

