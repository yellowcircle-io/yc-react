<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Check the following code:

• Why isn't this string "2025_sales_outbound" being triggered under the Sales logic

exports.main = (event, callback) => {
// Get input properties from HubSpot contact
const utmAd = event.inputFields.utm_ad__c || '';
const utmSource = event.inputFields.utm_source__c || '';
const utmMedium = event.inputFields.utm_medium__c || '';
const utmCampaign = event.inputFields.utm_campaign__c || '';
const utmContent = event.inputFields.utm_content__c || '';
const utmTerm = event.inputFields.utm_term__c || '';
const utmRef = event.inputFields.utm_ref || '';
const utmFunnel = event.inputFields.utm_funnel || '';
const hsAnalyticsSource = event.inputFields.hs_analytics_source || '';
const hsAnalyticsSourceData1 = event.inputFields.hs_analytics_source_data_1 || '';
const hsAnalyticsSourceData2 = event.inputFields.hs_analytics_source_data_2 || '';
const hsAnalyticsLastReferrer = event.inputFields.hs_analytics_last_referrer || '';
let level3Channel = '';
let channelCategory = '';
let funnelPosition = '';
// Function to determine funnel position from UTM campaign
function getFunnelPosition(campaign) {
const campaignLower = campaign.toLowerCase();
if (campaignLower.includes('tf') || campaignLower.includes('tofu')) {
return 'Top of Funnel';
} else if (campaignLower.includes('mf') || campaignLower.includes('mofu')) {
return 'Mid Funnel';
} else if (campaignLower.includes('bf') || campaignLower.includes('bofu')) {
return 'Bottom Funnel';
} else {
return 'MISC';
}
}
// Function to check if source contains any of the provided strings
function containsAny(source, stringArray) {
return stringArray.some(str => source.toLowerCase().includes(str.toLowerCase()));
}
// Main attribution logic
if (utmSource) {
// PAID MARKETING CHANNELS
const sourceLower = utmSource.toLowerCase();
const campaignLower = utmCampaign.toLowerCase();

    // Google Ads Attribution
    if (containsAny(sourceLower, ['google', 'googleads'])) {
      channelCategory = 'Paid Search';
      if (campaignLower.includes('brand')) {
        level3Channel = 'Google Ads - Brand';
      } else if (campaignLower.includes('nonbrand')) {
        level3Channel = 'Google Ads - Nonbrand';
      } else if (campaignLower.includes('perf_max') || campaignLower.includes('performance_max') || campaignLower.includes('perf max') ) {
        level3Channel = 'Google Ads - Performance Max';
      } else if (campaignLower.includes('dsa')) {
        level3Channel = 'Google Ads - DSA';
      } 
       else if (campaignLower.includes('demandgen')) {
        level3Channel = 'Google Ads - Demand Gen';
      }
       else if (campaignLower.includes('DSP')) {
        level3Channel = 'Google Ads - Display';
      }
      else {
        level3Channel = 'Google Ads - MISC';
      }
    }
    
    // Microsoft Ads Attribution
    else if (containsAny(sourceLower, ['bing', 'microsoft', 'microsoftads'])) {
      channelCategory = 'Paid Search';
      if (campaignLower.includes('brand')) {
        level3Channel = 'Microsoft Ads - Brand';
      } else if (campaignLower.includes('nonbrand')) {
        level3Channel = 'Microsoft Ads - Nonbrand';
      } else {
        level3Channel = 'Microsoft Ads - MISC';
      }
    }
    
    // Perplexity Ads Attribution
    else if (containsAny(sourceLower, ['perplexity'])) {
      channelCategory = 'Paid Search';
      level3Channel = 'Perplexity Ads';
    }
    
     // Spotify Ads Attribution
    else if (containsAny(sourceLower, ['spotify'])) {
      channelCategory = 'Paid Social';
      level3Channel = 'Spotify – Paid Ads';
    }
    
         // Product Hunt Ads Attribution
    else if (containsAny(sourceLower, ['product_hunt'])) {
      channelCategory = 'Paid Social';
      level3Channel = 'Product Hunt – Paid Ads';
    }
    
         // Newsletter: Consumer Startup Ads Attribution
    else if (containsAny(sourceLower, ['newsletter_consumer_startups', 'newsletterconsumerstartups'])) {
      channelCategory = 'Paid Social';
      level3Channel = 'Newsletter, Consumer Startups';
    }
    
    // LinkedIn Ads Attribution
    else if (containsAny(sourceLower, ['linkedin'])) {
      channelCategory = 'Paid Social';
      funnelPosition = getFunnelPosition(utmCampaign);
      level3Channel = `LinkedIn Ads - ${funnelPosition}`;
    }
    
    // Facebook/Meta Ads Attribution
    else if (containsAny(sourceLower, ['facebook', 'meta', 'fb'])) {
      channelCategory = 'Paid Social';
      funnelPosition = getFunnelPosition(utmCampaign);
      level3Channel = `Facebook Ads - ${funnelPosition}`;
    }
    
    // X/Twitter Ads Attribution
    else if (containsAny(sourceLower, ['twitter', 'x.com', 'x'])) {
      channelCategory = 'Paid Social';
      funnelPosition = getFunnelPosition(utmCampaign);
      level3Channel = `X Ads - ${funnelPosition}`;
    }
    
    // Reddit Ads Attribution
    else if (containsAny(sourceLower, ['reddit'])) {
      channelCategory = 'Paid Social';
      funnelPosition = getFunnelPosition(utmCampaign);
      level3Channel = `Reddit Ads - ${funnelPosition}`;
    }
    
    
    // Stripe Ads Attribution
    else if (containsAny(sourceLower, ['stripe', 'strip_atlas', 'stripe_atlas', 'stripe-atlas'])) {
channelCategory = 'Stripe';
level3Channel = 'Stripe';
}

    // Sales Outbound
       else if (containsAny(sourceLower, ['sales', '2025_sales_outbound', 'sales_outreach'])) {
      channelCategory = 'Sales';
      level3Channel = 'Sales Outbound';
    }
    
    // AI Inbound
      else if (containsAny(utmSource || hsAnalyticsSourceData2 || hsAnalyticsSourceData1 , ['chatgpt', 'chatgpt.com', 'perplexity', 'claude'])) {
      channelCategory = 'AI Referral – UTM';
      level3Channel = 'AI';
    }
    
     // Affiliate - NerdWallet
      else if (containsAny(utmSource || utmCampaign || utmMedium, ['nerd', 'nerdwallet', 'NerdwalletStartupCards' ])) {
      channelCategory = 'Paid Affiliate';
      level3Channel = 'Affiliates - Paid | NerdWallet';
    }
    
    
    // Affiliate - NerdWallet
      else if (containsAny(utmSource || utmCampaign || utmMedium, ['g2', 'G2'])) {
      channelCategory = 'Paid Affiliate';
      level3Channel = 'Affiliates - Paid | G2';
    }
    
    // Affiliate Inbound
      else if (containsAny(utmSource || utmCampaign || utmMedium, ['affiliate', 'affiliates'])) {
      channelCategory = 'Affiliate';
      level3Channel = 'Affiliates - Paid | Other';
    }
    
    
    // Other paid channels
    else {
      channelCategory = 'Other Paid';
      level3Channel = 'Other Paid Channel';
    }
    }
// ORGANIC/DIRECT CHANNELS (when no UTM source)
else {
if (hsAnalyticsSource === 'ORGANIC_SEARCH') {
channelCategory = 'Organic Search';

      // Determine specific search engine from referrer
      if (containsAny(hsAnalyticsLastReferrer || hsAnalyticsSourceData2, ['google'])) {
        level3Channel = 'Google Search';
      } else if (containsAny(hsAnalyticsLastReferrer || hsAnalyticsSourceData2, ['bing', 'yahoo', 'duckduckgo'])) {
        level3Channel = 'Microsoft Search';
      } else if (containsAny(hsAnalyticsLastReferrer || hsAnalyticsSourceData2, ['chatgpt', 'openai', 'chatgpt.com'])) {
        level3Channel = 'ChatGPT';
      } else if (containsAny(hsAnalyticsLastReferrer || hsAnalyticsSourceData2, ['claude', 'anthropic'])) {
        level3Channel = 'Claude';
      } else if (containsAny(hsAnalyticsLastReferrer|| hsAnalyticsSourceData2, ['perplexity'])) {
        level3Channel = 'Perplexity';
      } else {
        level3Channel = 'Other Organic Search';
      }
    }
    
    else if (hsAnalyticsSource === 'SOCIAL_MEDIA') {
      channelCategory = 'Organic Social';
      
      // Determine specific social platform from referrer
      if (containsAny(hsAnalyticsLastReferrer || hsAnalyticsSourceData1, ['linkedin'])) {
        level3Channel = 'LinkedIn Organic';
      } else if (containsAny(hsAnalyticsLastReferrer || hsAnalyticsSourceData1, ['facebook', 'fb.com'])) {
        level3Channel = 'Facebook Organic';
      } else if (containsAny(hsAnalyticsLastReferrer || hsAnalyticsSourceData1, ['twitter', 'x.com'])) {
        level3Channel = 'X Organic';
      } else if (containsAny(hsAnalyticsLastReferrer || hsAnalyticsSourceData1, ['reddit'])) {
        level3Channel = 'Reddit Organic';
      } else if (containsAny(hsAnalyticsLastReferrer || hsAnalyticsSourceData1, ['tiktok'])) {
        level3Channel = 'TikTok Organic';
      } else if (containsAny(hsAnalyticsLastReferrer || hsAnalyticsSourceData1, ['instagram'])) {
        level3Channel = 'Instagram Organic';
      } else {
        level3Channel = 'Other Organic Social';
      }
    }
    
    else if (hsAnalyticsSource === 'DIRECT_TRAFFIC') {
      channelCategory = 'Direct';
      level3Channel = 'Direct Application';
    }
    
    else if (hsAnalyticsSource === 'EMAIL_MARKETING') {
      channelCategory = 'Email';
      level3Channel = 'Email Marketing';
    }
    
    else if (hsAnalyticsSource === 'REFERRALS') {
      channelCategory = 'Referral';
      level3Channel = 'Website Referral';
    }
    
    else {
      channelCategory = 'Other';
      level3Channel = 'Other/Unknown';
    }
    }
// Return the attribution results
callback({
outputFields: {
level_3_channel_source: level3Channel,
channel_category: channelCategory,
funnel_position: funnelPosition || '',
attribution_timestamp: new Date().toISOString(),
utm_source_processed: utmSource,
utm_campaign_processed: utmCampaign
}
});
};

