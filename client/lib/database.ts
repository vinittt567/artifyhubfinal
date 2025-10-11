import { supabase } from './supabase';

// Profile operations
export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },

  async getProfileByUsername(username: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
    
    return { data, error };
  },

  async updateProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  },

  async searchProfiles(query: string, limit = 10) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, name, avatar_url, tagline, is_verified')
      .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
      .limit(limit);
    
    return { data, error };
  }
};

// Skills operations
export const skillsService = {
  async getUserSkills(userId: string) {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .eq('user_id', userId)
      .order('skill_name');
    
    return { data, error };
  },

  async addSkill(userId: string, skillData: {
    skill_name: string;
    proficiency?: number;
    category?: string;
  }) {
    const { data, error } = await supabase
      .from('skills')
      .insert({
        user_id: userId,
        ...skillData
      })
      .select()
      .single();
    
    return { data, error };
  },

  async updateSkill(skillId: string, updates: any) {
    const { data, error } = await supabase
      .from('skills')
      .update(updates)
      .eq('id', skillId)
      .select()
      .single();
    
    return { data, error };
  },

  async deleteSkill(skillId: string) {
    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', skillId);
    
    return { error };
  }
};

// Work experience operations
export const workExperienceService = {
  async getUserWorkExperience(userId: string) {
    const { data, error } = await supabase
      .from('work_experiences')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });
    
    return { data, error };
  },

  async addWorkExperience(userId: string, experienceData: {
    company: string;
    role: string;
    start_date?: string;
    end_date?: string;
    currently_working?: boolean;
    description?: string;
    technologies?: string[];
  }) {
    const { data, error } = await supabase
      .from('work_experiences')
      .insert({
        user_id: userId,
        ...experienceData
      })
      .select()
      .single();
    
    return { data, error };
  },

  async updateWorkExperience(experienceId: string, updates: any) {
    const { data, error } = await supabase
      .from('work_experiences')
      .update(updates)
      .eq('id', experienceId)
      .select()
      .single();
    
    return { data, error };
  },

  async deleteWorkExperience(experienceId: string) {
    const { error } = await supabase
      .from('work_experiences')
      .delete()
      .eq('id', experienceId);
    
    return { error };
  }
};

// Post operations
export const postService = {
  async getFeedPosts(limit = 20, offset = 0) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { error: 'Not authenticated' };

    // Get the list of users that the current user is following
    const { data: followingData, error: followingError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    if (followingError) {
      return { error: followingError };
    }

    // Extract the user IDs that are being followed
    const followingIds = followingData?.map(f => f.following_id) || [];
    
    // Also include the current user's own posts
    const userIds = [user.id, ...followingIds];

    // If not following anyone, only show own posts
    if (userIds.length === 0) {
      userIds.push(user.id);
    }

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey (
          id, username, name, avatar_url, is_verified
        ),
        likes (count),
        comments (count)
      `)
      .in('user_id', userIds)
      // Exclude flagged posts from feed
      .eq('is_flagged', false)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    return { data, error };
  },

  async getPostById(postId: string) {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey (
          id, username, name, avatar_url, is_verified
        ),
        likes (count),
        comments (count)
      `)
      .eq('id', postId)
      .single();
    
    return { data, error };
  },

  async getUserPosts(userId: string, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey (
          id, username, name, avatar_url, is_verified
        ),
        likes (count),
        comments (count)
      `)
      .eq('user_id', userId)
      // Include flagged posts for the owner
      .or(`is_public.eq.true,and(user_id.eq.${userId})`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    return { data, error };
  },

  async createPost(post: {
    content: string;
    image_urls?: string[];
    code_language?: string;
    tags?: string[];
  }) {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        ...post,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();
    
    return { data, error };
  },

  async deletePost(postId: string) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { error: 'Not authenticated' };

    // First, verify that the post belongs to the current user
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (fetchError) {
      return { error: fetchError.message || 'Failed to fetch post' };
    }

    // Check if the post belongs to the current user
    if (post.user_id !== user.id) {
      return { error: 'You can only delete your own posts' };
    }

    // Delete the post
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      return { error: error.message || 'Failed to delete post' };
    }

    return { data: true, error: null };
  },

  async searchPosts(query: string, limit = 20) {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey (
          id, username, name, avatar_url, is_verified
        )
      `)
      .textSearch('content_tsv', query)
      // Exclude flagged posts from search results
      .eq('is_flagged', false)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  }
};

// Like operations
export const likeService = {
  async toggleLike(postId: string) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { error: 'Not authenticated' };

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
      
      return { data: { liked: false }, error };
    } else {
      // Like - first get the post to find the author
      const { data: post } = await supabase
        .from('posts')
        .select('user_id, content')
        .eq('id', postId)
        .single();
        
      if (!post) {
        return { error: 'Post not found' };
      }

      // Insert like
      const { data, error } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: user.id })
        .select()
        .single();
      
      // Create notification if liking someone else's post
      if (!error && post.user_id !== user.id) {
        await notificationService.createNotification({
          user_id: post.user_id,
          type: 'like',
          actor_id: user.id,
          entity_type: 'post',
          entity_id: postId,
          metadata: {
            content: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '')
          }
        });
      }
      
      return { data: { liked: true, ...data }, error };
    }
  },

  async checkIfLiked(postId: string) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { data: false, error: null };

    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    return { data: !!data, error: error?.code === 'PGRST116' ? null : error };
  }
};

