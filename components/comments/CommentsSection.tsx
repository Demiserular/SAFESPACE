"use client"

import { useState, useEffect, useOptimistic, startTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ThreadFlow, type Comment } from "./ThreadFlow"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, Sparkles, Send } from "lucide-react"
import dynamic from "next/dynamic"
import useSWR from "swr"
import { supabase } from "@/lib/supabase"

// Lazy load the heavy Discussion Room component
const DiscussionRoom = dynamic<{ postId: string; onClose: () => void; comments: Comment[] }>(
  () => import("./DiscussionRoom"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    ),
  }
)

interface CommentsSectionProps {
  postId: string
  postAuthorId: string
  initialComments?: Comment[]
}

/**
 * Fetcher for SWR - fetches comments from API with error handling
 */
const fetcher = async (url: string): Promise<Comment[]> => {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error('Failed to fetch comments:', res.status, res.statusText)
      return []
    }
    const data = await res.json()

    // Transform dates from ISO strings to Date objects  
    return (data || []).map((comment: any) => ({
      ...comment,
      createdAt: typeof comment.createdAt === 'string'
        ? new Date(comment.createdAt)
        : comment.createdAt
    }))
  } catch (error) {
    console.error('Error fetching comments:', error)
    return []
  }
}/**
 * 🔥 ThreadFlow™ Comments Section
 * 
 * Enhanced comment system with:
 * - Reddit-style collapsible threads
 * - Optimistic UI for instant feedback
 * - SWR for intelligent caching
 * - Lazy-loaded Discussion Room for deep conversations
 * - High-performance rendering
 */
export function CommentsSection({
  postId,
  postAuthorId,
  initialComments = [],
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDiscussionRoom, setShowDiscussionRoom] = useState(false)

  // Use SWR for fetching with cache and revalidation
  const { data: comments, mutate, error: swrError } = useSWR<Comment[]>(
    `/api/comments?post_id=${postId}`,
    fetcher,
    {
      fallbackData: initialComments,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      onError: (err) => {
        console.error('SWR fetch error:', err)
      },
      shouldRetryOnError: false, // Don't retry on error to avoid spam
    }
  )

  // Optimistic updates
  const [optimisticComments, addOptimisticComment] = useOptimistic<Comment[], Comment>(
    comments || [],
    (state, newComment) => [...state, newComment]
  )

  /**
   * Handle new comment submission with optimistic UI
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)

    // Create optimistic comment
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      content: newComment,
      author: {
        id: "current-user",
        username: "You",
      },
      createdAt: new Date(),
      upvotes: 0,
      reactions: { hearts: 0, hugs: 0, thumbs: 0 },
      replyCount: 0,
      isAuthor: false,
    }

    // Add optimistically within a transition
    startTransition(() => {
      addOptimisticComment(optimisticComment)
    })
    setNewComment("")

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        console.error("No active session")
        throw new Error("Please log in to comment")
      }

      // Make API call with authorization header
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          post_id: postId,
          content: newComment,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to post comment")
      }

      // Revalidate to get real data from server
      await mutate()
    } catch (error) {
      console.error("Failed to post comment:", error)
      // Optionally: show error toast
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle reply to a comment
   */
  const handleReply = async (parentId: string, content: string) => {
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("Please log in to reply")
      }

      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          post_id: postId,
          parent_comment_id: parentId,
          content,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to post reply")
      }

      // Revalidate to get updated comments with new reply
      await mutate()
    } catch (error) {
      console.error("Failed to post reply:", error)
      throw error
    }
  }

  /**
   * Handle upvote with optimistic update
   */
  const handleUpvote = async (commentId: string) => {
    // Optimistic update
    mutate(
      comments?.map((c) =>
        c.id === commentId
          ? {
            ...c,
            upvotes: c.hasUpvoted ? c.upvotes - 1 : c.upvotes + 1,
            hasUpvoted: !c.hasUpvoted,
          }
          : c
      ),
      false // Don't revalidate immediately
    )

    try {
      const response = await fetch(`/api/comments/${commentId}/upvote`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to upvote")

      // Revalidate in background
      mutate()
    } catch (error) {
      console.error("Failed to upvote:", error)
      // Revalidate to restore correct state
      mutate()
    }
  }

  /**
   * Handle emoji reaction
   */
  const handleReact = async (commentId: string, reaction: string) => {
    try {
      await fetch(`/api/comments/${commentId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction }),
      })

      // Revalidate to show updated reactions
      mutate()
    } catch (error) {
      console.error("Failed to react:", error)
    }
  }

  /**
   * Handle report
   */
  const handleReport = (commentId: string) => {
    // Implement report functionality
    console.log("Reporting comment:", commentId)
  }

  // Group comments into top-level and replies
  const topLevelComments = optimisticComments.filter((c) => !c.parentId)
  const getReplies = (parentId: string) =>
    optimisticComments.filter((c) => c.parentId === parentId)

  return (
    <div className="space-y-6">
      {/* Comments Header */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <MessageSquare className="h-6 w-6 text-primary" />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ThreadFlow™
              </span>
              <span className="text-muted-foreground text-base">·</span>
              <span className="text-base">{topLevelComments.length}</span>
            </CardTitle>

            {/* Join Discussion Button - Opens Enhanced Mode */}
            {topLevelComments.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDiscussionRoom(true)}
                className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <Sparkles className="h-4 w-4" />
                Deep Dive
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* New Comment Form - Enhanced Design */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts... Markdown supported ✨"
                className="min-h-[100px] resize-none pr-12 text-base leading-relaxed border-2 focus:border-primary"
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isSubmitting || !newComment.trim()}
                className="absolute bottom-3 right-3 h-10 w-10 rounded-full shadow-lg"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                💡 **bold**, *italic*, `code`, and more supported
              </p>
            </div>
          </form>

          {/* Comments List - ThreadFlow™ */}
          {topLevelComments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 text-muted-foreground"
            >
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-base font-medium">No comments yet</p>
              <p className="text-sm mt-1">Be the first to start the conversation! 🚀</p>
            </motion.div>
          ) : (
            <div className="space-y-2 divide-y divide-border/50">
              <AnimatePresence mode="popLayout">
                {topLevelComments.map((comment) => (
                  <ThreadFlow
                    key={comment.id}
                    comment={comment}
                    onReply={handleReply}
                    onUpvote={handleUpvote}
                    onReact={handleReact}
                    onReport={handleReport}
                    replies={getReplies(comment.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discussion Room Modal (Lazy Loaded) */}
      <AnimatePresence>
        {showDiscussionRoom && (
          <DiscussionRoom
            postId={postId}
            onClose={() => setShowDiscussionRoom(false)}
            comments={optimisticComments}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * CommentSkeleton - Loading state for comments
 */
export function CommentSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-16 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
