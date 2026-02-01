"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { X, Send, Users, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Comment } from "./CommentThread"
// import ReactMarkdown from "react-markdown"
import { formatDistanceToNow } from "date-fns"

interface DiscussionRoomProps {
  postId: string
  onClose: () => void
  comments: Comment[]
}

/**
 * DiscussionRoom - Heavy mode, real-time discussion component
 * Lazy loaded only when "Join Discussion" is clicked
 * 
 * Features:
 * - Real-time updates (simulated for now, ready for Socket.io/Pusher)
 * - Typing indicators
 * - User presence
 * - Scroll anchoring
 * - Auto-detach on exit
 */
export default function DiscussionRoom({
  postId,
  onClose,
  comments,
}: DiscussionRoomProps) {
  const [message, setMessage] = useState("")
  const [isOnline, setIsOnline] = useState(true)
  const [activeUsers, setActiveUsers] = useState(3)
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [comments])

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Simulate real-time connection
  useEffect(() => {
    // In production, connect to Socket.io or Pusher here
    const interval = setInterval(() => {
      setActiveUsers(Math.floor(Math.random() * 5) + 2)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  // Handle typing indicator (debounced)
  useEffect(() => {
    if (message) {
      setIsTyping(true)
      const timeout = setTimeout(() => setIsTyping(false), 1000)
      return () => clearTimeout(timeout)
    }
  }, [message])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    // In production, emit to Socket.io/Pusher
    console.log("Sending message:", message)
    setMessage("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background border rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Live Discussion</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {isOnline ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500" />
                    <span>{activeUsers} active</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-red-500" />
                    <span>Reconnecting...</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages Area */}
        <ScrollArea ref={scrollRef} className="flex-1 px-6 py-4">
          <div className="space-y-6">
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {comment.author.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-bold text-sm text-foreground">
                      {comment.author.username}
                    </span>
                    {comment.isAuthor && (
                      <Badge className="text-[9px] py-0 px-1.5 bg-gradient-to-r from-amber-400 to-orange-500 border-0">
                        OP
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                    </span>
                  </div>

                  <div className="bg-gradient-to-br from-muted/60 to-muted/30 dark:from-muted/40 dark:to-muted/20 rounded-2xl rounded-tl-md px-4 py-3 border border-border/50 shadow-sm">
                    <p className="text-sm leading-relaxed mb-0 whitespace-pre-wrap text-foreground">{comment.content}</p>
                  </div>

                  {/* Reaction Bar - More visible */}
                  <div className="flex gap-2 mt-2 px-1">
                    {comment.reactions.hearts > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs bg-background/80 px-2 py-0.5 rounded-full border shadow-sm">
                        ❤️ {comment.reactions.hearts}
                      </span>
                    )}
                    {comment.reactions.thumbs > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs bg-background/80 px-2 py-0.5 rounded-full border shadow-sm">
                        👍 {comment.reactions.thumbs}
                      </span>
                    )}
                    {comment.reactions.hugs > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs bg-background/80 px-2 py-0.5 rounded-full border shadow-sm">
                        🤗 {comment.reactions.hugs}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Typing Indicator - Animated */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 items-end"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-500">
                    <Users className="h-4 w-4 text-white" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted/50 rounded-2xl rounded-tl-md px-4 py-3 border">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    <span className="text-xs text-muted-foreground ml-2">Someone is typing...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Reactions Bar */}
        <div className="px-6 py-2 border-t bg-muted/30">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-medium">Quick:</span>
            <div className="flex gap-1">
              {["👍", "❤️", "🤗", "😊", "🙏", "💪"].map((emoji) => (
                <button
                  key={emoji}
                  className="h-8 w-8 rounded-full hover:bg-secondary hover:scale-110 transition-all flex items-center justify-center text-lg"
                  onClick={() => setMessage(prev => prev + emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input Area - Enhanced */}
        <div className="px-6 py-4 border-t bg-background">
          <form onSubmit={handleSend} className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="min-h-[56px] max-h-[120px] resize-none pr-4 rounded-2xl border-2 focus:border-primary bg-muted/30"
                rows={2}
              />
            </div>
            <Button
              type="submit"
              size="icon"
              className="h-14 w-14 rounded-2xl flex-shrink-0 shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              disabled={!message.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 px-1">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
