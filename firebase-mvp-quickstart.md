# Firebase MVP Quick-Start Guide
## Shareable Time Capsule in 1.5-2 Hours

**Context:** Firebase project `yellowcircle-app` already exists! This guide focuses on implementing the client-side shareable URL functionality.

---

## Speed Comparison: Firebase vs. Alternatives

| Approach | Setup Time | Implementation Time | **Total Time** | Production Ready? |
|----------|-----------|---------------------|----------------|-------------------|
| **Firebase** | 10 min | 80-100 min | **1.5-2 hrs** | ✅ Yes |
| Cloudinary (hack) | 0 min | 150-210 min | 2.5-3.5 hrs | ❌ Hacky |
| GitHub Gist | 10 min | 180-240 min | 3-4 hrs | ⚠️ Questionable |

**Recommendation:** Firebase is the fastest AND most reliable option.

---

## Prerequisites

- [x] Firebase project `yellowcircle-app` exists (confirmed in `.firebaserc`)
- [x] Firebase hosting configured
- [x] Firebase Functions set up
- [ ] Firestore Database enabled in console
- [ ] Firebase credentials in `.env`

---

## Phase 1: Get Firebase Credentials (10 minutes)

### Step 1: Access Firebase Console
1. Go to https://console.firebase.google.com/project/yellowcircle-app
2. Click ⚙️ (Settings) → Project settings
3. Scroll to "Your apps" section
4. If no web app exists, click "Add app" → Web (</>) icon
5. Register app nickname: "Yellow Circle Web"
6. Copy the `firebaseConfig` object

### Step 2: Create `.env` File
Create `/Users/christophercooper_1/Dropbox/CC Projects/yellowcircle/yellow-circle/.env`:

```env
# Firebase Configuration (Project: yellowcircle-app)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=yellowcircle-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yellowcircle-app
VITE_FIREBASE_STORAGE_BUCKET=yellowcircle-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Cloudinary (existing - keep using)
VITE_CLOUDINARY_CLOUD_NAME=yellowcircle-io
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
```

### Step 3: Enable Firestore
1. In Firebase Console, go to "Build" → "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode"
4. Select location: `us-central1` (or closest to you)
5. Click "Enable"

---

## Phase 2: Install & Configure (15 minutes)

### Step 1: Install Firebase SDK
```bash
cd /Users/christophercooper_1/Dropbox/CC\ Projects/yellowcircle/yellow-circle
npm install firebase
```

### Step 2: Create Firebase Config
**File:** `src/config/firebase.js`

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
```

### Step 3: Test Connection
Create a simple test file or add this to TimeCapsulePage temporarily:

```javascript
import { db } from '../config/firebase';
import { collection } from 'firebase/firestore';

