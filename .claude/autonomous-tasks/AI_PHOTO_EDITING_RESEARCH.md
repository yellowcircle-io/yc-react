# AI Photo Editing Research & Implementation Plan

**Created:** December 20, 2025
**Status:** Research Complete, Ready for Implementation
**Use Case:** Headshot photography business (dash@dashkolos.com)

---

## Executive Summary

AI photo editing capabilities would enhance the photographer use case by enabling:
1. **Background removal/replacement** - Professional backdrops for headshots
2. **Portrait enhancement** - Skin retouching, lighting correction
3. **Batch processing** - Efficient workflow for multiple headshots
4. **Consistent branding** - Template-based styling

---

## API Comparison Matrix

| Provider | Background Removal | Portrait Enhancement | Pricing | Best For |
|----------|-------------------|---------------------|---------|----------|
| **remove.bg** | ✅ Excellent | ❌ No | $0.13-0.43/image | Background only |
| **Photoroom** | ✅ Excellent | ⚠️ Basic | $0.01+/credit | E-commerce |
| **Picsart** | ✅ Good | ✅ Face Enhancement | ~$0.01/edit | Full suite |
| **VanceAI** | ✅ Good | ✅ Portrait Pro | Variable | Portrait focus |
| **Cutout Pro** | ✅ Good | ⚠️ Basic | Competitive | Batch processing |
| **Adobe Firefly** | ✅ Excellent | ✅ Excellent | Enterprise | Premium quality |

---

## Recommended Stack

### Primary: Picsart API
- **Why:** Full-featured, competitive pricing ($0.01/edit), face enhancement included
- **Features:**
  - Face Enhancement API
  - Background Removal
  - Photo Adjust (lighting, color)
  - Style Transfer
- **Pricing:** ~8 credits per operation, bulk discounts available
- **Integration:** REST API, well-documented

### Secondary: remove.bg
- **Why:** Best-in-class background removal for fallback
- **Pricing:** 50 free API calls/month (preview resolution)
- **Use case:** When Picsart is unavailable or for premium background removal

---

## Proposed Functions

### 1. `enhanceHeadshot`
```javascript
/**
 * Full headshot enhancement pipeline
 * @param {string} imageUrl - Input image URL
 * @param {object} options - Enhancement options
 * @returns {object} Enhanced image + metadata
 */
exports.enhanceHeadshot = functions.https.onRequest(async (req, res) => {
  // 1. Face detection & alignment
  // 2. Skin retouching (preserve texture)
  // 3. Lighting normalization
  // 4. Background removal/replacement
  // 5. Color grading (optional preset)
});
```

### 2. `removeBackground`
```javascript
/**
 * Background removal with optional replacement
 * @param {string} imageUrl - Input image
 * @param {string} backgroundType - 'transparent' | 'solid' | 'gradient' | 'custom'
 * @param {string} backgroundColor - Hex color or gradient spec
 */
exports.removeBackground = functions.https.onRequest(async (req, res) => {
  // Primary: Picsart API
  // Fallback: remove.bg
});
```

### 3. `batchProcessHeadshots`
```javascript
/**
 * Process multiple headshots with consistent styling
 * @param {array} images - Array of image URLs
 * @param {object} template - Styling template
 */
exports.batchProcessHeadshots = functions.https.onRequest(async (req, res) => {
  // Parallel processing with rate limiting
  // Consistent output formatting
  // Progress tracking via Firestore
});
```

---

## Budget Planning

### Monthly Estimates (300 headshots/month)
| Operation | Cost/Image | Volume | Monthly |
|-----------|-----------|--------|---------|
| Background Removal | $0.02 | 300 | $6.00 |
| Face Enhancement | $0.03 | 300 | $9.00 |
| Lighting Adjust | $0.01 | 300 | $3.00 |
| **Total** | **$0.06** | **300** | **$18.00** |

### Budget Controls
- Monthly cap: $25 (matches existing $20 image gen cap pattern)
- Per-client isolation via `client_esp_keys` pattern
- Usage tracking in Firestore (`api_usage/photo-edit-{month}`)

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Set up Picsart API key via Firebase config
- [ ] Create `photoEdit` base function with auth
- [ ] Implement `removeBackground` endpoint
- [ ] Add usage tracking and budget controls

### Phase 2: Enhancement Features (Week 2)
- [ ] Implement `enhanceHeadshot` pipeline
- [ ] Add preset templates (corporate, creative, casual)
- [ ] Create frontend UI in UnitySTUDIO

### Phase 3: Batch Processing (Week 3)
- [ ] Implement `batchProcessHeadshots`
- [ ] Add progress tracking UI
- [ ] Client-specific templates and branding

---

## API Keys Required

```bash
# Picsart API
firebase functions:config:set picsart.api_key="YOUR_KEY"

# remove.bg (fallback)
firebase functions:config:set removebg.api_key="YOUR_KEY"
```

---

## Integration Points

### Existing yellowCircle Infrastructure
1. **generateImage** - Extend with photo editing capabilities
2. **Cloudinary** - Store processed images
3. **Client ESP Keys** - Pattern for per-client API key management
4. **Budget Tracking** - Existing `api_usage` collection

### Frontend Components
1. **UnitySTUDIO** - Add photo editing canvas
2. **CreativeCanvas** - Integrate enhancement tools
3. **ExportManager** - Batch export processed headshots

---

## Next Steps

1. **User Decision:** Choose Picsart vs alternative
2. **API Key Signup:** Create developer accounts
3. **Implementation:** Build core functions
4. **Testing:** Process sample headshots
5. **UI:** Add to UnitySTUDIO

---

## Sources

- [Photoroom API](https://www.photoroom.com/api)
- [Picsart Enterprise API](https://picsart.io/pricing/)
- [remove.bg Pricing](https://www.remove.bg/pricing)
- [VanceAI API](https://vanceai.com/api/)
- [Cutout Pro](https://techshark.io/tools/cutout-pro/)
