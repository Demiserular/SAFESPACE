"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Heart, Flag, ThumbsUp, HeartHandshakeIcon as Hug, Send, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { generateUsername } from "@/lib/username-generator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function PostDetail({ params }) {
  const postId = params.id
  // In a real app, we would fetch the post data based on the ID
  const post = posts.find((p) => p.id.toString() === postId) || posts[0]

  const [replyContent, setReplyContent] = useState("")
  const [replies, setReplies] = useState(post.replies)
  const [replyUsername] = useState(generateUsername())

  const handleReply = (e) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    const newReply = {
      id: replies.length + 1,
      username: replyUsername,
      content: replyContent,
      timeAgo: "Just now",
      upvotes: 0,
      hearts: 0,
      hugs: 0,
      isAuthor: false,
      children: [],
    }

    setReplies([...replies, newReply])
    setReplyContent("")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/">← Back to posts</Link>
      </Button>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{post.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span className="bg-muted px-2 py-1 rounded-full text-xs">{post.username}</span>
                <span className="text-xs text-muted-foreground">{post.timeAgo}</span>
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">{post.category}</span>
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon">
              <Flag className="h-4 w-4" />
              <span className="sr-only">Flag post</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-line">{post.content}</p>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="flex gap-4">
            <Button variant="ghost" size="sm" className="flex gap-1 items-center">
              <ThumbsUp className="h-4 w-4" />
              <span>{post.upvotes}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex gap-1 items-center">
              <Heart className="h-4 w-4" />
              <span>{post.hearts}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex gap-1 items-center">
              <Hug className="h-4 w-4" />
              <span>{post.hugs}</span>
            </Button>
          </div>
          <Button variant="outline" size="sm">
            Invite to Private Chat
          </Button>
        </CardFooter>
      </Card>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Replies ({replies.length})</h2>
        <div className="space-y-4">
          {replies.map((reply) => (
            <ReplyCard key={reply.id} reply={reply} />
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Reply as {replyUsername}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReply}>
            <Textarea
              placeholder="Share your thoughts, advice, or support..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="mb-4"
              rows={3}
            />
            <div className="flex justify-end">
              <Button type="submit" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Post Reply
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function ReplyCard({ reply, depth = 0 }) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [childReplies, setChildReplies] = useState(reply.children || [])
  const [replyUsername] = useState(generateUsername())

  const handleReply = (e) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    const newReply = {
      id: Date.now(),
      username: replyUsername,
      content: replyContent,
      timeAgo: "Just now",
      upvotes: 0,
      hearts: 0,
      hugs: 0,
      isAuthor: false,
      children: [],
    }

    setChildReplies([...childReplies, newReply])
    setReplyContent("")
    setShowReplyForm(false)
  }

  return (
    <div className={`pl-${depth * 4}`}>
      <Card className={depth > 0 ? "border-l-4 border-l-primary/20" : ""}>
        <CardHeader className="py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">{reply.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{reply.username}</span>
              {reply.isAuthor && (
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">Original Poster</span>
              )}
              <span className="text-xs text-muted-foreground">{reply.timeAgo}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Flag className="h-4 w-4 mr-2" /> Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="py-2">
          <p className="text-sm">{reply.content}</p>
        </CardContent>
        <CardFooter className="py-2 flex justify-between">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-7 px-2 flex gap-1 items-center">
              <ThumbsUp className="h-3 w-3" />
              <span className="text-xs">{reply.upvotes}</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 flex gap-1 items-center">
              <Heart className="h-3 w-3" />
              <span className="text-xs">{reply.hearts}</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 flex gap-1 items-center">
              <Hug className="h-3 w-3" />
              <span className="text-xs">{reply.hugs}</span>
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="h-7" onClick={() => setShowReplyForm(!showReplyForm)}>
            Reply
          </Button>
        </CardFooter>

        {showReplyForm && (
          <div className="px-4 pb-4">
            <form onSubmit={handleReply}>
              <Textarea
                placeholder="Write your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="mb-2 text-sm"
                rows={2}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowReplyForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Post
                </Button>
              </div>
            </form>
          </div>
        )}
      </Card>

      {childReplies.length > 0 && (
        <div className="ml-8 mt-2 space-y-2">
          {childReplies.map((childReply) => (
            <ReplyCard key={childReply.id} reply={childReply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

// Sample data
const posts = [
  {
    id: 1,
    username: "GentleSoul42",
    title: "Feeling overwhelmed with work deadlines",
    content:
      "I've been struggling to keep up with my workload lately. Every time I complete one task, three more appear. I'm starting to feel burnt out and don't know how to approach my manager about this.\n\nI've tried making to-do lists and prioritizing tasks, but the volume is just too much. Has anyone been in a similar situation? How did you handle it?",
    category: "Career Stress",
    timeAgo: "2 hours ago",
    upvotes: 12,
    hearts: 5,
    hugs: 8,
    replies: [
      {
        id: 1,
        username: "WorkLifeBalancer",
        content:
          "I've been there. What helped me was having an honest conversation with my manager about workload. I prepared by documenting all my tasks and time spent, which made it easier to show the issue objectively.",
        timeAgo: "1 hour ago",
        upvotes: 8,
        hearts: 3,
        hugs: 2,
        isAuthor: false,
        children: [
          {
            id: 11,
            username: "GentleSoul42",
            content: "That's a good idea. Did your manager respond well to seeing the documentation?",
            timeAgo: "45 minutes ago",
            upvotes: 2,
            hearts: 0,
            hugs: 0,
            isAuthor: true,
            children: [],
          },
        ],
      },
      {
        id: 2,
        username: "StressFreeLiving",
        content:
          "Sometimes it helps to take a step back and evaluate which tasks actually need to be done by you. Can you delegate anything? Are there processes that could be more efficient?",
        timeAgo: "30 minutes ago",
        upvotes: 5,
        hearts: 2,
        hugs: 1,
        isAuthor: false,
        children: [],
      },
      {
        id: 3,
        username: "MindfulPro",
        content:
          "Don't forget to take care of yourself during stressful periods. Short breaks, proper sleep, and some exercise can help maintain your mental health while you work through this.",
        timeAgo: "15 minutes ago",
        upvotes: 4,
        hearts: 6,
        hugs: 3,
        isAuthor: false,
        children: [],
      },
    ],
  },
]

