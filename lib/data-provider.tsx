"use client"

import useSWR, { SWRConfig } from 'swr';
import { ReactNode } from 'react';

// Fast fetcher with error handling
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error: any = new Error('An error occurred while fetching the data.');
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }
  return res.json();
};

// SWR configuration for app-like performance
export const swrConfig = {
  fetcher,
  revalidateOnFocus: false, // Don't refetch on window focus for faster feel
  revalidateOnReconnect: true, // Refetch on reconnect
  dedupingInterval: 2000, // Dedupe requests within 2s
  focusThrottleInterval: 5000, // Throttle focus revalidation
  errorRetryCount: 3, // Retry failed requests
  errorRetryInterval: 5000, // Wait 5s between retries
  keepPreviousData: true, // Keep showing old data while fetching new
};

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  );
}

// Custom hooks for common data
export function usePosts() {
  const { data, error, isLoading, mutate } = useSWR('/api/posts', fetcher, {
    refreshInterval: 30000, // Refresh every 30s
  });

  return {
    posts: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function usePost(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/posts/${id}` : null,
    fetcher
  );

  return {
    post: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useComments(postId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    postId ? `/api/comments?post_id=${postId}` : null,
    fetcher
  );

  return {
    comments: data,
    isLoading,
    isError: error,
    mutate,
  };
}
