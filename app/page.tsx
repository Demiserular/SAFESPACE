import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Heart, MessageSquare, Flag, ThumbsUp, HeartHandshakeIcon as Hug, HeartPulse } from 'lucide-react'

interface Post {
  id: number;
  username: string;
  title: string;
  content: string;
  category: string;
  timeAgo: string;
  upvotes: number;
  hearts: number;
  hugs: number;
  replies: number;
}

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl">
      <header className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Safe Space</h1>
        <p className="text-muted-foreground">An anonymous community for support and connection</p>
        <div className="flex justify-center mt-4">
          <Button className="bg-primary/10 hover:bg-primary/20 text-primary" asChild>
            <Link href="/ai-support" className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5" />
              24/7 AI Emotional Support
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex justify-end mb-4 hidden sm:flex">
        <Button asChild>
          <Link href="/create-post">Create Post</Link>
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 mb-8">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="depression">Depression Help</TabsTrigger>
          <TabsTrigger value="career">Career Stress</TabsTrigger>
          <TabsTrigger value="relationships">Relationship Advice</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </TabsContent>

        <TabsContent value="depression" className="space-y-4">
          {posts
            .filter((post) => post.category === "Depression Help")
            .map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
        </TabsContent>

        <TabsContent value="career" className="space-y-4">
          {posts
            .filter((post) => post.category === "Career Stress")
            .map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
        </TabsContent>

        <TabsContent value="relationships" className="space-y-4">
          {posts
            .filter((post) => post.category === "Relationship Advice")
            .map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PostCard({ post }: { post: Post }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base sm:text-lg">{post.title}</CardTitle>
            <CardDescription className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-1">
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
        <p className="text-sm">{post.content}</p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between">
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
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/post/${post.id}`} className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{post.replies} replies</span>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

// Sample data
const posts = [
  {
    id: 1,
    username: "GentleSoul42",
    title: "Feeling overwhelmed with work deadlines",
    content:
      "I've been struggling to keep up with my workload lately. Every time I complete one task, three more appear. I'm starting to feel burnt out and don't know how to approach my manager about this.",
    category: "Career Stress",
    timeAgo: "2 hours ago",
    upvotes: 12,
    hearts: 5,
    hugs: 8,
    replies: 7,
  },
  {
    id: 2,
    username: "HopefulHiker",
    title: "How do you cope with persistent sadness?",
    content:
      "For the past few months, I've been feeling down most days. I still go through the motions of daily life, but the joy is missing. Has anyone found effective ways to manage these feelings?",
    category: "Depression Help",
    timeAgo: "5 hours ago",
    upvotes: 24,
    hearts: 18,
    hugs: 15,
    replies: 12,
  },
  {
    id: 3,
    username: "QuietObserver",
    title: "Communication issues with my partner",
    content:
      "My partner and I seem to be talking past each other lately. We both have good intentions but end up in misunderstandings. Any advice for improving communication in a long-term relationship?",
    category: "Relationship Advice",
    timeAgo: "1 day ago",
    upvotes: 32,
    hearts: 14,
    hugs: 9,
    replies: 21,
  },
]

