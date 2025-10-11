import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Post, PostCard } from "@/components/app/PostCard";
import { Link } from "react-router-dom";
import { Plus, Loader2, RefreshCw } from "lucide-react";
import { postService } from "@/lib/database";
import { useResponsive } from "@/hooks/useResponsive";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function FeedPage() {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const POSTS_PER_PAGE = 10;

  const loadPosts = async (offset = 0, isLoadMore = false) => {
    try {
      if (!isLoadMore) setLoading(true);
      else setLoadingMore(true);
      
      const { data, error } = await postService.getFeedPosts(POSTS_PER_PAGE, offset);
      
      if (error) {
        throw new Error(typeof error === 'string' ? error : error.message || 'Unknown error');
      }
      
      if (data) {
        if (isLoadMore) {
          setPosts(prev => [...prev, ...data]);
        } else {
          setPosts(data);
        }
        
        // Check if we have more posts to load
        setHasMore(data.length === POSTS_PER_PAGE);
        setPage(Math.floor(offset / POSTS_PER_PAGE) + 1);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadPosts(page * POSTS_PER_PAGE, true);
    }
  };

  const refresh = () => {
    setPage(0);
    setHasMore(true);
    loadPosts(0, false);
  };

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user]);

  if (loading) {
    return (
      <AppShell mainClassName="container max-w-4xl">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand" />
            <p className="text-muted-foreground">Loading your feed...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell mainClassName="container max-w-4xl">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <div className="text-red-500 text-lg font-medium">Error loading feed</div>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={refresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
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
        <h1 className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl'}`}>Home Feed</h1>
        <Button onClick={refresh} variant="ghost" size="sm">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <div className="text-muted-foreground text-lg">No posts yet</div>
          <p className="text-muted-foreground">
            Follow other developers or create your first post to see content here.
          </p>
          <Link to="/create">
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create First Post
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          
          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center py-6">
              <Button 
                onClick={loadMore} 
                disabled={loadingMore}
                variant="outline"
                className="min-w-[120px]"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create Post FAB */}
      <Link
        to="/create"
        className={`fixed ${isMobile ? 'bottom-20 right-4' : 'bottom-6 right-6'} h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-[16px_16px_40px_rgba(0,0,0,0.18),_-12px_-12px_32px_rgba(255,255,255,0.05)] ring-1 ring-black/5 hover:animate-floaty flex z-50`}
        aria-label="Create post"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </AppShell>
  );
}