console.log('Firebase connected:', db.app.name);
```

---

## Phase 3: Implement Save Function (30 minutes)

### Step 1: Create Save Hook
**File:** `src/hooks/useFirebaseCapsule.js`

```javascript
import { useState } from 'react';
import { collection, doc, writeBatch, getDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useFirebaseCapsule = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveCapsule = async (nodes, edges, metadata = {}) => {
    setIsSaving(true);
    setError(null);

    try {
      const capsuleRef = doc(collection(db, 'capsules'));
      const capsuleId = capsuleRef.id;
      const batch = writeBatch(db);

      // Save capsule metadata
      batch.set(capsuleRef, {
        id: capsuleId,
        title: metadata.title || 'UK Travel Memories',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPublic: true,
        viewCount: 0
      });

      // Save nodes
      nodes.forEach(node => {
        const nodeRef = doc(db, `capsules/${capsuleId}/nodes`, node.id);
        batch.set(nodeRef, node);
      });

      // Save edges
      edges.forEach(edge => {
        const edgeRef = doc(db, `capsules/${capsuleId}/edges`, edge.id);
        batch.set(edgeRef, edge);
      });

      await batch.commit();
      console.log('✅ Capsule saved:', capsuleId);
      return capsuleId;

    } catch (err) {
      console.error('❌ Save failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const loadCapsule = async (capsuleId) => {
    setIsLoading(true);
    setError(null);

    try {
      const capsuleRef = doc(db, 'capsules', capsuleId);
      const capsuleSnap = await getDoc(capsuleRef);

      if (!capsuleSnap.exists()) {
        throw new Error('Capsule not found');
      }

      const nodesRef = collection(db, `capsules/${capsuleId}/nodes`);
      const nodesSnap = await getDocs(nodesRef);
      const nodes = nodesSnap.docs.map(doc => doc.data());

      const edgesRef = collection(db, `capsules/${capsuleId}/edges`);
      const edgesSnap = await getDocs(edgesRef);
      const edges = edgesSnap.docs.map(doc => doc.data());

      return {
        metadata: capsuleSnap.data(),
        nodes,
        edges
      };

    } catch (err) {
      console.error('❌ Load failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { saveCapsule, loadCapsule, isSaving, isLoading, error };
};
```

---

## Phase 4: Add Save Button to TimeCapsulePage (20 minutes)

### Step 1: Import Hook
Add to top of `src/pages/TimeCapsulePage.jsx`:

```javascript
import { useFirebaseCapsule } from '../hooks/useFirebaseCapsule';
import { useState } from 'react';
```

### Step 2: Add State & Hook
Inside the component:

```javascript
const { saveCapsule, isSaving } = useFirebaseCapsule();
const [shareUrl, setShareUrl] = useState('');
const [showShareModal, setShowShareModal] = useState(false);

const handleSaveAndShare = async () => {
  try {
    const capsuleId = await saveCapsule(nodes, edges, {
      title: 'UK Travel Memories'
    });

    const url = `${window.location.origin}/uk-memories/view/${capsuleId}`;
    setShareUrl(url);
    setShowShareModal(true);

    alert(`✅ Saved! Share URL: ${url}`);
  } catch (error) {
    alert('Failed to save: ' + error.message);
  }
};
```

### Step 3: Add Button to Header
Find the header section (around line 250-300) and add:

```javascript
<button
  onClick={handleSaveAndShare}
  disabled={isSaving || nodes.length === 0}
  style={{
    padding: '10px 20px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: isSaving ? 'wait' : 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    opacity: nodes.length === 0 ? 0.5 : 1,
    marginLeft: '10px'
  }}
>
  {isSaving ? '💾 Saving...' : '🔗 Save & Share'}
</button>
```

---

## Phase 5: Create Public View Page (30 minutes)

### Step 1: Create CapsuleViewPage
**File:** `src/pages/CapsuleViewPage.jsx`

```javascript
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import DraggablePhotoNode from '../components/travel/DraggablePhotoNode';
import { useFirebaseCapsule } from '../hooks/useFirebaseCapsule';

const nodeTypes = {
  photoNode: DraggablePhotoNode,
};

const CapsuleViewPage = () => {
  const { capsuleId } = useParams();
  const navigate = useNavigate();
  const { loadCapsule, isLoading, error } = useFirebaseCapsule();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    const fetchCapsule = async () => {
      try {
        const data = await loadCapsule(capsuleId);
        setNodes(data.nodes);
        setEdges(data.edges);
        setMetadata(data.metadata);
      } catch (err) {
        console.error('Failed to load capsule:', err);
      }
    };

    if (capsuleId) {
      fetchCapsule();
    }
  }, [capsuleId]);

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <p style={{ fontSize: '18px', color: '#666' }}>⏳ Loading time capsule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fee'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>❌ Capsule Not Found</h2>
          <button onClick={() => navigate('/uk-memories')}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0 }}>
      {/* Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        backgroundColor: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>
          {metadata?.title || 'Travel Memories'} (Read-Only)
        </h1>
        <button
          onClick={() => navigate('/uk-memories')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#EECF00',
            border: 'none',
            borderRadius: '4px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Create Your Own
        </button>
      </div>

      {/* Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 50%, #f0f0f0 100%)',
        zIndex: 10
      }} />

      {/* React Flow - Read Only */}
      <div style={{ width: '100%', height: '100%', paddingTop: '80px', position: 'relative', zIndex: 20 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnScroll={true}
          minZoom={0.5}
          maxZoom={2.5}
        >
          <Background
            variant="dots"
            gap={24}
            size={2}
            color="#fbbf24"
            style={{ opacity: 0.4 }}
          />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
};

export default CapsuleViewPage;
```

### Step 2: Add Route
**File:** `src/RouterApp.jsx`

Add this import:
```javascript
import CapsuleViewPage from './pages/CapsuleViewPage';
```

Add this route (find the `<Routes>` section):
```javascript
<Route path="/uk-memories/view/:capsuleId" element={<CapsuleViewPage />} />
```

---

## Phase 6: Set Firestore Security Rules (5 minutes)

1. Go to Firebase Console → Firestore Database → Rules
2. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /capsules/{capsuleId} {
      allow read: if true;  // Public read
      allow create: if true;  // Anyone can create

      match /nodes/{nodeId} {
        allow read: if true;
        allow write: if true;  // Simplified for MVP
      }

      match /edges/{edgeId} {
        allow read: if true;
        allow write: if true;  // Simplified for MVP
      }
    }
  }
}
```

3. Click "Publish"

---

## Testing Checklist (10 minutes)

### Test Save Flow
- [ ] Open http://localhost:5173/uk-memories
- [ ] Upload a photo
- [ ] Click "Save & Share" button
- [ ] Verify alert shows URL
- [ ] Copy the URL

### Test Load Flow
- [ ] Open the copied URL in new tab
- [ ] Verify photo appears in read-only view
- [ ] Verify you can't drag or edit
- [ ] Verify "Create Your Own" button works

### Test Multiple Capsules
- [ ] Create second capsule with different photos
- [ ] Verify both URLs work independently
- [ ] Verify photos don't mix between capsules

---

## Deployment (5 minutes)

```bash
# Build production version
npm run build

# Deploy to Firebase Hosting
firebase deploy
```

Your shareable URLs will work at: `https://yellowcircle-app.web.app/uk-memories/view/{id}`

---

## Total Time Breakdown

| Phase | Task | Time |
|-------|------|------|
| 1 | Get Firebase credentials | 10 min |
| 2 | Install & configure | 15 min |
| 3 | Implement save function | 30 min |
| 4 | Add save button | 20 min |
| 5 | Create public view page | 30 min |
| 6 | Security rules | 5 min |
| Testing | End-to-end testing | 10 min |
| **Total** | | **120 min (2 hours)** |

---

## Why Firebase Wins Over Alternatives

### vs. Cloudinary (Hacky JSON Upload)
- ❌ Cloudinary not designed for JSON data
- ❌ No update capability (immutable uploads)
- ❌ Awkward URL structure
- ❌ More debugging time (30-60 min extra)

### vs. GitHub Gist API
- ❌ Requires GitHub authentication
- ❌ Rate limits (60 requests/hour)
- ❌ Not designed for app data
- ❌ 1-2 hours slower implementation

### ✅ Firebase Advantages
- Purpose-built for this exact use case
- Simple 25-line save function
- Automatic unique ID generation
- Production-ready security rules
- Scales automatically
- Free tier: 50k reads/day

---

## Next Steps After MVP

1. **Add ShareModal Component** (10 min) - Nice copy-to-clipboard UI
2. **Add View Counter** (5 min) - Track how many times capsule is viewed
3. **Add Update Capability** (15 min) - Allow editing existing capsules
4. **Add Export/Import** (20 min) - JSON backup fallback

Total: ~50 minutes of polish for production-ready feature.
