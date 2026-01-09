'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { LogOut, Settings, User, Mail, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, loading, signOut } = useSupabaseAuth();
  const router = useRouter();
  const [initials, setInitials] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }

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
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mx-auto max-w-3xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.user_metadata?.avatar_url || ''} alt={user.email || 'User'} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-center sm:text-left">
              <CardTitle className="text-2xl">{user.user_metadata?.full_name || user.email?.split('@')[0]}</CardTitle>
              <CardDescription className="flex items-center justify-center sm:justify-start">
                <Mail className="mr-2 h-4 w-4" />
                {user.email}
              </CardDescription>
              <CardDescription className="flex items-center justify-center sm:justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Joined {new Date(user.created_at || '').toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <Tabs defaultValue="posts">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="saved">Saved</TabsTrigger>
            </TabsList>
            <TabsContent value="posts" className="mt-6">
              <div className="rounded-lg border p-8 text-center">
                <User className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Posts Yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  When you create posts, they will appear here.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="comments" className="mt-6">
              <div className="rounded-lg border p-8 text-center">
                <User className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Comments Yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  When you comment on posts, they will appear here.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="saved" className="mt-6">
              <div className="rounded-lg border p-8 text-center">
                <User className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Saved Posts</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  When you save posts, they will appear here.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <Separator />
        <CardFooter className="flex justify-between pt-6">
          <Link href="/settings">
            <Button variant="outline" size="sm" className="gap-1">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
          <Button variant="destructive" size="sm" className="gap-1" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
