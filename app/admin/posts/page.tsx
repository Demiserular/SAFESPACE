"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Edit, 
  Trash2, 
  Eye, 
  Shield, 
  ArrowLeft,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter
} from "lucide-react"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import Link from "next/link"

interface Post {
  id: string
  title: string
  content: string
  category: string
  author_id: string
  anonymous_username?: string
  is_anonymous: boolean
  status: 'active' | 'moderated' | 'deleted'
  moderation_reason?: string
  moderated_by?: string
  moderated_at?: string
  created_at: string
  updated_at: string
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [moderateDialogOpen, setModerateDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    category: "",
    is_anonymous: false
  })
  const [moderationForm, setModerationForm] = useState({
    status: "active" as 'active' | 'moderated' | 'deleted',
    reason: ""
  })

  const { user, loading: authLoading } = useSupabaseAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    loadPosts()
  }, [user, authLoading, statusFilter])

  const loadPosts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== "all") {
        params.append('status', statusFilter)
      }
      params.append('limit', '100')

      const response = await fetch(`/api/admin/posts?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }
      const data = await response.json()
      setPosts(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (post: Post) => {
    setSelectedPost(post)
    setEditForm({
      title: post.title,
      content: post.content,
      category: post.category,
      is_anonymous: post.is_anonymous
    })
    setEditDialogOpen(true)
  }

  const handleModerate = (post: Post) => {
    setSelectedPost(post)
    setModerationForm({
      status: post.status,
      reason: post.moderation_reason || ""
    })
    setModerateDialogOpen(true)
  }

  const handleDelete = (post: Post) => {
    setSelectedPost(post)
    setDeleteDialogOpen(true)
  }

  const submitEdit = async () => {
    if (!selectedPost) return

    try {
      const response = await fetch(`/api/admin/posts/${selectedPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (!response.ok) {
        throw new Error('Failed to update post')
      }

      setEditDialogOpen(false)
      loadPosts()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const submitModeration = async () => {
    if (!selectedPost) return

    try {
      const response = await fetch(`/api/admin/posts/${selectedPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: moderationForm.status,
          moderation_reason: moderationForm.reason
        })
      })

      if (!response.ok) {
        throw new Error('Failed to moderate post')
      }

      setModerateDialogOpen(false)
      loadPosts()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const submitDelete = async (hardDelete = false) => {
    if (!selectedPost) return

    try {
      const url = hardDelete ? 
        `/api/admin/posts/${selectedPost.id}?hard=true` : 
        `/api/admin/posts/${selectedPost.id}`

      const response = await fetch(url, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }

      setDeleteDialogOpen(false)
      loadPosts()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
      case 'moderated':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Moderated</Badge>
      case 'deleted':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Deleted</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.anonymous_username && post.anonymous_username.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Posts Management</h1>
            <p className="text-muted-foreground">Manage and moderate all posts</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/create-post">
            <Plus className="w-4 h-4 mr-2" />
            Create Post
          </Link>
        </Button>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="moderated">Moderated</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Posts ({filteredPosts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{post.title}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-md">
                        {post.content.substring(0, 100)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {post.is_anonymous ? (
                      <span className="text-muted-foreground">
                        {post.anonymous_username || 'Anonymous'}
                      </span>
                    ) : (
                      <span>{post.author_id}</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(post.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{post.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(post.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        asChild
                      >
                        <Link href={`/posts/${post.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(post)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleModerate(post)}
                      >
                        <Shield className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(post)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>
              Make changes to the post content and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Input
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Moderation Dialog */}
      <Dialog open={moderateDialogOpen} onOpenChange={setModerateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Moderate Post</DialogTitle>
            <DialogDescription>
              Change the post status and add moderation reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={moderationForm.status} onValueChange={(value: any) => setModerationForm({ ...moderationForm, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="moderated">Moderated</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Moderation Reason</label>
              <Textarea
                value={moderationForm.reason}
                onChange={(e) => setModerationForm({ ...moderationForm, reason: e.target.value })}
                placeholder="Reason for moderation action..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitModeration}>
              Apply Moderation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Choose how to delete this post. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Soft Delete:</strong> Marks post as deleted but keeps it in database for recovery.<br/>
                <strong>Hard Delete:</strong> Permanently removes post and all related data.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => submitDelete(false)}>
              Soft Delete
            </Button>
            <Button variant="destructive" onClick={() => submitDelete(true)}>
              Hard Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}