Looking at your code, I can identify the issue with the string "2025_sales_outbound" not being triggered under the Sales logic.

## The Problem

The issue is in this condition on line 112:

```javascript
else if (containsAny(sourceLower, ['sales', '2025_sales_outbound', 'sales_outreach'])) {
```

**The string "2025_sales_outbound" will never match** because:

1. The `containsAny` function converts the source to lowercase: `source.toLowerCase()`
2. Your input string "2025_sales_outbound" contains underscores and mixed case
3. When converted to lowercase, it becomes "2025_sales_outbound"
4. The function then checks if this lowercase version **contains** any of the strings in your array
5. However, you're looking for an exact match of "2025_sales_outbound" within the source

## The Solutions

Here are several ways to fix this:

### Option 1: Make the search string lowercase

```javascript
else if (containsAny(sourceLower, ['sales', '2025_sales_outbound', 'sales_outreach'])) {
```

(Note: "2025_sales_outbound" is already lowercase, so this should work)

### Option 2: Add variations to handle different formats

```javascript
else if (containsAny(sourceLower, ['sales', '2025_sales_outbound', '2025salesoutbound', 'sales_outreach', 'salesoutbound'])) {
```


### Option 3: Use a more flexible matching approach

```javascript
else if (containsAny(sourceLower, ['sales']) || 
         sourceLower.includes('2025') && sourceLower.includes('sales') && sourceLower.includes('outbound')) {
```


## Debugging Steps

To troubleshoot this further, you could add some debugging:

```javascript
// Add this right after getting the utmSource
console.log('Original utmSource:', utmSource);
console.log('sourceLower:', sourceLower);
console.log('Contains sales?', containsAny(sourceLower, ['sales']));
console.log('Contains 2025_sales_outbound?', containsAny(sourceLower, ['2025_sales_outbound']));
```


## Most Likely Issue

The most probable cause is that your actual `utm_source__c` value might be slightly different from what you expect. Common variations could be:

- Extra whitespace: `" 2025_sales_outbound "`
- Different casing: `"2025_Sales_Outbound"`
- Different separators: `"2025-sales-outbound"` or `"2025salesoutbound"`

**Recommendation**: Use Option 2 above to handle multiple variations, or add the debugging code to see exactly what value is being processed.

