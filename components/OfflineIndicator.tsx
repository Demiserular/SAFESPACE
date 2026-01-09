"use client"

import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Wifi, WifiOff, Loader2 } from 'lucide-react'

export function OfflineIndicator() {
  const { isOnline, isReconnecting } = useOnlineStatus()

  if (isOnline && !isReconnecting) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-2">
      <Alert 
        className={`mx-auto max-w-md transition-all duration-300 ${
          isReconnecting 
            ? 'bg-yellow-500/90 text-yellow-100 border-yellow-400' 
            : 'bg-red-500/90 text-red-100 border-red-400'
        } backdrop-blur-sm`}
      >
        <div className="flex items-center gap-2">
          {isReconnecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          <AlertDescription className="font-medium">
            {isReconnecting 
              ? 'Reconnecting...'
              : 'You\'re offline. Some features may be limited.'
            }
          </AlertDescription>
        </div>
      </Alert>
    </div>
  )
}