"use client";

import React, { useState, useEffect } from "react";
import { Cloud, CloudOff, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncIndicatorProps {
  isSyncing?: boolean;
  className?: string;
  collapsed?: boolean;
}

export function SyncIndicator({ isSyncing = false, className, collapsed = false }: SyncIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 text-xs text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 transition-all",
          collapsed && "justify-center p-1 px-1",
          className
        )}
        title="Offline — changes will sync once connection returns"
      >
        <CloudOff className="h-3 w-3 shrink-0" />
        {!collapsed && <span className="font-medium truncate">Offline</span>}
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 transition-all",
          collapsed && "justify-center p-1 px-1",
          className
        )}
        title="Syncing changes with server..."
      >
        <Loader2 className="h-3 w-3 animate-spin shrink-0" />
        {!collapsed && <span className="font-medium truncate">Syncing...</span>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md",
        collapsed && "justify-center p-1",
        className
      )}
      title="All changes saved to cloud"
    >
      <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 shadow-xs shadow-emerald-500/50" />
      {!collapsed && <span className="text-[11px] font-medium truncate">All changes saved</span>}
    </div>
  );
}
