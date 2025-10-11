// DebugFlagging.tsx - Component to help debug the flagging system
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { postService, reportService } from "@/lib/database";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function DebugFlagging() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDebugInfo = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch some posts for debugging
      const { data: feedPosts, error: postsError } = await postService.getFeedPosts(10, 0);
      if (postsError) {
        console.error('Error fetching posts:', postsError);
        return;
      }
      
      setPosts(feedPosts || []);
      
      // You could also fetch reports here if you have admin privileges
      // This would require a special admin function in your database service
    } catch (error) {
      console.error('Error in fetchDebugInfo:', error);
    } finally {
      setLoading(false);
    }
  };

  const manuallyFlagPost = async (postId: string) => {
    if (!user) return;
    
    try {
      // This is a temporary function to manually flag a post for testing
      // In a real implementation, this would be an admin-only function
      console.log('Would manually flag post:', postId);
      
      toast({
        title: "Manual Flag",
        description: `Would flag post ${postId}. Check console for details.`,
      });
    } catch (error) {
      console.error('Error manually flagging post:', error);
      toast({
        title: "Error",
        description: "Failed to manually flag post",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchDebugInfo();
    }
  }, [user]);

  if (!user) return null;

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Flagging System Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={fetchDebugInfo} disabled={loading}>
              {loading ? "Loading..." : "Refresh Debug Info"}
            </Button>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Recent Posts:</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {posts.map((post) => (
                <div key={post.id} className="border p-2 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{post.profiles?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {post.content.substring(0, 100)}...
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-2 py-1 text-xs rounded ${
                        post.is_flagged 
                          ? "bg-red-100 text-red-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {post.is_flagged ? "FLAGGED" : "NORMAL"}
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-1 text-xs"
                        onClick={() => manuallyFlagPost(post.id)}
                      >
                        Flag
                      </Button>
                    </div>
                  </div>
                  {post.is_flagged && post.flagged_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Flagged at: {new Date(post.flagged_at).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p className="font-medium">Debug Information:</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>Check browser console for any errors</li>
              <li>Verify database trigger is working</li>
              <li>Check Supabase logs for trigger execution</li>
              <li>Ensure RLS policies are correctly hiding flagged posts</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}