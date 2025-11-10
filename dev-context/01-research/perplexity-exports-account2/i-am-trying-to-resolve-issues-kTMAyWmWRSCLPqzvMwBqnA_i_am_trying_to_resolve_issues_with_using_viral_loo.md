<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## Resolving Viral Loops and HubSpot Referrer Campaign Issues

Based on your description of the issues with your Viral Loops and HubSpot referrer campaign integration, I've identified several key problems and their solutions. The main issue centers around properly connecting referred contacts to their original referrers, particularly when dealing with camelCase referral codes that HubSpot doesn't natively support.

### Problem Analysis

Your current setup has these specific issues:

1. **Referral link data not passing to Viral Loops**: When a referred contact signs up through a referral link, their data reaches HubSpot but fails to properly register in Viral Loops with the referrer connection[^1][^2]
2. **Webhook conversion failures**: The goal/conversion webhook in HubSpot fails because Viral Loops lacks the referred contact's record[^1][^2]
3. **CamelCase data transformation needed**: The referral code parameter requires camelCase formatting (`referralCode`) which HubSpot workflows don't natively support[^3]

### Solution Architecture

The resolution involves creating an intermediary step using **HubSpot Operations Hub** with a custom code action to properly format and send the referral data to Viral Loops. Here's the comprehensive solution:

#### Step 1: Set Up HubSpot Custom Code Action

Create a custom code workflow action in HubSpot Operations Hub that transforms the referral code data into the required camelCase format and makes the proper API call to Viral Loops[^4][^5].

```javascript
const hubspot = require("@hubspot/api-client");

exports.main = (event, callback) => {
  return callback(processEvent(event));
};

function processEvent(event) {
  // Extract referral code from HubSpot contact properties
  const referralCode = event.inputFields.referral_code; // HubSpot snake_case
  const contactEmail = event.inputFields.email;
  const firstName = event.inputFields.firstname;
  const lastName = event.inputFields.lastname;
  
  // Viral Loops API configuration
  const viralLoopsConfig = {
    publicToken: 'YOUR_VIRAL_LOOPS_PUBLIC_TOKEN',
    apiUrl: 'https://app.viral-loops.com/api/v3/campaign/participant'
  };
  
  // Format data for Viral Loops API (camelCase required)
  const participantData = {
    publicToken: viralLoopsConfig.publicToken,
    user: {
      firstname: firstName,
      lastname: lastName,
      email: contactEmail
    },
    referrer: {
      referralCode: referralCode // camelCase format required
    }
  };
  
  // Make API call to Viral Loops
  return fetch(viralLoopsConfig.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(participantData)
  })
  .then(response => response.json())
  .then(data => {
    return {
      outputFields: {
        viral_loops_response: JSON.stringify(data),
        registration_status: 'success'
      }
    };
  })
  .catch(error => {
    return {
      outputFields: {
        viral_loops_response: error.message,
        registration_status: 'failed'
      }
    };
  });
}
```


#### Step 2: Configure the HubSpot Workflow

Set up your HubSpot workflow to trigger when a referred contact is created[^6]:

1. **Trigger**: Contact creation or form submission
2. **Enrollment criteria**: Contact has a referral code property populated
3. **Custom code action**: Use the code above to register the participant with Viral Loops
4. **Branch logic**: Create different paths based on the success/failure of the Viral Loops registration

#### Step 3: Viral Loops API Integration Details

The key to connecting referred users to their referrers is using the correct API endpoint and parameters[^3]. When registering a participant who was referred, you must include the `referrer` object with the `referralCode` field:

```json
{
  "publicToken": "your_campaign_public_token",
  "user": {
    "firstname": "John",
    "lastname": "Doe", 
    "email": "john.doe@example.com"
  },
  "referrer": {
    "referralCode": "ABC123XYZ"
  }
}
```


#### Step 4: Handle Conversion Events

Once the referred contact is properly registered in Viral Loops, set up the conversion tracking[^7]:

1. **Use Viral Loops conversion API**: When the referred contact performs the desired action
2. **API endpoint**: `POST /campaign/participant/convert`
3. **Required data**: The participant's referral code or email to trigger the conversion

### Alternative Solutions

If the custom code approach seems complex, consider these alternatives:

#### Option 1: Use Zapier Integration

Leverage Zapier as an intermediary to handle the data transformation between HubSpot and Viral Loops[^8]. Zapier can automatically convert snake_case to camelCase during the data transfer.

#### Option 2: Modify Form Capture

Instead of relying on HubSpot's native form handling, implement a custom form solution that captures the referral code in the correct format from the beginning[^9].

#### Option 3: Third-Party Integration Tools

Use platforms like Pabbly Connect or Integrately that specifically support Viral Loops and HubSpot integrations with built-in data transformation capabilities[^8][^10].

### Implementation Best Practices

1. **Test with sample data**: Before going live, test the entire flow with sample referral codes and contacts
2. **Error handling**: Implement robust error handling to catch and log failed API calls
3. **Data validation**: Verify that referral codes exist in Viral Loops before attempting to connect referred users
4. **Monitoring**: Set up monitoring to track successful vs. failed referral connections
5. **Backup webhooks**: Consider implementing backup notification systems for critical conversion events

### Expected Outcome

After implementing this solution:

- Referred contacts will be properly registered in Viral Loops with their referrer connection intact
- Conversion webhooks will function correctly since Viral Loops will have complete participant records
- The referral attribution chain will be maintained, allowing proper reward distribution
- Your referral campaign metrics will be accurate across both platforms

