"use client";

import { useEffect } from "react";
import { useSWRConfig } from "swr";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/use-profile";

/**
 * Global Realtime hook that listens for changes on tasks, notes,
 * documents, and profiles for the current user and invalidates SWR caches.
 */
export function useRealtime() {
  const { profile } = useProfile();
  const { mutate } = useSWRConfig();

  useEffect(() => {
    if (!profile?.id) return;

    const supabase = createClient();
    const profileId = profile.id;

    // Create unique channel for this user
    const channel = supabase
      .channel(`planify-sync-${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `profile_id=eq.${profileId}`,
        },
        () => {
          // Invalidate tasks and stats caches across all open tabs/devices
          mutate(
            (key) => typeof key === "string" && (key.startsWith("/api/tasks") || key.startsWith("/api/statistics")),
            undefined,
            { revalidate: true }
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recurring_tasks",
          filter: `profile_id=eq.${profileId}`,
        },
        () => {
          mutate(
            (key) => typeof key === "string" && (key.startsWith("/api/rollback") || key.startsWith("/api/tasks") || key.startsWith("/api/statistics")),
            undefined,
            { revalidate: true }
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notes",
          filter: `profile_id=eq.${profileId}`,
        },
        () => {
          mutate(
            (key) => typeof key === "string" && key.startsWith("/api/notes"),
            undefined,
            { revalidate: true }
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
          filter: `profile_id=eq.${profileId}`,
        },
        () => {
          mutate(
            (key) => typeof key === "string" && key.startsWith("/api/documents"),
            undefined,
            { revalidate: true }
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${profileId}`,
        },
        () => {
          mutate("/api/profile", undefined, { revalidate: true });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Planify Realtime: Connected and synchronized across devices.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, mutate]);
}
