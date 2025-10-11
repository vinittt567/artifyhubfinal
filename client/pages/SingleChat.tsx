import { AppShell } from "@/components/app/AppShell";
import { ChatWindow, Message } from "@/components/app/ChatWindow";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Video, MoreHorizontal, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { messageService, profileService } from "@/lib/database";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsive } from "@/hooks/useResponsive";

interface ConversationData {
  id: string;
  participant: {
    id: string;
    username: string;
    name: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
}

export default function SingleChatPage() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConversationData = async () => {
      if (!conversationId || !user) return;
      
      try {
        setLoading(true);
        
        // Load messages for this conversation
        const { data: messagesData, error: messagesError } = await messageService.getMessages(conversationId);
        
        if (messagesError) {
          throw new Error(typeof messagesError === 'string' ? messagesError : messagesError.message || 'Failed to load messages');
        }
        
        if (messagesData && messagesData.length > 0) {
          // Get the other participant from the first message
          const otherParticipant = messagesData.find(msg => msg.sender_id !== user.id);
          
          if (otherParticipant && otherParticipant.profiles) {
            setConversation({
              id: conversationId,
              participant: {
                id: otherParticipant.profiles.id,
                username: otherParticipant.profiles.username,
                name: otherParticipant.profiles.name,
                avatar_url: otherParticipant.profiles.avatar_url
              }
            });
          } else {
            // Fallback conversation data
            setConversation({
              id: conversationId,
              participant: {
                id: 'unknown',
                username: 'user',
                name: 'Unknown User',
                avatar_url: undefined
              }
            });
          }
          
          // Transform messages
          const transformedMessages: Message[] = messagesData.map(msg => ({
            id: msg.id,
            text: msg.content || '',
            self: msg.sender_id === user.id,
            createdAt: new Date(msg.created_at).toLocaleTimeString()
          })).reverse();
          
          setMessages(transformedMessages);
        } else {
          // No messages yet, still set up a basic conversation
          setConversation({
            id: conversationId,
            participant: {
              id: 'unknown',
              username: 'user',
              name: 'New Conversation',
              avatar_url: undefined
            }
          });
          setMessages([]);
        }
        
      } catch (err) {
        console.error('Error loading conversation:', err);
        setError(err instanceof Error ? err.message : 'Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    loadConversationData();
  }, [conversationId, user]);

  const handleSendMessage = async (text: string) => {
    if (!conversationId || !user) return;
    
    try {
      const { data, error } = await messageService.sendMessage(conversationId, text);
      
      if (error) {
        console.error('Error sending message:', error);
        return;
      }
      
      if (data) {
        const newMessage: Message = {
          id: data.id,
          text: data.content,
          self: true,
          createdAt: new Date(data.created_at).toLocaleTimeString()
        };
        
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (loading) {
    return (
      <AppShell mainClassName="flex flex-col h-screen p-0">
        <div className="flex justify-center items-center flex-1">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand" />
            <p className="text-muted-foreground">Loading conversation...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !conversation) {
    return (
      <AppShell mainClassName="flex flex-col h-screen p-0">
        <div className="flex justify-center items-center flex-1">
          <div className="text-center space-y-4">
            <div className="text-red-500 text-lg font-medium">Error</div>
            <p className="text-muted-foreground">{error || 'Conversation not found'}</p>
            <Button onClick={() => navigate('/messages')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Messages
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell mainClassName="flex flex-col h-screen p-0">
      {/* Chat Header */}
      <div className={`flex items-center gap-3 border-b bg-background/80 backdrop-blur ${
        isMobile ? 'p-3' : 'p-4'
      }`}>
        <Link to="/messages">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        
        <Avatar className={isMobile ? 'h-8 w-8' : 'h-10 w-10'}>
          <AvatarImage src={conversation.participant.avatar_url} />
          <AvatarFallback>
            {conversation.participant.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h2 className={`font-semibold truncate ${
            isMobile ? 'text-sm' : 'text-base'
          }`}>
            {conversation.participant.name}
          </h2>
          <p className={`text-muted-foreground ${
            isMobile ? 'text-xs' : 'text-sm'
          }`}>
            @{conversation.participant.username}
          </p>
        </div>
        
        {!isMobile && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Chat Window */}
      <div className="flex-1 min-h-0">
        <ChatWindow
          name={conversation.participant.name}
          username={conversation.participant.username}
          avatarUrl={conversation.participant.avatar_url}
          online={false} // TODO: Implement online status
          messages={messages}
          onSend={handleSendMessage}
        />
      </div>
    </AppShell>
  );
}