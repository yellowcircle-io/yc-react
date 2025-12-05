/**
 * Firestore Storage Adapter
 * Primary storage for Unity Platform
 *
 * Collections:
 * - contacts (prospects, leads, clients)
 * - journeys (campaigns, sequences)
 * - canvases (UnityNotes workspaces)
 * - assets (UnityStudio creations)
 * - workspaces (multi-tenant isolation)
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';

// Firebase config from environment
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton)
let db = null;

const getDb = () => {
  if (!db) {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
  }
  return db;
};

/**
 * Create a collection interface for a given collection name
 * @param {string} collectionName
 * @param {string} workspaceId - Optional workspace namespace
 */
const createCollectionInterface = (collectionName, workspaceId = null) => {
  const getCollectionRef = () => {
    const db = getDb();
    if (workspaceId) {
      return collection(db, 'workspaces', workspaceId, collectionName);
    }
    return collection(db, collectionName);
  };

  return {
    /**
     * Create a new document
     */
    create: async (data) => {
      const colRef = getCollectionRef();
      const docRef = await addDoc(colRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: docRef.id, ...data };
    },

    /**
     * Update an existing document
     */
    update: async (id, data) => {
      const db = getDb();
      const docRef = workspaceId
        ? doc(db, 'workspaces', workspaceId, collectionName, id)
        : doc(db, collectionName, id);

      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return { id, ...data };
    },

    /**
     * Get a single document by ID
     */
    get: async (id) => {
      const db = getDb();
      const docRef = workspaceId
        ? doc(db, 'workspaces', workspaceId, collectionName, id)
        : doc(db, collectionName, id);

      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;

      return { id: docSnap.id, ...docSnap.data() };
    },

    /**
     * List documents with optional filters
     */
    list: async (filters = {}) => {
      const colRef = getCollectionRef();
      let q = query(colRef);

      // Apply filters
      Object.entries(filters).forEach(([field, value]) => {
        if (field === '_limit') {
          q = query(q, limit(value));
        } else if (field === '_orderBy') {
          q = query(q, orderBy(value.field, value.direction || 'asc'));
        } else if (value !== undefined && value !== null) {
          q = query(q, where(field, '==', value));
        }
      });

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * Delete a document
     */
    delete: async (id) => {
      const db = getDb();
      const docRef = workspaceId
        ? doc(db, 'workspaces', workspaceId, collectionName, id)
        : doc(db, collectionName, id);

      await deleteDoc(docRef);
    },

    /**
     * Query with custom conditions
     */
    query: async (conditions) => {
      const colRef = getCollectionRef();
      let q = query(colRef);

      conditions.forEach((condition) => {
        const [field, op, value] = condition;
        q = query(q, where(field, op, value));
      });

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    },
  };
};

/**
 * Firestore Storage Adapter
 */
const firestoreAdapter = {
  name: 'firestore',

  // Default collections (global namespace)
  contacts: createCollectionInterface('contacts'),
  journeys: createCollectionInterface('journeys'),
  canvases: createCollectionInterface('canvases'),
  assets: createCollectionInterface('assets'),

  /**
   * Get collection interface for any collection
   */
  collection: (name, workspaceId = null) => createCollectionInterface(name, workspaceId),

  /**
   * Get workspace-scoped storage
   * All collections will be namespaced under /workspaces/{workspaceId}/
   */
  workspace: (workspaceId) => ({
    contacts: createCollectionInterface('contacts', workspaceId),
    journeys: createCollectionInterface('journeys', workspaceId),
    canvases: createCollectionInterface('canvases', workspaceId),
    assets: createCollectionInterface('assets', workspaceId),
    collection: (name) => createCollectionInterface(name, workspaceId),
  }),

  /**
   * Check if Firestore is configured
   */
  isConfigured: () => !!import.meta.env.VITE_FIREBASE_PROJECT_ID,

  /**
   * Get provider info
   */
  getInfo: () => ({
    name: 'Firestore',
    freeTier: '50K reads/day, 20K writes/day',
    namespacing: 'supported',
  }),
};

export default firestoreAdapter;
