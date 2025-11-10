<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Data Enrichment, Identity Resolution, and Ethical Targeting: A Marketing Operations Perspective

Your question touches on several critical areas where marketing technology, privacy regulations, and ethical business practices intersect. Let me break down the concept of "reverse enrichment," examine the ethical and legal constraints, and clarify how your Marketing Operations (MOps) role relates to these Top-of-Funnel (TOF) growth initiatives.

## Understanding "Reverse Enrichment" and Identity Resolution

**"Reverse enrichment"** in your context refers to the practice of using known individual identifiers to build comprehensive profiles that can then be used to target those same individuals across different platforms and contexts—specifically targeting their private social media accounts rather than professional profiles. This process typically involves several key components.

**Data enrichment** traditionally means enhancing existing first-party customer data with additional information from third-party sources to create more complete customer profiles[^1][^2]. However, what you're describing goes beyond standard enrichment to include **identity resolution**—the process of connecting scattered data points across multiple devices, platforms, and touchpoints to create unified customer profiles[^3][^4].

**Identity graphs** serve as the technological backbone for this process. These systems act as digital databases that store identifiers tied to individual customers and prospects, providing businesses with a comprehensive view of their audiences across diverse channels[^3][^5]. The process involves collecting identifiers (email addresses, phone numbers, device IDs, browsing history), performing identity resolution to match and link customer records from varied sources, and then using this unified profile for targeting purposes[^3].

![Data Enrichment Process with Ethical Compliance Checkpoints](https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/b461b109ced4da536e4c480d44891534/fa2fd2ce-9726-4fe1-996f-b4be3d294401/185213be.png)

Data Enrichment Process with Ethical Compliance Checkpoints

## Technical Feasibility and Current Practices

Yes, targeting individuals' private accounts through identity resolution is technically possible and widely practiced. Major advertising platforms like Facebook, Google, and LinkedIn offer sophisticated targeting services that utilize identity graphs to match customer data with user profiles across platforms[^6][^7].

**Custom Audience targeting** allows advertisers to upload customer contact information (email addresses, phone numbers) to platforms like Facebook, which then matches this data with user accounts to display targeted advertisements[^8][^9]. **Lookalike audience targeting** uses algorithmic analysis of existing customer data to identify and target new users who share similar characteristics, behaviors, and interests with a company's best customers[^6][^10].

The process typically works through secure hashing methods, where customer data is encrypted during transfer and matched against platform databases[^8]. This enables targeting across both business and personal social media accounts, as platforms don't necessarily distinguish between professional and personal usage contexts.

## Ethical and Legal Constraints

The ethical and legal landscape surrounding this practice is complex and rapidly evolving, with significant risks for non-compliance.

### Privacy Regulation Compliance

**GDPR requirements** mandate explicit consent for processing personal data for marketing purposes, particularly for intrusive profiling and tracking practices[^11][^8]. The European Data Protection Board has specifically ruled that Custom Audience targeting without explicit user consent violates GDPR principles[^12][^13]. German Data Protection Authorities have banned advertisers from using Facebook's Custom Audience tool without explicit user consent, with courts upholding these decisions[^12].

**CCPA and other US regulations** provide similar protections, giving consumers rights to know how their data is collected and used, delete their personal information, and opt-out of data selling or sharing[^14]. Additional state-level privacy laws are emerging, creating a patchwork of compliance requirements.

### Key Ethical Considerations

**Purpose limitation** requires that personal data be collected for specific, legitimate purposes and not processed in ways incompatible with those purposes[^15][^11]. **Data minimization** mandates collecting only the minimum amount of personal data necessary to achieve specified objectives[^11]. **Transparency** obligations require clear communication about how personal data is collected, processed, and used[^11].

The practice of targeting private accounts specifically raises additional concerns about **user expectations and context**. People often maintain different privacy expectations for their personal versus professional online presence[^16][^17]. Targeting personal accounts using data collected in business contexts may violate these reasonable expectations.

![Risk Assessment Matrix for Data Enrichment and Targeting Approaches](https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/b461b109ced4da536e4c480d44891534/e6d9ae53-1f17-4d25-a664-094315a257c3/896c0a7d.png)

Risk Assessment Matrix for Data Enrichment and Targeting Approaches

## Marketing Operations vs. Growth Marketing: Role Clarity

