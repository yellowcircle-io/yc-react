<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# I am working to set up the operations for a referral program and contest that I've been given less than three business days to execute. I was handed a tool called Viral Loops that appears to have poorly set up integrations with HubSpot and our custom-coded website. The referrer link seems to be working properly (as it's an in platform aspect); however the callback for when a referrer converts seems to fail since the webhook does not recognize the contact that is being sent as the conversion (as it's beyond signup). Does Viral Loops have an API/webhook to add contacts that have registered and tie it back so that the conversion event can be properly tracked?

Given your urgent timeline and the integration challenges between Viral Loops, HubSpot, and your custom website, here’s how you can approach the problem and what Viral Loops offers for tracking conversions and managing contacts:

## Viral Loops API and Webhook Capabilities

**API for Managing Contacts and Conversions**

- **Viral Loops provides a robust API** that allows you to automate campaign management, participant tracking, and reward allocation. You can add participants, track conversions, and trigger actions based on milestones or achievements[^1].
- **You can use the API to add new contacts** (participants) to your campaign programmatically. This is useful if you want to ensure that users who sign up through your website are properly registered in Viral Loops as participants, not just as leads[^1].
- **Conversion tracking is available via API or JavaScript snippet.** When a participant completes a conversion (e.g., makes a purchase), you can trigger a conversion event in Viral Loops either by calling the API or by using the provided JavaScript on your website[^2].

**Webhook Integrations**

- **Viral Loops supports webhook-based integrations** for both sending and receiving data. For example, you can set up a webhook in HubSpot to send new contacts to Viral Loops, and Viral Loops can also send events (like conversions) to other systems[^3][^4].
- **However, the standard HubSpot-to-Viral Loops webhook integration is typically set up to send new signups from HubSpot to Viral Loops.** It does not natively handle the reverse (Viral Loops sending conversion events back to HubSpot) unless you configure a custom workflow or use a third-party integration tool[^3][^4].
- **If the webhook is failing to recognize a contact for a conversion event, it may be because the contact was not properly registered as a participant in Viral Loops at the time of the conversion.** This can happen if the contact was added to Viral Loops after the initial signup, or if the conversion event is not being sent with the correct participant identifier (usually email or unique ID)[^2].


## How to Properly Track Conversions

1. **Ensure Participants Are Added to Viral Loops**
    - **Add participants via the Viral Loops API** when they sign up on your website, not just when they are added to HubSpot. This ensures Viral Loops knows who the participant is before any conversion event occurs[^1][^2].
    - **If you are importing contacts from HubSpot to Viral Loops, make sure the import includes all required fields (email, first name, last name, etc.)**[^5].
2. **Track Conversions**
    - **Trigger a conversion event in Viral Loops** when a participant completes the desired action (e.g., makes a purchase). This can be done via API or by embedding the Viral Loops JavaScript on your website[^2].
    - **If you use the API, you can call the conversion endpoint with the participant’s identifier (email or unique ID) to mark them as converted**[^2].
    - **If you use the JavaScript snippet, conversions are tracked automatically when the participant visits the specified page and is identified by Viral Loops**[^2].
3. **Handle Webhook Failures**
    - **If the webhook is failing to recognize a contact, check that the participant is registered in Viral Loops before the conversion event is sent.**
    - **Ensure that the conversion event payload includes the correct participant identifier.** If the webhook is expecting a different identifier (e.g., HubSpot contact ID vs. Viral Loops participant ID), you may need to map these in your integration logic.

## Summary Table

| Step | Viral Loops API/Webhook Support | Notes |
| :-- | :-- | :-- |
| Add new participant | Yes (API, webhook, import) | Add via API, webhook, or import from HubSpot/CSV |
| Track conversion | Yes (API, JavaScript) | Call API or use JS snippet on website |
| Send conversion to HubSpot | Limited (via custom webhook) | Not native; requires custom setup or third-party tool |
| Update participant status | Yes (API) | Can update participant status, milestones, and rewards via API |

## Recommendations

- **Use the Viral Loops API to add participants as soon as they sign up on your website.** This ensures Viral Loops knows who the participant is before any conversion event occurs[^1][^2].
- **Trigger conversion events via the Viral Loops API or JavaScript snippet when the conversion happens.** This will ensure accurate tracking of referrals and conversions[^2].
- **If you need to send conversion events back to HubSpot, consider using a third-party integration tool (like Pipedream, Pabbly, or Zapier) to bridge the gap between Viral Loops and HubSpot**[^1][^6].
- **Test your setup with dummy data to ensure all steps (signup, participant addition, conversion tracking) work as expected before going live**[^5].

Viral Loops does have the necessary API and webhook capabilities to add contacts and track conversions, but you may need to customize your integration logic to ensure that conversion events are properly recognized and tied back to the correct participants[^1][^2][^3].
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://pipedream.com/apps/viral-loops

[^2]: https://www.youtube.com/watch?v=NRcWI8aLGcQ

[^3]: https://documentation.viral-loops.com/en/articles/5021099-how-to-set-a-webhook-in-hubspot

[^4]: https://intercom.help/viral-loops/en/articles/5021099-how-to-set-a-webhook-in-hubspot

[^5]: https://viral-loops.com/blog/hubspot-integration/

[^6]: https://www.pabbly.com/connect/integrations/webhook-by-pabbly/viral-loops/

[^7]: https://documentation.viral-loops.com/en/articles/8540588-setting-up-a-referral-program-for-existing-customers-viral-loops-widgets-api

[^8]: https://documentation.viral-loops.com/en/articles/3011503-hubspot-integration

[^9]: https://loops.so/docs/integrations/incoming-webhooks

[^10]: https://viral-loops.com/integrations

[^11]: https://zapier.com/apps/activecampaign/integrations/viral-loops/1456608/add-participants-to-viral-loops-when-contacts-are-updated-in-activecampaign

[^12]: https://www.instagram.com/thv/

[^13]: https://open.spotify.com/artist/3JsHnjpbhX4SnySpvpa9DK

[^14]: https://www.youtube.com/channel/UCFqldK305KOVQXbAIGi-flg

[^15]: https://4spotconsulting.com/integrate-hubspot-crm-with-viral-loops-effortlessly/

[^16]: https://community.zapier.com/how-do-i-3/importing-contacts-from-viral-loops-to-sendgrid-15365

[^17]: https://www.youtube.com/watch?v=vGaykM5Vmd0

[^18]: https://doc.ibexa.co/projects/connect/en/latest/apps/viral-loops/

[^19]: https://en.wikipedia.org/wiki/V_(singer)

[^20]: https://www.youtube.com/watch?v=HAWYOuMGkK0

[^21]: https://vmagazine.com

[^22]: https://music.apple.com/bt/artist/v/1191852113

[^23]: https://www.collinsdictionary.com/dictionary/english/v

[^24]: https://www.britannica.com/sitemap/v/1

[^25]: https://www.imdb.com/title/tt0085106/

[^26]: https://community.hubspot.com/t5/APIs-Integrations/Webhook-Infinite-Loop/m-p/549153

[^27]: https://www.pabbly.com/author/rajpal-tomarmagnetbrains-com/page/343/

[^28]: https://www.youtube.com/watch?v=8M_MlBMWBsE

