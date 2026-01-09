"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  AlertTriangle, 
  ArrowLeft, 
  Eye, 
  Shield, 
  Trash2, 
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle
} from "lucide-react"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { PostsService } from "@/lib/posts-service"
import type { Post, Comment, Report } from "@/lib/types"
import Link from "next/link"

export default function AdminModerationPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<Post | Comment | Report | null>(null)
  const [moderationReason, setModerationReason] = useState("")
  const [isModerating, setIsModerating] = useState(false)
  const { user, loading: authLoading } = useSupabaseAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    // Check if user is admin/moderator
    const checkPermissions = async () => {
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

    checkPermissions()
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch posts, comments, and reports that need moderation
      const [postsData, commentsData, reportsData] = await Promise.all([
        PostsService.getPostsForModeration(),
        PostsService.getCommentsForModeration(),
        PostsService.getReports('pending')
      ])
      
      setPosts(postsData)
      setComments(commentsData)
      setReports(reportsData)
    } catch (err: any) {
      console.error("Error fetching moderation data:", err)
      setError(err.message || "Failed to load moderation data")
    } finally {
      setLoading(false)
    }
  }

  const handleModerate = async (action: 'moderate' | 'delete') => {
    if (!selectedItem) return

    setIsModerating(true)

    try {
      if ('title' in selectedItem) {
        // It's a post
        await PostsService.moderatePost(
          selectedItem.id, 
          action === 'delete' ? 'deleted' : 'moderated', 
          moderationReason
        )
      } else if ('post_id' in selectedItem && !('reporter_id' in selectedItem)) {
        // It's a comment
        await PostsService.moderateComment(
          selectedItem.id, 
          action === 'delete' ? 'deleted' : 'moderated', 
          moderationReason
        )
      } else if ('reporter_id' in selectedItem) {
        // It's a report
        await PostsService.updateReportStatus(
          selectedItem.id, 
          action === 'delete' ? 'resolved' : 'reviewed', 
          moderationReason
        )
      }

      setSelectedItem(null)
      setModerationReason("")
      fetchData() // Refresh data
    } catch (err: any) {
      console.error("Error moderating item:", err)
      setError(err.message || "Failed to moderate item")
    } finally {
      setIsModerating(false)
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
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Content Moderation</h1>
          <p className="text-muted-foreground">Manage posts, comments, and reports</p>
        </div>
      </div>

      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Reports ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Posts ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Comments ({comments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Reports</CardTitle>
              <CardDescription>
                User reports that require review
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending reports
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {report.post_id ? 'Post' : 'Comment'}
                          </Badge>
                        </TableCell>
                        <TableCell>{report.reason}</TableCell>
                        <TableCell>
                          {report.reporter_id ? 'Anonymous' : 'Anonymous'}
                        </TableCell>
                        <TableCell>
                          {new Date(report.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedItem(report)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Posts Requiring Moderation</CardTitle>
              <CardDescription>
                Posts that have been flagged or reported
              </CardDescription>
            </CardHeader>
            <CardContent>
              {posts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No posts requiring moderation
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="max-w-xs truncate">
                          {post.title}
                        </TableCell>
                        <TableCell>
                          {post.anonymous_username || 'Anonymous'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{post.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={post.status === 'moderated' ? 'destructive' : 'default'}>
                            {post.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(post.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedItem(post)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comments Requiring Moderation</CardTitle>
              <CardDescription>
                Comments that have been flagged or reported
              </CardDescription>
            </CardHeader>
            <CardContent>
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No comments requiring moderation
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comments.map((comment) => (
                      <TableRow key={comment.id}>
                        <TableCell className="max-w-xs truncate">
                          {comment.content}
                        </TableCell>
                        <TableCell>
                          {comment.anonymous_username || 'Anonymous'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={comment.status === 'moderated' ? 'destructive' : 'default'}>
                            {comment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(comment.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedItem(comment)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Moderation Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Moderate Content</DialogTitle>
            <DialogDescription>
              Review and take action on this content
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Content Preview:</h4>
                {'title' in selectedItem ? (
                  <div>
                    <p className="font-medium">{selectedItem.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{selectedItem.content}</p>
                  </div>
                ) : 'post_id' in selectedItem && !('reporter_id' in selectedItem) ? (
                  <p className="text-sm">{selectedItem.content}</p>
                ) : (
                  <div>
                    <p className="font-medium">Report: {selectedItem.reason}</p>
                    {selectedItem.description && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedItem.description}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Moderation Reason:</label>
                <Textarea
                  placeholder="Explain why this content is being moderated..."
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedItem(null)}
              disabled={isModerating}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleModerate('delete')}
              disabled={isModerating || !moderationReason.trim()}
            >
              {isModerating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
            <Button
              onClick={() => handleModerate('moderate')}
              disabled={isModerating || !moderationReason.trim()}
            >
              {isModerating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Moderate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 