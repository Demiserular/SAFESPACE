"use client"

/**
 * Example Integration of Hybrid Comment System
 * This shows how to integrate the new comment system into your existing post page
 */

import { useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Heart, Flag, ThumbsUp, HeartHandshakeIcon as Hug } from "lucide-react"
import Link from "next/link"
import { CommentsSection, CommentSkeleton } from "@/components/comments/CommentsSection"

export default function PostDetailExample({ params }: { params: { id: string } }) {
  const postId = params.id

  // Sample post data (in real app, fetch from API)
  const post = {
    id: postId,
    username: "GentleSoul42",
    title: "Feeling overwhelmed with work deadlines",
    content: `I've been struggling to keep up with my workload lately. Every time I complete one task, three more appear. I'm starting to feel burnt out and don't know how to approach my manager about this.

I've tried making to-do lists and prioritizing tasks, but the volume is just too much. Has anyone been in a similar situation? How did you handle it?`,
    category: "Career Stress",
    timeAgo: "2 hours ago",
    upvotes: 12,
    hearts: 5,
    hugs: 8,
    user_id: "user-123", // Post author ID
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/">← Back to posts</Link>
      </Button>

      {/* Original Post Card */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{post.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span className="bg-muted px-2 py-1 rounded-full text-xs">{post.username}</span>
                <span className="text-xs text-muted-foreground">{post.timeAgo}</span>
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                  {post.category}
                </span>
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

      {/* NEW HYBRID COMMENT SYSTEM */}
      <Suspense fallback={<CommentSkeleton />}>
        <CommentsSection
          postId={postId}
          postAuthorId={post.user_id}
          // initialComments will be fetched by SWR
        />
      </Suspense>
    </div>
  )
}
