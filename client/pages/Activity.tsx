import { AppShell } from "@/components/app/AppShell";
import { Bell, Heart, MessageSquare, UserPlus, Code, Share, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { notificationService } from "@/lib/database";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsive } from "@/hooks/useResponsive";
import { formatTimeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: string;
  actor_id?: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: any;
  read: boolean;
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    name: string;
    avatar_url?: string;
  };
}

export default function ActivityPage() {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await notificationService.getNotifications();
      
      if (error) {
        throw new Error(typeof error === 'string' ? error : error.message || 'Failed to load notifications');
      }
      
      if (data) {
        setNotifications(data);
        const unread = data.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    
    try {
      await notificationService.markAsRead(unreadIds);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return { icon: Heart, color: 'text-red-500' };
      case 'comment':
        return { icon: MessageSquare, color: 'text-blue-500' };
      case 'follow':
        return { icon: UserPlus, color: 'text-green-500' };
      case 'share':
        return { icon: Share, color: 'text-purple-500' };
      default:
        return { icon: Bell, color: 'text-gray-500' };
    }
  };

  const getNotificationText = (notification: Notification) => {
    const actorName = notification.profiles?.name || 'Someone';
    const username = notification.profiles?.username || 'unknown';
    
    switch (notification.type) {
      case 'like':
        return `${actorName} liked your post`;
      case 'comment':
        return `${actorName} commented on your post`;
      case 'follow':
        return `${actorName} started following you`;
      case 'share':
        return `${actorName} shared your post`;
      default:
        return `${actorName} interacted with your content`;
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand" />
            <p className="text-muted-foreground">Loading activity...</p>
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
            <div className="text-red-500 text-lg font-medium">Error loading activity</div>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={loadNotifications} variant="outline">
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-brand" />
            <h1 className={isMobile ? 'text-xl font-bold' : 'text-2xl font-bold'}>
              Activity
            </h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size={isMobile ? 'sm' : 'default'}>
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications */}
        {notifications.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <Code className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No activity yet</p>
            <p className="text-muted-foreground">
              When people interact with your posts, you'll see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const { icon: Icon, color } = getNotificationIcon(notification.type);
              const notificationText = getNotificationText(notification);
              const timeAgo = formatTimeAgo(notification.created_at);
              
              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                    notification.read 
                      ? 'bg-card hover:bg-muted/50' 
                      : 'bg-brand/5 border-brand/20 hover:bg-brand/10'
                  }`}
                >
                  {/* Icon */}
                  <div className={`p-2 rounded-full bg-muted flex-shrink-0 ${color}`}>
                    <Icon className={isMobile ? 'h-3 w-3' : 'h-4 w-4'} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={isMobile ? 'text-sm' : 'text-base'}>
                      <span className="font-semibold text-foreground">
                        {notificationText}
                      </span>
                    </p>
                    
                    {notification.metadata?.content && (
                      <p className={`text-muted-foreground mt-1 line-clamp-2 ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        "{notification.metadata.content}"
                      </p>
                    )}
                    
                    <p className={`text-muted-foreground mt-2 ${
                      isMobile ? 'text-xs' : 'text-sm'
                    }`}>
                      {timeAgo}
                    </p>
                  </div>
                  
                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="w-2 h-2 bg-brand rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Refresh button at bottom */}
        <div className="flex justify-center pt-6">
          <Button onClick={loadNotifications} variant="ghost">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    </AppShell>
  );
}