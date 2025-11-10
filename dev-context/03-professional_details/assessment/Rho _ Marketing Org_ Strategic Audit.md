# 01\. MARKETING ORGANIZATION

# Marketing / Growth / Ops Organization:

RE: Role and Responsibilities. OKRs/Goals for each department. There is some ambiguity, but it could likely be navigated. My concern centers on what leadership's expectations are – e.g., the Lifecycle seems to be misaligned strategically. For instance, based on Tommy's feedback regarding the candidates, it appears that the role might be better framed as Demand Generation.

**TECH STACK NEEDS & REQUIREMENTS:**   
**At a high-level, the things that the Tech Stack needs to solve for:** 

* \[P0\] Ability to send email  
* \[P2\] Simple, elegant means to execute branded emails with dynamic content/segments  
* \[P1\] Scale/implement other channels (P1. SMS, P2-3. Push, In-App)  
* \[P1\] Automated journeys that can trigger the above based on Segments and Behavior   
* \[P1\] Tracking user behavior on Rho.co  
* \[P0\] "Seamless" integration with Salesforce across objects

**KEY QUESTIONS:**

* What team owns the data infrastructure?   
* What team owns tool acquisition/What team owns experimentation (differentiation of experiments)  
* How does the org support MOF/BOF   
  * Tommy seems focused on TOF/Sales Pipeline  
    * Lifecycle is typically focused on the Middle to Bottom

Marketing

Brand 

**Growth:**  
Rapid customer acquisition and activation  
Short-term experimentation and testing  
Top and mid-funnel optimization  
Paid acquisition, SEO, conversion rate optimization  
Metrics: CAC, MQL/SQL volume, conversion rates, acquisition velocity​

**Lifecycle:**  
Long-term customer retention and engagement  
Customer journey orchestration across all stages  
Post-purchase activation, retention, expansion, winback  
Email, SMS, in-app messaging, customer communication programs  
Metrics: LTV, churn rate, retention, engagement, expansion revenue

Operations

Growth Engineering

RevOps

Marketing Ops

# Marketing Assistance

# \[DRAFT\]

# MARKETING OPERATIONS 

# STRATEGIC ASSISTANCE: Scope of Work

**Executive Summary & Strategic Recommendations**

Prepared for Leadership

Date: October 13, 2025

# **EXECUTIVE OVERVIEW**

Our marketing operations infrastructure requires immediate strategic intervention to support projected growth targets. Current inefficiencies are constraining campaign velocity by 200-300% compared to industry benchmarks, directly impacting our ability to scale speed-to-lead efforts and support revenue objectives.

## **Key Business Impact:**

* Campaign deployment time: 2-4 days (industry standard: 4-6 hours)  
* Marketing operations overhead: \+$100,000 annually in inefficiency costs  
* Technical debt accumulation: \~15% quarterly growth in system maintenance overhead

# **STRATEGIC OPTIONS ANALYSIS**

## **Option 1: Status Quo Maintenance**

* Cost: $0 additional investment  
* Timeline: Ongoing degradation  
* Outcome: Continued velocity constraints, increasing technical debt  
* Risk Level: HIGH \- System failure probability increases \~15% quarterly

## \*Option 2: Professional HubSpot Cleanup \+ Custom Tool Development (RECOMMENDED)

* Cost: $32,000 contractor investment \+ internal development resources  
* Timeline: 3-6 months to full capability  
* Outcome: 300-500% improvement in campaign velocity \+ competitive differentiation  
* Risk Level: MEDIUM \- Managed transition with fallback options

## **Option 3: Complete Platform Migration**

* Cost: $150,000-250,000 total investment  
* Timeline: 12-18 months implementation  
* Outcome: Industry-standard capabilities, no competitive advantage  
* Risk Level: HIGH \- Significant operational disruption

# **RECOMMENDED STRATEGY: PARALLEL DEVELOPMENT APPROACH**

## **Phase 1: Foundation Stabilization (Months 1-2)**

### **Contractor Focus:**

* Salesforce-HubSpot sync error resolution (90%+ improvement target)  
* Field mapping, rationalization, and documentation  
* Critical workflow consolidation

### **Internal Development Focus:**

* Custom email component library development  
* Automated campaign deployment system  
* Advanced attribution modeling framework

## **Phase 2: Advanced Capabilities (Months 3-6)**

### **Contractor Focus:**

* Performance optimization and documentation  
* Knowledge transfer and maintenance procedures

### **Internal Development Focus:**

* Salesforce data integration engine  
* Predictive lead scoring system  
* Competitive intelligence automation

### **Goals**

1. **Cleaner, More Reliable Data**  
   * Audit all existing data flows and automation rules.  
   * Implement data validation and normalization standards.  
   * Eliminate redundant workflows, properties, and legacy fields.

   

2. **Faster Speed to Lead**  
   * Reduce lag between lead signup and HubSpot visibility.  
   * Improve sync latency between HubSpot, Salesforce, and the self-serve signup funnel  
     1. Current Salesforce APEX automation \- [\[Wexpert internal analisys\] Questions For Rho Salesforce Integration Changes](https://docs.google.com/document/d/17z7Tf01PGtLSWu-SwH8GwXzEzj_nET1xKXEi4uij4Oo/edit?tab=t.0#heading=h.18eoxwkjw0du)  
   * Establish full visibility into what data comes in, when, and through which system.

3. **Optimize Integration with Self-Serve Signup**  
   * Map and document how data flows from signup → HubSpot → Salesforce.  
   * Identify bottlenecks and inconsistencies in signup event tracking or lead enrichment.  
   * Align lifecycle triggers (welcome emails, trial starts, etc.) to real user actions in signup.  
   * Create alerting and dashboards to monitor sync health and data freshness.

4. **Improved Flexibility & Scalability**  
   * Configure HubSpot to scale efficiently and support experimentation.  
   * Enable A/B testing for emails, journeys, and lead scoring logic.  
   * Ensure the system can handle increased lead volume without degradation.

5. **Better Segmentation and Targeting**  
   * Rebuild segments and lists using clean, standardized data.  
   * Align segmentation with lifecycle stages and CRM definitions.  
   * Increase refresh frequency for dynamic lists tied to real-time user behavior.

6. **Set Up Systems To Support Lifecycle Marketing Enhancements**  
   * Implement lifecycle email campaigns and referral workflows.  
   * Enable experimentation with templates, triggers, and content.  
   * Improve tracking of engagement and conversion metrics.

7. **Tracking and Attribution**  
   * Define clear attribution models (multi-touch vs. first-touch).  
   * Improve visibility into performance by source, campaign, and signup type.  
   * Establish consistent reporting between HubSpot and Salesforce.

# Data Issue Use Case

Data Issue Use Case

Here is an example of how data flows between HubSpot and Salesforce.   
TLDR:  
When a record is created, it is assigned a "Primary Inbound Channel". Historically, the value was not always set properly and was slow to assign (per picklist discussion). We developed an improvement that was faster and more accurate. However, there are still issues, some that can be resolved by tooling, but most that necessitate better data practices and schemas

This serves as a general use case for the overall process that needs refactoring/fixing.   
\---  
A major shared concept is Primary Inbound Channel (doc).   
Prior to my arrival, it was connected by this field \[Primary Inbound Channel (Legacy)\]  
As attached, this field is connected and used by a multitude of different resources in HubSpot.   
HubSpot, like most CRM/database systems, wants to ensure assets are unused before being archived, deprecated, or deleted.   
In particular, the usage in Workflows means that it is still constantly in use and technically active  
However, it is laborious to disentangle, and instead of removing the field is mostly underused and quarantined.  
\--  
Regardless, the way that this value is set is based on how a record is first generated – via Sales, Form Submission, List Upload, etc.  
The generation type is then tracked and tagged in kind with the above documentation.   
NOTE: Technically, the issue is a data schema problem – as Sales contacts should not have a "Primary Inbound Channel" until they actually are Inbound   
Moreover, what is actually tracked is the "Original Traffic Source" – an existing field in HubSpot that is automatically set once a record is created on a particular Object.   
The workaround that was developed by RevOps/MOps was to create HubSpot L3 \[Salesforce Deal Object\] / PIC \[L3, 0.2: Source\] | Deal \- (Data String) \[HubSpot Deal}  
This field exists on both Contacts and Deals since multiple contacts are often members of a particular deal and can Inbound in different ways \[e.g. Contact A at Company X submits form on Oct 1 from traffic via Google AD and Contact B submits on Nov 1 from due to Event Attendance\] – An example of the importance that is more integral to attribution than Marketing campaigns.  
(NOTE: this has more details and interrelated fields, and the complexity rises to account for tracking how inbound changes in multitouch scenarios – but is partially why data needs to flow bidirectionally)  
The workaround fails at times due to associated data being disassociated at the time of submission or creation, or data being appended after submission.   
For instance, Contact A UTM information is dropping/failing due to the use of Incognito.   
Contact B, stating they found Rho via Perplexity

All said, the reason this has been a point of emphasis is because "Primary Inbound Channel" is also used as a proxy for best touch for attribution in Salesforce/Data. 

Let me know if you have followup question. Jeremy and Anthony are also points of information.

# Potential Scope of Work

### Potential Scope of Work

### **Goals**

1. **Cleaner, More Reliable Data**

   * Audit all existing data flows and automation rules.

   * Implement data validation and normalization standards.

   * Eliminate redundant workflows, properties, and legacy fields.

   

2. **Faster Speed to Lead**

   * Reduce lag between lead signup and HubSpot visibility.

   * Improve sync latency between HubSpot, Salesforce, and the self-serve signup funnel  
     1. Current Salesforce APEX automation \- [\[Wexpert internal analisys\] Questions For Rho Salesforce Integration Changes](https://docs.google.com/document/d/17z7Tf01PGtLSWu-SwH8GwXzEzj_nET1xKXEi4uij4Oo/edit?tab=t.0#heading=h.18eoxwkjw0du)

   * Establish full visibility into what data comes in, when, and through which system.

3. **Optimize Integration with Self-Serve Signup**

   * Map and document how data flows from signup → HubSpot → Salesforce.

   * Identify bottlenecks and inconsistencies in signup event tracking or lead enrichment.

   * Align lifecycle triggers (welcome emails, trial starts, etc.) to real user actions in signup.

   * Create alerting and dashboards to monitor sync health and data freshness.

4. **Improved Flexibility & Scalability**

   * Configure HubSpot to scale efficiently and support experimentation.

   * Enable A/B testing for emails, journeys, and lead scoring logic.

   * Ensure system can handle increased lead volume without degradation.

5. **Better Segmentation and Targeting**

   * Rebuild segments and lists using clean, standardized data.

   * Align segmentation with lifecycle stages and CRM definitions.

   * Increase refresh frequency for dynamic lists tied to real-time user behavior.

6. **Set Up Systems To Support Lifecycle Marketing Enhancements**

   * Implement lifecycle email campaigns and referral workflows.

   * Enable experimentation with templates, triggers, and content.

   * Improve tracking of engagement and conversion metrics.

7. **Tracking and Attribution**

   * Define clear attribution models (multi-touch vs. first-touch).

   * Improve visibility into performance by source, campaign, and signup type.

   * Establish consistent reporting between HubSpot and Salesforce.

# 02\. Events Management

# Events / PM: Integrated Operations

## Current Process

1. Event Occurrence  
2. Registrations/Attendees Compiled  
3. List distributed to RevOps  
4. List is manually cleaned   
5. Campaign Created in Salesforce  
6. Campaign ID manually associated to List  
7. List uploaded into HubSpot  
8. Records “enriched” through Workflows  
9. List synced back to associated Campaign   
10. Request made for Email Communications  
11. Email series developed and reviewed  
12. Emails scheduled and deployed

## Pain Points

* Manual Luma-to-HubSpot list uploads (occurs 10+/week)  
* 24-72 hr delay between event completion and HubSpot ingestion  
* Manual data cleansing (business validation/email filtering)  
* Manual processing imprecision    
* Salesforce campaign ID association latency (10-30min)  
* Lacks proactive Event / Campaign creation or calendering management  
* Email follow-ups can miss the window of opportunity

# Proposed Solution (Phase 1, MVP):

* Sync Registrations to HubSpot (via *Luma\<\>Zapier*)  
  * Records held in Hubspot until SFDC Campaign associated)  
* Prepopulate Event data in HubSpot   
  * Executed on an associated field, mirroring current event/campaign fields)  
