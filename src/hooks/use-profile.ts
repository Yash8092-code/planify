"use client";

import useSWR from "swr";
import { Profile } from "@/lib/types";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to fetch");
  return json.data;
};

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR<Profile | null>(
    "/api/profile",
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  );

  const signOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      mutate(null, false);
      window.location.href = "/onboarding";
    } catch (err) {
      console.error("Signout error:", err);
    }
  };

  return {
    profile: data ?? null,
    isLoading,
    isError: !!error,
    error,
    hasProfile: data !== null && data !== undefined,
    mutate,
    signOut,
  };
}
