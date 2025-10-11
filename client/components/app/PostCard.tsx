import { Heart, MessageCircle, MoreHorizontal, Verified, Trash2, Flag, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ClayCard } from "@/components/app/ClayCard";
import { renderMarkdownNodes } from "@/lib/markdown";
import { likeService, postService, reportService } from "@/lib/database";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsive } from "@/hooks/useResponsive";
import { formatTimeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type Post = {
  id: string;
  content: string;
  image_urls?: string[];
  code_language?: string;
  tags?: string[];
  like_count: number;
  comment_count: number;
  share_count: number;
  is_public: boolean;
  is_flagged: boolean;
  flagged_at?: string;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    name: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
};

export function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isMobile } = useResponsive();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("inappropriate");
  const [reportDetails, setReportDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  const initials = post.profiles.name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Check if user has liked this post
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (user) {
        try {
          const { data, error } = await likeService.checkIfLiked(post.id);
          if (!error) {
            setIsLiked(!!data);
          } else {
            console.warn('Error checking like status:', error);
          }
        } catch (error) {
          console.warn('Failed to check like status:', error);
        }
      }
    };
    checkLikeStatus();
  }, [post.id, user]);

  // Check if user has already reported this post
  useEffect(() => {
    const checkReportStatus = async () => {
      if (user && user.id !== post.profiles.id) {
        try {
          const { data, error } = await reportService.getUserReportForPost(post.id);
          if (!error && data) {
            setHasReported(true);
          }
        } catch (error) {
          console.warn('Failed to check report status:', error);
        }
      }
    };
    checkReportStatus();
  }, [post.id, user, post.profiles.id]);

  const handleLike = async () => {
    if (!user || isLoading) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await likeService.toggleLike(post.id);
      if (!error && data) {
        setIsLiked(data.liked);
        setLikeCount(prev => data.liked ? prev + 1 : prev - 1);
      } else if (error) {
        console.error('Like operation failed:', error);
        // You could show a toast notification here if desired
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!user || isDeleting) return;
    
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const { error } = await postService.deletePost(post.id);
      
      if (error) {
        throw new Error(error);
      }
      
      toast({
        title: "Post Deleted",
        description: "Your post has been successfully deleted.",
      });
      
      // Refresh the feed or remove the post from the UI
      // This would typically be handled by the parent component
      window.location.reload();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete post",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReportPost = async () => {
    if (!user || isReporting || hasReported) return;
    
    setIsReporting(true);
    try {
      const { error } = await reportService.reportPost(post.id, reportReason, reportDetails);
      
      if (error) {
        throw new Error(error);
      }
      
      toast({
        title: "Post Reported",
        description: "Thank you for reporting this post. Our team will review it.",
      });
      
      setHasReported(true);
      setIsReportDialogOpen(false);
      setReportDetails("");
    } catch (error) {
      console.error('Error reporting post:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to report post",
        variant: "destructive",
      });
    } finally {
      setIsReporting(false);
    }
  };

  const timeAgo = formatTimeAgo(post.created_at);
  const isPostOwner = user?.id === post.profiles.id;
  const isFlagged = post.is_flagged;

  // If the post is flagged and the user is not the owner, don't show it
  if (isFlagged && !isPostOwner) {
    return null;
  }

  return (
    <ClayCard className={`transition-all duration-200 hover:scale-[1.002] ${
      isMobile ? 'p-3' : 'p-5'
    }`}>
      {isFlagged && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle className="flex items-center gap-2">
            <EyeOff className="h-4 w-4" />
            Post Under Review
          </AlertTitle>
          <AlertDescription>
            This post has been flagged for review due to multiple reports. Only you can see this post.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex gap-4">
        {/* Avatar */}
        <div className={`flex-none rounded-full bg-brand/10 text-brand grid place-items-center font-semibold ring-4 ring-white/5 overflow-hidden ${
          isMobile ? 'h-8 w-8 text-xs' : 'h-12 w-12 text-sm'
        }`}>
          {post.profiles.avatar_url ? (
            <img
              src={post.profiles.avatar_url}
              alt={post.profiles.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        
        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${
              isMobile ? 'text-xs' : 'text-sm'
            }`}>
              <span className="font-semibold flex items-center gap-1">
                {post.profiles.name}
                {post.profiles.is_verified && (
                  <Verified className={`text-blue-500 ${
                    isMobile ? 'h-3 w-3' : 'h-4 w-4'
                  }`} />
                )}
              </span>
              <span className="text-muted-foreground">@{post.profiles.username}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{timeAgo}</span>
            </div>
            
            <div className="flex items-center gap-1">
              {isPostOwner && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={handleDeletePost}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
              
              {!isMobile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isPostOwner ? (
                      <DropdownMenuItem 
                        onClick={handleDeletePost}
                        className="text-red-500 focus:text-red-600 focus:bg-red-50"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Post
                          </>
                        )}
                      </DropdownMenuItem>
                    ) : (
                      <>
                        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                          <DialogTrigger asChild>
                            <DropdownMenuItem 
                              onSelect={(e) => e.preventDefault()}
                              disabled={hasReported}
                              className={hasReported ? "text-muted-foreground" : "text-red-500 focus:text-red-600 focus:bg-red-50"}
                            >
                              <Flag className="mr-2 h-4 w-4" />
                              {hasReported ? "Already Reported" : "Report Post"}
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Report Post</DialogTitle>
                              <DialogDescription>
                                Why are you reporting this post? This report will be reviewed by our team.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <RadioGroup defaultValue="inappropriate" onValueChange={setReportReason}>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="inappropriate" id="inappropriate" />
                                  <Label htmlFor="inappropriate">Inappropriate content</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="spam" id="spam" />
                                  <Label htmlFor="spam">Spam or misleading</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="harassment" id="harassment" />
                                  <Label htmlFor="harassment">Harassment or bullying</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="other" id="other" />
                                  <Label htmlFor="other">Other</Label>
                                </div>
                              </RadioGroup>
                              <div className="space-y-2">
                                <Label htmlFor="details">Additional details (optional)</Label>
                                <Textarea
                                  id="details"
                                  value={reportDetails}
                                  onChange={(e) => setReportDetails(e.target.value)}
                                  placeholder="Provide more details about your report..."
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleReportPost} disabled={isReporting || hasReported}>
                                {isReporting ? "Reporting..." : "Submit Report"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <DropdownMenuItem>Copy Link</DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          {/* Post Content */}
          <div className={`mt-3 space-y-3 ${isFlagged ? 'opacity-70' : ''} ${
            isMobile ? 'text-sm' : 'text-base'
          }`}>
            {renderMarkdownNodes(post.content)}
          </div>
          
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.tags.slice(0, isMobile ? 3 : 5).map((tag, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 bg-brand/10 text-brand rounded-full ${
                    isMobile ? 'text-xs' : 'text-sm'
                  } ${isFlagged ? 'opacity-70' : ''}`}
                >
                  #{tag}
                </span>
              ))}
              {post.tags.length > (isMobile ? 3 : 5) && (
                <span className={`text-muted-foreground ${
                  isMobile ? 'text-xs' : 'text-sm'
                } ${isFlagged ? 'opacity-70' : ''}`}>
                  +{post.tags.length - (isMobile ? 3 : 5)} more
                </span>
              )}
            </div>
          )}
          
          {/* Images */}
          {post.image_urls && post.image_urls.length > 0 && (
            <div className="mt-4 space-y-3">
              {post.image_urls.slice(0, 4).map((imageUrl, index) => (
                <div key={index} className={`overflow-hidden rounded-2xl border border-white/10 bg-muted/30 ${isFlagged ? 'opacity-70' : ''}`}>
                  <img
                    src={imageUrl}
                    alt={`Post image ${index + 1}`}
                    className={`w-full object-cover ${
                      isMobile ? 'max-h-64' : 'max-h-[500px]'
                    }`}
                    loading="lazy"
                  />
                </div>
              ))}
              {post.image_urls.length > 4 && (
                <div className={`text-sm text-muted-foreground ${isFlagged ? 'opacity-70' : ''}`}>
                  +{post.image_urls.length - 4} more images
                </div>
              )}
            </div>
          )}
          
          {/* Actions */}
          <div className={`mt-4 pt-3 border-t border-muted/30 flex items-center text-muted-foreground ${
            isMobile ? 'gap-4 text-xs' : 'gap-8 text-sm'
          } ${isFlagged ? 'opacity-70' : ''}`}>
            <button 
              onClick={handleLike}
              disabled={isLoading || isFlagged}
              className={`inline-flex items-center gap-2 hover:text-foreground transition-colors ${
                isLiked ? 'text-red-500' : ''
              } ${isLoading ? 'opacity-50' : ''}`}
              aria-label={isLiked ? "Unlike post" : "Like post"}
            >
              <Heart className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} ${
                isLiked ? 'fill-current' : ''
              }`} />
              <span>{likeCount}</span>
            </button>
            
            <Link 
              to={`/post/${post.id}`}
              className="inline-flex items-center gap-2 hover:text-foreground transition-colors active:scale-95 cursor-pointer"
              aria-label="Comment on post"
            >
              <MessageCircle className={isMobile ? 'h-4 w-4' : 'h-5 w-5'} />
              <span>{post.comment_count}</span>
            </Link>
          </div>
        </div>
      </div>
    </ClayCard>
  );
}