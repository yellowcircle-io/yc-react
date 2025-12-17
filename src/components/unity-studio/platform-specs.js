/**
 * Platform Creative Specifications (2025)
 *
 * Production-ready specs for social and display advertising platforms.
 * Sources: Official platform documentation as of December 2025
 *
 * @see UNITY_STUDIO_REARCHITECTURE.md for full context
 */

// ============================================================
// Platform Dimensions
// ============================================================

export const PLATFORM_SPECS = {
  // Instagram
  instagram_feed_square: {
    width: 1080,
    height: 1080,
    ratio: '1:1',
    platform: 'instagram',
    placement: 'feed',
    label: 'Instagram Feed (Square)',
    description: 'Standard square format for Instagram feed posts'
  },
  instagram_feed_portrait: {
    width: 1080,
    height: 1350,
    ratio: '4:5',
    platform: 'instagram',
    placement: 'feed',
    label: 'Instagram Feed (Portrait)',
    description: 'Preferred vertical format - takes up more screen space'
  },
  instagram_story: {
    width: 1080,
    height: 1920,
    ratio: '9:16',
    platform: 'instagram',
    placement: 'story',
    label: 'Instagram Story/Reel',
    description: 'Full-screen vertical for Stories and Reels'
  },
  instagram_carousel: {
    width: 1080,
    height: 1080,
    ratio: '1:1',
    platform: 'instagram',
    placement: 'carousel',
    label: 'Instagram Carousel',
    description: 'Square format for carousel posts (up to 10 cards)'
  },

  // Facebook
  facebook_feed_square: {
    width: 1080,
    height: 1080,
    ratio: '1:1',
    platform: 'facebook',
    placement: 'feed',
    label: 'Facebook Feed (Square)',
    description: 'Standard square format for Facebook feed'
  },
  facebook_feed_portrait: {
    width: 1080,
    height: 1350,
    ratio: '4:5',
    platform: 'facebook',
    placement: 'feed',
    label: 'Facebook Feed (Portrait)',
    description: 'Vertical format for maximum visibility'
  },
  facebook_story: {
    width: 1080,
    height: 1920,
    ratio: '9:16',
    platform: 'facebook',
    placement: 'story',
    label: 'Facebook Story',
    description: 'Full-screen vertical for Stories'
  },
  facebook_carousel: {
    width: 1080,
    height: 1080,
    ratio: '1:1',
    platform: 'facebook',
    placement: 'carousel',
    label: 'Facebook Carousel',
    description: 'Square format for carousel ads'
  },

  // LinkedIn
  linkedin_sponsored: {
    width: 1200,
    height: 627,
    ratio: '1.91:1',
    platform: 'linkedin',
    placement: 'feed',
    label: 'LinkedIn Sponsored Content',
    description: 'Standard landscape for sponsored posts'
  },
  linkedin_square: {
    width: 1200,
    height: 1200,
    ratio: '1:1',
    platform: 'linkedin',
    placement: 'feed',
    label: 'LinkedIn Square',
    description: 'Square format for LinkedIn feed'
  },
  linkedin_vertical: {
    width: 628,
    height: 1200,
    ratio: '1:1.91',
    platform: 'linkedin',
    placement: 'feed',
    label: 'LinkedIn Vertical',
    description: 'Mobile-optimized vertical format'
  },
  linkedin_carousel: {
    width: 1080,
    height: 1080,
    ratio: '1:1',
    platform: 'linkedin',
    placement: 'carousel',
    label: 'LinkedIn Carousel',
    description: 'Square format for carousel ads (2-10 cards)'
  },

  // Reddit
  reddit_feed: {
    width: 1200,
    height: 628,
    ratio: '4:3',
    platform: 'reddit',
    placement: 'feed',
    label: 'Reddit Feed (Desktop)',
    description: 'Standard landscape for desktop feed'
  },
  reddit_compact: {
    width: 1080,
    height: 1080,
    ratio: '1:1',
    platform: 'reddit',
    placement: 'compact',
    label: 'Reddit Compact View',
    description: 'Square format for compact feed view'
  },
  reddit_thumbnail: {
    width: 400,
    height: 300,
    ratio: '4:3',
    platform: 'reddit',
    placement: 'thumbnail',
    label: 'Reddit Thumbnail',
    description: 'Required thumbnail image (<500KB)'
  },

  // Google Display Network
  google_medium_rectangle: {
    width: 300,
    height: 250,
    ratio: 'custom',
    platform: 'google',
    placement: 'display',
    label: 'Medium Rectangle',
    description: 'Best performing display size - desktop + mobile'
  },
  google_leaderboard: {
    width: 728,
    height: 90,
    ratio: 'custom',
    platform: 'google',
    placement: 'display',
    label: 'Leaderboard',
    description: 'Desktop header/footer banner'
  },
  google_half_page: {
    width: 300,
    height: 600,
    ratio: 'custom',
    platform: 'google',
    placement: 'display',
    label: 'Half Page',
    description: 'Desktop sidebar vertical'
  },
  google_mobile_leaderboard: {
    width: 320,
    height: 50,
    ratio: 'custom',
    platform: 'google',
    placement: 'display',
    label: 'Mobile Leaderboard',
    description: 'Standard mobile banner'
  },
  google_large_mobile: {
    width: 320,
    height: 100,
    ratio: 'custom',
    platform: 'google',
    placement: 'display',
    label: 'Large Mobile Banner',
    description: 'Larger mobile banner format'
  },
  google_skyscraper: {
    width: 160,
    height: 600,
    ratio: 'custom',
    platform: 'google',
    placement: 'display',
    label: 'Wide Skyscraper',
    description: 'Desktop sidebar vertical'
  },
  google_responsive_landscape: {
    width: 1200,
    height: 628,
    ratio: '1.91:1',
    platform: 'google',
    placement: 'responsive',
    label: 'Responsive Landscape',
    description: 'Landscape image for responsive display ads'
  },
  google_responsive_square: {
    width: 1200,
    height: 1200,
    ratio: '1:1',
    platform: 'google',
    placement: 'responsive',
    label: 'Responsive Square',
    description: 'Square image for responsive display ads'
  },
  google_responsive_portrait: {
    width: 1200,
    height: 1500,
    ratio: '4:5',
    platform: 'google',
    placement: 'responsive',
    label: 'Responsive Portrait (Optional)',
    description: 'Optional portrait for responsive display ads'
  }
};

