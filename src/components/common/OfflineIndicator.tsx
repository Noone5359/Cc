import { WifiOff, Wifi } from 'lucide-react';
import React, { useState, useEffect } from 'react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineMessage(true);
      // Hide the "back online" message after 3 seconds
      setTimeout(() => setShowOnlineMessage(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineMessage(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show "back online" message temporarily
  if (showOnlineMessage) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fadeIn">
        <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3">
          <Wifi size={20} />
          <span className="font-medium">Back online!</span>
        </div>
      </div>
    );
  }

  // Show "offline" indicator when offline
  if (!isOnline) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fadeIn">
        <div className="bg-orange-500 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3">
          <WifiOff size={20} />
          <div>
            <div className="font-medium">You're offline</div>
            <div className="text-sm text-white/90">Some features may be limited</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
