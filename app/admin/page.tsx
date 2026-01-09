"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Shield, 
  BarChart3, 
  Flag, 
  Users, 
  Settings, 
  ArrowLeft,
  AlertCircle,
  Loader2
} from "lucide-react"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { PostsService } from "@/lib/posts-service"
import Link from "next/link"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalComments: 0,
    pendingReports: 0,
    moderatedContent: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, loading: authLoading } = useSupabaseAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    // Check if user is admin
    const checkAdminStatus = async () => {
      if (!user) return
      
      try {
        const { data, error } = await PostsService.getUserRole(user.id)
        if (error || !data || !['admin', 'moderator'].includes(data.role)) {
          router.push('/')
        }
      } catch (err) {
        router.push('/')
      }
    }

    checkAdminStatus()
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch basic stats
      const [posts, comments, reports, moderatedPosts, moderatedComments] = await Promise.all([
        PostsService.getPosts(undefined, 1000), // Get all posts for count
        PostsService.getCommentsForModeration(), // This will get all comments
        PostsService.getReports('pending'),
        PostsService.getPostsForModeration(),
        PostsService.getCommentsForModeration()
      ])

      setStats({
        totalPosts: posts.length,
        totalComments: comments.length,
        pendingReports: reports.length,
        moderatedContent: moderatedPosts.length + moderatedComments.length
      })
    } catch (err: any) {
      console.error("Error fetching stats:", err)
      setError(err.message || "Failed to load admin statistics")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your community platform</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
               Your Community posts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComments}</div>
            <p className="text-xs text-muted-foreground">
              User comments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReports}</div>
            <p className="text-xs text-muted-foreground">
              Need review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderated Content</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.moderatedContent}</div>
            <p className="text-xs text-muted-foreground">
              Posts & comments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Posts Management
            </CardTitle>
            <CardDescription>
              View, edit, delete and moderate all community posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/posts">
                Manage Posts
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Content Moderation
            </CardTitle>
            <CardDescription>
              Review and moderate posts, comments, and user reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/moderation">
                Manage Content
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Feedback Analytics
            </CardTitle>
            <CardDescription>
              View user feedback and platform analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/feedback">
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage user roles and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/admin/users">
                Manage Users
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Platform Settings
            </CardTitle>
            <CardDescription>
              Configure platform settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/admin/settings">
                Configure
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button variant="outline" size="sm">
              <Flag className="h-4 w-4 mr-2" />
              Review Reports
            </Button>
            <Button variant="outline" size="sm">
              <Shield className="h-4 w-4 mr-2" />
              Moderate Content
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 