Your confusion about how this request relates to your MOps function is understandable, as there are fundamental differences between Marketing Operations and Growth Marketing roles.

**Marketing Operations (MOps)** focuses on the operational infrastructure that enables marketing activities. MOps professionals manage processes, technology, and data to ensure marketing strategies are implemented effectively[^18][^19]. Key responsibilities include CRM management, marketing automation, data governance, workflow optimization, and ensuring compliance with privacy regulations[^20][^21].

**Growth Marketing**, conversely, focuses on driving measurable outcomes like lead generation, customer acquisition, and revenue growth through tactics designed to move prospects through the sales funnel[^22][^23]. Growth marketers typically handle campaign strategy, audience targeting, conversion optimization, and performance marketing initiatives.

![Marketing Operations vs Growth Marketing: Role Comparison](https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/b461b109ced4da536e4c480d44891534/61c1e41f-1473-4d5a-b60e-52c73e721903/b62fb983.png)

Marketing Operations vs Growth Marketing: Role Comparison

### Your Role in This Context

As a MOps professional managing a HubSpot instance, your involvement in this growth initiative would likely center on several key areas:

**Data infrastructure and compliance**: Ensuring that any data enrichment and targeting activities comply with privacy regulations and company policies. This includes setting up proper consent management, data processing agreements, and audit trails[^15][^11].

**System integration**: If the growth team proceeds with identity resolution and targeting, you would likely be responsible for integrating any new data sources with HubSpot, maintaining data quality, and ensuring proper attribution and tracking[^24][^25].

**Process optimization**: Establishing workflows for how enriched data flows into your CRM system, how leads generated from targeting campaigns are processed, and how attribution is maintained across different touchpoints[^20].

![HubSpot-centric marketing operations ecosystem diagram](https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/c36f8846-5434-418f-a7cf-b21a1368c8f6.png)

HubSpot-centric marketing operations ecosystem diagram

## HubSpot's Role in the Identity Resolution Ecosystem

HubSpot serves as a central hub for customer data management but has limitations in identity resolution capabilities. While HubSpot offers robust CRM functionality and marketing automation tools, it cannot serve as an identity provider in the same way specialized identity resolution platforms can[^26][^27].

**Current limitations** include relatively weak identity stitching capabilities compared to dedicated Customer Data Platforms (CDPs)[^27]. HubSpot's identity deduplication logic can sometimes merge different individuals' data if they share browser sessions or cookies, which creates data quality issues[^28].

**Integration opportunities** exist with specialized identity resolution platforms that can enhance HubSpot's capabilities. Many companies use HubSpot as a data destination while leveraging third-party tools for identity resolution and data enrichment[^29][^30].

## Recommendations and Best Practices

Given the ethical, legal, and operational complexities involved, I recommend the following approach:

### 1. Establish Clear Governance Framework

Before proceeding with any targeting initiatives, establish a comprehensive data governance framework that includes explicit consent collection procedures, privacy policy updates, and compliance monitoring processes[^15][^31]. Create clear documentation of data sources, processing purposes, and retention policies.

### 2. Implement Privacy-First Practices

Focus on **first-party data strategies** that rely on directly collected customer information with clear consent[^11][^31]. When third-party enrichment is necessary, work only with reputable vendors who provide compliance guarantees and maintain high data quality standards[^31][^32].

### 3. Consider Alternative Approaches

Rather than targeting private accounts, consider focusing on business-context targeting or developing stronger first-party data collection strategies[^33]. This approach typically involves lower compliance risk while still enabling effective targeting.

### 4. Establish Cross-Functional Collaboration

Bridge the gap between MOps and Growth Marketing through regular communication and shared KPIs[^34][^35]. Define clear handoff processes for how targeting campaigns integrate with your CRM systems and what compliance checks are required at each stage.

### 5. Regular Compliance Auditing

Implement ongoing monitoring and auditing processes to ensure all targeting activities remain compliant with evolving privacy regulations[^11][^36]. This includes regular reviews of consent records, data processing agreements, and vendor compliance status.

## Conclusion

While technically feasible, targeting individuals' private accounts through data enrichment and identity resolution carries significant ethical and legal risks that require careful consideration. The distinction between your MOps role and Growth Marketing objectives is important—you would primarily be responsible for ensuring compliant data management and system integration rather than campaign strategy and execution.

