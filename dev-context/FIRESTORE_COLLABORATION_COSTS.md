# Firestore Collaboration Cost Analysis

**Created:** December 14, 2025
**Purpose:** Document Firestore billing impact for Unity Notes collaboration at scale

---

## Current Architecture (v3 Collaboration Model)

### Data Structure
```javascript
// Each capsule document (~1KB average)
{
  nodes: [...],           // Array of node objects
  edges: [...],           // Array of edge objects
  metadata: { title },    // Canvas metadata
  ownerId: "uid",         // Owner's Firebase UID
  collaborators: [        // Max ~20 collaborators per canvas
    { email, role, addedAt }
  ],
  isPublic: boolean,      // Public/private toggle
  shareSlug: "abc123",    // Short shareable ID
  version: 3,             // Schema version
  createdAt, updatedAt    // Timestamps
}
```

### Operation Costs (As of Dec 2025)
| Operation | Free Tier | Blaze Plan |
|-----------|-----------|------------|
| Document Read | 50K/day | $0.06/100K |
| Document Write | 20K/day | $0.18/100K |
| Document Delete | 20K/day | $0.02/100K |
| Storage | 1GB | $0.18/GB/mo |

---

## Cost Projections by Scale

### Scenario 1: 10 Active Users (Hobby/Test)

**Monthly Usage Estimate:**
- Canvas loads: 10 users × 5 loads/day × 30 days = **1,500 reads**
- Canvas saves: 10 users × 3 saves/day × 30 days = **900 writes**
- Collaboration updates: ~50 writes/month
- Access checks: ~500 reads/month

**Total:** ~2,000 reads, ~950 writes
**Cost:** **FREE** (well within free tier)

---

### Scenario 2: 100 Active Users (Small Business)

**Monthly Usage Estimate:**
- Canvas loads: 100 users × 5 loads/day × 30 days = **15,000 reads**
- Canvas saves: 100 users × 3 saves/day × 30 days = **9,000 writes**
- Collaboration updates: ~500 writes/month
- Access checks: ~5,000 reads/month

**Total:** ~20,000 reads, ~9,500 writes
**Cost:** **FREE** (within free tier, approaching write limit)

---

### Scenario 3: 1,000 Active Users (Growth Stage)

**Monthly Usage Estimate:**
- Canvas loads: 1,000 users × 5 loads/day × 30 days = **150,000 reads**
- Canvas saves: 1,000 users × 3 saves/day × 30 days = **90,000 writes**
- Collaboration updates: ~5,000 writes/month
- Access checks: ~50,000 reads/month

**Total:** ~200,000 reads, ~95,000 writes

**Daily Breakdown:**
- Reads: 6,667/day (exceeds 50K free tier ❌)
- Writes: 3,167/day (within 20K free tier ✓)

**Monthly Cost (Blaze):**
- Reads: 150K × $0.06/100K = **$0.09**
- Writes: 90K × $0.18/100K = **$0.16**
- Storage: ~1GB = **$0.18**

**Total: ~$0.43/month**

---

### Scenario 4: 10,000 Active Users (Scale)

**Monthly Usage Estimate:**
- Canvas loads: 10,000 users × 5 loads/day × 30 days = **1,500,000 reads**
- Canvas saves: 10,000 users × 3 saves/day × 30 days = **900,000 writes**
- Collaboration updates: ~50,000 writes/month
- Access checks: ~500,000 reads/month

**Total:** ~2,000,000 reads, ~950,000 writes

**Monthly Cost (Blaze):**
- Reads: 2M × $0.06/100K = **$1.20**
- Writes: 950K × $0.18/100K = **$1.71**
- Storage: ~10GB = **$1.80**

**Total: ~$4.71/month**

---

## Cost Optimization Strategies

### 1. Implemented Optimizations
- **Metadata-only queries**: Collaboration checks don't load full canvas data
- **Client-side caching**: Reduces repeat reads for same canvas
- **Batch operations**: Multiple collaborator updates in single write
- **Auto-cleanup**: 30-day expiry for unviewed auto-saved capsules

### 2. Future Optimizations (if needed)
- **Read replicas**: Cache hot canvases in CDN
- **Lazy loading**: Load node data on-demand, not full canvas
- **Pub/Sub**: Use Firebase Realtime for presence, Firestore for persistence
- **Composite indexes**: Optimize collaboration queries

---

## Risk Analysis

### Low Risk (Current State)
- 10-100 users: Completely free
- Collaboration features add minimal overhead (~5% increase)

### Medium Risk (1,000+ users)
- Switch to Blaze plan required
- Costs remain under $5/month

### High Risk Scenarios
| Risk | Mitigation |
|------|------------|
| Runaway reads from bots | Rate limiting, authentication required |
| Large canvas storage | Node limit enforcement (100 nodes free, 999 admin) |
| Orphaned documents | Auto-cleanup after 30 days |

---

## Monitoring Recommendations

### Firebase Console Alerts
```
Set alerts for:
- Daily reads > 40,000 (80% of free tier)
- Daily writes > 16,000 (80% of free tier)
- Storage > 800MB (80% of free tier)
```

### Dashboard Metrics
Track via existing Admin Hub:
- Total capsules stored
- Active users (weekly)
- Average canvas size
- Collaboration rate (% with >1 collaborator)

---

## Conclusion

**Unity Notes collaboration is cost-efficient at scale:**

| Scale | Monthly Cost | Per-User Cost |
|-------|-------------|---------------|
| 10 users | $0 | $0 |
| 100 users | $0 | $0 |
| 1,000 users | $0.43 | $0.0004 |
| 10,000 users | $4.71 | $0.0005 |

The v3 collaboration model adds minimal Firestore overhead while enabling full sharing/collaboration features. The primary cost driver remains storage, not operations.

---

## Appendix: Cleanup Function Impact

The `cleanupOldCapsules` function (added Dec 14, 2025) helps control costs:

```javascript
// Cleanup criteria:
- Auto-saved capsules (no explicit save)
- Zero views
- Older than 30 days
- Preview first (shows count before delete)
```

**Expected Impact:**
- Reduces storage by ~60% for orphaned capsules
- Prevents accumulation of test/abandoned canvases
- Maintains healthy document count for query performance
