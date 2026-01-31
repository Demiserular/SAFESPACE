"use client"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Heart, MessageSquare, Flag, Share2 } from 'lucide-react'
import { getPosts } from '@/lib/api_routes'
import { createReaction, deleteReaction, getReactions } from '@/lib/api_routes'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { useHapticFeedback } from '@/lib/haptic-feedback'
import { Post, Reaction } from '@/lib/types'

const samplePosts = [
  {
    id: "1",
    anonymous_username: "GentleSoul42",
    title: "Feeling overwhelmed with work deadlines",
    content: "I've been struggling to keep up with my workload lately. Every time I complete one task, three more appear. I'm starting to feel burnt out and don't know how to approach my manager about this.",
    category: "Career Stress",
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    is_anonymous: true,
    status: "active" as "active" | "moderated" | "deleted",
    reaction_counts: { upvotes: 12, hearts: 5, hugs: 8 },
    user_reactions: { upvote: false, heart: false, hug: false },
    comment_count: 7
  },
  {
    id: "2",
    anonymous_username: "HopefulHiker",
    title: "How do you cope with persistent sadness?",
    content: "For the past few months, I've been feeling down most days. I still go through the motions of daily life, but the joy is missing. Has anyone found effective ways to manage these feelings?",
    category: "Depression Help",
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    is_anonymous: true,
    status: "active" as "active" | "moderated" | "deleted",
    reaction_counts: { upvotes: 24, hearts: 18, hugs: 15 },
    user_reactions: { upvote: false, heart: false, hug: false },
    comment_count: 12
  },
  {
    id: "3",
    anonymous_username: "QuietObserver",
    title: "Communication issues with my partner",
    content: "My partner and I seem to be talking past each other lately. We both have good intentions but end up in misunderstandings. Any advice for improving communication in a long-term relationship?",
    category: "Relationship Advice",
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    is_anonymous: true,
    status: "active" as "active" | "moderated" | "deleted",
    reaction_counts: { upvotes: 32, hearts: 14, hugs: 9 },
    user_reactions: { upvote: false, heart: false, hug: false },
    comment_count: 21
  }
]

