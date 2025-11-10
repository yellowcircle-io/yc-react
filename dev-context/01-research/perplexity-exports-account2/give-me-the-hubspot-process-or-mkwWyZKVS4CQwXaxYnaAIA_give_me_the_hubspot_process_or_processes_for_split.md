<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## HubSpot Processes for Splitting a Text String into First and Last Name Values

HubSpot offers several ways to split a text string (such as a "Full Name" field) into separate "First Name" and "Last Name" values. The process you choose depends on your data source (form input, existing CRM records, or email addresses) and your technical resources. Below are the main approaches supported by HubSpot and its community.

---

**Splitting Full Name from Form Input (JavaScript Approach)**

If you collect a single "Full Name" field in your HubSpot forms and want to automatically populate the hidden "First Name" and "Last Name" fields, you can use JavaScript on your landing page. A recommended method is to use the [split-human-name](https://unpkg.com/split-human-name@latest/dist/split-human-name.min.js) JavaScript library, which intelligently parses human names.

**Process:**

- Include the split-human-name library in your form page.
- Use JavaScript to listen for changes to the "Full Name" field.
- When the field changes, split the value and assign the results to the hidden "First Name" and "Last Name" fields.

**Sample Code:**

```javascript
$(document).on("change", ".hbspt-form input[name=full_name]", function() {
  var name = window.splitName($(this).val());
  $('.hbspt-form input[name=firstname]').val(name.firstName);
  $('.hbspt-form input[name=lastname]').val(name.lastName);
});
```

This approach works well for most Western naming conventions but may require adjustment for more complex or non-Western names[^2].

---

**Splitting Full Name Using HubSpot Workflows (Custom Code Action)**

For data already in HubSpot (such as existing contacts with a "Full Name" property), you can use HubSpot's Operations Hub "Custom Code" workflow action to split the name.

**Process:**

- Create a workflow that enrolls contacts based on your criteria.
- Add a "Custom Code" action (requires Operations Hub Professional or Enterprise).
- Write code (Node.js/JavaScript or Python) to split the "Full Name" property.
- Use "Copy Property Value" actions to assign the parsed values to the "First Name" and "Last Name" properties[^1].

**Example (JavaScript/Node.js):**

```javascript
exports.main = async (event, callback) => {
  const fullName = event.inputFields['full_name'];
  let firstName = '';
  let lastName = '';
  if (fullName) {
    const nameParts = fullName.trim().split(' ');
    firstName = nameParts[^0] || '';
    lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  }
  callback({
    outputFields: {
      firstName,
      lastName,
    },
  });
};
```

After running the code, use workflow actions to copy the outputs to the respective contact properties[^1].

---

**Splitting Name from Email Address (Custom Code in Workflow)**

If you need to derive names from email addresses (e.g., "john.doe@example.com"), you can use a similar custom code action in a workflow.

**Process:**

- Enroll contacts based on missing first/last name but having an email address.
- Use a custom code action to parse the email prefix (before the @) and split by dot or other delimiters.
- Assign the resulting values to "First Name" and "Last Name" properties[^3][^5].

**Example (JavaScript/Node.js):**

```javascript
exports.main = async (event, callback) => {
  const email = event.inputFields['email'];
  let firstName = '';
  let lastName = '';
  if (email && typeof email === 'string') {
    const namePattern = /^([a-zA-Z]+)\.([a-zA-Z]+)@/;
    const match = email.match(namePattern);
    if (match) {
      firstName = match[^1].charAt(0).toUpperCase() + match[^1].slice(1);
      lastName = match[^2].charAt(0).toUpperCase() + match[^2].slice(1);
    }
  }
  callback({
    outputFields: {
      firstName,
      lastName,
    },
  });
};
```

This method is best for standardized email formats and may need adjustments for edge cases[^3][^5].

---

**Bulk Data Cleansing (Outside HubSpot)**

If your data is inconsistent or you need to handle complex cases (e.g., names with multiple parts, missing last names), consider exporting your contact list, processing it in a spreadsheet or script, and re-importing the cleaned data. This is often simpler for one-off or bulk corrections[^4].

---

## Summary Table: HubSpot Name Splitting Methods

| Method | Where Used | Technical Level | Automation | Notes |
| :-- | :-- | :-- | :-- | :-- |
| JavaScript on Forms | Landing pages, forms | Low-Medium | Real-time | Best for new submissions[^2] |
| Custom Code in Workflows | Existing CRM data | Medium | Automated | Requires Operations Hub Pro/Enterprise[^1][^3][^5] |
| Email Parsing in Workflows | When only email is present | Medium | Automated | Works for standard email formats[^3][^5] |
| Bulk Export \& Re-import | Large/complex datasets | Low | Manual | Good for one-off fixes[^4] |


---

**Best Practice:**
For ongoing data collection, use separate "First Name" and "Last Name" fields in your forms whenever possible to ensure data quality and minimize the need for splitting logic[^2]. For existing data, HubSpot's custom code workflows or JavaScript on forms provide robust solutions for most use cases.
<span style="display:none">[^10][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://community.hubspot.com/t5/9881-Operations-Hub/Custom-code-Format-Data-split-full-name-property/m-p/740086

[^2]: https://www.zyxware.com/article/6557/hubspot-form-optimization-should-you-use-full-name-or-first-name-last-name-fields

[^3]: https://community.hubspot.com/t5/CMS-Development/HELP-NEEDED-Seperate-first-and-last-name-automatically-via-a/m-p/1082050

[^4]: https://community.hubspot.com/t5/9881-Operations-Hub/Splitting-First-Name-If-Last-Name-is-Unknown/m-p/763853

[^5]: https://community.hubspot.com/t5/APIs-Integrations/Use-code-in-workflow-to-copy-first-amp-lastname-from-email/m-p/875330

[^6]: https://community.hubspot.com/t5/HubSpot-Ideas/Make-it-possible-for-Hubspot-Forms-to-separate-First-Last-Name/idi-p/255055

[^7]: https://knowledge.hubspot.com/workflows/format-your-data-with-workflows

[^8]: https://community.hubspot.com/t5/Dashboards-Reporting/Grabbing-User-s-First-and-Last-name-and-putting-in-seperate/m-p/1042835

[^9]: https://www.youtube.com/watch?v=F_S6fSIQAXg

[^10]: https://community.make.com/t/create-scenario-that-splits-name-and-updates-hubspot-contact/59319