The most prudent approach involves establishing robust privacy governance, focusing on first-party data strategies, and maintaining clear boundaries between business and personal targeting contexts. By taking a privacy-first approach, your organization can pursue growth objectives while maintaining customer trust and regulatory compliance.
<span style="display:none">[^100][^101][^102][^103][^104][^105][^106][^107][^108][^109][^110][^111][^112][^113][^114][^115][^37][^38][^39][^40][^41][^42][^43][^44][^45][^46][^47][^48][^49][^50][^51][^52][^53][^54][^55][^56][^57][^58][^59][^60][^61][^62][^63][^64][^65][^66][^67][^68][^69][^70][^71][^72][^73][^74][^75][^76][^77][^78][^79][^80][^81][^82][^83][^84][^85][^86][^87][^88][^89][^90][^91][^92][^93][^94][^95][^96][^97][^98][^99]</span>

<div align="center">⁂</div>

[^1]: https://segment.com/blog/reverse-etl/

[^2]: https://www.acxiom.com/data-enrichment/

[^3]: https://verve.com/blog/unlocking-customer-personalization-with-identity-graphs-a-visual-guide/

[^4]: https://accurateappend.com/the-power-of-reverse-appending/

[^5]: https://www.getcensus.com/playbook/behavioral-targeting-with-enriched-data

[^6]: https://www.acxiom.com/blog/identity-resolution-power-graphs/

[^7]: https://deepsync.com/data-enrichment/

[^8]: https://www.typeform.com/blog/data-enrichment-for-personalization

[^9]: https://www.growthloop.com/university/article/identity-graph

[^10]: https://hightouch.com/blog/understanding-data-enrichment-a-comprehensive-guide-hightouch

[^11]: https://airbyte.com/data-engineering-resources/what-is-data-enrichment

[^12]: https://www.forrester.com/blogs/more-than-a-buzzword-master-the-identity-graph-to-unlock-the-value-of-identity-resolution/

[^13]: https://www.boltic.io/blog/how-to-quickly-reverse-etl-your-marketing-data

[^14]: https://www.coursera.org/articles/data-enrichment

[^15]: https://www.marketingprofs.com/articles/2023/50019/how-marketers-can-use-customer-identity-graphs?adref=shareaccess\&cntexp=E79AE817EFD699D2F40EEC9C76F5DB39278F4AD7DB43ABC46C322632C21271B9

[^16]: https://www.treasuredata.com/wp-content/uploads/data-driven-marketers-guide-to-data-enrichment-arm-treasure-data.pdf

[^17]: https://improvado.io/blog/what-is-data-enrichment

[^18]: https://www.liveintent.com/blog/li-weekly-whats-an-identity-graph/

[^19]: https://segment.com/data-hub/data-enrichment/

[^20]: https://www.eyeota.com/blog/what-is-data-enrichment-and-how-to-approach-it-successfully

[^21]: https://www.salesforce.com/marketing/lookalike-audience/

[^22]: https://www.privacycompany.eu/blogpost-en/is-consent-required-to-advertise-on-facebook-custom-audiences

[^23]: https://umatechnology.org/compliant-workflows-in-data-enrichment-platforms-to-increase-arr/

[^24]: https://www.linkedin.com/pulse/understanding-lookalike-audiences-powerful-tool-joseph-n-martinez-e3lfc

[^25]: https://www.privacycompany.eu/blog/is-consent-required-to-advertise-on-facebook-custom-audiences

[^26]: https://superagi.com/privacy-first-data-enrichment-navigating-gdpr-and-ccpa-compliance-with-advanced-apis/

[^27]: https://www.decentriq.com/article/what-are-lookalike-audiences

[^28]: https://www.socialmediatoday.com/news/facebook-adds-new-data-security-provisions-for-custom-audience-use/525667/

[^29]: https://www.tye.io/en/blog/data-enrichment-gpdr/

[^30]: https://www.decimus.ai/blog/lookalike-audience-power

[^31]: https://edri.org/our-work/facebook-custom-audience-illegal-without-explicit-user-consent/

[^32]: https://www.openprisetech.com/blog/data-enrichment-part-v-gdpr-compliance/

[^33]: https://cowles.yale.edu/sites/default/files/2022-08/d2302.pdf

[^34]: https://econsultancy.com/savvy-marketers-facebook-custom-audience-transparency/

