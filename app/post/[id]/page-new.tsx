"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Heart, Flag, ThumbsUp, HeartHandshake, Send, Share2, MessageCircle, ChevronDown, ChevronUp, ArrowLeft, MoreHorizontal, Bookmark, Clock, Eye } from "lucide-react"
import Link from "next/link"
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Mock Data
const mockPost = {
  id: "1",
  title: "How do you cope with persistent feelings of loneliness?",
  content: `I've been struggling with loneliness for a while now. Even when I'm surrounded by people, I feel disconnected and isolated. It's like there's an invisible wall between me and everyone else.

I've tried joining clubs, reaching out to old friends, and even therapy. Some days are better than others, but the underlying feeling never really goes away.

Has anyone else experienced this? What strategies have helped you feel more connected to others and yourself? I'm open to any suggestions or just hearing that I'm not alone in this.`,
  anonymous_username: "HopefulHiker",
  category: "Depression",
  created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  user_id: "user-123",
  views: 234,
  reading_time: "2 min read"
};

const mockComments = [
  {
    id: "c1",
    content: "I completely understand what you're going through. I felt the same way for years. What helped me was starting to do small acts of kindness for strangers - it sounds weird but it made me feel more connected to humanity.",
    anonymous_username: "GentleSoul",
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    upvotes: 12,
    replies: [
      {
        id: "c1-r1",
        content: "This is such a beautiful suggestion. Small connections can make such a big difference.",
        anonymous_username: "WarmHeart",
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        upvotes: 5,
      }
    ]
  },
  {
    id: "c2",
    content: "You're definitely not alone in feeling this way. I've found that being vulnerable with at least one person - really opening up about how I feel - has helped more than anything else. Quality over quantity in relationships.",
    anonymous_username: "QuietStrength",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    upvotes: 8,
    replies: []
  },
  {
    id: "c3",
    content: "Thank you for sharing this. It takes courage to open up. Have you tried journaling? Writing down my thoughts helps me process feelings of isolation and sometimes reveals patterns I wasn't aware of.",
    anonymous_username: "ReflectiveMind",
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    upvotes: 6,
    replies: []
  }
];

