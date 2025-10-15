# Firebase Backend Implementation Plan
## Travel Time Capsule - Shareable URLs & Cloud Persistence

## Overview
Transform the Travel Time Capsule from localStorage-only to a cloud-backed, shareable experience using Firebase (Firestore, Storage, and optional Auth).

---

## ✅ Existing Firebase Infrastructure

**Good News:** Firebase is already set up for this project!

### What's Already Configured
- **Firebase Project:** `yellowcircle-app` (confirmed in `.firebaserc`)
- **Firebase Hosting:** Configured to deploy from `dist/` directory
- **Firebase Functions:** Infrastructure ready with `firebase-admin` v12.6.0 and `firebase-functions` v6.0.1
- **GitHub:** Project exists at `yellowcircle/yellow-circle` (or similar)
- **Deployment:** `firebase deploy` command available

### What We Need to Add
- ⏳ Client-side Firebase SDK (install `firebase` package in main app)
- ⏳ Firestore Database (enable in Firebase Console if not already enabled)
- ⏳ Firebase configuration file: `src/config/firebase.js`
- ⏳ Environment variables for client-side SDK

### Impact on Timeline
**Original Estimate:** 2-3 hours
**Revised Estimate:** **1.5-2 hours** (Firebase project already exists!)

This significantly reduces Phase 1 time since we skip:
- ❌ Creating new Firebase project
- ❌ Setting up Firebase hosting
- ❌ Configuring deployment pipeline

---

## Phase 1: Firebase Setup & Configuration

### 1.1 Install Firebase SDK
```bash
npm install firebase@^10.7.0
```

### 1.2 Create Firebase Configuration File
**File:** `src/config/firebase.js`

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;
```

### 1.3 Environment Variables
**Create or update `.env`:**
```env
# Firebase Configuration (Project: yellowcircle-app)
# Get these from: https://console.firebase.google.com/project/yellowcircle-app/settings/general
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=yellowcircle-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yellowcircle-app
VITE_FIREBASE_STORAGE_BUCKET=yellowcircle-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Cloudinary (continue using for images)
VITE_CLOUDINARY_CLOUD_NAME=yellowcircle-io
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
```

### 1.4 Firebase Console Setup
**Since the project already exists, just verify/enable:**
1. Go to https://console.firebase.google.com/project/yellowcircle-app
2. ✅ Verify Firestore Database is enabled (or enable in production mode)
3. ✅ Verify Storage is enabled (or enable with default rules)
4. ⏳ Enable Authentication > Anonymous (optional, for tracking)

---

## Phase 2: Firestore Data Structure

### 2.1 Collections Design

```
capsules/
  {capsuleId}/
    - id: string (auto-generated)
    - title: string
    - description: string (optional)
    - createdAt: timestamp
    - updatedAt: timestamp
    - isPublic: boolean
    - ownerId: string (optional - for auth users)
    - viewCount: number

    nodes: subcollection
      {nodeId}/
        - id: string
        - type: 'photoNode'
        - position: { x: number, y: number }
        - data: {
            imageUrl: string (Cloudinary URL)
            location: string
            date: string
            description: string
            size: number
          }

    edges: subcollection
      {edgeId}/
        - id: string
        - source: string
        - target: string
        - type: string
```

### 2.2 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read access for all capsules
    match /capsules/{capsuleId} {
      allow read: if true;
      allow create: if true; // Anyone can create
      allow update, delete: if request.auth != null &&
                               resource.data.ownerId == request.auth.uid;

      // Subcollections inherit parent permissions
      match /nodes/{nodeId} {
        allow read: if true;
        allow write: if get(/databases/$(database)/documents/capsules/$(capsuleId)).data.ownerId == request.auth.uid ||
                        !exists(/databases/$(database)/documents/capsules/$(capsuleId)/nodes/$(nodeId));
      }

      match /edges/{edgeId} {
        allow read: if true;
        allow write: if get(/databases/$(database)/documents/capsules/$(capsuleId)).data.ownerId == request.auth.uid ||
                        !exists(/databases/$(database)/documents/capsules/$(capsuleId)/edges/$(edgeId));
      }
    }
  }
}
```

---

## Phase 3: Core Firebase Hooks