The HubSpot Operations Hub custom code action serves as the crucial bridge that handles the data format transformation and ensures proper API communication between the two platforms[^11].
<span style="display:none">[^12][^13][^14][^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35][^36][^37][^38][^39][^40][^41][^42][^43][^44][^45][^46][^47][^48][^49][^50][^51][^52][^53][^54]</span>

<div align="center">⁂</div>

[^1]: https://documentation.viral-loops.com/en/articles/3011503-hubspot-integration

[^2]: https://intercom.help/viral-loops/en/articles/5021099-how-to-set-a-webhook-in-hubspot

[^3]: https://developers.viral-loops.com/reference/get_campaign-participant-referrer

[^4]: https://community.hubspot.com/t5/9881-Operations-Hub/Use-Case-Custom-Code-Actions-at-Work/m-p/447537

[^5]: https://developers.hubspot.com/docs/api/workflows/custom-code-actions

[^6]: https://knowledge.hubspot.com/workflows/format-your-data-with-workflows

[^7]: https://pipedream.com/apps/viral-loops/integrations/conversion-tools

[^8]: https://integrately.com/integrations/hubspot/viral-loops

[^9]: https://documentation.viral-loops.com/en/articles/981505-how-to-use-a-custom-form

[^10]: https://www.pabbly.com/integrate-maite-with-viral-loops-a-step-by-step-api-tutorial/

[^11]: https://developers.hubspot.com/docs/api/automation/custom-workflow-actions

[^12]: https://ecosystem.hubspot.com/marketplace/apps/viral-loops

[^13]: https://viral-loops.com/blog/hubspot-integration/

[^14]: https://viral-loops.com/integrations/hubspot-referral-integration

[^15]: https://www.pabbly.com/author/rajpal-tomarmagnetbrains-com/page/343/

[^16]: https://legacydocs.hubspot.com/docs/faq/api-request-monitoring

[^17]: https://documentation.viral-loops.com/en/articles/8540588-setting-up-a-referral-program-for-existing-customers-viral-loops-widgets-api

[^18]: https://viral-loops.com

[^19]: https://viral-loops.com/integrations

[^20]: https://documentation.viral-loops.com/en/articles/2850549-web-api-reference

[^21]: https://pipedream.com/apps/viral-loops

[^22]: https://help.okta.com/wf/en-us/Content/Topics/Workflows/connector-reference/hubspotcrm/actions/customapiaction.htm

[^23]: https://www.cdata.com/kb/tech/hubspot-jdbc-apache-camel.rst

[^24]: https://intercom.help/viral-loops/en/articles/8976679-scenarios-and-example-campaigns-with-viral-loops

[^25]: https://viral-loops.com/referral-marketing/referral-link

[^26]: https://documentation.viral-loops.com/en/articles/9997426-referrer-vs-referred-user-page

[^27]: https://viral-loops.com/templates/refer-a-friend

[^28]: https://www.youtube.com/watch?v=jObDRtQZKbw

[^29]: https://documentation.viral-loops.com/en/articles/9997426-referrer-vs-invitee-page

[^30]: https://gist.github.com/inathanael25/cf51d0c75642e4c4e944943f9d822cf7

[^31]: https://doc.ibexa.co/projects/connect/en/latest/apps/viral-loops/

[^32]: https://community.hubspot.com/t5/HubSpot-Ideas/Auto-Change-Fields-from-Uppercase-to-Title-Case/idi-p/16816

[^33]: https://documentation.viral-loops.com/en/articles/8651360-viral-loops-google-tag-manager-participant-management-and-conversions

[^34]: https://aptitude8.com/blog/hubspots-dataset-improvements-and-repackaging-what-this-means-for-your-team

[^35]: https://help.emailoctopus.com/article/295-use-viral-loops-to-build-a-newsletter-referral-program

[^36]: https://www.youtube.com/watch?v=jYD5M-D-Ass

[^37]: https://help.referral-factory.com/user-behavior

[^38]: https://viral-loops-api.readthedocs.io

[^39]: https://community.hellotars.com/t/anyone-getting-referral-codes-into-their-bot/661

[^40]: https://www.youtube.com/watch?v=NRcWI8aLGcQ

[^41]: https://viral-loops.com/product-updates/bug-purge-api-wishpond-integration

[^42]: https://documentation.viral-loops.com/en/articles/8597961-viral-loops-hubspot-participant-management-and-conversions

[^43]: https://www.youtube.com/watch?v=k9at4SUHOTw

[^44]: https://pipedream.com/apps/viral-loops/integrations/campaign-monitor

[^45]: https://developers.viral-loops.com/reference/post_campaign-participant-2

[^46]: https://loops.so/docs/webhooks

[^47]: https://www.youtube.com/watch?v=WRdDQqTeU5c

[^48]: https://www.scopiousdigital.com/faq/use-hubspot-custom-workflow-actions-make-api-calls-without

[^49]: https://www.insycle.com/hubspot/workflows/

[^50]: https://developers.hubspot.com/docs/reference/api/automation/custom-code-actions

[^51]: https://www.innovationvisual.com/knowledge-hub/knowledge/everything-you-need-to-know-about-hubspot-operations-hub

[^52]: https://developers.viral-loops.com/reference/get_campaign-participant-referrals

[^53]: https://developers.viral-loops.com/reference/participant-1

[^54]: https://developers.viral-loops.com/docs/invitee-form-widget