[^35]: https://getdatabees.com/data-enrichment-gdpr/

[^36]: https://aokmarketing.com/lookalike-audiences-a-comprehensive-guide-for-marketers/

[^37]: https://netzpolitik.org/2019/facebook-custom-audience-illegal-without-explicit-user-consent-bavarian-dpa-rules/

[^38]: https://superagi.com/privacy-first-data-enrichment-ensuring-compliance-and-security-in-the-age-of-gdpr-and-ccpa/

[^39]: https://cowles.yale.edu/sites/default/files/2022-08/d2302-r.pdf

[^40]: https://councils.forbes.com/blog/balancing-data-and-privacy-in-advertising

[^41]: https://www.driveway.app/blog/what-is-marketing-operations-(mops)

[^42]: https://www.hubspot.com/products/marketing/marketing-automation

[^43]: https://www.rendertribe.com/marketingops-vs-revops/

[^44]: https://directiveconsulting.com/resources/glossary/marketing-operations/

[^45]: https://www.hubspot.com/products/marketing/marketing-automation?uuid=59b39531-ac0e-43b7-803d-97d00ac6cce8

[^46]: https://martech.org/why-the-future-of-marketing-depends-on-a-smarter-mops-function/

[^47]: https://business.adobe.com/blog/basics/definitive-guide-to-marketing-operations-mops

[^48]: https://www.hubspot.com/use-case/automate-marketing

[^49]: https://www.inflection.io/post/gtm-operations-gtm-ops-vs-marketing-operations-mops-whats-the-difference

[^50]: https://martech.org/what-is-marketing-operations-and-who-are-mops-professionals/

[^51]: https://www.youtube.com/watch?v=q_kDg2NRWo8

[^52]: https://growthmethod.com/marketing-operations/

[^53]: https://www.linkedin.com/pulse/what-marketing-operations-do-mops-professionals-chandan-kumar-thakur-j4qbf

[^54]: https://www.youtube.com/watch?v=fpGsm7GTNQw

[^55]: https://darrellalfonso.substack.com/p/breakdown-of-gtm-ops-vs-mops-vs-revops

[^56]: https://revops.fyi/what-is-marketing-operations-mops

[^57]: https://www.hubspot.com/products/marketing/marketing-automation-information

[^58]: https://www.reprise.com/resources/blog/product-marketing-vs-marketing-operations-the-future-of-b2b-marketing

[^59]: https://martech.zone/marketing-operations/

[^60]: https://academy.hubspot.com/courses/automation-strategy

[^61]: https://socinator.com/blog/social-media-targeting/

[^62]: https://www.linkedin.com/pulse/why-employees-should-never-use-personal-accounts-when-brett-gallant-rkgie

[^63]: https://www.insideprivacy.com/data-privacy/edpb-publishes-draft-guidelines-on-the-targeting-of-social-media-users/

[^64]: https://www.cmswire.com/customer-experience/from-reach-to-retention-let-your-brand-shine-on-private-social-networks/

[^65]: https://www.marketingeye.com.au/marketing-blog/the-ethics-of-targeted-advertising-and-data-privacy.html

[^66]: https://natlawreview.com/article/edpb-published-guidelines-targeting-social-media-users

[^67]: https://www.clubmarketing.com/blog/social-media-for-clubs

[^68]: https://www.linkedin.com/pulse/why-you-need-keep-business-personal-social-media-separate-aguiar

[^69]: https://www.edpb.europa.eu/system/files/2021-04/edpb_guidelines_082020_on_the_targeting_of_social_media_users_en.pdf

[^70]: https://www.reddit.com/r/marketing/comments/goj4i0/how_do_i_develop_a_social_media_strategy_when_we/

[^71]: https://www.indeed.com/career-advice/career-development/personal-ethics-vs-business-ethics

[^72]: https://dpnetwork.org.uk/social-media-targeting-consent-or-legitimate-interests/

[^73]: https://www.dataprotection.ie/sites/default/files/uploads/2018-11/Guidance Tailoring your Social Media Privacy and Advertising Preferences.pdf

[^74]: https://pmc.ncbi.nlm.nih.gov/articles/PMC9530433/

[^75]: https://epic.org/issues/consumer-privacy/social-media-privacy/

[^76]: https://localiq.co.uk/blog/why-you-should-be-using-social-targeting-to-market-your-business