* Quarantine invalid and unqualified records at inception based on filter logic  
* Assign SFDC Campaign ID when Event AND Luma Event MATCH  
  * Leverage Zapier/Hubspot Workflows to Format/Concatenate string name  
* \~Develop Workflow for ongoing Email distribution   
  * Tag Primary Inbound Channel at   
  * {Anthony – Do you have additional insights on what Partnerships had in mind for an automated flow?}   
* 

# *\*Proposed Solution (Phase 2, Optimizations):*

* Discover a method for prepopulating Campaign ID  
* Develop intake form/ticketing for DR email requests  
* Ingest intake form for communication sequencing   
* Explore HubSpot Form \+ Landing page solution.   
* Investigate adding enrichment to HubSpot \[Clay?\]

Cost-Benefit / ROI

* Reduces friction and execution time for workflows and manual actions  
* Improves holistic speed-to-lead drivers  
* Expedites top-of-mind communication (Right message, right time)  
* Enables potential for ABM/Sales Enablement efforts  
* Increases visibility into Lifecycle Journey & Performance Metrics  
* \~Enables options for optimized/branded pre/post event touchpoints  
* Allows for enrichment and progressive profiling of 

| METRIC | CURRENT STATE | AUTOMATED STATE |
| :---- | :---- | :---- |
| Data Ingestion Delay | 24-72 Hrs | 15min |
| Salesforce sync time | 10-30 min | \<5min |
| Manual Effort  | 10 per list | \<5min |
| Email Creation \+ Deployment | Variable (\~20min/email) | 10min |

# Events: Updated Process

# **Events: Updated Process**

## **Current Process**

