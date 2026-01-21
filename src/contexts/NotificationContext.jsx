/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  addDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

/**
 * NotificationContext - Real-time in-app notifications
 *
 * Notification Types:
 * - folder_shared: Someone shared a folder with you
 * - link_shared: Someone shared a link with you
 * - link_added_to_shared_folder: New link added to a shared folder
 * - canvas_shared: Someone shared a canvas with you
 *
 * Data Model (notifications collection):
 * {
 *   userId: string,           // Recipient user ID
 *   userEmail: string,        // Recipient email (for email-based queries)
 *   type: string,             // Notification type
 *   title: string,            // Short title
 *   message: string,          // Full message
 *   read: boolean,            // Has been read
 *   dismissed: boolean,       // Permanently dismissed
 *   actionUrl: string,        // Optional URL to navigate to
 *   metadata: object,         // Type-specific data (folderId, linkId, etc.)
 *   createdAt: timestamp,
 *   readAt: timestamp | null
 * }
 */

const NotificationContext = createContext(null);

// Notification type constants
export const NOTIFICATION_TYPES = {
  FOLDER_SHARED: 'folder_shared',
  LINK_SHARED: 'link_shared',
  LINK_ADDED_TO_SHARED_FOLDER: 'link_added_to_shared_folder',
  CANVAS_SHARED: 'canvas_shared',
  SYSTEM: 'system'
};

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Query notifications for this user (by ID or email)
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid),
      where('dismissed', '==', false),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));

        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
        setLoading(false);
      },
      (error) => {
        console.error('[NotificationContext] Error listening to notifications:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Mark a single notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, {
        read: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('[NotificationContext] Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.uid || notifications.length === 0) return;

    try {
      const batch = writeBatch(db);
      const unreadNotifs = notifications.filter(n => !n.read);

      unreadNotifs.forEach(notif => {
        const notifRef = doc(db, 'notifications', notif.id);
        batch.update(notifRef, {
          read: true,
          readAt: serverTimestamp()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('[NotificationContext] Error marking all as read:', error);
    }
  }, [user?.uid, notifications]);

  // Dismiss a notification (soft delete)
  const dismissNotification = useCallback(async (notificationId) => {
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, {
        dismissed: true
      });
    } catch (error) {
      console.error('[NotificationContext] Error dismissing notification:', error);
    }
  }, []);

  // Delete a notification (hard delete)
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notifRef);
    } catch (error) {
      console.error('[NotificationContext] Error deleting notification:', error);
    }
  }, []);

  // Clear all dismissed notifications (admin cleanup)
  const clearDismissed = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', user.uid),
        where('dismissed', '==', true)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('[NotificationContext] Error clearing dismissed:', error);
    }
  }, [user?.uid]);

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    deleteNotification,
    clearDismissed
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook to use notification context
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Helper function to create a notification (called from sharing functions)
export async function createNotification({
  userId,
  userEmail,
  type,
  title,
  message,
  actionUrl = null,
  metadata = {}
}) {
  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId,
      userEmail: userEmail?.toLowerCase() || null,
      type,
      title,
      message,
      actionUrl,
      metadata,
      read: false,
      dismissed: false,
      createdAt: serverTimestamp()
    });
    console.log(`[Notification] Created: ${type} for ${userEmail || userId}`);
    return true;
  } catch (error) {
    console.error('[Notification] Error creating notification:', error);
    return false;
  }
}

export default NotificationContext;
