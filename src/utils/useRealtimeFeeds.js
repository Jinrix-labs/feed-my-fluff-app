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

    // Subscribe to realtime updates
    unsubscribeRef.current = subscribeToFeeds(groupId, (payload) => {
      // Call the callback with the payload
      onUpdate(payload);
    });

    // Cleanup on unmount or groupId change
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [groupId, onUpdate]);
}

export default useRealtimeFeeds;

