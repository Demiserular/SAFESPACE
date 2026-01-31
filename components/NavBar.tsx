'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartPulse, LogIn, UserPlus, User, Settings, LogOut, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useEffect } from "react";

export function NavBar() {
  const pathname = usePathname();
  const { user, loading, initialized, signOut } = useSupabaseAuth();
  const [initials, setInitials] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user?.email) {
      // Generate initials from email
      const email = user.email;
      const nameParts = email.split('@')[0].split('.');
      if (nameParts.length > 1) {
        setInitials(`${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase());
      } else {
        setInitials(email.substring(0, 2).toUpperCase());
      }
    }
  }, [user]);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Don't render anything until client-side hydration is complete
  if (!mounted) {
    return (
      <nav className="bg-background border-b border-border py-4 hidden md:block">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="safe-space-logo hover:no-underline">
            Safe-Space
          </Link>
          <div className="flex items-center gap-4"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-background border-b border-border py-3 hidden md:block">
      <div className="container mx-auto flex items-center justify-between">
        {/* Left side - Brand */}
        <div className="flex items-center">
          <Link
            href="/"
            className="safe-space-logo hover:no-underline"
          >
            Safe-Space
          </Link>
        </div>

        {/* Center - Navigation Links */}
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="h-9 px-3">
            <Link
              href="/chat-rooms"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive("/chat-rooms")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Chat Rooms
            </Link>
          </Button>

          <Button asChild variant="ghost" size="sm" className="h-9 px-3">
            <Link
              href="/posts"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive("/posts")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Posts
            </Link>
          </Button>

          <Button asChild variant="ghost" size="sm" className="h-9 px-3">
            <Link
              href="/ai-support"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive("/ai-support")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <HeartPulse className="h-4 w-4" />
              AI Support
            </Link>
          </Button>
        </div>

        {/* Create Post Button */}
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="h-9">
            <Link href="/create-post" className="flex items-center gap-2">
              <PenSquare className="h-4 w-4" />
              Create Post
            </Link>
          </Button>
        </div>

        {/* Right side - Theme Toggle & User Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {initialized && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url || ''} alt={user.email || 'User'} />
                        <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium leading-none">
                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer flex items-center">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-1">
                  <Button asChild variant="ghost" size="sm" className="h-9">
                    <Link href="/login" className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      Login
                    </Link>
                  </Button>
                  <Button asChild variant="default" size="sm" className="h-9">
                    <Link href="/signup" className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Sign Up
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}