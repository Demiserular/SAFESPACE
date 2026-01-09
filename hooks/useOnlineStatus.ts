"use client"

import { useState, useEffect } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isReconnecting, setIsReconnecting] = useState(false)

  useEffect(() => {
    // Check if we're in browser environment
    if (typeof navigator === 'undefined') return

    // Set initial status
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsReconnecting(true)
      // Small delay to show reconnecting state
      setTimeout(() => {
        setIsOnline(true)
        setIsReconnecting(false)
      }, 1000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setIsReconnecting(false)
    }

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, isReconnecting }
}