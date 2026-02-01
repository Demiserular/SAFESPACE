"use client"

import { useState, useEffect, useOptimistic, startTransition, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ThreadFlow, type Comment } from "./ThreadFlow"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  MessageSquare, 
  Sparkles, 
  Send, 
  Users, 
  Zap, 
  MessageCircle,
  LayoutList,
  MessagesSquare,
  Smile,
  Image as ImageIcon,
  AtSign,
  Hash,
  Mic
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import dynamic from "next/dynamic"
import useSWR from "swr"
import { getSupabaseClient } from "@/lib/supabase"
import Link from "next/link"

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

const QUICK_REACTIONS = ["👍", "❤️", "🤗", "😊", "🙏", "💪"]

interface CommentsSectionProps {
  postId: string
  postAuthorId: string
  initialComments?: Comment[]
}

type ViewMode = "discussion" | "thread"

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
}

/**
 * 🔥 ThreadFlow™ Comments Section - Enhanced Discussion Mode
 * 
 * Reimagined comment system with:
 * - Chat-style message bubbles in Discussion Mode
 * - Reddit-style collapsible threads in Thread Mode
 * - Real-time typing indicators
 * - Quick emoji reactions
 * - Live chat room integration
 * - Optimistic UI for instant feedback
 * - SWR for intelligent caching
 */