[^77]: https://abmatic.ai/blog/ethics-of-personalized-marketing-what-you-need-to-know

[^78]: https://www.findlaw.com/consumer/online-scams/social-media-privacy-laws.html

[^79]: https://www.reddit.com/r/SocialMediaMarketing/comments/1hmkf03/how_can_you_target_your_audience_on_social_media/

[^80]: https://pressbooks.openeducationalberta.ca/saitintrobiz/chapter/personal-and-business-ethics/

[^81]: https://mountain.com/blog/upper-funnel-vs-lower-funnel/

[^82]: https://www.conwaymarketinggroup.com/growth-marketing-vs-operational-marketing/

[^83]: https://www.linkedin.com/pulse/data-enrichment-legal-answer-yes-here-why-searchbug

[^84]: https://www.reddit.com/r/PPC/comments/10igdtz/just_how_efficient_is_the_fullfunnel_strategy_vs/

[^85]: https://endato.com/news/data-enrichment-fraud/

[^86]: https://www.mckinsey.com/capabilities/growth-marketing-and-sales/our-insights/why-every-business-needs-a-full-funnel-marketing-strategy

[^87]: https://www.techrepublic.com/article/big-data-six-critical-areas-of-legal-risk/

[^88]: https://blog.embertribe.com/conversion-rate-optimization/upper-funnel-vs-lower-funnel-key-differences-every-marketer-should-know

[^89]: https://www.o8.agency/blog/growth-marketing/growth-marketing-vs-performance-marketing

[^90]: https://www.clearvoice.com/resources/what-is-top-of-funnel-marketing/

[^91]: https://www.linkedin.com/pulse/dynamic-duo-unpacking-differences-between-marketing-rajesh-bharti-u5zwc

[^92]: https://www.inoopa.com/article/Security-A-Major-Challenge-for-External-Data-Enrichment

[^93]: https://www.kissmetrics.io/blog/top-of-funnel/

[^94]: https://www.shopify.com/blog/marketing-operations

[^95]: https://ortto.com/learn/top-of-funnel-marketing-strategies/

[^96]: https://www.marketingprofs.com/7/emergence-of-marketing-operations-patterson.asp

[^97]: https://community.hubspot.com/t5/APIs-Integrations/Using-HubSpot-as-an-identity-provider/m-p/891176

[^98]: https://techpatio.com/2024/articles/data-enrichment-practices

[^99]: https://www.mishcon.com/news/new-edpb-guidelines-on-targeted-advertising-to-social-media-users

[^100]: https://sourceforge.net/software/identity-resolution/integrates-with-hubspot-crm/

[^101]: https://deepmind.google/discover/blog/best-practices-for-data-enrichment/

[^102]: https://www.insideprivacy.com/advertising-marketing/rules-on-targeted-advertising-what-do-the-digital-markets-act-and-digital-services-act-say/

[^103]: https://www.reddit.com/r/marketing/comments/1611tqz/using_hubspot_as_a_sort_of_cdp/

[^104]: https://www.linkedin.com/pulse/ethical-data-enrichment-balancing-personalization-privacy-ipj0f

[^105]: https://blog.hubspot.com/service/how-to-choose-cdp

[^106]: https://montrealethics.ai/the-ethical-ambiguity-of-ai-data-enrichment-measuring-gaps-in-research-ethics-norms-and-practices/

[^107]: https://oag.ca.gov/privacy/ccpa

[^108]: https://www.manageengine.com/identity-360/integrations/hubspot.html

[^109]: https://partnershiponai.org/developing-guidance-for-responsible-data-enrichment-sourcing/

[^110]: https://cdp.com/basics/international-u-s-data-privacy-laws-and-regulations-you-need-to-know/

[^111]: https://robsobers.com/hubspot-gotcha-1-identity-deduplication/

[^112]: https://www.forbes.com/councils/forbestechcouncil/2023/04/10/15-expert-tips-to-help-businesses-ethically-manage-their-data/

[^113]: https://portal.ct.gov/ag/sections/privacy/the-connecticut-data-privacy-act

[^114]: https://www.leadspace.com/wp-content/uploads/2024/10/Guide_IdentityResolution_10.17.24.pdf

[^115]: https://sunscrapers.com/blog/5-best-practices-for-ethical-data-sourcing-in-the-age-of-big-data/