// ============================================================
// Safe Zones (areas to keep text-free)
// ============================================================

export const SAFE_ZONES = {
  // Story formats - have UI overlays
  instagram_story: {
    top: 250,     // 14% of 1920 - status bar, profile
    bottom: 340,  // 20% of 1920 - CTA, swipe up
    description: 'Keep headlines and important elements away from top 250px and bottom 340px'
  },
  facebook_story: {
    top: 250,
    bottom: 340,
    description: 'Same as Instagram Stories - UI overlays'
  },

  // Feed formats - recommended margins for readability
  instagram_feed_square: {
    top: 54,      // 5% margin
    bottom: 54,
    left: 54,
    right: 54,
    description: 'Recommended 5% margin for better framing'
  },
  instagram_feed_portrait: {
    top: 67,      // 5% of 1350
    bottom: 67,
    left: 54,
    right: 54,
    description: 'Recommended 5% margin for better framing'
  },
  facebook_feed_square: {
    top: 54,
    bottom: 54,
    left: 54,
    right: 54,
    description: 'Recommended 5% margin for better framing'
  },
  facebook_feed_portrait: {
    top: 67,
    bottom: 67,
    left: 54,
    right: 54,
    description: 'Recommended 5% margin for better framing'
  },
  linkedin_sponsored: {
    top: 32,
    bottom: 32,
    left: 60,
    right: 60,
    description: 'Keep text away from edges for professional look'
  },
  linkedin_square: {
    top: 60,
    bottom: 60,
    left: 60,
    right: 60,
    description: 'Keep text away from edges for professional look'
  },
  linkedin_vertical: {
    top: 0,
    bottom: 100,
    description: 'Minimal safe zone at bottom for engagement buttons'
  },

  // Google Display - strict safe zones
  google_medium_rectangle: {
    top: 12,
    bottom: 12,
    left: 15,
    right: 15,
    description: 'Minimum padding required for Google approval'
  },
  google_leaderboard: {
    top: 4,
    bottom: 4,
    left: 36,
    right: 36,
    description: 'Minimum padding for narrow format'
  },
  google_responsive_landscape: {
    top: 32,
    bottom: 32,
    left: 60,
    right: 60,
    description: 'Recommended safe zone for responsive ads'
  },
  google_responsive_square: {
    top: 60,
    bottom: 60,
    left: 60,
    right: 60,
    description: 'Recommended safe zone for responsive ads'
  },

  // Reddit
  reddit_feed: {
    top: 32,
    bottom: 32,
    left: 60,
    right: 60,
    description: 'Keep content away from edges'
  },
  reddit_compact: {
    top: 54,
    bottom: 54,
    left: 54,
    right: 54,
    description: 'Recommended margin for compact view'
  }
};

