import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app/AppShell";
import { PostCard } from "@/components/app/PostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, Loader2, Trash2, Flag, Eye, EyeOff } from "lucide-react";
import { postService, commentService, profileService, reportService } from "@/lib/database";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsive } from "@/hooks/useResponsive";
import { useToast } from "@/hooks/use-toast";
import { formatTimeAgo } from "@/lib/utils";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Comment = {
  id: string;
  content: string;
  like_count: number;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    name: string;
    avatar_url?: string;
  };
};

type Post = {
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

type UserProfile = {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
  is_verified?: boolean;
};

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("inappropriate");
  const [reportDetails, setReportDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  const fetchPost = async () => {
    if (!postId) return;
    
    try {
      setLoading(true);
      const { data, error } = await postService.getPostById(postId);
      
      if (error) {
        throw new Error(typeof error === 'string' ? error : error.message || 'Unknown error');
      }
      
      if (data) {
        setPost(data);
      } else {
        setError("Post not found");
      }
    } catch (err) {
      console.error("Error fetching post:", err);
      setError(err instanceof Error ? err.message : "Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await profileService.getProfile(user.id);
      
      if (!error && data) {
        setUserProfile(data);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const fetchComments = async () => {
    if (!postId) return;
    
    try {
      setCommentLoading(true);
      const { data, error } = await commentService.getPostComments(postId);
      
      if (error) {
        throw new Error(typeof error === 'string' ? error : error.message || 'Unknown error');
      }
      
      setComments(data || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
      // Don't show error for comments, just show empty state
    } finally {
      setCommentLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!postId || !newComment.trim() || !user || postingComment) return;
    
    try {
      setPostingComment(true);
      const { data, error } = await commentService.createComment(postId, newComment.trim());
      
      if (error) {
        throw new Error(typeof error === 'string' ? error : error.message || 'Unknown error');
      }
      
      if (data) {
        setComments(prev => [data, ...prev]);
        setNewComment("");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
      alert("Failed to post comment. Please try again.");
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!postId || !post || !user || isDeleting) return;
    
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const { error } = await postService.deletePost(postId);
      
      if (error) {
        throw new Error(error);
      }
      
      toast({
        title: "Post Deleted",
        description: "Your post has been successfully deleted.",
      });
      
      // Navigate back to feed after deletion
      navigate("/feed");
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
    if (!postId || !post || !user || isReporting || hasReported) return;
    
    setIsReporting(true);
    try {
      const { error } = await reportService.reportPost(postId, reportReason, reportDetails);
      
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

  // Check if user has already reported this post
  useEffect(() => {
    const checkReportStatus = async () => {
      if (postId && user && post && user.id !== post.profiles.id) {
        try {
          const { data, error } = await reportService.getUserReportForPost(postId);
          if (!error && data) {
            setHasReported(true);
          }
        } catch (error) {
          console.warn('Failed to check report status:', error);
        }
      }
    };
    checkReportStatus();
  }, [postId, user, post]);

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
  }, [postId]);

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand" />
            <p className="text-muted-foreground">Loading post...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <div className="text-red-500 text-lg font-medium">Error loading post</div>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => navigate("/feed")} variant="outline">
              Back to Feed
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!post) {
    return (
      <AppShell>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <div className="text-muted-foreground text-lg">Post not found</div>
            <Button onClick={() => navigate("/feed")} variant="outline">
              Back to Feed
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const isPostOwner = user?.id === post.profiles.id;
  const isFlagged = post.is_flagged;

  // If the post is flagged and the user is not the owner, show a warning
  if (isFlagged && !isPostOwner) {
    return (
      <AppShell>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center space-y-4 max-w-md">
            <Alert variant="destructive">
              <AlertTitle className="flex items-center gap-2 justify-center">
                <EyeOff className="h-5 w-5" />
                Post Under Review
              </AlertTitle>
              <AlertDescription>
                This post has been flagged for review due to multiple reports and is no longer available.
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate("/feed")} variant="outline">
              Back to Feed
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          onClick={() => navigate("/feed")} 
          variant="ghost" 
          size="sm"
          className="h-10 w-10 p-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <h1 className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl'}`}>Post Details</h1>
          <div className="flex items-center gap-1">
            {isPostOwner ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleDeletePost}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
              </Button>
            ) : (
              <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-10 w-10 p-0 ${hasReported ? "text-muted-foreground" : "text-red-500 hover:text-red-600 hover:bg-red-50"}`}
                    disabled={hasReported}
                  >
                    <Flag className="h-5 w-5" />
                  </Button>
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
            )}
          </div>
        </div>
      </div>

      {/* Flagged Post Warning */}
      {isFlagged && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle className="flex items-center gap-2">
            <EyeOff className="h-4 w-4" />
            Post Under Review
          </AlertTitle>
          <AlertDescription>
            This post has been flagged for review due to multiple reports. Only you can see this post.
          </AlertDescription>
        </Alert>
      )}

      {/* Post */}
      <div className="mb-8">
        <PostCard post={post} />
      </div>

      {/* Comments Section */}
      <div className="space-y-6">
        <h2 className={`font-bold ${isMobile ? 'text-lg' : 'text-xl'}`}>
          Comments ({comments.length})
        </h2>

        {/* Comment Form */}
        {userProfile && !isFlagged && (
          <div className="flex gap-4">
            <Avatar className="h-10 w-10">
              {userProfile.avatar_url ? (
                <AvatarImage src={userProfile.avatar_url} alt={userProfile.name} />
              ) : (
                <AvatarFallback className="text-sm">
                  {userProfile.name?.split(" ").map(s => s[0]).join("").toUpperCase() || "U"}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 flex gap-3">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 h-12"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handlePostComment();
                  }
                }}
              />
              <Button 
                onClick={handlePostComment}
                disabled={!newComment.trim() || postingComment}
                size="lg"
                className="h-12 w-12 p-0"
              >
                {postingComment ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Comments List */}
        {commentLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-lg mb-2">No comments yet</div>
            <p>Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4">
                <Avatar className="h-10 w-10">
                  {comment.profiles.avatar_url ? (
                    <AvatarImage src={comment.profiles.avatar_url} alt={comment.profiles.name} />
                  ) : (
                    <AvatarFallback className="text-sm">
                      {comment.profiles.name?.split(" ").map(s => s[0]).join("").toUpperCase() || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="bg-muted/30 rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm">{comment.profiles.name}</span>
                      <span className="text-muted-foreground text-xs">@{comment.profiles.username}</span>
                      <span className="text-muted-foreground text-xs">·</span>
                      <span className="text-muted-foreground text-xs">
                        {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-base">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-6 mt-3 text-sm text-muted-foreground">
                    <button className="hover:text-foreground transition-colors flex items-center gap-1">
                      Like ({comment.like_count})
                    </button>
                    <button className="hover:text-foreground transition-colors">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}