// Follow operations
export const followService = {
  async toggleFollow(userId: string) {
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) return { error: 'Not authenticated' };

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUser.id)
      .eq('following_id', userId)
      .single();

    if (existingFollow) {
      // Unfollow
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId);
      
      return { data: { following: false }, error };
    } else {
      // Follow
      const { data, error } = await supabase
        .from('follows')
        .insert({ follower_id: currentUser.id, following_id: userId })
        .select()
        .single();
      
      // Create notification for the followed user
      if (!error) {
        await notificationService.createNotification({
          user_id: userId,
          type: 'follow',
          actor_id: currentUser.id,
          entity_type: 'user',
          entity_id: currentUser.id,
          metadata: {}
        });
      }
      
      return { data: { following: true, ...data }, error };
    }
  },

  async checkIfFollowing(userId: string) {
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) return { data: false, error: null };

    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUser.id)
      .eq('following_id', userId)
      .single();

    return { data: !!data, error: error?.code === 'PGRST116' ? null : error };
  },

  async getFollowers(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower_id,
        profiles!follows_follower_id_fkey (
          id, username, name, avatar_url, is_verified
        )
      `)
      .eq('following_id', userId)
      .limit(limit);

    return { data, error };
  },

  async getFollowing(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following_id,
        profiles!follows_following_id_fkey (
          id, username, name, avatar_url, is_verified
        )
      `)
      .eq('follower_id', userId)
      .limit(limit);

    return { data, error };
  }
};

// Comment operations
export const commentService = {
  async getPostComments(postId: string, limit = 20) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles!comments_user_id_fkey (
          id, username, name, avatar_url, is_verified
        )
      `)
      .eq('post_id', postId)
      .is('parent_comment_id', null) // Top-level comments only
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data, error };
  },

  async createComment(postId: string, content: string, parentCommentId?: string) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
        parent_comment_id: parentCommentId || null
      })
      .select(`
        *,
        profiles!comments_user_id_fkey (
          id, username, name, avatar_url, is_verified
        )
      `)
      .single();

    return { data, error };
  }
};

// Message operations
export const messageService = {
  async getConversations(limit = 20) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { error: 'Not authenticated' };

    // Use the new secure RPC function instead of direct table access
    const { data, error } = await supabase.rpc('get_user_conversations');
    
    return { data, error };
  },

  async getOrCreateConversation(otherUserId: string) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { error: 'Not authenticated' };

    // Use the new secure RPC function instead of complex queries
    const { data, error } = await supabase.rpc('start_chat_with_user', {
      other_user_id: otherUserId
    });

    if (error) {
      return { error };
    }

    return { 
      data: {
        conversation_id: data,
        conversations: { id: data }
      }, 
      error: null 
    };
  },

  async createNewConversation(otherUserId: string) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { error: 'Not authenticated' };

    // Use the secure RPC function
    const { data, error } = await supabase.rpc('start_chat_with_user', {
      other_user_id: otherUserId
    });

    if (error) {
      return { error };
    }

    return { 
      data: {
        conversation_id: data,
        conversations: { id: data }
      }, 
      error: null 
    };
  },

  async getConversationWithUser(userId: string) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { error: 'Not authenticated' };

    // Use the secure RPC function to start/find conversation
    const { data, error } = await supabase.rpc('start_chat_with_user', {
      other_user_id: userId
    });

    if (error) {
      return { error };
    }

    // Return in expected format
    return { 
      data: {
        conversation_id: data,
        conversations: { id: data }
      }, 
      error: null 
    };
  },

  async getMessages(conversationId: string, limit = 50) {
    // Use the secure RPC function
    const { data, error } = await supabase.rpc('get_conversation_messages', {
      conv_id: conversationId,
      limit_count: limit
    });

    return { data, error };
  },

  async sendMessage(conversationId: string, content: string, fileUrl?: string) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { error: 'Not authenticated' };

    // Use the secure RPC function
    const { data, error } = await supabase.rpc('send_message', {
      conv_id: conversationId,
      message_content: content,
      file_url_param: fileUrl || null
    });

    return { data, error };
  }
};

// Notification operations
export const notificationService = {
  async getNotifications(limit = 50) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        profiles!notifications_actor_id_fkey (
          id, username, name, avatar_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data, error };
  },

  async createNotification(notificationData: {
    user_id: string;
    type: string;
    actor_id?: string;
    entity_type?: string;
    entity_id?: string;
    metadata?: any;
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notificationData,
        read: false
      })
      .select()
      .single();
    
    return { data, error };
  },

  async markAsRead(notificationIds: string[]) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', notificationIds);

    return { data, error };
  },

  async getUnreadCount() {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { data: 0, error: null };

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    return { data: count || 0, error };
  }
};

// Report operations
export const reportService = {
  async reportPost(postId: string, reason: string, details?: string) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { error: 'Not authenticated' };

    // Insert the report
    const { data, error } = await supabase
      .from('reports')
      .insert({
        post_id: postId,
        reporter_id: user.id,
        reason,
        details
      })
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate report error
      if (error.code === '23505') { // unique_violation
        return { error: 'You have already reported this post' };
      }
      return { error: error.message || 'Failed to report post' };
    }

    return { data, error: null };
  },

  async getUserReportForPost(postId: string) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { data: null, error: null };

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('post_id', postId)
      .eq('reporter_id', user.id)
      .single();

    return { data, error: error?.code === 'PGRST116' ? null : error };
  }
};
