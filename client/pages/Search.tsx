import { AppShell } from "@/components/app/AppShell";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PostCard, Post } from "@/components/app/PostCard";
import { profileService, postService, followService, messageService } from "@/lib/database";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsive } from "@/hooks/useResponsive";
import { Search, Users, FileText, Verified, UserPlus, UserCheck, Loader2, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface SearchProfile {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
  tagline?: string;
  is_verified?: boolean;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<SearchProfile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [followingLoading, setFollowingLoading] = useState<Set<string>>(new Set());

  const searchUsers = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await profileService.searchProfiles(searchQuery);
      
      if (error) {
        const errorMessage = typeof error === 'string' ? error : (error as any)?.message || 'Search failed';
        throw new Error(errorMessage);
      }
      
      if (data) {
        setUsers(data);
        
        // Check follow status for each user
        if (user) {
          const followStatuses = await Promise.all(
            data.map(async (profile) => {
              const { data: isFollowing } = await followService.checkIfFollowing(profile.id);
              return { userId: profile.id, isFollowing: !!isFollowing };
            })
          );
          
          const followingSet = new Set(
            followStatuses
              .filter(status => status.isFollowing)
              .map(status => status.userId)
          );
          setFollowingUsers(followingSet);
        }
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const searchPosts = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setPosts([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await postService.searchPosts(searchQuery);
      
      if (error) {
        const errorMessage = typeof error === 'string' ? error : (error as any)?.message || 'Search failed';
        throw new Error(errorMessage);
      }
      
      if (data) {
        setPosts(data);
      }
    } catch (error) {
      console.error('Error searching posts:', error);
      toast({
        title: "Error",
        description: "Failed to search posts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (activeTab === "users") {
      searchUsers(searchQuery);
    } else if (activeTab === "posts") {
      searchPosts(searchQuery);
    }
  };

  const handleMessage = async (profileId: string) => {
    try {
      const { data, error } = await messageService.getOrCreateConversation(profileId);
      
      if (error) {
        console.error('Error creating conversation:', error);
        toast({
          title: "Error",
          description: "Failed to start conversation",
          variant: "destructive"
        });
        return;
      }
      
      if (data) {
        // Navigate to messages page with the conversation
        navigate('/messages');
        toast({
          title: "Success",
          description: "Conversation started"
        });
      }
    } catch (err) {
      console.error('Error starting conversation:', err);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive"
      });
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (query.trim()) {
      if (tab === "users") {
        searchUsers(query);
      } else if (tab === "posts") {
        searchPosts(query);
      }
    }
  };

  const handleFollow = async (userId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to follow users",
        variant: "destructive"
      });
      return;
    }

    setFollowingLoading(prev => new Set([...prev, userId]));
    
    try {
      const { data, error } = await followService.toggleFollow(userId);
      
      if (error) {
        const errorMessage = typeof error === 'string' ? error : (error as any)?.message || 'Search failed';
        throw new Error(errorMessage);
      }
      
      if (data) {
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          if (data.following) {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });
        
        toast({
          title: "Success",
          description: data.following ? "User followed" : "User unfollowed"
        });
      }
    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive"
      });
    } finally {
      setFollowingLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    // Load some initial content if needed
  }, []);

  return (
    <AppShell>
      <div className={`mx-auto w-full space-y-6 ${
        isMobile ? 'max-w-full px-4' : 'max-w-2xl'
      }`}>
        {/* Search Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Search className="h-6 w-6 text-brand" />
            <h1 className={`font-bold ${
              isMobile ? 'text-xl' : 'text-2xl'
            }`}>
              Search
            </h1>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              placeholder="Search users, posts, skills..."
            />
          </div>
        </div>

        {/* Search Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className={`grid w-full grid-cols-2 ${
            isMobile ? 'text-sm' : ''
          }`}>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Posts
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 mt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-3">
                {users.map((profile) => {
                  const isFollowing = followingUsers.has(profile.id);
                  const isLoadingFollow = followingLoading.has(profile.id);
                  const isOwnProfile = user?.id === profile.id;
                  
                  return (
                    <div
                      key={profile.id}
                      className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <Link to={`/profile/${profile.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className={isMobile ? 'h-12 w-12' : 'h-14 w-14'}>
                          <AvatarImage src={profile.avatar_url} />
                          <AvatarFallback>
                            {profile.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold truncate ${
                              isMobile ? 'text-sm' : 'text-base'
                            }`}>
                              {profile.name}
                            </h3>
                            {profile.is_verified && (
                              <Verified className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className={`text-muted-foreground truncate ${
                            isMobile ? 'text-xs' : 'text-sm'
                          }`}>
                            @{profile.username}
                          </p>
                          {profile.tagline && (
                            <p className={`text-muted-foreground truncate mt-1 ${
                              isMobile ? 'text-xs' : 'text-sm'
                            }`}>
                              {profile.tagline}
                            </p>
                          )}
                        </div>
                      </Link>
                      
                      {!isOwnProfile && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Message button - only show if following */}
                          {isFollowing && (
                            <Button
                              onClick={() => handleMessage(profile.id)}
                              variant="outline"
                              size={isMobile ? "sm" : "default"}
                              className="flex-shrink-0"
                            >
                              <MessageCircle className="h-4 w-4" />
                              {!isMobile && <span className="ml-2">Message</span>}
                            </Button>
                          )}
                          
                          {/* Follow button */}
                          <Button
                            onClick={() => handleFollow(profile.id)}
                            disabled={isLoadingFollow}
                            variant={isFollowing ? "outline" : "default"}
                            size={isMobile ? "sm" : "default"}
                            className="flex-shrink-0"
                          >
                            {isLoadingFollow ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isFollowing ? (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                {isMobile ? '' : 'Following'}
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                {isMobile ? '' : 'Follow'}
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : query.trim() ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found for "{query}"</p>
                <p className="text-sm mt-2">Try searching with different keywords</p>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Search for developers to connect with</p>
                <p className="text-sm mt-2">Enter a name or username to get started</p>
              </div>
            )}
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4 mt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : query.trim() ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No posts found for "{query}"</p>
                <p className="text-sm mt-2">Try searching with different keywords</p>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Search for posts and discussions</p>
                <p className="text-sm mt-2">Enter keywords to find relevant content</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
