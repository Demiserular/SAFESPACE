"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Heart, Flag, ThumbsUp, HeartHandshakeIcon as Hug, Send, MoreHorizontal, Share2, MessageCircle, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { getPost, getComments, createComment, getReactions, createReaction, deleteReaction, createReport } from '@/lib/api_routes';
import { Post, Comment, Reaction } from '@/lib/types';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

// Add this interface definition to fix the error
interface CommentWithChildren extends Comment {
  children?: CommentWithChildren[];
}

export default function PostDetail({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>("");

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentWithChildren[]>([]);
  const [replyContent, setReplyContent] = useState("")
  const [loading, setLoading] = useState(true);
  const [showAllComments, setShowAllComments] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");

  const [reactions, setReactions] = useState<{
    upvote: number,
    heart: number,
    hug: number
  }>({ upvote: 0, heart: 0, hug: 0 });
  const [userReactions, setUserReactions] = useState<{
    upvote: boolean,
    heart: boolean,
    hug: boolean
  }>({ upvote: false, heart: false, hug: false });
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    if (!id) return; // Don't fetch until we have the ID

    const fetchPostAndComments = async () => {
      try {
        const [postData, commentsData, reactionsData] = await Promise.all([
          getPost(id),
          getComments(id),
          getReactions(id),
        ]);
        setPost(postData);

        // Nest comments
        const commentsById: { [key: string]: CommentWithChildren } = {};
        if (Array.isArray(commentsData)) {
          commentsData.forEach(comment => {
            commentsById[comment.id] = { ...comment, children: [] };
          });

          const rootComments: CommentWithChildren[] = [];
          commentsData.forEach(comment => {
            if (comment.parent_comment_id && commentsById[comment.parent_comment_id]) {
              commentsById[comment.parent_comment_id].children?.push(commentsById[comment.id]);
            } else {
              rootComments.push(commentsById[comment.id]);
            }
          });

          setComments(rootComments);
        }

        // Process reactions
        const reactionCounts = { upvote: 0, heart: 0, hug: 0 };
        const userReactionState = { upvote: false, heart: false, hug: false };

        // Ensure reactionsData is an array before calling forEach
        if (Array.isArray(reactionsData)) {
          reactionsData.forEach((reaction: Reaction) => {
            // Count reactions by type
            if (reaction.reaction_type === 'upvote') reactionCounts.upvote++;
            if (reaction.reaction_type === 'heart') reactionCounts.heart++;
            if (reaction.reaction_type === 'hug') reactionCounts.hug++;

            // Check if current user has reacted
            if (user && reaction.user_id === user.id) {
              if (reaction.reaction_type === 'upvote') userReactionState.upvote = true;
              if (reaction.reaction_type === 'heart') userReactionState.heart = true;
              if (reaction.reaction_type === 'hug') userReactionState.hug = true;
            }
          });
        }

        setReactions(reactionCounts);
        setUserReactions(userReactionState);
      } catch (error) {
        console.error('Error fetching post and comments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPostAndComments();
  }, [id, user]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim() || !user) return
    const newComment = await createComment({
      post_id: id,
      content: replyContent,
    })
    setComments([...comments, newComment])
    setReplyContent("")
  }

  const handleReaction = async (reactionType: 'upvote' | 'heart' | 'hug') => {
    if (!user) {
      // Redirect to login or show a message
      alert('Please log in to react to posts');
      return;
    }

    try {
      const currentValue = userReactions[reactionType];

      // Toggle reaction
      if (currentValue) {
        // Remove the reaction
        await deleteReaction({
          post_id: id,
          user_id: user.id,
          reaction_type: reactionType
        });

        // Update local state
        setUserReactions({
          ...userReactions,
          [reactionType]: false
        });

        setReactions({
          ...reactions,
          [reactionType]: reactions[reactionType] - 1
        });
      } else {
        // Add the reaction
        await createReaction({
          post_id: id,
          user_id: user.id,
          reaction_type: reactionType
        });

        // Update local state
        setUserReactions({
          ...userReactions,
          [reactionType]: true
        });

        setReactions({
          ...reactions,
          [reactionType]: reactions[reactionType] + 1
        });
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  }

  const handleShare = () => {
    setShareDialogOpen(true);
  }

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link copied!",
        description: "Post link has been copied to clipboard.",
      });
      setShareDialogOpen(false);
    });
  }

  const handleReport = () => {
    setReportDialogOpen(true);
  }

  const submitReport = async () => {
    if (!user || !reportReason) return;

    try {
      await createReport({
        post_id: id,
        reason: reportReason,
        description: reportDescription,
      });
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe.",
      });
      setReportDialogOpen(false);
      setReportReason("");
      setReportDescription("");
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    }
  }

  if (!post && !loading) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-3xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Post not found</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return null; // Let the global loader handle the loading state
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-3xl">
      <Button variant="ghost" asChild className="mb-4 text-sm">
        <Link href="/">← Back to posts</Link>
      </Button>

      <Card className="mb-6 sm:mb-8">
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg sm:text-xl leading-tight pr-2">{post.title}</CardTitle>
              <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <span className="bg-muted px-2 py-1 rounded-full text-xs">
                    {post.anonymous_username || "Anonymous"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs self-start sm:self-auto">{post.category || "General Support"}</span>
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReport}
              disabled={isReporting}
              className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
            >
              <Flag className="h-4 w-4" />
              <span className="sr-only">Flag post</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm sm:text-base whitespace-pre-line leading-relaxed">{post.content}</p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between border-t pt-3 sm:pt-4">
          <div className="flex gap-1 sm:gap-2 justify-center sm:justify-start">
            <Button
              key="upvote"
              variant={userReactions.upvote ? "default" : "ghost"}
              size="sm"
              className="flex gap-1 items-center h-8 sm:h-9 px-2 sm:px-3"
              onClick={() => handleReaction('upvote')}
            >
              <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">{reactions.upvote}</span>
            </Button>
            <Button
              key="heart"
              variant={userReactions.heart ? "default" : "ghost"}
              size="sm"
              className="flex gap-1 items-center h-8 sm:h-9 px-2 sm:px-3"
              onClick={() => handleReaction('heart')}
            >
              <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">{reactions.heart}</span>
            </Button>
            <Button
              key="hug"
              variant={userReactions.hug ? "default" : "ghost"}
              size="sm"
              className="flex gap-1 items-center h-8 sm:h-9 px-2 sm:px-3"
              onClick={() => handleReaction('hug')}
            >
              <Hug className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">{reactions.hug}</span>
            </Button>
            <Button
              key="share"
              variant="ghost"
              size="sm"
              className="flex gap-1 items-center h-8 sm:h-9 px-2 sm:px-3"
              onClick={handleShare}
            >
              <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm hidden sm:inline">Share</span>
            </Button>
          </div>
          <Button variant="outline" size="sm" asChild className="h-8 sm:h-9">
            <Link href="/chat-rooms" className="flex items-center gap-1 sm:gap-2">
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm hidden sm:inline">Invite to Private Chat</span>
              <span className="text-xs sm:hidden">Chat</span>
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* ThreadFlow™ Comments Section - Reddit-style threaded discussions */}
      <CommentsSection postId={id} postAuthorId={post.user_id || ''} />

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share this post</DialogTitle>
            <DialogDescription>
              Share this post with others
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleCopyLink} className="flex-1">
                Copy Link
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: post?.title,
                      text: post?.content.substring(0, 100) + "...",
                      url: window.location.href,
                    });
                  } else {
                    handleCopyLink();
                  }
                }}
                className="flex-1"
              >
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report this post</DialogTitle>
            <DialogDescription>
              Help us keep the community safe by reporting inappropriate content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="spam" value="spam">Spam</SelectItem>
                  <SelectItem key="harassment" value="harassment">Harassment</SelectItem>
                  <SelectItem key="inappropriate" value="inappropriate">Inappropriate content</SelectItem>
                  <SelectItem key="misinformation" value="misinformation">Misinformation</SelectItem>
                  <SelectItem key="other" value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Additional details (optional)</label>
              <Textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Provide additional context..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitReport} disabled={!reportReason}>
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ReplyCard({ comment, postId }: { comment: CommentWithChildren, postId: string }) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [childReplies, setChildReplies] = useState(comment.children || [])
  const [commentReactions, setCommentReactions] = useState<{
    upvote: number,
    heart: number,
    hug: number
  }>({ upvote: 0, heart: 0, hug: 0 });
  const [userCommentReactions, setUserCommentReactions] = useState<{
    upvote: boolean,
    heart: boolean,
    hug: boolean
  }>({ upvote: false, heart: false, hug: false });
  const [reportCommentDialogOpen, setReportCommentDialogOpen] = useState(false);
  const [commentReportReason, setCommentReportReason] = useState("");
  const [commentReportDescription, setCommentReportDescription] = useState("");

  // Load comment reactions on component mount
  useEffect(() => {
    const fetchCommentReactions = async () => {
      try {
        const reactionsData = await getReactions(undefined, comment.id);

        const reactionCounts = { upvote: 0, heart: 0, hug: 0 };
        const userReactionState = { upvote: false, heart: false, hug: false };

        // Add safety check for array
        if (Array.isArray(reactionsData)) {
          reactionsData.forEach((reaction: Reaction) => {
            if (reaction.reaction_type === 'upvote') reactionCounts.upvote++;
            if (reaction.reaction_type === 'heart') reactionCounts.heart++;
            if (reaction.reaction_type === 'hug') reactionCounts.hug++;

            if (user && reaction.user_id === user.id) {
              if (reaction.reaction_type === 'upvote') userReactionState.upvote = true;
              if (reaction.reaction_type === 'heart') userReactionState.heart = true;
              if (reaction.reaction_type === 'hug') userReactionState.hug = true;
            }
          });
        }

        setCommentReactions(reactionCounts);
        setUserCommentReactions(userReactionState);
      } catch (error) {
        console.error('Error fetching comment reactions:', error);
      }
    };

    fetchCommentReactions();
  }, [comment.id, user]);

  const handleCommentReaction = async (reactionType: 'upvote' | 'heart' | 'hug') => {
    if (!user) {
      alert('Please log in to react to comments');
      return;
    }

    try {
      const currentValue = userCommentReactions[reactionType];

      if (currentValue) {
        await deleteReaction({
          comment_id: comment.id,
          user_id: user.id,
          reaction_type: reactionType
        });

        setUserCommentReactions({
          ...userCommentReactions,
          [reactionType]: false
        });

        setCommentReactions({
          ...commentReactions,
          [reactionType]: commentReactions[reactionType] - 1
        });
      } else {
        await createReaction({
          comment_id: comment.id,
          user_id: user.id,
          reaction_type: reactionType
        });

        setUserCommentReactions({
          ...userCommentReactions,
          [reactionType]: true
        });

        setCommentReactions({
          ...commentReactions,
          [reactionType]: commentReactions[reactionType] + 1
        });
      }
    } catch (error) {
      console.error('Error toggling comment reaction:', error);
    }
  }

  const handleCommentReport = async () => {
    if (!user || !commentReportReason) return;

    try {
      await createReport({
        comment_id: comment.id,
        reason: commentReportReason,
        description: commentReportDescription,
      });
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe.",
      });
      setReportCommentDialogOpen(false);
      setCommentReportReason("");
      setCommentReportDescription("");
    } catch (error) {
      console.error('Error submitting comment report:', error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim() || !user) return
    const newReply = await createComment({
      post_id: postId,
      parent_comment_id: comment.id,
      content: replyContent,
    })
    setChildReplies([...childReplies, newReply])
    setReplyContent("")
    setShowReplyForm(false)
  }

  return (
    <div>
      <Card>
        <CardHeader className="py-2 sm:py-3">
          <div className="flex justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Avatar className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0">
                <AvatarFallback className="text-xs">
                  {(comment.anonymous_username || "Anonymous").substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                <span className="text-xs sm:text-sm font-medium truncate">{comment.anonymous_username || "Anonymous"}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                  <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setReportCommentDialogOpen(true)}>
                  <Flag className="h-4 w-4 mr-2" /> Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="py-1 sm:py-2">
          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {comment.content}
          </p>
        </CardContent>
        <CardFooter className="py-2 flex flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-between">
          <div className="flex gap-1 justify-center sm:justify-start">
            <Button
              key="upvote"
              variant={userCommentReactions.upvote ? "default" : "ghost"}
              size="sm"
              className="h-6 sm:h-7 px-1 sm:px-2 flex gap-1 items-center"
              onClick={() => handleCommentReaction('upvote')}
            >
              <ThumbsUp className="h-3 w-3" />
              <span className="text-xs">{commentReactions.upvote}</span>
            </Button>
            <Button
              key="heart"
              variant={userCommentReactions.heart ? "default" : "ghost"}
              size="sm"
              className="h-6 sm:h-7 px-1 sm:px-2 flex gap-1 items-center"
              onClick={() => handleCommentReaction('heart')}
            >
              <Heart className="h-3 w-3" />
              <span className="text-xs">{commentReactions.heart}</span>
            </Button>
            <Button
              key="hug"
              variant={userCommentReactions.hug ? "default" : "ghost"}
              size="sm"
              className="h-6 sm:h-7 px-1 sm:px-2 flex gap-1 items-center"
              onClick={() => handleCommentReaction('hug')}
            >
              <Hug className="h-3 w-3" />
              <span className="text-xs">{commentReactions.hug}</span>
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="h-6 sm:h-7 text-xs sm:text-sm" onClick={() => setShowReplyForm(!showReplyForm)}>
            Reply
          </Button>
        </CardFooter>

        {showReplyForm && (
          <div className="px-2 sm:px-4 pb-3 sm:pb-4">
            <form onSubmit={handleReply}>
              <Textarea
                placeholder="Write your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="mb-2 text-xs sm:text-sm"
                rows={2}
                maxLength={1000}
              />
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                <p className="text-xs text-muted-foreground order-2 sm:order-1">
                  {replyContent.length}/1000 characters
                </p>
                <div className="flex gap-2 order-1 sm:order-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowReplyForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="h-7 text-xs">
                    Post
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </Card>

      {childReplies.length > 0 && (
        <div className="ml-4 sm:ml-8 mt-2 space-y-2 border-l-2 border-muted pl-2 sm:pl-4">
          {childReplies.map((childReply) => (
            <ReplyCard key={childReply.id} comment={childReply} postId={postId} />
          ))}
        </div>
      )}

      {/* Comment Report Dialog */}
      <Dialog open={reportCommentDialogOpen} onOpenChange={setReportCommentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report this comment</DialogTitle>
            <DialogDescription>
              Help us keep the community safe by reporting inappropriate content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Select value={commentReportReason} onValueChange={setCommentReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="spam" value="spam">Spam</SelectItem>
                  <SelectItem key="harassment" value="harassment">Harassment</SelectItem>
                  <SelectItem key="inappropriate" value="inappropriate">Inappropriate content</SelectItem>
                  <SelectItem key="misinformation" value="misinformation">Misinformation</SelectItem>
                  <SelectItem key="other" value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Additional details (optional)</label>
              <Textarea
                value={commentReportDescription}
                onChange={(e) => setCommentReportDescription(e.target.value)}
                placeholder="Provide additional context..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportCommentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCommentReport} disabled={!commentReportReason}>
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}