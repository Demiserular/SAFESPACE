"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import LoaderCollection, { LoaderType } from './ui/LoaderCollection';

type LoadingContextType = {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
};

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  setLoading: () => { },
});

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({
  children
}: {
  children: React.ReactNode
}) => {
  const [isLoading, setLoading] = useState(false);
  const [loaderType, setLoaderType] = useState<LoaderType>('pulse');
  const [loadingMessage, setLoadingMessage] = useState('Loading');
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Minimalistic loading messages
  const loadingMessages = [
    "Loading",
    "Please wait",
    "One moment",
    "Processing",
  ];

  // Function to randomly select a loader type
  const getRandomLoaderType = (): LoaderType => {
    const loaderTypes: LoaderType[] = ['pulse', 'bounce', 'wave', 'spin', 'dots', 'progress'];
    const randomIndex = Math.floor(Math.random() * loaderTypes.length);
    return loaderTypes[randomIndex];
  };

  // Function to randomly select a loading message
  const getRandomLoadingMessage = (): string => {
    const randomIndex = Math.floor(Math.random() * loadingMessages.length);
    return loadingMessages[randomIndex];
  };

  // Track route changes to show loader
  useEffect(() => {
    // This effect runs on mount and when pathname or searchParams change
    const handleRouteChangeStart = () => {
      // Select a random loader type and message for each navigation
      setLoaderType(getRandomLoaderType());
      setLoadingMessage(getRandomLoadingMessage());
      setLoading(true);
    };

    const handleRouteChangeComplete = () => {
      // Add a small delay to make the loader visible even for fast page loads
      setTimeout(() => {
        setLoading(false);
      }, 800); // Increased from 500ms to 800ms for better visibility
    };

    // Show loader on route change
    handleRouteChangeStart();
    handleRouteChangeComplete();

  }, [pathname, searchParams]);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      {isLoading && <LoaderCollection type={loaderType} message={loadingMessage} />}
      {children}
    </LoadingContext.Provider>
  );
};

export default LoadingProvider;
