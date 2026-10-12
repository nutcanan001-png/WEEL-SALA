import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl bg-slate-900/90 border border-amber-500/40 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-amber-300 shadow-xl animate-fade-in">
        <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
        <span>โหมดออฟไลน์ — ใช้งานได้ครบถ้วนโดยไม่ต้องต่อเน็ต</span>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl bg-slate-900/90 border border-emerald-500/40 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-emerald-300 shadow-xl">
        <Wifi className="w-4 h-4 text-emerald-400" />
        <span>เชื่อมต่อสัญญาณออนไลน์แล้ว</span>
      </div>
    );
  }

  return null;
};