1. User subscribes to the [Rho calendar](https://lu.ma/rhoevents) or registers for a specific event (ex: [Founder Dinner](https://lu.ma/jj98zuxs))  
2. The [Record](https://app.hubspot.com/contacts/39998325/objects/0-1/views/47365033/list?query=faisal) is synced to HubSpot via Zapier (Zap/flow)  
   1. The following fields are created/updated for subscription \<[Zap](https://zapier.com/editor/290254285/published)\>  
      1. Name: \[sample: Faissal Younus\]  
      2. Email: \[sample: faisal@pillar.io\]  
   2. The following fields are created/updated for registration if the associated event contains the form fields AND/OR the user supplies the related values’ information (all fields are currently set as single-line strings) \<[Zap](https://zapier.com/editor/290267013/published/291116223/fields)\>  
      1. First Name \[sample: Faissal\]  
      2. Last Name \[sample: Younus\]  
      3. Email \[sample: [faisal@pillar.io](mailto:faisal@pillar.io)\]  
      4. Phone number \[sample: \+15169969045\]  
      5. Job Title: \[sample: TBD\]   
      6. Luma Event  \[sample: 2025-04-09T02:00:00.000Z | Founder TopGolf \- Rho, BeatVC, BMW iVentures, Shorewind Capital | approved | False | https://lu.ma/jhj5j3lianswer: Pillar\]  
      7. Luma | Event Date \[sample: 04/09/25\]  
      8. Luma | Event Link \[sample: https://lu.ma/jhj5j3li\]  
      9. Luman | Event Name \[sample: Founder TopGolf \- Rho, BeatVC, BMW iVentures, Shorewind Capital\]  
      10. Luma | Event Attendance \[sample: False\]  
      11. Luma | Event Status \[sample: False (true/false)  
      12. **Event Sync | Luma \[sample: 04/09/25 \-  Founder TopGolf \- Rho, BeatVC, BMW iVentures, Shorewind Capital (Event Date \+ Event Name\]**  
3. Records are added to [\[Contact Sync\] New Leads | Luma Events](https://app.hubspot.com/contacts/39998325/objectLists/8084/filters)  
4. Records are held in this list as Salesforce Exclusion\* for Marketing Distribution until one of the following criteria is met:  
   1. Record is associated with Salesforce Campaign  
   2. Record is associated with existing Deal/Owner/Opportunity  
   3. **\*Exclusion criteria is**  **Campaign ID**: Unknown **AND**  **Salesforce Inclusion**: Unknown     
      1. {*This will be updated upon deciding how records will be associated with Salesforce Campaigns*)

# 03\. LIFECYCLE CONTRIBUTORS

03\. LIFECYCLE Contributors  

# Lifecycle Marketing Manager JD

## **Lifecycle Marketing Manager**

**New York, NY (Hybrid)**  
**Department: Growth Marketing**  
**Employment Type: Full-Time**

---

### **About Rho**

Rho is building the financial operating system for the next generation of companies. Our platform brings together banking, corporate cards, AP, AR, expense management, and more into one cohesive system. We help scaling teams move faster, spend smarter, and unlock compounding growth.

We’re backed by top investors including Dragoneer, Inspired Capital, and M13. Our growth team is in execution mode and we’re looking for a top-tier lifecycle marketer to help us turn our funnel into a machine.

---

### **About the Role**

We're looking for a **Lifecycle Marketing Manager** who is obsessive about segmentation, personalization, and moving customers to action. You’ll own the entire lifecycle, from the first sign-up moment to launch, expansion, and retention. You’ll be the architect behind hundreds of micro-targeted flows that work together to convert, activate, and retain customers at scale.

This is not a set-it-and-forget-it email job. You’ll manage a living, breathing system of flows, campaigns, and triggers with surgical precision. You’ll partner across sales, product, and design to build journeys that feel both automated and hand-crafted. You’ll measure everything. You’ll optimize aggressively. And you’ll do it with taste.

---

### **What You’ll Do**

* Build and manage deeply segmented lifecycle programs across signup, onboarding, activation, and retention.  
* Own audience creation across tools like HubSpot, Segment, PostHog, Census, or your weapon of choice.  
* Design high-converting campaigns across email, SMS, in-app, push, and more.  
  Partner with sales and client success to support expansion and re-engagement.  
* Constantly test copy, design, send times, and flow logic to maximize performance.  
* Ship high-quality, high-frequency experiments and scale what works.  
* Maintain a hyper-segmented map of our lifecycle and keep it evolving in real time.  
* Monitor key KPIs and report on lifecycle performance across stages.

### **Who You Are**

* Lifecycle-obsessed. You see every customer touchpoint as an opportunity to drive value  
* High taste. You care deeply about the craft of your copy, CTAs, and flow design.  
* Deeply segmented mindset. You’re not afraid of managing 100+ micro-flows and keeping them all clean.  
* Analytical and creative. You think in data, but you also know what moves people.  
* Tool-native. You’ve probably already connected five platforms to run your ideal program.  
* Fast-moving. You ship, learn, and iterate without waiting for perfect.

### **Bonus Points**

* Experience in high-volume B2B or product-led SaaS environments.  
* Comfortable working in and around data tools like PostHog, Mixpanel, Amplitude, and Looker.  
* Fluency with tools like HubSpot, Customer.io, Census, Zapier, and more.   
* Strong copywriting instincts and a design eye.  
* Familiarity with experiment design and multivariate testing.

# ADDITIONAL CONTEXT

# RevOps Thread

[3:20 PM](https://getrho.slack.com/archives/D08D633409K/p1761247237212409)  
Christopher Cooper Does it make sense to reevaluate the events process? I think someone was brought in to support list uploads, but there still seems to be a lack of strategy that connects the new tests/goals (newsletter follow-ups / sms distributions)  
[3:21 PM](https://getrho.slack.com/archives/D08D633409K/p1761247287951879)  
Anthony Hwang![:rho-sf:][image1] yeah  
[3:23 PM](https://getrho.slack.com/archives/D08D633409K/p1761247412446869)  
Christopher Cooper Noted, I’ll aim to document and organize to meet late next week or thereafter — unless there is more immediate urgency  
[3:25 PM](https://getrho.slack.com/archives/D08D633409K/p1761247550197379)  
Anthony Hwang![:rho-sf:][image2] sounds good  
Saved for later  
[3:33 PM](https://getrho.slack.com/archives/D08D633409K/p1761248028846949)  
Anthony Hwang![:rho-sf:][image3] before our meeting, can we get more context on what we are looking to do with SMS and newsletter followup  
[3:36 PM](https://getrho.slack.com/archives/D08D633409K/p1761248201432799)  
Christopher Cooper That’s the intention of meeting and documenting  
[3:42 PM](https://getrho.slack.com/archives/D08D633409K/p1761248532777759)  
Anthony Hwang![:rho-sf:][image4] ah okay  
[11:55 AM](https://getrho.slack.com/archives/D08D633409K/p1761321349427519)  
Christopher Cooper QQ: Would it be possible to get time on Tommy's calendar before \~mid-Nov to get perspective of his vision for Growth/RevOps/Rho, etc?  
Are you fine with me connecting directly, would he prefer an objective oriented conversation?  
[12:02 PM](https://getrho.slack.com/archives/D08D633409K/p1761321762508409)  
Anthony Hwang![:rho-sf:][image5] Hey do you want to chat about this 1on1 and we can go from there?  
[12:03 PM](https://getrho.slack.com/archives/D08D633409K/p1761321807290179)  
What do you need for me around the role and the responsibilities? Is it the ambiguity with the new growth engineers joining  
[12:11 PM](https://getrho.slack.com/archives/D08D633409K/p1761322270256839)  
Christopher Cooper Sure, can chat 1:1 – though only looking for perspective since I've never actually had a conversation with anyone in leadership (Tommy, Justin, Everett, etc).  
RE: Role and Responsibilities. OKRs/Goals for each department. There is some ambiguity, but it could likely be navigated. My concern centers on what leadership's expectations are – e.g., the Lifecycle seems to be misaligned strategically. For instance, based on Tommy's feedback regarding the candidates, it appears that the role might be better framed as Demand Generation. (edited)   
[12:15 PM](https://getrho.slack.com/archives/D08D633409K/p1761322537796819)  
Anthony Hwang![:rho-sf:][image6] i can chat Monday afternoon. If you could lay this out in a doc that would be great.  
[12:28 PM](https://getrho.slack.com/archives/D08D633409K/p1761323311071599)  
Anthony Hwang![:rho-sf:][image7] I will also be in SF M-F  
[12:30 PM](https://getrho.slack.com/archives/D08D633409K/p1761323428361609)  
but working NY hours  
[12:43 PM](https://getrho.slack.com/archives/D08D633409K/p1761324193710319)  
Christopher Cooper Thanks, noted. Will send documentation ahead of scheduling meeting – assuming it doesn't need to be highly detailed? Any other pertinent info or P0s going into next week?  
[12:44 PM](https://getrho.slack.com/archives/D08D633409K/p1761324296889259)  
Anthony Hwang![:rho-sf:][image8] P0s as well  
[12:45 PM](https://getrho.slack.com/archives/D08D633409K/p1761324311161709)  
be as detailed as you think we need  
[12:45 PM](https://getrho.slack.com/archives/D08D633409K/p1761324319880259)  
at least enough to guide the conversation and understand what the ask should be

# CCooper 90 Day MOps Plan

**Christopher Cooper \- Marketing Operations \- First 90 Day Plan**

[Notes - Christopher / Becca 1:1](https://docs.google.com/document/d/1-z48XGqMisUgQ78pXd0TADJECeXYn9uo39fWLjy5PkA/edit?tab=t.0#heading=h.txqkc26mldtp)

**Onboarding Documents**

* [Sales and Product Training Hub](https://drive.google.com/drive/u/0/folders/1xEMBa5v4sp6Lpfuqz3s5SiUR9P_UgoKa)  
* [Marketing Channel Levels and Attribution](https://docs.google.com/spreadsheets/d/14D4s29A50-HjO7PzEXCs3OaF4JPKTzdd1WMYtc5h46s/edit?gid=1340077062#gid=1340077062)   
* Key JIRA tickets with context  
  * [Documenting existing Hubspot lifecycle](https://rho.atlassian.net/jira/core/projects/REVOPS/board?groupBy=status&selectedIssue=REVOPS-1415&text=lifecycle) and its related automations. Does not have context on the decisions behind each stage but allows the user to explore what currently exists  
* [Hubspot Consultant Audit Work](https://drive.google.com/drive/folders/1k_y324a0ItO7BS_r2xilLcD913pZBaqA)  
* [Onboarding Guide: Greg Mayer (For Chris)](https://docs.google.com/document/d/1SZl73q7hUFVhSJgiFnAOO0oyKea1VtQJli5lmz46zEQ/edit?usp=sharing) \- this gives you a good intro to our industry

**Onboarding / Exploratory Sessions \[PHASE 1: Complete\]**

- [ ] Marketing 101 \- Becca   
      * Channels as they stand today   
      * Key strategies that the team is focusing on \+ how that impacts marketing ops   
      * Key stakeholders (Justin, Drew, Partner team, Luis) and the immediate support they need from MOPs  
      * Current projects \- Website revamp, localized market launch, validating paid demand gen channels   
- [ ] Partner Marketing 101 \- Christine   
- [ ] Corporate Marketing 101 \- Justin  
- [ ] Marketing Ops vs. Revops Delineation \- Anthony \+ Becca  
      * What key tasks / automations live in SFDC vs HS?   
      * What purpose does each platform serve?   
      * Working with Anthony  
      * Revops vs. Marketing goals   
- [ ] Meet Tommy \- CRO  
- [ ] 1:1 Stakeholder Meetings    
      * Luis  
        

**Key Projects**

Data Validation**\[IN PROGRESS\]**

* Data dictionary of all the fields in Hubspot  
* Clean up of what’s used, what’s not 

Lifecycle Stage Tagging **\[ON HOLD//BLOCKER\]**

* Align on lead lifecycle stage order and definitions  
  * Lead / MQL / SQL / SAL / Opportunity / Closed Won ?  
  * Which are manual vs. automatically triggered  
* Figure out how we capture demo requests or contact sales requests  
  * Automatic booking through Cal.com

Becca Qs:

* Can we make sure each lifecycle stage is disparate? You’re either in one stage or another, not both at the same time 

Inbound Channel / Source Tagging \-\> Attribution

Current State

* Document the entire universe of possibilities a marketing contact can enter HubSpot  
  * List uploads  
  * Enriched vs. not   
  * By channels   
* Understand the different ways a channel and source is tagged and set   
  * Hardcoded by form  
  * Dynamic based on UTMs  
* Audit existing workflows and automation processes \- untangle the mess of 300+ workflows   
  * Ie: there are definitely legacy workflows that are incorrectly tagging   
* Rebuild all rules using best practices   
* Decide on form-level or UTM-based attribution \- this is a big topic of conversation  
  * As part of this, we probably need to do a Hubspot-wide form\<\>website audit 

Becca Qs:

* What’s the difference between a channel and lead source? What’s their relationship? 

Marketing and Channel Reporting

* We’ve reached our max of 500 reports \- which ones are used? Which ones can be deleted? \[√\]  
* Stakeholder reporting needs   
  * This is Luis’ key [dashboard](https://app.hubspot.com/reports-dashboard/39998325/view/11727104)  
* Align on what we report out on in Hubspot vs. Looker vs. SFDC

**Working Style / Task Tracking**

* 30-day looking out roadmap of tasks and priorities \- high-level  
* JIRA tickets for the status of tasks and projects and documentation  
* Revops involvement in Chris’ onboarding / project-based work   
  * Problem definition, audit, solution proposal, green light from Anthony and Becca 

**Backlog \- Will keep adding \[IN PROGRESS\]**

* Cleanup of Hubspot forms  
* Cleanup of unused lists  
* Cleanup of existing companies, contacts, and deals  
* New lead list ingestion process  
  * Lists come from Drew (events) and Christine (Partner) 

| Stakeholder | Function | What’s Working | What’s Not |
| :---- | :---- | :---- | :---- |
| Will | Sales |  | Tracking for AE’s is hard. A lot of switching of ownership |
|  |  |  |  |
|  |  |  |  |

# Hubspot Integration Errors

Hubspot Integration Errors

**Custom Code Errors**

1. Error on Disqual\_reason\_require\_for\_disqual\_statu validation rule. Two options here to fix:  
   1. Admins and integration profile can bypass the validation  
   2. We just request the Disqualification Reason in the moment of the Status Update, so Already disqualified Leads won’t block, but if Hubspot disqualify a lead, the Disqualified Reason should be updated from hubspot OR we can create an automation to populate as “Disqualified by Hubspot”  
   3. 

     
      https://app.hubspot.com/integrations-settings/39998325/installed/salesforce/health?archived=false\&bucket=CUSTOM\_CODE\&rollupKey=7f4d46297b666ac6aa0dbd8e5ab2149eaf59a618a3c63c2de71b7650da7c8a2c	![][image9]

   

2. Error when Parsing Application Status Signup field. This is under Dev Analysis. 

   Contact: execution of AfterUpdate caused by: System.AuraException: Error to parse Application Status Signup. Error: Unexpected character ('N' (code 78)): was expecting comma to separate OBJECT entries at \[line:1, column:108\] Class.ApplicationStatusTransformer.buildApplicationStatusByGlobalBusiness: line 45, column 1 Class.ApplicationStatusTransformer.getApplicationStatusByGlobalBusiness: line 21, column 1 Class.OpportunityProcessorMultipleAccounts.processAutomaticOpportunityCreation: line 47, column 1 Class.ContactTriggerHandler.afterUpdate: line 63, column 1 Class.TriggerHandler.run: line 58, column 1 Trigger.Contact: line 2, column 1

   [https://app.hubspot.com/integrations-settings/39998325/installed/salesforce/health?archived=false\&bucket=CUSTOM\_CODE\&rollupKey=7f4d46297b666ac6aa0dbd8e5ab2149eaf59a618a3c63c2de71b7650da7c8a2c](https://app.hubspot.com/integrations-settings/39998325/installed/salesforce/health?archived=false&bucket=CUSTOM_CODE&rollupKey=7f4d46297b666ac6aa0dbd8e5ab2149eaf59a618a3c63c2de71b7650da7c8a2c)

   Resolved   
   ![][image10]

3. Error on [event\_cant\_be\_blank](https://rho.lightning.force.com/lightning/setup/ObjectManager/Opportunity/ValidationRules/03d8X000001l9eKQAQ/view) validation rule. Similar to the first error, we can bypass the Validation rule for Admins and integration users, or the Event should be sent by hubspot on the Opportunity (Deal) update.   
   Please pick the Event this Lead was sourced from.  
   ![][image11]  
   [https://app.hubspot.com/integrations-settings/39998325/installed/salesforce/health?archived=false\&bucket=CUSTOM\_CODE\&rollupKey=1d58125db1f5469e24c5e1fac15690ef7b88e23ef2e5c81af898bad34b65bedf](https://app.hubspot.com/integrations-settings/39998325/installed/salesforce/health?archived=false&bucket=CUSTOM_CODE&rollupKey=1d58125db1f5469e24c5e1fac15690ef7b88e23ef2e5c81af898bad34b65bedf)

4. Same as the first topic, we could create a exception to bypass for this user, configure hubspot to send the field, or create and automation to populate Nurture Reason as “Updated to Nurturing by Hubspot”  
   ![][image12]

**Picklists Errors**  
[https://app.hubspot.com/integrations-settings/39998325/installed/salesforce/health?archived=false\&bucket=PICKLIST](https://app.hubspot.com/integrations-settings/39998325/installed/salesforce/health?archived=false&bucket=PICKLIST)  
HubSpot (Salesforce) Data Reconciliation

* The "easiest" path forward to cleaning up sync errors likely involves methodically and manually fixing issues based on date of "First Detected" and batching in digestible chunks to prevent CPU/API issues.  
* Cleaning up automatically will likely introduce the issues previously observed  
* This can partially, programmatically be executed by manually overriding per Angelo's documentation  
1. [https://docs.google.com/spreadsheets/d/15UCNsH5lzLd0QrqnkvpEH4YsroswyMzsyY7ogmYX0gg/edit?gid=0\#gid=0](https://docs.google.com/spreadsheets/d/15UCNsH5lzLd0QrqnkvpEH4YsroswyMzsyY7ogmYX0gg/edit?gid=0#gid=0)

 


# MARKETING OPERATION MANAGER \- Initial JD

MARKETING OPERATION MANAGER:  
About Us  
From two-person startups to public companies, Rho is the banking platform with everything businesses need to manage cash, control spend, and automate finance busywork. Rho offers corporate cards, banking, treasury, expense management, AP, accounting automation, and more in one integrated platform backed by award-winning support.

About the Role  
Rho is looking for a Marketing Operations Manager to join our lean-but-mighty GTM team and report to the Head of Growth. We’re not just looking for an analyst; we seek a strategic-minded individual with a deep understanding of bleeding-edge marketing tactics and customer management who wants to drive impact across our acquisition and retention funnel. The Marketing Operations Manager will be instrumental in architecting and building a repeatable growth engine to attract startup founders and finance teams from the ground up.

Responsibilities

* Manage Marketing Technology Stack: Oversee the daily operation and integration of key marketing platforms such as HubSpot, Salesforce, and other marketing automation tools to ensure seamless workflows and data accuracy.  
* Campaign Support and Execution: Collaborate with the marketing team to implement and optimize multi-channel campaigns, ensuring accurate audience segmentation, email automation, and performance tracking.  
* CRM Management and Reporting: Maintain clean and organized marketing and sales databases, providing regular analytics and insights to measure campaign ROI, lead quality, and pipeline contribution.  
* Conversion Tracking and Tag Management: Ensure all of our audience behaviors and signals are being tracked accurately and fed into our digital programs that rely on them  
* Cross-Functional Collaboration: Partner with sales, product, and customer success teams to align on lead qualification, sales enablement, and overall customer journey strategies.  
* Process Optimization: Develop and refine marketing operations processes, including lead scoring, nurturing workflows, and funnel optimization to enhance efficiency and effectiveness.

Qualifications

* 3-5 years of experience in a high-velocity environment, preferably at a startup or scaling technology company.  
* Proven track record of success in small, agile teams with a history of supporting GTM stakeholders in achieving revenue targets.  
* Mastery of key tools such as Hubspot, Salesforce, Google Analytics, and other marketing automation tools.  
* Exceptional interpersonal and communication abilities to seamlessly work with sales, product, and customer success teams, aligning strategies across departments for maximum impact.  
* A forward-thinking approach to stay ahead of marketing trends, identifying and deploying new technologies, tools, and best practices to continuously enhance operational efficiency and effectiveness.  
* Advanced ability to analyze marketing performance data, uncover actionable insights, and translate complex data into strategic recommendations that drive measurable outcomes.

Our people are our most valuable asset. The salary range for this role is $119,000 \- $150,000. Base salary may vary depending on relevant experience, skills, geographic location, and business needs. In addition to base pay, Rho offers equity, healthcare benefits and paid time off.  
Diversity is a core value at Rho. We’re passionate about building and sustaining an inclusive and equitable environment for all those involved with our mission, including employees, contractors, candidates, customers and vendors. We believe every member of the Rho community enriches our ability to provide a broad range of ways to understand and engage with the market, identify problems, and drive solutions that align with our mission. We welcome all qualified applications and support each of our Rho’ers with ongoing professional growth opportunities.

# MOps Manager Update

### **Marketing Operations**

Objective:  
Optimize marketing processes and technologies to improve efficiency and effectiveness, ensuring a solid operational backbone for marketing endeavors.

Key Responsibilities:

1. HubSpot Optimization and Campaign Analysis:  
   * Master and enhance existing sales pipelines and lifecycle stages within HubSpot.  
   * Analyze ongoing campaigns to identify improvements and optimize performance.  
2. Campaign and Lifecycle Operations:  
   * Landing Page Creation: Design and implement conversion-optimized landing pages that align with specific campaigns and user segmentation.  
   * Email Campaign Operations: Oversee the creation, execution, and analysis of email marketing strategies, ensuring they are targeted, measurable, and effective.  
     1. **Marketing operations will not be responsible for copy and design. We will expect our cross-functional partners to provide the content to implement**  
3. Pipeline and Segmentation Strategy Development:  
   * Develop and refine strategies for advanced segmentation and pipeline management.  
   * Implement these strategies in HubSpot, setting up automation and ensuring accurate tracking and reporting.  
4. System Optimization and Partner Marketing:  
   * Coordinate closely with partnerships and product teams to integrate marketing strategies.  
   * Regularly review and optimize the marketing tech stack and operational workflows to maintain system efficiency and data integrity.  
5. Account-Based Marketing and Enhanced Reporting:  
   * Initiate and manage targeted marketing strategies focusing on key accounts.  
   * Produce and refine detailed reports that track marketing ROI, campaign effectiveness, and funnel activities.

Timeline of Activities:

* Days 1-30: Audit and initial optimization of HubSpot, beginning of stakeholder meetings.  
* Days 31-60: Integration of advanced campaign strategies and partner collaborations.  
* Days 61-90: Launch of targeted account-based marketing initiatives and major system enhancements.

# GROWTH MARKETING MANAGER \- Initial JD

GROWTH MARKETING MANAGER:

About Us  
From two-person startups to public companies, Rho is the banking platform with everything businesses need to manage cash, control spend, and automate finance busywork. Rho offers corporate cards, banking, treasury, expense management, AP, accounting automation, and more in one integrated platform backed by award-winning support.

About the Role  
Rho is looking for a Growth Marketing Manager to join our lean but mighty GTM team, reporting to the Head of Growth. We're not just looking for a channel manager; we seek a growth generalist with an intrinsic understanding of what fuels startups and the visions that drive them. The Growth Marketing Manager will be an instrumental player in architecting and building a repeatable growth engine to attract startup founders and finance teams from the ground up.

Responsibilities  
Strategic Growth Planning: Develop and execute demand generation strategies tailored to startups and finance teams, focusing on long-term, sustainable growth.  
Full-funnel Campaign Creation and Execution: Design and implement campaigns that resonate with our ICP across the marketing funnel, from building awareness to activation.  
Channel Experimentation: Explore and test various marketing channels to identify the most effective and efficient ways to reach and engage our target audience.  
Data-Driven Optimization: Leverage data and analytics to continuously refine strategies, making data-backed decisions to improve campaign performance, lead quality, speed-to-activation, and overall channel ROI.  
Sales Enablement: Partner with the Sales team to ensure a seamless flow of quality leads that contribute directly to sales pipeline and revenue goals.  
Marketing technology innovation: Continually scout cutting-edge demand generation tactics and tools and integrate these to keep Rho at the forefront of our market segment.  
Cross-Functional Collaboration: Work closely with content, community, revenue operations, and product teams to increase awareness, engagement and resonance with our campaigns and offerings.

Qualifications

* 3-5 years of experience in demand generation or growth marketing, preferably in startup or fintech environments  
* Proven track record of success in small, agile GTM teams with a history of executing on acquisition tactics from 0 to 1  
* Strong critical thinking skills and growth mindset  
* Ability to quickly adapt to new tools and technologies  
* Strong background in CRM and marketing automation tools, with HubSpot and Salesforce knowledge considered a significant advantage.  
* Excellent communication and collaboration skills  
* Analytical mindset with the ability to derive actionable insights from data

What We're Looking For

* We value critical thinking and growth instincts over specific channel expertise. The ideal candidate will:  
* Be able to execute flawlessly on acquisition tactics from start to finish  
* Juggle multiple channels and initiatives with a strong understanding of how it all comes together  
* Use quantitative and qualitative data to analyze the efficacy and impact of your work  
* Always be testing and iterating to improve and build upon their existing work  
* Put themselves in the shoes of the customer and understand how to create campaigns that resonate with their needs  
* It takes a distinct personality to thrive at a fast-paced startup. Some traits we’re looking for are:  
* Curiosity, creativity and a bias towards challenging the status quo  
* Persistence and resilience, unfazed by large challenges and failures  
* Ability to form an opinion, make decisions and execute quickly in ambiguity  
* Low ego, and high impact-driving  
* Passion for the startup or fintech industry is a plus  
* A background in growth, marketing, consulting, business operations, or any other quantitative field is encouraged to apply

Our people are our most valuable asset. The salary range for this role is $123,000 \- $142,000. Base salary may vary depending on relevant experience, skills, geographic location, and business needs. In addition to base pay, Rho offers equity, healthcare benefits and paid time off.  
Diversity is a core value at Rho. We’re passionate about building and sustaining an inclusive and equitable environment for all those involved with our mission, including employees, contractors, candidates, customers and vendors. We believe every member of the Rho community enriches our ability to provide a broad range of ways to understand and engage with the market, identify problems, and drive solutions that align with our mission. We welcome all qualified applications and support each of our Rho’ers with ongoing professional growth opportunities.

# Growth Manager Update

### **Growth Manager**

Objective:  
Drive sustainable business growth by developing and implementing innovative growth strategies that attract and engage key customer segments.

Key Responsibilities:

1. Strategic Growth Planning:  
   * Develop comprehensive strategies to generate demand, particularly among startups and finance teams, ensuring alignment with long-term business objectives.  
2. Full-Funnel Campaign Management:  
   * Conceptualize and execute multi-channel marketing campaigns that guide potential customers through each stage of the funnel, from awareness to conversion.  
3. Channel Experimentation and Optimization:  
   * Test and analyze various marketing channels to uncover the most effective methods for reaching and engaging target audiences.  
   * Use insights from data to continually refine and optimize growth strategies.  
4. Sales Enablement and Alignment:  
   * Work closely with the Sales team to ensure a seamless transition of leads through the sales pipeline, enhancing lead quality and conversion rates.  
5. Cross-Functional Collaboration and Innovation:  
   * Collaborate with teams across the organization, including Product, Content, and Revenue Operations, to ensure coherent and synchronized growth efforts.  
   * Stay ahead of market trends by integrating the latest growth tactics and technological innovations.

Qualifications & Traits for Success:

* Demonstrated experience in growth marketing with a strong track record in a startup or fintech environment.  
* Proficiency in CRM and marketing automation tools, e.g., HubSpot and Salesforce.  
* An analytical and adaptable mindset, capable of managing multiple initiatives and pivoting strategies based on real-time data.

# MOps / Growth

### **Marketing Operations**

Objective:  
Optimize marketing processes and technologies to improve efficiency and effectiveness, ensuring a solid operational backbone for marketing endeavors.

Key Responsibilities:

1. HubSpot Optimization and Campaign Analysis:  
   * Master and enhance existing sales pipelines and lifecycle stages within HubSpot.  
   * Analyze ongoing campaigns to identify improvements and optimize performance.  
2. Campaign and Lifecycle Operations:  
   * Landing Page Creation: Design and implement conversion-optimized landing pages that align with specific campaigns and user segmentation.  
   * Email Campaign Operations: Oversee the creation, execution, and analysis of email marketing strategies, ensuring they are targeted, measurable, and effective.  
     1. **Marketing operations will not be responsible for copy and design. We will expect our cross-functional partners to provide the content to implement**  
3. Pipeline and Segmentation Strategy Development:  
   * Develop and refine strategies for advanced segmentation and pipeline management.  
   * Implement these strategies in HubSpot, setting up automation and ensuring accurate tracking and reporting.  
4. System Optimization and Partner Marketing:  
   * Coordinate closely with partnerships and product teams to integrate marketing strategies.  
   * Regularly review and optimize the marketing tech stack and operational workflows to maintain system efficiency and data integrity.  
5. Account-Based Marketing and Enhanced Reporting:  
   * Initiate and manage targeted marketing strategies focusing on key accounts.  
   * Produce and refine detailed reports that track marketing ROI, campaign effectiveness, and funnel activities.

Timeline of Activities:

* Days 1-30: Audit and initial optimization of HubSpot, beginning of stakeholder meetings.  
* Days 31-60: Integration of advanced campaign strategies and partner collaborations.  
* Days 61-90: Launch of targeted account-based marketing initiatives and major system enhancements.

### **Growth Manager**

Objective:  
Drive sustainable business growth by developing and implementing innovative growth strategies that attract and engage key customer segments.

Key Responsibilities:

1. Strategic Growth Planning:  
   * Develop comprehensive strategies to generate demand, particularly among startups and finance teams, ensuring alignment with long-term business objectives.  
2. Full-Funnel Campaign Management:  
   * Conceptualize and execute multi-channel marketing campaigns that guide potential customers through each stage of the funnel, from awareness to conversion.  
3. Channel Experimentation and Optimization:  
   * Test and analyze various marketing channels to uncover the most effective methods for reaching and engaging target audiences.  
   * Use insights from data to continually refine and optimize growth strategies.  
4. Sales Enablement and Alignment:  
   * Work closely with the Sales team to ensure a seamless transition of leads through the sales pipeline, enhancing lead quality and conversion rates.  
5. Cross-Functional Collaboration and Innovation:  
   * Collaborate with teams across the organization, including Product, Content, and Revenue Operations, to ensure coherent and synchronized growth efforts.  
   * Stay ahead of market trends by integrating the latest growth tactics and technological innovations.

Qualifications & Traits for Success:

* Demonstrated experience in growth marketing with a strong track record in a startup or fintech environment.  
* Proficiency in CRM and marketing automation tools, e.g., HubSpot and Salesforce.  
* An analytical and adaptable mindset, capable of managing multiple initiatives and pivoting strategies based on real-time data.

# Copy of Funnel Optimization Kickoff

8/18 Agenda

* Email as unique key — or how to solve the multiple app submission problem  
* Service design by start path   
  * Direct / submitted   
  * Direct / incomplete   
  * Lead form / submitted   
  * Lead form / incomplete   
* Lead segmentation   
  * Quality proxy / channel / both?   
* Self-serve vs. sales routing logic  
* Associate AE design / outreach / call sequences   
  * AAE → AE design   
* Email automation (sales assisted and self-serve)   
* Mechanics  
  * Speed to lead  
    * Signup forms to SFDC v Hubs   
* Spara / site chat   
* Enrichment motion 

CC   
	INTEGRATED SYSTEM

* Customer Journey Mapping   
* “Server-side” tagging (versus Client side / UTM)  
  * Data Handoff  
* ABM Deployment  
* Events Lead Generation   
* Campaign Activity (Multiple touchpoints & tracking, etc)  
  * Examples:   
    * Sales Outbound (Direct Outreach)  
    * Summer off Rho (Referral/Demand Generation)  
    * Paid Media  
    * Lifecycle Marketing  
    * Events  
    * Terrestrial/OOH  
    * Stripe 


  SALES PIPELINE

* Lead Quality Validation Gaps  
* Lead scoring  
* Enrichment Process & Values  
* ETL/Sync Delays   
  * **What is the current process?**  
* Property/Field Taxonomy

	MARKETING FUNNEL

* Control Grouping & Data Validation  
* Targeting & Testing Processes  
* Data Quality and Source(s) of Truth  
  * Segment / Snowflake  
* **Case Study:** Summer of Rho // Referral Campaigns  
* Marketing Campaign Associations  
  * What constitutes a \[P0\] campaign from Rho perspective  
    

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA/klEQVR4Xp2QMQuCQBTHXROkJTKIlgORhBY/R30ev4euQTW3NRY22dCWOIVLs9wQzeJ17+jpnWhaD/7ce3//97s7NY3XxbLOD9dl0PcpyB6Wy8o4EcLAXC8WldlSW9MMIctXWpohIc+P2XkLyHyyRWlcbXuPT9iY5kXZIRUegFkxB0GgAOSgXODx7Ah6zPq+v2oEgMc/HreTyXQ3Hg/Q+xmAM3qNABhujiN+zD8S9PoNukrJ6rp+nxnGaz4cMuj7SM4CAAYhSinLskz0aZqW/jcpgCRJxAoFsHq4SY2AoigUgOd5AorwTgBIBkRRxOI47g+oPwEAuDHP83bAP3oDAYBHLrNtsuYAAAAASUVORK5CYII=>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA/klEQVR4Xp2QMQuCQBTHXROkJTKIlgORhBY/R30ev4euQTW3NRY22dCWOIVLs9wQzeJ17+jpnWhaD/7ce3//97s7NY3XxbLOD9dl0PcpyB6Wy8o4EcLAXC8WldlSW9MMIctXWpohIc+P2XkLyHyyRWlcbXuPT9iY5kXZIRUegFkxB0GgAOSgXODx7Ah6zPq+v2oEgMc/HreTyXQ3Hg/Q+xmAM3qNABhujiN+zD8S9PoNukrJ6rp+nxnGaz4cMuj7SM4CAAYhSinLskz0aZqW/jcpgCRJxAoFsHq4SY2AoigUgOd5AorwTgBIBkRRxOI47g+oPwEAuDHP83bAP3oDAYBHLrNtsuYAAAAASUVORK5CYII=>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA/klEQVR4Xp2QMQuCQBTHXROkJTKIlgORhBY/R30ev4euQTW3NRY22dCWOIVLs9wQzeJ17+jpnWhaD/7ce3//97s7NY3XxbLOD9dl0PcpyB6Wy8o4EcLAXC8WldlSW9MMIctXWpohIc+P2XkLyHyyRWlcbXuPT9iY5kXZIRUegFkxB0GgAOSgXODx7Ah6zPq+v2oEgMc/HreTyXQ3Hg/Q+xmAM3qNABhujiN+zD8S9PoNukrJ6rp+nxnGaz4cMuj7SM4CAAYhSinLskz0aZqW/jcpgCRJxAoFsHq4SY2AoigUgOd5AorwTgBIBkRRxOI47g+oPwEAuDHP83bAP3oDAYBHLrNtsuYAAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA/klEQVR4Xp2QMQuCQBTHXROkJTKIlgORhBY/R30ev4euQTW3NRY22dCWOIVLs9wQzeJ17+jpnWhaD/7ce3//97s7NY3XxbLOD9dl0PcpyB6Wy8o4EcLAXC8WldlSW9MMIctXWpohIc+P2XkLyHyyRWlcbXuPT9iY5kXZIRUegFkxB0GgAOSgXODx7Ah6zPq+v2oEgMc/HreTyXQ3Hg/Q+xmAM3qNABhujiN+zD8S9PoNukrJ6rp+nxnGaz4cMuj7SM4CAAYhSinLskz0aZqW/jcpgCRJxAoFsHq4SY2AoigUgOd5AorwTgBIBkRRxOI47g+oPwEAuDHP83bAP3oDAYBHLrNtsuYAAAAASUVORK5CYII=>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA/klEQVR4Xp2QMQuCQBTHXROkJTKIlgORhBY/R30ev4euQTW3NRY22dCWOIVLs9wQzeJ17+jpnWhaD/7ce3//97s7NY3XxbLOD9dl0PcpyB6Wy8o4EcLAXC8WldlSW9MMIctXWpohIc+P2XkLyHyyRWlcbXuPT9iY5kXZIRUegFkxB0GgAOSgXODx7Ah6zPq+v2oEgMc/HreTyXQ3Hg/Q+xmAM3qNABhujiN+zD8S9PoNukrJ6rp+nxnGaz4cMuj7SM4CAAYhSinLskz0aZqW/jcpgCRJxAoFsHq4SY2AoigUgOd5AorwTgBIBkRRxOI47g+oPwEAuDHP83bAP3oDAYBHLrNtsuYAAAAASUVORK5CYII=>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA/klEQVR4Xp2QMQuCQBTHXROkJTKIlgORhBY/R30ev4euQTW3NRY22dCWOIVLs9wQzeJ17+jpnWhaD/7ce3//97s7NY3XxbLOD9dl0PcpyB6Wy8o4EcLAXC8WldlSW9MMIctXWpohIc+P2XkLyHyyRWlcbXuPT9iY5kXZIRUegFkxB0GgAOSgXODx7Ah6zPq+v2oEgMc/HreTyXQ3Hg/Q+xmAM3qNABhujiN+zD8S9PoNukrJ6rp+nxnGaz4cMuj7SM4CAAYhSinLskz0aZqW/jcpgCRJxAoFsHq4SY2AoigUgOd5AorwTgBIBkRRxOI47g+oPwEAuDHP83bAP3oDAYBHLrNtsuYAAAAASUVORK5CYII=>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA/klEQVR4Xp2QMQuCQBTHXROkJTKIlgORhBY/R30ev4euQTW3NRY22dCWOIVLs9wQzeJ17+jpnWhaD/7ce3//97s7NY3XxbLOD9dl0PcpyB6Wy8o4EcLAXC8WldlSW9MMIctXWpohIc+P2XkLyHyyRWlcbXuPT9iY5kXZIRUegFkxB0GgAOSgXODx7Ah6zPq+v2oEgMc/HreTyXQ3Hg/Q+xmAM3qNABhujiN+zD8S9PoNukrJ6rp+nxnGaz4cMuj7SM4CAAYhSinLskz0aZqW/jcpgCRJxAoFsHq4SY2AoigUgOd5AorwTgBIBkRRxOI47g+oPwEAuDHP83bAP3oDAYBHLrNtsuYAAAAASUVORK5CYII=>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA/klEQVR4Xp2QMQuCQBTHXROkJTKIlgORhBY/R30ev4euQTW3NRY22dCWOIVLs9wQzeJ17+jpnWhaD/7ce3//97s7NY3XxbLOD9dl0PcpyB6Wy8o4EcLAXC8WldlSW9MMIctXWpohIc+P2XkLyHyyRWlcbXuPT9iY5kXZIRUegFkxB0GgAOSgXODx7Ah6zPq+v2oEgMc/HreTyXQ3Hg/Q+xmAM3qNABhujiN+zD8S9PoNukrJ6rp+nxnGaz4cMuj7SM4CAAYhSinLskz0aZqW/jcpgCRJxAoFsHq4SY2AoigUgOd5AorwTgBIBkRRxOI47g+oPwEAuDHP83bAP3oDAYBHLrNtsuYAAAAASUVORK5CYII=>

[image9]: <data:image/png;base64,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>

[image10]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnAAAAAwCAYAAACR1EfmAAAfNklEQVR4Xu2d+XMbV7bf/e8lsbUvlj3zkt+TqqQqP+S9eJ6fxzO2PLbHlmXL1kZtXEQRJMF9BUkABEAQ+77v+0IQBEmJfvNS9c253SAJdAMkKFESKd1b9SkJ6Nt9t3PO/Z7uhvTBh2fP46j8l0bOdEjTeRfa8mEj5y624BI+Oi/nzIXLTZy9eKWJc5eu7nP5Ks4LfIzzV0QuCFwTuHh1l08ELn28y6cCl69J+YPAlU/ac1XKp4cgrf/Jp3tcYVzb5ZM9Ln+8y7V9aByXrn68D43z4pWre1y4zLgicukKzgtcFrl4GecELuHcBZGzFy6KnBc5s8cFfHSuBS3s58MzIjIb2eMc/nMjH70M5/c50xnyfrwMF9ryYadI/eBNce4YkV57jxb20EBnseVcWzq3m7Nt+U+NfHgaOLfPR83Ix90OuT8c6hfS9Torj+ct43ojTXazH+c/knK+M86wvaAdF/Y5eyCXj5eLzYgxtR1XDubS4YgxvB1XO0R63uE09UM2Lgl7+8kBNO0vLTgnsm8nrfafZmT2d4phPveBNIB2gtxxj0Inzn1R5KXFG6NRvDFaiLe6gGsUbxf2xNvRBJxUsLUVb1Kh1g7peW9UwDHaCThGKwHHnKm1A0ntR0C6GbTkXPOGfOimXN+IDtiM2iFv+2VoEGyH2vgJoGnzfM1I2xZoYRcS9uKGbK53kYu4zsWcXLy1FHEnXsidQgEntY9XFG8ysSblwtsXbzIR05K6UGuHVCi1QCqsmpEKNSnS+p1x/OKNrVsL0ba313Qg3hhn2wk3eaw5DLm9HwdyXzmc/fNfSsC9/GAOceo9pMKt7tgtxVuzgNt3mOMRcPviTRRwl2UCjkQaF3B1p2rhQMLmLbcfwYakG8IBNG0qjXfXWiGt3+J6x8IBtt2Znb8lZJvnG0TaFwG5bbSNNdI1EJCLt86FnFy8tRVxJ1bInXYBJ4nzUiRiTYpMrEkR9ojDxFsL8dUJe/vN4ciEjIy6SDsMqWBqgVRgNSMVbW9QvDFkcy/hPKOFaGvaa15FwMljTCfI7f04kfuMHOk5ryDgjj4g6SS2Qy7c9pz6EPF26N03ZqTHLN4Ouvv2UsLtVAg4RmsB11LE7a2txH6kG0IHSDeXdkjPO3Yktt0OuX2/BYR1kGyKx0KLte6A9oJOHmOk7M25dD1aCDcp766IO0UCTrr+51rE+V0kQq0VMrEmRdgj2gk4iRjrFGGP6RyZgGlJXZx1ilQ4tUAqtJp5S+LtIptD6Tq8nIDrJA7JYmGLmHIYcjt/Xcj9Zh9p3fOCD76SgOt8cNJJbIdcuO07dau7b83i7dB33w4ScFcbBZz00Wl7AXfQ3bd3SsDVRdzBAk4UcVInaifgBPuRbgqnAYltt0Nu36/KxZZ81ArpZvhaabHmHdBayMltpG28ka5LC9Em5d0UcadVwLWL9XUkYq0VMsHWkXhrEGOdwoTHSyIVMHIahNlRkAqoFkgFVzMnULwxpPuKlHPvqoBjyH1HXuf8ng9+MD07h5PMjMB8a+aamZUyz1AdyNz8gohKzryUBSmLB6I6Vhb2kPejjrS/e6j2EcYsZX4Pcc7qSOeziTnM7q1PZ+yv62wzMyeZuX2axvB2kc7tu4B0jCKznSFbt9fM9D5TJ4mZZmT9Pk6kayBbu6MhtYfDabEntNgXWu4N7wrSmP02kPbpVRDWULrOR0dqW/tIbVaC1MbfOHMtkNbZ5wPwwgsvvPDCCy+88HKqChdwvPDCCy+88MILL6esNAm4ysYWssV1DofD4XA4HM4JpknAbf7+D6w9/53D4XA4HA6Hc4LhAo7D4XA4HA7nlMEFHIfD4XA4HM4pgws4DofD4XA4nFMGF3AcDofD4XA4pwwu4DgcDofD4XBOGVzAcTgcDofD4ZwyuIDjcDgcDofDOWVwAcfhcDjvI9s7JwNpvzgcTkccn4DbIkfcetEe7qgcDodzMmDxeuP5yaD2XN4/DodzKMcj4Jg4Y04odcwmJ2VCjos4DofDeetsvpDH6LeJtH8cDudQXl3AMfHWaTBgIk56/jtIvrqF/BGzynx1G4X3ZH447w/lzW2kK1uy749KefsF+UgNpQ6SwPz6JnLVV2/zIDKVGnKnWXh0GrPfFNL+cTicQzkeAceEh9QhW3FEUfPGobHkKlW4whmBeGmzow1DSjBeRLRQk33fnh2EMyUkyq930+GcTEq1Grx+Lx70jWF00YbStrxOK4qbz1Fkrye0OCaD6hXfWIKwQ21to0x/TyYjmNAHkJPVORqBoA+jo2MwBktN35c3a1hc9cKb3ax/t4WnvUMYmFlFgcQj64f0Wk3nb23C5IkjURcRmUwMZldAVq+ZHaxa3XBG8y2PsTZPfDJ2gIDLF9cQS2QRThSQKW7Ijr8WpP17jZQ2tzBt9EITzO19Z/IGMWOLir63/Rxqmw8Dy0748zWZP8ZzeSxZPXim90IX2r/GYRQ2NpHf6DzGl7doLTa2qf2j70FvG6PNDU+6KsQA9jmTTcOZWJfVO4h8uQiDXotHyiWsBvNYWdHhUfcg7hETOi+iFfm8LC7M4d7jIfhz4v5rs5vQ/XQAansM6eoLpPMZLC0tondyFa7kOvWvhoF+pXBNxbwFnsxuHGExx4vh4RFMr4aQrIr+zGxHMTgk1B9SmeGlMYr1XyAaTyBckq9vNBqAMVBAqX6+N0jXq+za/AsEqZ1gUT6WTuACrgE2ucF4DskyOdp6DfZACqHCBjnsGoIUzBL0fYECXyxbRjBZQLrCNojniJD48sfzSLHPtGk4w2n4kiXaXNl1d5CvbCCztonsWhWBeAGhTIWc8wWJxQ0E6LqhVAnusHi+tE+cd50X6O99hsdKHRKFIqwOFwWFCjKlIlTLRsxpzYhSUMgUcjA6A1hescIWJhvNZfDdT3fw430FAukynB4vFlfs0Nv8sPqSZHNrcPu8mF+2QO+MYmFaib9++xsWDXYsGd3INQiMLLW1sGyCSm9HNFeCKxAT7DxdLMAVpMBXLMLudgnHLaEssuUyffZBpbPC6InBHYzDHS2jXFuDyxOG1W3EzW9/xbDWQXadgCtREXwrnIhjTmOkfjqR3XiBeDIKvZX6rV2lMa8LAU7o0/YLWGgeVFojVtwxxEoVdD94jB9+60F8rSGGUL1AwIOvrt/F/QEdiutVeFw6fHVzBHpPCPdv36Ix/wwv+WqYgqtKa4LaHEC2UoEvHIbGYIHB7sKTIS1cRTHgRxwa9D0bRyyZhtXlx5LBTOO2IUP9LVSr0BqtUK868HRwBhraFPyhINR6Ewy0NhaaixXzIr775hf8+ese8vM8fHScrYHBFWvqd7pQoDlfFa6dLG8glkpgnvq3bPPA4UsjnBfjjdxejokDBJzfG6C58SAQSWDF5EGytIEkGwvFtSjFrlS6gEA4iUSmTJSQKlRRqtSQyq4hmcojFMsISWyW+h9L5uALJpDIVWh9tmRt7SHt32uiWNuAzubA//h5FLfVPrD4zHzri0czeKDxkd0/hy8axvdKA0aMDnw/vIJlsu2iIOJ2kMqk8NmDKdycNENJvvlozkxxu4ZQOgOlzokZe5R8axvRbA5adxgLFg9WokXES2V83z2Bz7tVlGxU6HgeWrsXM9YglhwhxCn2Z8oVjOudUK5QQkLzxuzqn58sQmmJwUNrMbPqwhKzjddpF8fE369fx1e3J0m4kD2E/eh9cBvDhiQlXFvQm6xCXNPTuJ3hGOwkpPO0V2aLOTh94bpg3sHC0jJm9B5YTAb09I8jW6X9ORzC6NgULNHSnjgU2UEs7MDUShSxQh6/PhjDkjOCp+M6EpJrJMQm8WzKhLkFNWYMfqwsTqCLhN6c3oquYQNc0TQyVSaWd6+3jrt3FdD48pgZUeDekyHoaK0ChS3y1RhmpqaxYEsiW/sduXIJeoMWN3+4BWO8WaQmE370K8bxkPpvCJZRWF/H7JgCXWNmhIqUPK7o8f3Xf4U2/HIJHxdwDRSq6+S8aeQ3d1CqbcEZokCUZuKKglAsBztlW+HcOjzRnCDYouSIcQpgbvrsjWbgjJCjUsbqjaXJ4ZKk+Ok6GzXaPLIIJYvw0zW8kQzs/jSSlOUGKND5STC6/Em4YiUyhpdT4ZzTTBVdD0ZgCFWEzyUS9oW1AnRaDQamlqCcmsekxg2r3YZ7AypMzGvxdMIAszeML7+5ies3nwhC4JliDGOzi3jcTcGhbw6rRj36+scwOq2CYlKPCWU//vSXG5hYWMHUkkUQJEJ76xR8dMsYnlFjeHwC8wYfFtVaEmpJGI0GjM4YoFteRq9iUjj+RLEAvdGI/qFpuvYiRhdMGJtUY1wdQqkcw6hiGlqLBt999SN6Zoyw2B0Yp6AaiUUwOT2HkVk1FCPTMAVyMOnn0T2qxcTMApTzNsTWRfvPlQvoU0xhaEqN7oFZzNHG9etPv+LLb29TQrWf5LA7l6vUR+WgEncfKpFbK1FAnMX/vd6DaYMNN2/8iD99+T20K0aMj1N/Z5bQS3Ni9kXo8zgUE4tQm2wtBZzZqMOdu33UXy0UwxNQO1MkTl0YnNJiVm3AT3cHMG8NY4ja7hmex7OhYdzpUpLonsJf//x3/Mvn92kD0mFgeAoj0/N4/HQaqU1xfPkKra9Oi+FpDR1bgNHqwuTULJQzGignJ9GtXIHB64EzVpZsUsfIIQJObw4hSyLSavMKMcpJwtxFNmf1RGBzRejPOMIUv9z02eHPIJ2hOt4E7FTfRBvnqj0ITzgr1HX6YhTrcrSum7K29pD27zXBHsXHi3l80TWFOyTgypsbMDkc+O+/juDzvgWsxksIJOP4+7AO/VoLfpm0wpSq1pOLTdicDlxXmqCLrlFCvo5QrgxvOIKeKQ1ujajxg2IRK5EsCXY3vh3U4O7EMn6edmDZH8Pnd5X433fHsegMY5wSmR/Il+6MqXG9ZwaWRBF6uxM/KTW4ParGFAnnIfLJ/3l3Cg/ULvROqHFjZBk9FAtWk2KsOMk8uHsb3/42BKXKBvXSEn2+j1FjAnESP72U/DC/utmlwOC8AYNjy/DmNuGyLGNIObOXyEWzRUpuajCRL/YOTCGVS1EcU+Dzv96EtYVvZCnhTFYofpZzuNM7iwWTE3PGoLCf65bU6B/RIJLOI17egnpmDPe7SeStmPH1LQUUo3PQuRO0B+8KqRLu3R+HI7MNw+I47nX1QGVwk/iuQTU7ji//8iOWXClBwK2uGIR42N0zBJNEwFlWV9BLdjE4OIIxjV8QcEuqady4P0liM4yRsVn8evMnLuBeHVLwqSzMjjBs7gh0ljBljWXYPVGYKVhZKDhZ/Fnh7pnZHYOVRBi7W+cgcScYEgUGqydFGQWJvEKNrpUnIZeDO5SGL7FG2XwYBkeUsvQ4TG7CFYcvzRabZXV54RypQXLeB9bQ9XAc9vS+MHEbZ3Hv4bO6Peyg96mSBMAo5l3i48NnYwtY9KxhanYBKlMQw0MTGF30kQ1uw0FCT6FcwMM+JYYMaaF+eWsHiZAD/cNzsvZZW9/97Ts8oPoP+iiQzVopw6/gi8++xjcPpmFLbQjH//XHPuH4z789wSPFPDS2uNC3Mvn/s2cT6Jtwo1gMordrAIntIiaezSBCxwqZEHpmHVhamMcA9Zu1WShm8XRqFbPTI7AkxZigGB6HLf1CHIPVAg0JJnbXw2JYwuP+WajmZ/FsVNXUd7/LgFs3buDWwyf4ty/+htVola4dxP1+I/VhB6uaSZqLcQx29+Czf/tZmJN7D55gRGXCoHKCMu4XKNfKgoBz1l95CNlI5D0bo4CvRe+Qpj5/Fdzv6sadvlHEBZH5AkoK+Ivs8c4AtUUbRDITwAiJtex2BmPPJkk8G3H7dhf+5Zsuod1ffuuCPSMGaZ9Ng2eDY3vruzBLbdLmzI6Vajmqr8ainYRDsPD6YsIhAo7dgTNbvdDbwvB4o9AZfXAHU/BQUsvusDncIbiCWaSyFAMdfhJBUfqcg83qg49EkMvrxwqJQA8ltcX1bUoUtlCubsva2kPav9dKDd88nhYEXCyRxEPyi6XwGnyhCP6iMOLpkh0/jpswYfLhmwEtZrw5FIRXaTagt1hwY8oBZ25LsH2WcPWNL+CzPi2KW9vCHfSfJi1QqC14rA+RACnjX3sWoLDE0U31fhwzY8XiwPf98+hdiVBiH8eDkXlMGRy4PTAND3tku/UcRVqfaCiIr5VmEmzrlOBo8OVjEp3zThjjay3GdLIYIv9S20OYHleid8pMNmLFmC5MyaIW9rrIGaPkZXjBhumpGRKrq5R8DmJQE9m/Du2pqVQYd7qnYSBfKG7UkC5XkSxV0NUzhgmr/BUGn8+O3r4h+PMb8PtdJOKitHa/w0gJcd/QEvnyFvw+B625Du70hvAkLEu2md/YxN0nYxgxsLjGrrWDpSWKo73D+NOfb+HemH3v+8xaVeiHcngSQ6Oz+F//5zr+cvMxrn/zA/52Z5zGnajXfYGuu134899u4yuWbN8aQK6yDo16ETaPB0+7H1H8jlKcmuAC7lVh78IEoinYAiwo5UnERZHIk/DyJBDJVRDJlBHLi49CY9kC7N4YnIEU7JRlCi9YV6rCHTp2py6xtoVMrggjiTRPvCi8xO3wxuGOFYXrhDNrMLsS8Gc2UKhuwBdO0Dkvt4Cc085zPHr0FCNav2BH7DGKy6LGw8f9wl2yUm0Dj/rGMDA6I4g2do5UwI2NTEBBQbJUq0KvoXN7JtFDQaxnxo3SJiUT2RLidQHH3qvJVChw1R8VhN3L+PXWHajNHhhsTrLhLIKxCG7+8hi/UYaqsseE4z88mheOq1edGBiewZTORwF1E8nCGp5R5vlwYAXppBP3bz2RCbjeeRf0y2o8HZ4VNjz2XtwgZeaLc6OiaKN+MKElCrjn8HqdmF4JIkNxRbMwJ9z1ayXgFqZG8TP1UzmzhKeKAUzQBpHKywXczNAgvvn+EXR2L5ZXbeTTPtpgJgUBt7ZVw/0nVIc9DqEYpZ4awf3eKRJwKtzuGqdNeQe5cgpd3SPoJZHpy2/RGLbQTWJu3mii71XCpuv3GvH4oaJJwD151EdBexgGu4cyfRtSG+IduLDPDMXgqPAYu7ixQRm9Co9IpJbYo9VsCL/1LEFtM0PrEkWs3GaOgUMEnMESoXXKYNUWgD+YhIUS20gyj1i6KDwWZY9QzRTfkoV1xKIxsosQAsm1JgFntkdgpWSVvTYSTZWQX3v7j1CZ6EqXS/iiawI/TFoRiCUo+VjAkDUOrdWNb0fMGFi04rbKBSON+/rTRYzaxacyzFeDkRD+9ESFXn2ABDadQ/vE4KwGnz2eJ2GSxqTagLsqB0Z1VnQbwhT710jAqQQB10MC7saYhfYWL248m8OtOQd0JPh+7JuEyuLDQ+UcVN4UXIkMwsUtEnAhfE39MSWrWHX7Mawx4Z+75tBv2hUZJxfmX/og7ZmxMBwkOFn8GTNEYFo1QOfNCu/u9g6Mon/GDPPqCvnvCB70q2BN7z8eTqZjmJ6guak/qnT4wvBmqoLAvU/+qDSmBaG7l+RQ8qdUjqBHqRbeG4xTnBldciJR2cb05Cx6R/UIR0MYHRmHJcIewe4gWyohWqwJr3jc6xkn0Z7caz+3VoE36MUvFAc0/jJSZbb/l+GlPT1P7Y6RSB0eXyKRN0iCUoG/f38TP1DSu0zJJzu/VNvEg0f9eKiYpfEp8fM9BRKlNUHAhYrsvWcfIrTOdt0kF3CvSrFaQ5y9w8GCDAukpPIzpMxTxQr8iQKCLABt0GfasILJoiDC8lUm5srie2z0uVDbRqpUFYI+M4goCT7R8X9HIrdG9fIIUxspEoHs7h57DMt+vBBKl2QvynLeH2LpJPQkBpTTaowtrJINki2m4hib1WKU8KQqiFMdX058QdbijQh/dwUj8JItJrJpOn8V44srwrslWktA+M5A343N6ygLDSBXyMLiDqNQYXeD/fuPCijoRRMxjM8tC3U9sQzsnoDwPgjr16rDh3A8Cq1uRTi+aAlS31LQUX/H5w3QWIOIxEJYWNJiYWUVM4sm5J/X4HKGkKHrlyolCpZFFNZJmHq9NB4NxhdWECc/C0cCiK2J/mH17P+9vLUNjZ7am9NCZfTAn2aBNCSMu3HejHYfHAnxJeLy5ibMnihiuSwMziT14XdE6Prsuqxtp9tF/V/G5KIZ8WKJMuBA/a7K7whSUF/U6sX2Vn3w56ok4OZx+94Apha0wrgjFHBT+TwmVcuYWDRgyeSFL7UGi9WKiXkNVCsWqI1uFJ9X4XQGYKY+sHerVs0Wod1pnWvv0RAbXyTO5lxLc2GgBLEMj4/mhurN6leht8dp0yEx5AlSTHlNMfMAAVck+8uVa/T3bRRo0ypSApqnuJag2MV+1JArriNJcS9PcaxcfY58PgdnMEfzvI18vX6BrsGO79Zlj09ZXWlbe0j795pgd1z88QwUtB4KvZsE+TolTWWMrrgxvEIbKnv/mfaCGbMXwwY3VinpTtdfNxDZgTUQxbjBif5lF2adcUqI1mEPRqFYdpCo8CO5XkMgReI3Xqb128IME7JkKyZfBBofiQ7a2L3xFKaNZJMmHybI5sLkD/F8AcN0jUGdG0Gyt0yhCJUnjQgdM7gC1EcX5t1JBEon/x045l/Bwv4L/XmKP85ERXiPdHaRxRqydZ0d5kCG7CWP6bERaCU/ULLZrRiamMO4SocZvRM2pxNTKg1G5jQwk72ly0U8HV2GOy/ePS+u5SjJYnfztJgzUiKRWYdh1Ux+rcGiyY8Q+bXJvArFyCxdU08+64ErksLskl7wcWs41/RusPh0LCn0m92509uC8NM+r1LrMEJxTO+MCeJQrPsCsUSC7Gf/SUphvSw8oWPv9wl3/kJhhAtVBCJRsqn9ccZjAQT4jxheERoHe9TEMjT2mf3J7lKwPwsskFHfmdJnAaBAY9n9dSr7zH4pVKwLtd3zdx8v7V5fPI/VeyFem32uiZ9f5peunHcH0ca2kKTNLs02RcHuXlAyQJtfuSqIe2Yvu3bCfn3K/r77K1RWl/3CLbW2IfzzGYKtCtfcFF6Qz5HdsTrsBzdiXfb4p7H9/baYPbJ6u98zGxX+rLJrVZGt1j+z9kr1a1NGnFvfQLb+z3ewzFZoi12ftcvEwnOW1GwjSe2k1sTXBUpsHPV+sPqNSQzbRFmf2PVZNs3qsvE2zpvgP8IPhXY/s3lhfRazcuGc+lhY2+x6adb2tjh3jeNnyViG5o/98z9sbtgduEdP52iTWBcyb3Es7O5NlT5X622xcW4J3+U2xHln42Rtir/4FY8nSfywZLCx72w9WX+Ea2+zdx+fC3OToTncXT92bmMMOVYOEHBHJZlII5SqotziWMdI+/caYTaSJbtiiL/w3BHsjP2zMLt3c/I18ThLxuXnk72TvaTZo7dd26bv0rR2LPHZbUNMEHYEm2LXYT+QEOuLx9k1WBu5uu0Ldwcr4nVZvwS7ZPvDtmjrzDbY50bfPamI/tyw/7E4UJ/LbIU9Bl2v75u0FoU0JqfnEV1r/hEfE7/saUGa/JKNnfnw7rnsWvlynpIpx/557MbL2m79LWFPFuMUiyOiX7PPzM9ZHfbolLWfI8HNPrdaaxbbxO93hNgm3JGnWMf6wH7o1fiKA6vbGMOEMdfXmyHEuy0xljXFX8l5R+HVBRyDDVDqkFJYQGsxQRwOh3PSSOWLCKaKsu/fGY5RwB0L0v5x3huyZfavPGSP/L6neJPl/dYUxyPgGEycsbtQ7XjPJ5rD4XBODJ0k3W+K+l1SzvsJF2Ivz/EJOA6Hw+GcHtimyYTc24T14SUfH3E47ztcwHE4HA6Hw+GcMriA43A4HA6HwzllcAHH4XA4HA6Hc8rgAo7D4XA4HA7nlMEFHIfD4XA4HM4pgws4DofD4XA4nFMGF3AcDofD4XA4pwwu4DgcDofD4XBOGU0Crsr+/7ZKjcPhcDgcDodzgmkScP/4j/+H3//9HxwOh8PhcDicE0yTgOOFF1544YUXXnjh5eQXLuB44YUXXnjhhRdeTlnhAo4XXnjhhRdeeOHllBUu4HjhhRdeeOGFF15OWfng5s1fwOFwOBwOh8M5PXxw5vwl7HL2WLgscuFwzjVx5VDO73KxDZcauSrjwmFclvJxExffCldlyPvZYiwdI523OtK5bUfjunSIdF3bI7WRV0Nqfwcis+tL8jqt2LX/RiR1pP06HOm8tEY6zx0jXdO3ibRvApf3kM/NQVwSONsK6dq+JI3xU+DcxRMM61+LPneAdNyH097+WyFfO4bcxlshs6GTgsyO23F0+xbn7dKx2/NrhWyQIbfLDjnbGR8JXGjLh42cOf+WYG2/Oh9cvEIioZGr1zri0tVPWvNxM5cP4tqnh3JF4A8in8i5usunu/xRxsd/aOSfZFz7o5T/KuOTRv6pHf9NgvR4h0jboz61QtZvNhaBP8rYGz+bj5Y0zmEDjXMs49MmrnTK3ro2I137g2H20wKpjZ02ZONsjXTu5NR9RkoLH2qFfK2PmyPYjGxsu3yyx+E2cE3gUiuEeHYIFBsZsnh5ABekSJOuV6Y5wWxC2nZHXGtCGvPbIdsDWuwDUmTrU7frw9hbe6mNCLxpG27FAfFQZr/tIJuWzs+BtLFtqQ0fGdHmj2r3HXP5kJsSbZDdbGjDOcbFy4dyVoo02euAM4dyuSXSRKYjGvr6/wFFaijvz6N9zAAAAABJRU5ErkJggg==>

[image11]: <data:image/png;base64,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>

[image12]: <data:image/png;base64,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>