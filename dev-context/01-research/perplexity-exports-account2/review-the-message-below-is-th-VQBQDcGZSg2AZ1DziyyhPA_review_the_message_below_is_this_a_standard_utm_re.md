<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## Review of UTM Parameters for Google Performance Max

The message you've shared describes a **non-standard but strategically sound approach** to UTM tracking for Google Performance Max campaigns. Let me break down what's standard versus what's custom in your implementation.

### Standard UTM Parameters for Performance Max

According to Google's documentation and industry best practices, the standard UTM parameters for Performance Max campaigns typically include:[^1][^2][^3]

- `utm_source=google` - identifies Google as the traffic source
- `utm_medium=cpc` or `utm_medium=pmax` - specifies the marketing medium
- `utm_campaign={campaignid}` or campaign name - tracks the specific campaign
- `utm_content={creative}` - differentiates ad creatives
- `utm_term={keyword}` - captures keyword information (though limited in pMax)


### Your Custom Parameters: Not Standard but Valid

The two additional parameters you're implementing are **custom UTM parameters**, not part of Google's standard set:[^4]

- `&utm_pmax_asset={asset_name}`
- `&utm_pmax_topic={topic_name}`

These are custom extensions that fall outside the five standard UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`). However, this approach is completely valid and addresses a real limitation of Performance Max campaigns.[^5][^3]

### Why This Approach Makes Sense

Your strategy addresses a well-documented challenge with Performance Max campaigns. As noted in industry discussions, "pMax infamously betrays very little granular performance information". The lack of transparency in Performance Max reporting has led many advertisers to seek creative solutions for better tracking.[^6][^7][^1]

### Implementation Considerations

**Technical Feasibility**: Custom UTM parameters can be implemented at the campaign level or asset group level in Performance Max campaigns. Google's asset group URL options support tracking templates, final URL suffixes, and custom parameters.[^8][^9]

**Analytics Compatibility**: Most analytics platforms, including Google Analytics 4, will capture these custom parameters as long as they follow proper URL formatting. However, they won't appear in standard UTM reports and may require custom dimensions or events to track effectively.[^3][^4]

**Best Practices Alignment**: Your naming convention follows UTM best practices by using lowercase letters and underscores. The descriptive parameter names (`utm_pmax_asset` and `utm_pmax_topic`) clearly indicate their purpose and source.[^10][^11]

### Limitations and Alternatives

**Standard Limitations**: Performance Max campaigns have inherent tracking limitations compared to other campaign types. Asset group-level tracking templates aren't available in all scenarios.[^7][^1]

**Alternative Approaches**: Some advertisers use ValueTrack parameters like `{feeditemid}`, `{targetid}`, or `{creative}` for more granular Performance Max tracking. Others implement scripts to automate UTM parameter management.[^12][^13][^6][^7]

### Conclusion

While your UTM parameters aren't part of Google's standard set, they represent a thoughtful solution to Performance Max's reporting limitations. This custom approach is technically sound and addresses a legitimate business need for more granular performance insights. Just ensure your analytics platform is configured to capture and report on these custom parameters effectively.
<span style="display:none">[^14][^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35][^36][^37][^38][^39][^40][^41][^42][^43][^44][^45][^46]</span>

<div align="center">⁂</div>

[^1]: https://www.reddit.com/r/PPC/comments/yi8pqx/standard_tracking_template_utm_parameters_not/

[^2]: https://gaconnector.com/blog/how-to-add-utm-parameters-to-google-ads-automatically/

[^3]: https://www.rootandbranchgroup.com/utm-parameters-google-analytics/

[^4]: https://web.utm.io/blog/custom-utm-parameters/

[^5]: https://www.northbeam.io/blog/utm-tracking-parameters-for-ad-campaigns

[^6]: https://www.reddit.com/r/PPC/comments/179kvct/pmax_campaign_utm_parameters_for_tracking/

[^7]: https://www.reddit.com/r/PPC/comments/1g574er/tracking_template_on_pmax_asset_groups/

[^8]: https://support.google.com/google-ads/answer/16176749

[^9]: https://support.google.com/google-ads/answer/10724492?hl=en

[^10]: https://befoundonline.com/blog/six-best-practices-for-getting-started-with-utm-parameters-in-google-analytics-4

[^11]: https://www.reddit.com/r/PPC/comments/14azm00/utm_tagging_best_practices/

[^12]: https://nilsrooijmans.com/google-ads-script-review-set-url-tracking-parameters/

[^13]: https://developers.google.com/google-ads/api/performance-max/valuetrack

[^14]: https://support.google.com/google-ads/answer/6305348?hl=en

[^15]: https://help.getklar.com/en/articles/7161450-url-parameters-for-google-ads

[^16]: https://www.reddit.com/r/PPC/comments/1cooj1z/utm_parameters_allowed_on_pmax/

[^17]: https://www.maius.com/post/how-to-add-account-wide-utm-parameters-to-your-google-ads

[^18]: https://docs.bloomanalytics.io/bloom-pixel/step-3-utm-parameter-guide/google-ads-utm-parameter

[^19]: https://adequate.digital/en/utms-for-google-ads-campaigns/

[^20]: https://community.hubspot.com/t5/Ads/Performance-Max-or-PMax-Google-Ads/m-p/893334

[^21]: https://www.blobr.io/how-to-guides/how-do-you-add-utm-parameters-to-google-ads-for-effective-tracking

[^22]: https://playhouse.digital/blog/build-utm-tracking-parameters-for-google-analytics

[^23]: https://nilsrooijmans.com/daily/performance-max-valuetrack-and-custom-parameters-for-improved-tracking

[^24]: https://support.google.com/google-ads/answer/6277564?hl=en

[^25]: https://nordicclick.com/blog/guide-for-utm-tagging-ads-to-work-with-ga4/

[^26]: https://support.google.com/google-ads/thread/170874263/how-do-i-add-a-utm-source-to-performance-max-campaigns?hl=en

[^27]: https://developers.google.com/google-ads/api/performance-max/getting-started

[^28]: https://www.youtube.com/watch?v=EExqc3e-JeI

[^29]: https://developers.google.com/google-ads/api/performance-max/assets

[^30]: https://www.youtube.com/watch?v=5VpRARpfr5A

[^31]: https://support.google.com/google-ads/answer/6325879?hl=en

[^32]: https://developers.google.com/google-ads/api/performance-max/asset-groups

[^33]: https://support.google.com/google-ads/answer/7544718?hl=en

[^34]: https://support.google.com/google-ads/answer/10724897?hl=en

[^35]: https://www.reddit.com/r/GoogleTagManager/comments/1kn2wkr/struggling_to_send_custom_parameters_to_google/

[^36]: https://matomo.org/faq/general/how-to-track-google-ads-campaigns-with-matomo/

[^37]: https://www.reddit.com/r/PPC/comments/12qsfvk/performancemax_and_valuetrack_parameters/

[^38]: https://www.youtube.com/watch?v=1VlmmSKjEIs

[^39]: https://www.datafeedwatch.com/blog/performance-max-specs

[^40]: https://hawksem.com/blog/utm-parameters/

[^41]: https://developers.google.com/google-ads/api/performance-max/asset-requirements

[^42]: https://funnel.io/blog/google-analytics-utm-tagging

[^43]: https://support.google.com/google-ads/answer/10725056?hl=en

[^44]: https://experienceleague.adobe.com/en/docs/advertising/search-social-commerce/campaign-management/management/special-workflows/google-performance-max-campaigns

[^45]: https://www.definedigitalacademy.com/blog/stop-making-this-mistake-with-performance-max-asset-groups

[^46]: https://ppchero.com/16-tips-to-shake-up-and-optimise-your-google-ads-performance-max-campaigns/