### 3.1 Save Capsule Hook
**File:** `src/hooks/useFirebaseCapsule.js`

```javascript
import { useState } from 'react';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const useFirebaseCapsule = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Save capsule to Firebase
   * @returns {string} capsuleId - Shareable ID
   */
  const saveCapsule = async (nodes, edges, metadata = {}) => {
    setIsSaving(true);
    setError(null);

    try {
      // Generate unique capsule ID
      const capsuleRef = doc(collection(db, 'capsules'));
      const capsuleId = capsuleRef.id;

      // Use batch writes for atomic operations
      const batch = writeBatch(db);

      // Save capsule metadata
      batch.set(capsuleRef, {
        id: capsuleId,
        title: metadata.title || 'UK Travel Memories',
        description: metadata.description || '',
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

  /**
   * Load capsule from Firebase
   */
  const loadCapsule = async (capsuleId) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get capsule metadata
      const capsuleRef = doc(db, 'capsules', capsuleId);
      const capsuleSnap = await getDoc(capsuleRef);

      if (!capsuleSnap.exists()) {
        throw new Error('Capsule not found');
      }

      // Get nodes
      const nodesRef = collection(db, `capsules/${capsuleId}/nodes`);
      const nodesSnap = await getDocs(nodesRef);
      const nodes = nodesSnap.docs.map(doc => doc.data());

      // Get edges
      const edgesRef = collection(db, `capsules/${capsuleId}/edges`);
      const edgesSnap = await getDocs(edgesRef);
      const edges = edgesSnap.docs.map(doc => doc.data());

      // Increment view count
      await updateDoc(capsuleRef, {
        viewCount: increment(1)
      });

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

  /**
   * Update existing capsule
   */
  const updateCapsule = async (capsuleId, nodes, edges) => {
    setIsSaving(true);
    setError(null);

    try {
      const batch = writeBatch(db);

      // Update timestamp
      const capsuleRef = doc(db, 'capsules', capsuleId);
      batch.update(capsuleRef, {
        updatedAt: serverTimestamp()
      });

      // Update nodes (delete all, then re-add)
      // Note: In production, implement smart diffing
      nodes.forEach(node => {
        const nodeRef = doc(db, `capsules/${capsuleId}/nodes`, node.id);
        batch.set(nodeRef, node);
      });

      edges.forEach(edge => {
        const edgeRef = doc(db, `capsules/${capsuleId}/edges`, edge.id);
        batch.set(edgeRef, edge);
      });

      await batch.commit();
      console.log('✅ Capsule updated');

    } catch (err) {
      console.error('❌ Update failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveCapsule,
    loadCapsule,
    updateCapsule,
    isSaving,
    isLoading,
    error
  };
};
```

---

## Phase 4: Update TimeCapsulePage Component

### 4.1 Add Save & Share Functionality

**Update:** `src/pages/TimeCapsulePage.jsx`

```javascript
import { useFirebaseCapsule } from '../hooks/useFirebaseCapsule';
import { useParams, useNavigate } from 'react-router-dom';

const TimeCapsuleFlow = () => {
  const { capsuleId } = useParams(); // For view mode
  const navigate = useNavigate();
  const { saveCapsule, loadCapsule, isSaving, isLoading } = useFirebaseCapsule();

  const [currentCapsuleId, setCurrentCapsuleId] = useState(capsuleId || null);
  const [shareUrl, setShareUrl] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  // Load capsule on mount if viewing
  useEffect(() => {
    if (capsuleId) {
      loadCapsuleData(capsuleId);
    }
  }, [capsuleId]);

  const loadCapsuleData = async (id) => {
    try {
      const data = await loadCapsule(id);
      setNodes(data.nodes);
      setEdges(data.edges);
      setCurrentCapsuleId(id);
    } catch (error) {
      alert('Failed to load capsule: ' + error.message);
    }
  };

  const handleSaveAndShare = async () => {
    try {
      const id = await saveCapsule(nodes, edges, {
        title: 'UK Travel Memories',
        description: 'My travel photo collection'
      });

      const url = `${window.location.origin}/uk-memories/view/${id}`;
      setShareUrl(url);
      setCurrentCapsuleId(id);
      setShowShareModal(true);

      // Update localStorage with capsule ID for later updates
      localStorage.setItem('current-capsule-id', id);

    } catch (error) {
      alert('Failed to save: ' + error.message);
    }
  };

  // Add button to header
  return (
    <>
      {/* In header section */}
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
          opacity: nodes.length === 0 ? 0.5 : 1
        }}
      >
        {isSaving ? '💾 Saving...' : '🔗 Save & Share'}
      </button>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          url={shareUrl}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
};
```