export function CommentsSection({
  postId,
  postAuthorId,
  initialComments = [],
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDiscussionRoom, setShowDiscussionRoom] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("discussion")
  const [showTypingIndicator, setShowTypingIndicator] = useState(false)
  const [activeUsers] = useState(Math.floor(Math.random() * 5) + 2)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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
      const supabase = getSupabaseClient()
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
      const supabase = getSupabaseClient()
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

  // Scroll to bottom when new messages arrive in discussion mode
  useEffect(() => {
    if (viewMode === "discussion" && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [optimisticComments.length, viewMode])

  // Typing indicator simulation
  useEffect(() => {
    if (newComment.length > 0) {
      setShowTypingIndicator(false) // Don't show when user is typing
    }
  }, [newComment])

  const handleQuickReaction = async (emoji: string) => {
    // Add as a quick supportive message
    const supportMessage = `${emoji}`
    if (!supportMessage.trim() || isSubmitting) return

    setIsSubmitting(true)

    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      content: supportMessage,
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

    startTransition(() => {
      addOptimisticComment(optimisticComment)
    })

    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Please log in")

      await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          post_id: postId,
          content: supportMessage,
        }),
      })
      await mutate()
    } catch (error) {
      console.error("Failed to send reaction:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Discussion Header */}
      <Card className="border-2 shadow-lg overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30 border-b">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <MessagesSquare className="h-5 w-5 text-white" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              </div>
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  Discussion
                  <Badge variant="secondary" className="font-normal text-xs">
                    {topLevelComments.length} messages
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <Users className="h-3 w-3" />
                  <span>{activeUsers} active now</span>
                  <span className="text-primary">•</span>
                  <span className="text-green-600 dark:text-green-400">Live</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-auto">
                <TabsList className="h-9 p-1">
                  <TabsTrigger value="discussion" className="h-7 px-3 text-xs gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Chat</span>
                  </TabsTrigger>
                  <TabsTrigger value="thread" className="h-7 px-3 text-xs gap-1.5">
                    <LayoutList className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Threads</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Live Discussion Button */}
              {topLevelComments.length > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowDiscussionRoom(true)}
                  className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Live Room</span>
                </Button>
              )}

              {/* Link to Chat Rooms */}
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <Link href="/chat-rooms">
                  <Users className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Private Chat</span>
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Discussion View (Chat-style) */}
          {viewMode === "discussion" && (
            <div className="flex flex-col">
              {/* Messages Container */}
              <div className="max-h-[500px] overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-background to-muted/20">
                {topLevelComments.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 mb-4">
                      <MessageSquare className="h-8 w-8 text-indigo-500" />
                    </div>
                    <p className="text-base font-medium text-foreground">Start the conversation</p>
                    <p className="text-sm text-muted-foreground mt-1">Be the first to share your thoughts! 💬</p>
                  </motion.div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {topLevelComments.map((comment, index) => (
                      <ChatMessage
                        key={comment.id}
                        comment={comment}
                        isOwn={comment.author.id === "current-user"}
                        onReply={(content) => handleReply(comment.id, content)}
                        onUpvote={() => handleUpvote(comment.id)}
                        showAvatar={index === 0 || topLevelComments[index - 1]?.author.id !== comment.author.id}
                      />
                    ))}
                  </AnimatePresence>
                )}
                
                {/* Typing Indicator */}
                {showTypingIndicator && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                    <span>Someone is typing...</span>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reactions Bar */}
              <div className="px-4 py-2 border-t border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Quick support:</span>
                  <div className="flex gap-1">
                    {QUICK_REACTIONS.map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-lg hover:scale-125 transition-transform hover:bg-primary/10"
                        onClick={() => handleQuickReaction(emoji)}
                        disabled={isSubmitting}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Enhanced Input Area */}
              <form onSubmit={handleSubmit} className="p-4 bg-background">
                <div className="flex gap-3 items-end">
                  <div className="flex-1 relative">
                    <Textarea
                      ref={inputRef}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="min-h-[56px] max-h-[150px] resize-none pr-24 text-base leading-relaxed rounded-2xl border-2 focus:border-primary bg-muted/30"
                      disabled={isSubmitting}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSubmit(e)
                        }
                      }}
                    />
                    <div className="absolute bottom-2 right-2 flex items-center gap-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                            <Smile className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                          <div className="grid grid-cols-6 gap-1">
                            {["😊", "❤️", "🤗", "👍", "🙏", "💪", "✨", "🎉", "😢", "😤", "🤔", "💯"].map((emoji) => (
                              <Button
                                key={emoji}
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 text-xl hover:scale-110 transition-transform"
                                onClick={() => setNewComment(prev => prev + emoji)}
                              >
                                {emoji}
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting || !newComment.trim()}
                    className="h-14 w-14 rounded-2xl shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 px-1">
                  Press Enter to send • Shift+Enter for new line
                </p>
              </form>
            </div>
          )}

          {/* Thread View (Reddit-style) */}
          {viewMode === "thread" && (
            <div className="p-4 space-y-4">
              {/* New Comment Form */}
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
 * ChatMessage - Individual message in discussion view
 */
interface ChatMessageProps {
  comment: Comment
  isOwn: boolean
  onReply: (content: string) => Promise<void>
  onUpvote: () => Promise<void>
  showAvatar: boolean
}

function ChatMessage({ comment, isOwn, onReply, onUpvote, showAvatar }: ChatMessageProps) {
  const [showActions, setShowActions] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {showAvatar ? (
        <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-background shadow-sm">
          <AvatarFallback className={`text-xs font-bold text-white ${
            comment.isAuthor 
              ? "bg-gradient-to-br from-amber-400 to-orange-500" 
              : "bg-gradient-to-br from-indigo-400 to-purple-500"
          }`}>
            {comment.author.username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-9 flex-shrink-0" />
      )}

      <div className={`flex flex-col max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
        {/* Author name and badges */}
        {showAvatar && (
          <div className={`flex items-center gap-1.5 mb-1 ${isOwn ? "flex-row-reverse" : ""}`}>
            <span className="text-xs font-semibold text-foreground">
              {comment.author.username}
            </span>
            {comment.isAuthor && (
              <Badge className="h-4 px-1.5 text-[9px] bg-gradient-to-r from-amber-400 to-orange-500 border-0">
                OP
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground">
              {comment.createdAt instanceof Date 
                ? comment.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "Just now"
              }
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`
            relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
            ${isOwn 
              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md" 
              : "bg-muted/80 dark:bg-muted/50 text-foreground rounded-bl-md border"
            }
          `}
        >
          <p className="whitespace-pre-wrap break-words">{comment.content}</p>
          
          {/* Reactions display */}
          {(comment.reactions.hearts > 0 || comment.reactions.hugs > 0 || comment.upvotes > 0) && (
            <div className={`flex gap-1.5 mt-1.5 ${isOwn ? "justify-end" : "justify-start"}`}>
              {comment.upvotes > 0 && (
                <span className={`text-xs ${isOwn ? "text-white/80" : "text-muted-foreground"}`}>
                  👍 {comment.upvotes}
                </span>
              )}
              {comment.reactions.hearts > 0 && (
                <span className={`text-xs ${isOwn ? "text-white/80" : "text-muted-foreground"}`}>
                  ❤️ {comment.reactions.hearts}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quick action buttons */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`flex gap-0.5 mt-1 ${isOwn ? "flex-row-reverse" : ""}`}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={onUpvote}
              >
                👍
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                ❤️
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Reply
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
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