// ============================================================
// Text Limits by Platform
// ============================================================

export const TEXT_LIMITS = {
  instagram: {
    caption: 2200,           // Max caption length
    headline: null,          // No headline in standard posts
    hashtagsRecommended: 5,  // Optimal hashtag count
    description: 'First 125 characters visible before "more"'
  },
  facebook_feed: {
    primary: 125,            // Primary text (shown in full)
    headline: 27,            // Headline for ads
    description: 30,         // Link description
    fullPrimary: 500,        // Max primary text
    notes: 'Keep primary text under 125 chars for full visibility'
  },
  facebook_story: {
    primary: 125,
    headline: 40,
    description: 'Brief overlay text recommended'
  },
  linkedin: {
    intro: 150,              // Recommended intro length
    introMax: 600,           // Max intro length
    title: 255,              // Max title length
    description: 70,         // CTA description
    notes: 'First 150 chars shown without expanding'
  },
  reddit: {
    title: 150,              // Max title (60-80 recommended)
    body: 40000,             // Max body text
    optimalTitle: 80,        // Optimal title length
    description: 'Titles between 60-80 chars perform best'
  },
  google: {
    headline1: 30,           // First headline
    headline2: 30,           // Second headline
    headline3: 30,           // Third headline (optional)
    description1: 90,        // First description
    description2: 90,        // Second description
    longHeadline: 90,        // Long headline for responsive
    businessName: 25,        // Business name
    notes: 'Provide 5+ headlines and 5+ descriptions for optimization'
  }
};

// ============================================================
// File Specifications
// ============================================================

export const FILE_SPECS = {
  instagram: {
    formats: ['JPG', 'PNG'],
    maxSize: 30 * 1024 * 1024,  // 30MB
    maxSizeLabel: '30MB',
    recommendedFormat: 'PNG',
    notes: 'PNG for graphics, JPG for photos'
  },
  facebook: {
    formats: ['JPG', 'PNG'],
    maxSize: 30 * 1024 * 1024,
    maxSizeLabel: '30MB',
    recommendedFormat: 'PNG',
    textOverlay: 20,  // Text should be <20% of image
    notes: 'Images with <20% text perform better'
  },
  linkedin: {
    formats: ['JPG', 'PNG', 'GIF'],
    maxSize: 5 * 1024 * 1024,  // 5MB
    maxSizeLabel: '5MB',
    recommendedFormat: 'PNG',
    notes: 'Smaller file size limit than other platforms'
  },
  reddit: {
    formats: ['JPG', 'PNG'],
    maxSize: 500 * 1024,  // 500KB for thumbnails
    maxSizeLabel: '500KB (thumbnail)',
    recommendedFormat: 'JPG',
    notes: 'Keep thumbnails under 500KB'
  },
  google: {
    formats: ['JPG', 'PNG', 'GIF'],
    maxSize: 150 * 1024,  // 150KB per image
    maxSizeLabel: '150KB',
    recommendedFormat: 'JPG',
    textOverlay: 20,
    notes: 'Strict size limits - optimize images'
  }
};

// ============================================================
// Platform Groupings
// ============================================================