### 4.2 Create Share Modal Component

**File:** `src/components/travel/ShareModal.jsx`

```javascript
import React, { useState } from 'react';

const ShareModal = ({ url, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '32px',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>
          🎉 Your Time Capsule is Live!
        </h3>

        <p style={{ marginBottom: '16px', color: '#666' }}>
          Share this link with anyone to let them explore your travel memories:
        </p>

        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px'
        }}>
          <input
            type="text"
            value={url}
            readOnly
            style={{
              flex: 1,
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={handleCopy}
            style={{
              padding: '12px 24px',
              backgroundColor: copied ? '#10b981' : '#EECF00',
              color: copied ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#f3f4f6',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ShareModal;
```

---

## Phase 5: Add Public View Route

### 5.1 Create Public View Page

**File:** `src/pages/CapsuleViewPage.jsx`

```javascript
import React, { useEffect } from 'react';
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

  const [nodes, setNodes] = React.useState([]);
  const [edges, setEdges] = React.useState([]);
  const [metadata, setMetadata] = React.useState(null);

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
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
            animation: 'spin 2s linear infinite'
          }}>⏳</div>
          <p style={{ fontSize: '18px', color: '#666' }}>Loading time capsule...</p>
        </div>
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
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
            Capsule Not Found
          </h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            This time capsule doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#EECF00',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Go Home
          </button>
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
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>
            {metadata?.title || 'Travel Memories'}
          </h1>
          <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
            👁️ {metadata?.viewCount || 0} views • Read-only view
          </p>
        </div>
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
          zoomOnScroll={false}
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

### 5.2 Update Router

**File:** `src/RouterApp.jsx`

```javascript
import CapsuleViewPage from './pages/CapsuleViewPage';

// Add this route
<Route path="/uk-memories/view/:capsuleId" element={<CapsuleViewPage />} />
```

---

## Phase 6: Optional - Fallback Export/Import

### 6.1 JSON Export Hook

**File:** `src/hooks/useExportImport.js`

```javascript
export const useExportImport = () => {
  const exportToJSON = (nodes, edges, metadata = {}) => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      metadata,
      nodes,
      edges
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `travel-memories-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFromJSON = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  return { exportToJSON, importFromJSON };
};
```

---

## Implementation Timeline

### Week 1: Firebase Setup
- Day 1-2: Firebase project setup, configuration file
- Day 3: Firestore rules and data structure
- Day 4-5: Test Firebase connection and basic CRUD

### Week 2: Core Functionality
- Day 1-2: Implement save capsule hook
- Day 3: Implement load capsule hook
- Day 4-5: Update TimeCapsulePage with save/share

### Week 3: Public View & Polish
- Day 1-2: Create public view page
- Day 3: Add share modal
- Day 4: Testing and bug fixes
- Day 5: Optional export/import feature

---

## Testing Checklist

- [ ] Firebase connection works
- [ ] Can save capsule and get shareable URL
- [ ] Shareable URL loads correctly in new browser/incognito
- [ ] Read-only view prevents editing
- [ ] View counter increments
- [ ] Multiple capsules don't interfere with each other
- [ ] localStorage falls back if Firebase fails
- [ ] Export/Import works as backup

---

## Security Considerations

1. **Firestore Rules:** Public read, authenticated write
2. **Image URLs:** Use Cloudinary signed URLs for sensitive content
3. **Rate Limiting:** Consider Firebase App Check to prevent abuse
4. **Anonymous Auth:** Enable for better tracking without signup

---

## Next Steps

1. Set up Firebase project in console
2. Add Firebase config to `.env`
3. Implement `useFirebaseCapsule` hook
4. Update TimeCapsulePage with save/share button
5. Create public view route
6. Test end-to-end flow
