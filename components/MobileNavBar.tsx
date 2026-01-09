"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, PlusSquare, Heart, User, LogIn, MessageSquare, MessageCircle } from "lucide-react"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { useEffect, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"

export function MobileNavBar() {
  const pathname = usePathname()
  const { user, initialized } = useSupabaseAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Removed all JavaScript positioning - relying on CSS only
  }, [])

  const isActive = (path: string) => {
    return pathname === path
  }

  // Don't render anything until client-side hydration is complete
  if (!mounted) {
    return null
  }

  // Only show header on home page, but show navbar on all pages
  const showMobileHeader = pathname === '/'

  return (
    <>
      {/* Mobile Header with Theme Toggle - Only show on home page */}
      {showMobileHeader && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-sm border-b border-border md:hidden">
          <div className="flex justify-between items-center h-14 px-4">
            <div className="w-10">
              {/* Empty div for spacing */}
            </div>
            <Link href="/" className="safe-space-logo-mobile hover:no-underline">
              Safe-Space
            </Link>
            <div className="flex items-center">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation - Show on all pages */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[999999] bg-background/95 backdrop-blur-sm border-t border-border md:hidden safe-area-inset-bottom mobile-navbar-fixed"
        style={{
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          top: 'auto',
          width: '100vw',
          height: '64px',
          zIndex: 999999,
          transform: 'none',
          transition: 'none',
          animation: 'none',
          margin: '0',
          contain: 'strict',
          isolation: 'isolate'
        }}
      >
        <div className="flex justify-around items-center h-16 px-2">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center w-full h-full p-2 touch-manipulation transition-colors ${isActive('/') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1 font-medium">Home</span>
          </Link>

          <Link
            href="/chat-rooms"
            className={`flex flex-col items-center justify-center w-full h-full p-2 touch-manipulation transition-colors ${isActive('/chat-rooms') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs mt-1 font-medium">Chat</span>
          </Link>

          {initialized && (
            user ? (
              <Link
                href="/create-post"
                className={`flex flex-col items-center justify-center w-full h-full p-2 touch-manipulation transition-colors ${isActive('/create-post') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <PlusSquare className="h-5 w-5" />
                <span className="text-xs mt-1 font-medium">Post</span>
              </Link>
            ) : (
              <Link
                href="/signup"
                className={`flex flex-col items-center justify-center w-full h-full p-2 touch-manipulation transition-colors ${isActive('/signup') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <PlusSquare className="h-5 w-5" />
                <span className="text-xs mt-1 font-medium">Sign Up</span>
              </Link>
            )
          )}


          {initialized && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex flex-col items-center justify-center w-full h-full p-2 touch-manipulation transition-colors ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <User className="h-5 w-5" />
                    <span className="text-xs mt-1 font-medium">Profile</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mb-2">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/feedback" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Give Feedback
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/login"
                className={`flex flex-col items-center justify-center w-full h-full p-2 touch-manipulation transition-colors ${isActive('/login') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <LogIn className="h-5 w-5" />
                <span className="text-xs mt-1 font-medium">Login</span>
              </Link>
            )
          )}
        </div>
      </div>
    </>
  )
}