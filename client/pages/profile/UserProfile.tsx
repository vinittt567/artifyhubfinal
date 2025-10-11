import { AppShell } from "@/components/app/AppShell";
import { useParams } from "react-router-dom";
import { ProfileHeader } from "@/components/app/ProfileHeader";
import { ClayCard } from "@/components/app/ClayCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostCard, Post } from "@/components/app/PostCard";
import { Edit, Loader2, MapPin, Link as LinkIcon, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { profileService, skillsService, workExperienceService, postService } from "@/lib/database";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsive } from "@/hooks/useResponsive";
import { formatTimeAgo } from "@/lib/utils";

interface Profile {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
  tagline?: string;
  bio?: string;
  location?: string;
  website?: string;
  github_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  is_verified?: boolean;
  follower_count: number;
  following_count: number;
  post_count: number;
  created_at: string;
}

interface Skill {
  id: string;
  skill_name: string;
  proficiency?: number;
  category?: string;
}

interface WorkExperience {
  id: string;
  company: string;
  role: string;
  start_date?: string;
  end_date?: string;
  currently_working?: boolean;
  description?: string;
  technologies?: string[];
}

export default function UserProfilePage() {
  const { username = "me" } = useParams();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isOwnProfile = username === "me" || (profile && user && profile.username === user.user_metadata?.username);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let profileData;
        
        if (username === "me" && user) {
          // Load current user's profile
          const { data, error: profileError } = await profileService.getProfile(user.id);
          if (profileError) throw profileError;
          profileData = data;
        } else {
          // Load profile by username
          const { data, error: profileError } = await profileService.getProfileByUsername(username);
          if (profileError) throw profileError;
          profileData = data;
        }
        
        if (!profileData) {
          setError('Profile not found');
          return;
        }
        
        setProfile(profileData);
        
        // Load skills, work experience, and posts in parallel
        const [skillsResult, workResult, postsResult] = await Promise.allSettled([
          skillsService.getUserSkills(profileData.id),
          workExperienceService.getUserWorkExperience(profileData.id),
          postService.getUserPosts(profileData.id, 10)
        ]);
        
        if (skillsResult.status === 'fulfilled' && skillsResult.value.data) {
          setSkills(skillsResult.value.data);
        }
        
        if (workResult.status === 'fulfilled' && workResult.value.data) {
          setWorkExperiences(workResult.value.data);
        }
        
        if (postsResult.status === 'fulfilled' && postsResult.value.data) {
          setPosts(postsResult.value.data);
        }
        
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [username, user]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !profile) {
    return (
      <AppShell>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <div className="text-lg font-medium text-muted-foreground">Profile not found</div>
            <p className="text-muted-foreground">{error || 'The requested profile does not exist.'}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className={`mx-auto w-full space-y-6 ${
        isMobile ? 'max-w-full px-4' : 'max-w-3xl'
      }`}>
        <ProfileHeader
          name={profile.name}
          username={profile.username}
          tagline={profile.tagline || 'Developer'}
          avatarUrl={profile.avatar_url}
          isVerified={profile.is_verified}
          followerCount={profile.follower_count}
          followingCount={profile.following_count}
          postCount={profile.post_count}
        />
        
        {isOwnProfile && (
          <div className="flex justify-end">
            <Link to="/profile/edit">
              <Button variant="outline" size={isMobile ? 'sm' : 'default'}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </Link>
          </div>
        )}

        <ClayCard>
          <Tabs defaultValue="about" className="w-full">
            <div className="flex items-center justify-between gap-4">
              <TabsList className={`bg-card/60 ${isMobile ? 'text-xs' : ''}`}>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="work">Work</TabsTrigger>
                <TabsTrigger value="posts">Posts</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="about" className="mt-6">
              <div className="space-y-4">
                {profile.bio && (
                  <div>
                    <label className="mb-2 block text-sm font-medium">Bio</label>
                    <div className="w-full rounded-xl border bg-background/70 px-4 py-3 text-sm">
                      {profile.bio}
                    </div>
                  </div>
                )}
                
                <div className="grid gap-4 md:grid-cols-2">
                  {profile.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {(profile.website || profile.github_url || profile.linkedin_url || profile.twitter_url) && (
                  <div>
                    <label className="mb-2 block text-sm font-medium">Links</label>
                    <div className="space-y-2">
                      {profile.website && (
                        <a 
                          href={profile.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-brand hover:underline"
                        >
                          <LinkIcon className="h-4 w-4" />
                          Website
                        </a>
                      )}
                      {profile.github_url && (
                        <a 
                          href={profile.github_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-brand hover:underline"
                        >
                          <LinkIcon className="h-4 w-4" />
                          GitHub
                        </a>
                      )}
                      {profile.linkedin_url && (
                        <a 
                          href={profile.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-brand hover:underline"
                        >
                          <LinkIcon className="h-4 w-4" />
                          LinkedIn
                        </a>
                      )}
                      {profile.twitter_url && (
                        <a 
                          href={profile.twitter_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-brand hover:underline"
                        >
                          <LinkIcon className="h-4 w-4" />
                          Twitter
                        </a>
                      )}
                    </div>
                  </div>
                )}
                
                {!profile.bio && !profile.location && !profile.website && (
                  <div className="text-center py-8 text-muted-foreground">
                    {isOwnProfile ? (
                      <div className="space-y-2">
                        <p>Your profile is looking a bit empty.</p>
                        <Link to="/profile/edit">
                          <Button variant="outline" size="sm">
                            Add Bio & Info
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <p>This user hasn't added any information yet.</p>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="skills" className="mt-6">
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge
                      key={skill.id}
                      className="rounded-2xl border-white/10 bg-brand/10 text-foreground hover:bg-brand/20"
                      variant="outline"
                    >
                      {skill.skill_name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {isOwnProfile ? (
                    <div className="space-y-2">
                      <p>No skills added yet.</p>
                      <Link to="/profile/edit">
                        <Button variant="outline" size="sm">
                          Add Skills
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <p>This user hasn't added any skills yet.</p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="work" className="mt-6 space-y-3">
              {workExperiences.length > 0 ? (
                workExperiences.map((experience) => (
                  <ClayCard key={experience.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{experience.company}</p>
                        <p className="text-sm text-muted-foreground">{experience.role}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {experience.start_date && new Date(experience.start_date).toLocaleDateString()}
                          {' — '}
                          {experience.currently_working 
                            ? 'Present' 
                            : experience.end_date 
                              ? new Date(experience.end_date).toLocaleDateString()
                              : 'Present'
                          }
                        </p>
                        {experience.description && (
                          <p className="text-sm mt-2">{experience.description}</p>
                        )}
                        {experience.technologies && experience.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {experience.technologies.map((tech, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </ClayCard>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {isOwnProfile ? (
                    <div className="space-y-2">
                      <p>No work experience added yet.</p>
                      <Link to="/profile/edit">
                        <Button variant="outline" size="sm">
                          Add Experience
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <p>This user hasn't added any work experience yet.</p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="posts" className="mt-6 space-y-4">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {isOwnProfile ? (
                    <div className="space-y-2">
                      <p>You haven't posted anything yet.</p>
                      <Link to="/create">
                        <Button variant="outline" size="sm">
                          Create Your First Post
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <p>This user hasn't posted anything yet.</p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ClayCard>
      </div>
    </AppShell>
  );
}
