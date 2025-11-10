<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# How would I implement Zapier "Sub Zaps" into a process that is using Luma Events? I need Zapier to reference the event id from the "Event Updated" trigger so that it can be pushed into a corresponding zap for "Event Created". Please explain in detail. Do I need an additional Zap for the Start a Sub Zap and Return from Sub Zap actions? Where would the Call a Sub Zap action be placed for this purpose

To implement Sub-Zaps with Luma Events, follow this structured approach:

---

## **Implementation Steps**

1. **Create the Sub-Zap**
    - **Trigger**: Use *Start a Sub-Zap* and define an input field (e.g., `Event ID`) to receive data from parent Zaps[^2][^5].
    - **Action**: Add a *Return from a Sub-Zap* step to send the `Event ID` back to parent Zaps[^3][^5].
    - *No additional actions are required if only passing data through.*
2. **Modify the "Event Updated" Zap**
    - After Luma's *Event Updated* trigger, add a **Call a Sub-Zap** action[^1][^4].
    - Map Luma's `Event ID` to the Sub-Zap's input field[^5].
    - Use the returned `Event ID` in subsequent steps (e.g., triggering "Event Created" logic).
3. **Update the "Event Created" Zap**
    - In the "Event Created" Zap, add a **Call a Sub-Zap** action after its trigger.
    - Map the `Event ID` from Luma's *Event Created* trigger to the Sub-Zap input.

---

## **Key Requirements**

- **Separate Sub-Zap**: Yes, Sub-Zaps are standalone Zaps with mandatory *Start a Sub-Zap* triggers and *Return from a Sub-Zap* final steps[^2][^3].
- **Placement of Call a Sub-Zap**: Insert this action **immediately after the trigger** in both parent Zaps to ensure the `Event ID` is available for later steps[^4][^5].

---

## **Example Workflow**

- **Sub-Zap**: Acts as a centralized hub for `Event ID` handling.
- **Parent Zaps**: Both "Event Updated" and "Event Created" Zaps call the Sub-Zap to retrieve/process the `Event ID`, enabling cross-Zap data reuse[^4][^5].

Need clarification on how to map specific fields or test the Sub-Zap?
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35][^36][^37][^38][^39][^40][^41][^42][^43][^44][^45][^46][^47][^48][^49][^50][^51][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://zapier.com/apps/luma/integrations/sub-zap-by-zapier

[^2]: https://help.zapier.com/hc/en-us/articles/32283713627533-Understanding-Sub-Zaps

[^3]: https://help.zapier.com/hc/en-us/articles/8496308527629-Create-reusable-Zap-steps-with-Sub-Zaps

[^4]: https://community.zapier.com/featured-articles-65/how-to-use-multiple-triggers-for-the-same-zap-sub-zaps-9502

[^5]: https://www.xray.tech/post/how-to-build-sub-zaps

[^6]: https://community.zapier.com/how-do-i-3/use-a-zap-to-update-existing-events-in-google-calendar-6016

[^7]: https://community.zapier.com/how-do-i-3/which-event-to-choose-when-updating-a-found-event-20673

[^8]: https://zapier.com/apps/luma/integrations/slack

[^9]: https://community.zapier.com/how-do-i-3/getting-original-event-data-when-updating-event-on-google-calendar-19171

[^10]: https://community.zapier.com/how-do-i-3/finding-and-updating-specific-existing-google-calendar-event-39329

[^11]: https://zapier.com/apps/luma/integrations/notion

[^12]: https://community.zapier.com/code-webhooks-52/update-via-web-hooks-how-to-find-the-item-to-update-or-delete-by-id-18127

[^13]: https://community.zapier.com/troubleshooting-99/help-with-extracting-event-id-uuid-from-calendly-in-zapier-43303

[^14]: https://community.zapier.com/how-do-i-3/how-do-i-add-registration-to-zoom-event-with-status-registered-42932

[^15]: https://theeventscalendar.com/knowledgebase/creating-a-zap/

[^16]: https://community.zapier.com/how-do-i-3/create-outlook-event-with-specified-category-33023

[^17]: https://zapier.com/apps/luma/integrations/gravity-forms

[^18]: https://theworkflowpro.com/sub-zap-by-zapier/

[^19]: https://zapier.com/apps/sub-zap-by-zapier/integrations/formatter

[^20]: https://www.youtube.com/watch?v=PvVFxH6tPEw

[^21]: https://www.chathamoaks.co/guidebook/how-to-use-sub-zap-by-zapier

[^22]: https://zapier.com/apps/sub-zap-by-zapier/integrations

[^23]: https://www.youtube.com/watch?v=mxFw2hlQ7Zg

[^24]: https://solvaa.co.uk/how-can-i-use-zapiers-sub-zap-feature/

[^25]: https://zapier.com/apps/sub-zap-by-zapier/integrations/timing

[^26]: https://community.zapier.com/code-webhooks-52/how-can-i-return-line-items-from-a-sub-zap-26984

[^27]: https://www.reddit.com/r/zapier/comments/1jab1j2/subzap_returning_inconsistent_data/

[^28]: https://www.monkeypodmarketing.com/zapier-subzaps/

[^29]: https://zapier.com/apps/jobadder/integrations/sub-zap-by-zapier

[^30]: https://www.reddit.com/r/zapier/comments/1hl9lik/one_of_multiple_triggers/

[^31]: https://zapier.com/apps/onepage/integrations/sub-zap-by-zapier

[^32]: https://zapier.com/apps/lmn/integrations/sub-zap-by-zapier

[^33]: https://www.reddit.com/r/zapier/comments/1gj5nx2/how_to_trigger_the_creation_of_an_event/

[^34]: https://zapier.com/apps/calcom/integrations/sub-zap-by-zapier

[^35]: https://zapier.com/apps/avahr/integrations/sub-zap-by-zapier/255624742/trigger-sub-zaps-in-sub-zap-by-zapier-whenever-new-candidates-are-added-in-avahr

[^36]: https://help.dubsado.com/en/articles/3517394-dubsado-triggers-and-actions-in-zapier

[^37]: https://zapier.com/apps/slack/integrations/sub-zap-by-zapier

[^38]: https://zapier.com/apps/sub-zap-by-zapier/integrations/ilovepdf

[^39]: https://zapier.com/apps/acuity-scheduling/integrations/sub-zap-by-zapier

[^40]: https://zapier.com/apps/luma/integrations

[^41]: https://help.lu.ma/p/helpart-6hPoECVYQUrYgHI/set-up-a-zapier-integration

[^42]: https://zapier.com/apps/luma/integrations/webhook

[^43]: https://community.zapier.com/general-discussion-13/how-to-build-trigger-for-updated-user-data-14774

[^44]: https://community.zapier.com/how-do-i-3/how-can-i-update-a-google-calendar-event-field-when-the-event-is-created-43478

[^45]: https://community.zapier.com/code-webhooks-52/luma-get-event-run-python-code-in-zapier-24191

[^46]: https://community.zapier.com/how-do-i-3/how-to-place-a-return-from-a-sub-zap-step-after-a-looping-action-48998

[^47]: https://community.zapier.com/featured-articles-65/by-zapier-sub-zaps-and-how-to-use-them-11497

[^48]: https://community.zapier.com/how-do-i-3/what-happens-if-i-create-a-path-within-a-sub-zap-31736

[^49]: https://zapier.com/apps/loopreturns/integrations/sub-zap-by-zapier

[^50]: https://community.zapier.com/how-do-i-3/can-we-make-return-from-sub-zap-optional-for-one-way-sub-zap-38707

[^51]: https://www.youtube.com/watch?v=sfxdZUMc0zI

