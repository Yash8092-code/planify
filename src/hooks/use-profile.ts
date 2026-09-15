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
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    profile: data ?? null,
    isLoading,
    isError: !!error,
    error,
    hasProfile: data !== null && data !== undefined,
    mutate,
  };
}