const mockReactions = {
  upvote: 24,
  heart: 18,
  hug: 31
};

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function PostDetail({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>("");
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const [reactions, setReactions] = useState(mockReactions);
  const [userReactions, setUserReactions] = useState({
    upvote: false,
    heart: false,
    hug: false
  });
  const [saved, setSaved] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<string[]>(["c1"]);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  const handleReaction = (type: 'upvote' | 'heart' | 'hug') => {
    if (!user) {
      toast({ title: "Please log in", description: "You need to be logged in to react" });
      return;
    }
    
    setUserReactions(prev => ({ ...prev, [type]: !prev[type] }));
    setReactions(prev => ({
      ...prev,
      [type]: prev[type] + (userReactions[type] ? -1 : 1)
    }));
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => 
      prev.includes(commentId) 
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    );
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: mockPost.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied!", description: "Post link copied to clipboard" });
    }
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    toast({ title: "Comment posted!", description: "Your support has been shared" });
    setNewComment("");
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 pt-14 md:pt-0">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
          </Button>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => setSaved(!saved)}
            >
              <Bookmark className={`h-4 w-4 ${saved ? 'fill-primary text-primary' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
                  <Flag className="h-4 w-4 mr-2" />
                  Report Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="container max-w-3xl mx-auto px-4 py-6">
        {/* Post Content */}
        <article className="mb-8">
          {/* Category Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {mockPost.category}
            </span>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {mockPost.reading_time}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {mockPost.views} views
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-4">
            {mockPost.title}
          </h1>

          {/* Author & Time */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b">
            <Avatar className="h-10 w-10 bg-gradient-to-br from-primary/20 to-primary/10">
              <AvatarFallback className="text-sm font-medium">
                {mockPost.anonymous_username.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{mockPost.anonymous_username}</p>
              <p className="text-xs text-muted-foreground">{formatTimeAgo(mockPost.created_at)}</p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-base leading-relaxed whitespace-pre-line text-foreground/90">
              {mockPost.content}
            </p>
          </div>

          {/* Reaction Bar */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <div className="flex gap-1">
              <Button
                variant={userReactions.upvote ? "default" : "outline"}
                size="sm"
                className="gap-2 h-9 rounded-full"
                onClick={() => handleReaction('upvote')}
              >
                <ThumbsUp className="h-4 w-4" />
                <span>{reactions.upvote}</span>
              </Button>
              <Button
                variant={userReactions.heart ? "default" : "outline"}
                size="sm"
                className="gap-2 h-9 rounded-full"
                onClick={() => handleReaction('heart')}
              >
                <Heart className={`h-4 w-4 ${userReactions.heart ? 'fill-current' : ''}`} />
                <span>{reactions.heart}</span>
              </Button>
              <Button
                variant={userReactions.hug ? "default" : "outline"}
                size="sm"
                className="gap-2 h-9 rounded-full"
                onClick={() => handleReaction('hug')}
              >
                <HeartHandshake className="h-4 w-4" />
                <span>{reactions.hug}</span>
              </Button>
            </div>
            
            <Button variant="outline" size="sm" className="gap-2 h-9 rounded-full" asChild>
              <Link href="/chat-rooms">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Private Chat</span>
              </Link>
            </Button>
          </div>
        </article>

        {/* Comments Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">
              Responses ({mockComments.length})
            </h2>
          </div>

          {/* Add Comment */}
          <Card className="mb-6 border-dashed">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0 bg-muted">
                  <AvatarFallback className="text-xs">You</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea
                    placeholder="Share your thoughts or offer support..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px] resize-none border-0 focus-visible:ring-0 p-0 text-sm"
                  />
                  <div className="flex justify-end">
                    <Button 
                      size="sm" 
                      className="gap-2"
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim()}
                    >
                      <Send className="h-4 w-4" />
                      Respond
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments List */}
          <div className="space-y-4">
            {mockComments.map((comment) => (
              <div key={comment.id} className="group">
                <Card className="transition-colors hover:bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 shrink-0 bg-gradient-to-br from-primary/20 to-primary/10">
                        <AvatarFallback className="text-xs">
                          {comment.anonymous_username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.anonymous_username}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed">
                          {comment.content}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {comment.upvotes}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                            Reply
                          </Button>
                          {comment.replies.length > 0 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 text-xs gap-1 text-primary"
                              onClick={() => toggleReplies(comment.id)}
                            >
                              {expandedReplies.includes(comment.id) ? (
                                <>
                                  <ChevronUp className="h-3 w-3" />
                                  Hide {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3" />
                                  Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                                </>
                              )}
                            </Button>
                          )}
                        </div>

                        {/* Nested Replies */}
                        {expandedReplies.includes(comment.id) && comment.replies.length > 0 && (
                          <div className="mt-4 pl-4 border-l-2 border-muted space-y-4">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex gap-3">
                                <Avatar className="h-6 w-6 shrink-0 bg-muted">
                                  <AvatarFallback className="text-[10px]">
                                    {reply.anonymous_username.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-xs">{reply.anonymous_username}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                      {formatTimeAgo(reply.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-foreground/90 leading-relaxed">
                                    {reply.content}
                                  </p>
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1 mt-2">
                                    <ThumbsUp className="h-2.5 w-2.5" />
                                    {reply.upvotes}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report this post</DialogTitle>
            <DialogDescription>
              Help us keep the community safe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={reportReason} onValueChange={setReportReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                <SelectItem value="misinformation">Misinformation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Additional details (optional)"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                toast({ title: "Report submitted", description: "Thank you for helping keep our community safe." });
                setReportDialogOpen(false);
              }} 
              disabled={!reportReason}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
