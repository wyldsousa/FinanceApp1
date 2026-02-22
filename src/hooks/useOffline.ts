import { useState, useEffect, useCallback } from 'react';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Trigger sync when coming back online
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            // @ts-ignore - sync is not in all browsers yet
            if (registration.sync) {
              // @ts-ignore
              registration.sync.register('sync-transactions');
            }
          });
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  const syncWhenOnline = useCallback(async () => {
    if (isOnline) return true;
    
    return new Promise<boolean>((resolve) => {
      const checkOnline = () => {
        if (navigator.onLine) {
          resolve(true);
        }
      };
      
      window.addEventListener('online', checkOnline, { once: true });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        window.removeEventListener('online', checkOnline);
        resolve(false);
      }, 30000);
    });
  }, [isOnline]);

  return {
    isOnline,
    wasOffline,
    syncWhenOnline
  };
}
