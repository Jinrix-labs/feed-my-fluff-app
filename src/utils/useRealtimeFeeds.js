import { useEffect, useRef } from 'react';
import { subscribeToFeeds } from '@/lib/feeds';

/**
 * Hook to subscribe to realtime feed updates for a family group
 * @param {string} groupId - The family group ID
 * @param {Function} onUpdate - Callback function when feeds change
 */
export function useRealtimeFeeds(groupId, onUpdate) {
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!groupId) return;

    let unsubscribe = null;

    // Subscribe to realtime updates (async)
    subscribeToFeeds(groupId, (payload) => {
      // Call the callback with the payload
      onUpdate(payload);
    }).then((unsub) => {
      unsubscribeRef.current = unsub;
      unsubscribe = unsub;
    }).catch((error) => {
      console.error("Error subscribing to feeds:", error);
    });

    // Cleanup on unmount or groupId change
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [groupId, onUpdate]);
}

export default useRealtimeFeeds;