export const PLATFORMS = {
  meta: {
    name: 'Meta (Instagram + Facebook)',
    platforms: ['instagram', 'facebook'],
    icon: 'meta',
    color: '#0081FB'
  },
  linkedin: {
    name: 'LinkedIn',
    platforms: ['linkedin'],
    icon: 'linkedin',
    color: '#0A66C2'
  },
  reddit: {
    name: 'Reddit',
    platforms: ['reddit'],
    icon: 'reddit',
    color: '#FF4500'
  },
  google: {
    name: 'Google Display Network',
    platforms: ['google'],
    icon: 'google',
    color: '#4285F4'
  }
};

// ============================================================
// Campaign Presets
// ============================================================

export const CAMPAIGN_PRESETS = {
  social_awareness: {
    name: 'Social Awareness Campaign',
    description: 'Full coverage across social platforms',
    specs: [
      'instagram_feed_portrait',
      'instagram_story',
      'facebook_feed_portrait',
      'facebook_story',
      'linkedin_sponsored',
      'reddit_feed'
    ]
  },
  linkedin_b2b: {
    name: 'LinkedIn B2B Campaign',
    description: 'Professional audience targeting',
    specs: [
      'linkedin_sponsored',
      'linkedin_square',
      'linkedin_carousel'
    ]
  },
  display_full: {
    name: 'Google Display Full Coverage',
    description: 'All major display sizes',
    specs: [
      'google_medium_rectangle',
      'google_leaderboard',
      'google_half_page',
      'google_mobile_leaderboard',
      'google_responsive_landscape',
      'google_responsive_square'
    ]
  },
  instagram_only: {
    name: 'Instagram Campaign',
    description: 'Instagram feed and stories',
    specs: [
      'instagram_feed_portrait',
      'instagram_feed_square',
      'instagram_story'
    ]
  },
  quick_launch: {
    name: 'Quick Launch (Essential)',
    description: 'Minimum viable campaign coverage',
    specs: [
      'instagram_feed_portrait',
      'linkedin_sponsored',
      'google_medium_rectangle',
      'google_responsive_landscape'
    ]
  }
};

// ============================================================
// Helper Functions
// ============================================================

/**
 * Get all specs for a platform
 */
export const getSpecsByPlatform = (platform) => {
  return Object.entries(PLATFORM_SPECS)
    .filter(([, spec]) => spec.platform === platform)
    .map(([key, spec]) => ({ key, ...spec }));
};

/**
 * Get all specs for a placement type
 */
export const getSpecsByPlacement = (placement) => {
  return Object.entries(PLATFORM_SPECS)
    .filter(([, spec]) => spec.placement === placement)
    .map(([key, spec]) => ({ key, ...spec }));
};

/**
 * Get safe zone for a spec (if applicable)
 */
export const getSafeZone = (specKey) => {
  return SAFE_ZONES[specKey] || null;
};

/**
 * Get text limits for a platform
 */
export const getTextLimits = (platform) => {
  return TEXT_LIMITS[platform] || null;
};

/**
 * Get file specs for a platform
 */
export const getFileSpecs = (platform) => {
  return FILE_SPECS[platform] || null;
};

/**
 * Get specs for a campaign preset
 */
export const getCampaignPresetSpecs = (presetKey) => {
  const preset = CAMPAIGN_PRESETS[presetKey];
  if (!preset) return null;

  return preset.specs.map(specKey => ({
    key: specKey,
    ...PLATFORM_SPECS[specKey]
  }));
};

/**
 * Calculate aspect ratio from dimensions
 */
export const calculateAspectRatio = (width, height) => {
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
};

/**
 * Scale dimensions to fit within max bounds while preserving ratio
 */
export const scaleToFit = (width, height, maxWidth, maxHeight) => {
  const ratioW = maxWidth / width;
  const ratioH = maxHeight / height;
  const ratio = Math.min(ratioW, ratioH);

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
    scale: ratio
  };
};

// ============================================================
// Export
// ============================================================

export default {
  PLATFORM_SPECS,
  SAFE_ZONES,
  TEXT_LIMITS,
  FILE_SPECS,
  PLATFORMS,
  CAMPAIGN_PRESETS,
  getSpecsByPlatform,
  getSpecsByPlacement,
  getSafeZone,
  getTextLimits,
  getFileSpecs,
  getCampaignPresetSpecs,
  calculateAspectRatio,
  scaleToFit
};
