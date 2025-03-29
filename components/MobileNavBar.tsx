"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Search, PlusSquare, Heart, User, LogIn, MessageSquare, MessageCircle } from "lucide-react"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { useEffect, useState } from "react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger, 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function MobileNavBar() {
  const pathname = usePathname()
  const { user, loading, initialized } = useSupabaseAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const isActive = (path: string) => {
    return pathname === path
  }

  // Don't render anything until client-side hydration is complete
  if (!mounted) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex justify-around items-center h-16">
        <Link href="/" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`}>
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <Link href="/chat/1" className={`flex flex-col items-center justify-center w-full h-full ${pathname.startsWith('/chat') ? 'text-primary' : 'text-muted-foreground'}`}>
          <MessageSquare className="h-6 w-6" />
          <span className="text-xs mt-1">Chat</span>
        </Link>
        
        {initialized && (
          user ? (
            <Link href="/create-post" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/create-post') ? 'text-primary' : 'text-muted-foreground'}`}>
              <PlusSquare className="h-6 w-6" />
              <span className="text-xs mt-1">Post</span>
            </Link>
          ) : (
            <Link href="/signup" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/signup') ? 'text-primary' : 'text-muted-foreground'}`}>
              <PlusSquare className="h-6 w-6" />
              <span className="text-xs mt-1">Sign Up</span>
            </Link>
          )
        )}
        
        <Link href="/ai-support" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/ai-support') ? 'text-primary' : 'text-muted-foreground'}`}>
          <Heart className="h-6 w-6" />
          <span className="text-xs mt-1">Support</span>
        </Link>
        
        {initialized && (
          user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`flex flex-col items-center justify-center w-full h-full ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground'}`}>
                  <User className="h-6 w-6" />
                  <span className="text-xs mt-1">Profile</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/profile">My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/feedback">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Give Feedback
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/login') ? 'text-primary' : 'text-muted-foreground'}`}>
              <LogIn className="h-6 w-6" />
              <span className="text-xs mt-1">Login</span>
            </Link>
          )
        )}
      </div>
    </div>
  )
}