export default function Home() {
  const [activeTab, setActiveTab] = useState("all")
  const [posts, setPosts] = useState<Array<Post & { 
    reaction_counts: { upvotes: number; hearts: number; hugs: number; }; 
    user_reactions: { upvote: boolean; heart: boolean; hug: boolean; }; 
    comment_count: number; 
  }>>(samplePosts) // Start with sample posts for quick loading
  const { user } = useSupabaseAuth()

  useEffect(() => {
    async function fetchPosts() {
      try {
        // Fetch real posts from API
        const postsData = await getPosts();
        
        let allPosts = [...samplePosts]; // Start with sample posts
        
        if (postsData && postsData.length > 0) {
          // For each real post, fetch its reactions
          const postsWithReactions = await Promise.all(
            postsData.map(async (post) => {
              try {
                const reactions = await getReactions(post.id);
                
                // Ensure reactions is an array
                const reactionsArray = Array.isArray(reactions) ? reactions : [];
                
                // Calculate reaction counts
                const reactionCounts = {
                  upvotes: reactionsArray.filter((r: Reaction) => r.reaction_type === 'upvote').length,
                  hearts: reactionsArray.filter((r: Reaction) => r.reaction_type === 'heart').length,
                  hugs: reactionsArray.filter((r: Reaction) => r.reaction_type === 'hug').length
                };
                
                // Calculate user reactions if user is logged in
                const userReactions = {
                  upvote: user ? reactionsArray.some((r: Reaction) => r.reaction_type === 'upvote' && r.user_id === user.id) : false,
                  heart: user ? reactionsArray.some((r: Reaction) => r.reaction_type === 'heart' && r.user_id === user.id) : false,
                  hug: user ? reactionsArray.some((r: Reaction) => r.reaction_type === 'hug' && r.user_id === user.id) : false
                };
                
                return {
                  ...post,
                  anonymous_username: post.anonymous_username || "Anonymous",
                  reaction_counts: reactionCounts,
                  user_reactions: userReactions,
                  comment_count: 0 // Default comment count for real posts
                };
              } catch (error) {
                console.error(`Error fetching reactions for post ${post.id}:`, error);
                return {
                  ...post,
                  anonymous_username: post.anonymous_username || "Anonymous",
                  reaction_counts: { upvotes: 0, hearts: 0, hugs: 0 },
                  user_reactions: { upvote: false, heart: false, hug: false },
                  comment_count: 0
                };
              }
            })
          );
          
          // Combine real posts with sample posts
          allPosts = [...postsWithReactions, ...samplePosts];
        }
        
        // Sort all posts by creation date (newest first)
        allPosts.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateB.getTime() - dateA.getTime();
        });
        
        setPosts(allPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);
        // Keep sample posts on error, but still sort them
        const sortedSamplePosts = [...samplePosts].sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateB.getTime() - dateA.getTime();
        });
        setPosts(sortedSamplePosts);
      }
    }
    
    fetchPosts();
  }, [user]);

  // Memoize filtered posts to avoid recalculation
  const filteredPosts = useMemo(() => {
    if (activeTab === "all") return posts;
    
    return posts.filter(post =>
      (activeTab === "depression" && post.category === "Depression Help") ||
      (activeTab === "career" && post.category === "Career Stress") ||
      (activeTab === "relationships" && post.category === "Relationship Advice")
    );
  }, [activeTab, posts]);

  // Memoize tab change handler
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 pt-16 md:pt-0">
      {/* Main Content - Posts focused */}
      <div className="container mx-auto px-4 py-5 sm:py-6 lg:px-8 max-w-5xl">

        {/* Posts Feed */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="flex items-center justify-between mb-5 gap-2 overflow-x-auto pb-1">
            <TabsList className="h-10 p-1 w-full sm:w-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm h-8 px-3 sm:px-4">All</TabsTrigger>
              <TabsTrigger value="depression" className="text-xs sm:text-sm h-8 px-3 sm:px-4">Depression</TabsTrigger>
              <TabsTrigger value="career" className="text-xs sm:text-sm h-8 px-3 sm:px-4">Career</TabsTrigger>
              <TabsTrigger value="relationships" className="text-xs sm:text-sm h-8 px-3 sm:px-4">Relationships</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredPosts.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground text-sm">No posts found in this category.</p>
                  <Button asChild className="mt-4" size="sm">
                    <Link href="/create-post">Create the first post</Link>
                  </Button>
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

const PostCard = memo(function PostCard({ post }: { post: any }) {
  const { user } = useSupabaseAuth()
  const haptic = useHapticFeedback()
  const [reactionCounts, setReactionCounts] = useState(post.reaction_counts || { upvotes: 0, hearts: 0, hugs: 0 })
  const [userReactions, setUserReactions] = useState(post.user_reactions || { upvote: false, heart: false, hug: false })
  const [isExpanded, setIsExpanded] = useState(false)
  // Memoize expensive calculations
  const contentLength = useMemo(() => post.content?.length || 0, [post.content])
  const shouldShowMoreButton = useMemo(() => contentLength > 200, [contentLength])
  const commentCount = useMemo(() => post.comment_count || 0, [post.comment_count])
  
  const handleShare = useCallback(async () => {
    try {
      haptic.light() // Provide feedback on interaction
      
      const shareData = {
        title: `Safe Space: ${post.title}`,
        text: `Check out this post from Safe Space: "${post.title}"`,
        url: `${window.location.origin}/post/${post.id}`
      }

      // Check if Web Share API is available (most mobile browsers support this)
      if (navigator.share) {
        try {
          await navigator.share(shareData)
          haptic.success() // Success feedback
          return
        } catch (shareError: any) {
          // User cancelled the share, don't show error
          if (shareError.name === 'AbortError') {
            return
          }
          console.error('Share error:', shareError)
        }
      }
      
      // Fallback to copying URL to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url)
        haptic.medium() // Medium feedback for action completion
        alert('✓ Link copied to clipboard!')
      } catch (clipboardError) {
        // Final fallback - show the link
        prompt('Copy this link to share:', shareData.url)
      }
    } catch (error) {
      console.error('Error sharing:', error)
      haptic.error() // Error feedback
      // Fallback already handled above
    }
  }, [post.title, post.id, haptic])

  const handleReaction = useCallback(async (reactionType: 'upvote' | 'heart' | 'hug') => {
    haptic.light() // Immediate feedback on tap
    
    if (!user) {
      haptic.error() // Error feedback for unauthorized action
      alert("Please log in to react to posts");
      return;
    }
    
    try {
      // Get the current reaction state
      const currentValue = userReactions[reactionType];
      
      // Create a mapping between our UI types and API types
      const reactionTypeMap: {[key: string]: string} = {
        'upvote': 'upvote',
        'heart': 'heart',
        'hug': 'hug'
      };
      
      // Create a mapping between our UI counts and API types
      const countTypeMap: {[key: string]: 'upvotes' | 'hearts' | 'hugs'} = {
        'upvote': 'upvotes',
        'heart': 'hearts',
        'hug': 'hugs'
      };
      
      const apiReactionType = reactionTypeMap[reactionType];
      
      if (currentValue) {
        // Remove the reaction
        await deleteReaction({
          post_id: post.id,
          user_id: user.id,
          reaction_type: apiReactionType as 'upvote' | 'heart' | 'hug'
        });
        
        haptic.light() // Light feedback for removal
        
        // Update local state
        setUserReactions((prev: { upvote: boolean; heart: boolean; hug: boolean }) => ({
          ...prev,
          [reactionType]: false
        }));
        
        setReactionCounts((prev: { upvotes: number; hearts: number; hugs: number }) => ({
          ...prev,
          [countTypeMap[reactionType]]: Math.max(0, prev[countTypeMap[reactionType]] - 1)
        }));
      } else {
        // Add the reaction
        await createReaction({
          post_id: post.id,
          user_id: user.id,
          reaction_type: apiReactionType as 'upvote' | 'heart' | 'hug'
        });
        
        // Different feedback based on reaction type
        switch (reactionType) {
          case 'heart':
            haptic.medium() // Warm feedback for hearts
            break;
          case 'hug':
            haptic.heavy() // Strong feedback for hugs
            break;
          default:
            haptic.light()
        }
        
        // Update local state
        setUserReactions((prev: { upvote: boolean; heart: boolean; hug: boolean }) => ({
          ...prev,
          [reactionType]: true
        }));
        
        setReactionCounts((prev: { upvotes: number; hearts: number; hugs: number }) => ({
          ...prev,
          [countTypeMap[reactionType]]: prev[countTypeMap[reactionType]] + 1
        }));
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
      haptic.error() // Error feedback
      alert("Failed to update reaction. Please try again.");
    }
  }, [user, userReactions, reactionCounts, post.id, haptic])

  return (
    <Card className="hover:shadow-md transition-shadow card-optimized h-full flex flex-col">
      <CardHeader className="p-4 pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm sm:text-base font-semibold line-clamp-2 leading-snug">{post.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="bg-muted px-2 py-0.5 rounded text-[11px]">
                {post.anonymous_username || "Anonymous"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {(() => {
                  const now = new Date();
                  const postDate = new Date(post.created_at);
                  const diffInMs = now.getTime() - postDate.getTime();
                  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
                  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
                  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
                  
                  if (diffInMinutes < 1) return "just now";
                  if (diffInMinutes < 60) return `${diffInMinutes}m`;
                  if (diffInHours < 24) return `${diffInHours}h`;
                  if (diffInDays < 7) return `${diffInDays}d`;
                  return postDate.toLocaleDateString();
                })()}
              </span>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[11px]">
                {post.category || "Support"}
              </span>
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="flex-shrink-0 h-7 w-7"
            onClick={() => {
              if (user) {
                haptic.light()
                alert('Report functionality will be implemented soon');
              } else {
                haptic.error()
                alert('Please log in to report posts');
              }
            }}
          >
            <Flag className="h-3 w-3" />
            <span className="sr-only">Flag post</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1 flex flex-col">
        <div className="flex-1">
          <p className={`text-xs sm:text-sm leading-relaxed text-muted-foreground ${
            !isExpanded && shouldShowMoreButton ? 'line-clamp-3' : ''
          }`}>
            {post.content}
          </p>
          
          {shouldShowMoreButton && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                haptic.light()
                setIsExpanded(!isExpanded)
              }}
              className="h-6 px-2 text-xs text-primary hover:text-primary/80 mt-1"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </Button>
          )}
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/30">
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex gap-1.5 items-center h-8 px-3 hover:bg-transparent transition-colors text-muted-foreground group"
              onClick={() => handleReaction('heart')}
            >
              <Heart className={`h-4 w-4 transition-colors ${
                userReactions.heart 
                  ? 'fill-red-500 text-red-500' 
                  : 'group-hover:text-red-400'
              }`} />
              <span className={`text-sm ${
                userReactions.heart ? 'text-red-500' : ''
              }`}>{reactionCounts.hearts}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex gap-1.5 items-center h-8 px-3 hover:bg-transparent transition-colors text-muted-foreground group"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 group-hover:text-blue-500 transition-colors" />
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            asChild 
            className="flex gap-1.5 items-center h-8 px-3 hover:bg-primary/5 transition-all rounded-full border-primary/20 text-primary text-xs"
          >
            <Link href={`/post/${post.id}`}>
              <MessageSquare className="h-4 w-4" />
              <span>Reply</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})

