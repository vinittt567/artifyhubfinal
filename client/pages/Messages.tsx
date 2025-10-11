import { AppShell } from "@/components/app/AppShell";
import { useEffect, useState } from "react";
import { ChatSidebar, Conversation } from "@/components/app/ChatSidebar";
import { ChatWindow, Message } from "@/components/app/ChatWindow";
import { messageService } from "@/lib/database";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsive } from "@/hooks/useResponsive";
import { Loader2, MessageCircle } from "lucide-react";

export default function MessagesPage() {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messagesById, setMessagesById] = useState<Record<string, Message[]>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data, error } = await messageService.getConversations();
        
        if (error) {
          throw new Error(typeof error === 'string' ? error : error.message || 'Failed to load conversations');
        }
        
        if (data && data.length > 0) {
          // Transform the data from the RPC function to match our Conversation type
          const transformedConversations: Conversation[] = data.map((item: any) => ({
            id: item.conversation_id,
            user: {
              name: item.other_user_name || 'Unknown User',
              username: item.other_user_username || 'unknown',
              avatarUrl: item.other_user_avatar_url,
              online: false // TODO: Implement online status
            },
            last: item.last_message_content || 'Click to start messaging'
          }));
          
          setConversations(transformedConversations);
          
          // Set first conversation as active if available
          if (transformedConversations.length > 0) {
            setActiveId(transformedConversations[0].id);
          }
        } else {
          setConversations([]);
        }
      } catch (err) {
        console.error('Error loading conversations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user]);

  // Load messages for active conversation
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeId) return;
      
      try {
        const { data, error } = await messageService.getMessages(activeId);
        
        if (error) {
          console.error('Error loading messages:', error);
          return;
        }
        
        if (data) {
          // Transform messages from RPC function to match our Message type
          const transformedMessages: Message[] = data.map((msg: any) => ({
            id: msg.message_id,
            text: msg.content || '',
            self: msg.is_own_message,
            createdAt: new Date(msg.created_at).toLocaleTimeString()
          }));
          
          setMessagesById(prev => ({
            ...prev,
            [activeId]: transformedMessages
          }));
        }
      } catch (err) {
        console.error('Error loading messages:', err);
      }
    };

    loadMessages();
  }, [activeId, user]);

  const handleSendMessage = async (text: string) => {
    if (!activeId || !user) return;
    
    try {
      const { data, error } = await messageService.sendMessage(activeId, text);
      
      if (error) {
        console.error('Error sending message:', error);
        return;
      }
      
      if (data) {
        // Add the new message to the local state
        const newMessage: Message = {
          id: data, // RPC function returns message ID
          text: text,
          self: true,
          createdAt: new Date().toLocaleTimeString()
        };
        
        setMessagesById(prev => ({
          ...prev,
          [activeId]: [...(prev[activeId] || []), newMessage]
        }));
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand" />
            <p className="text-muted-foreground">Loading conversations...</p>
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
            <div className="text-red-500 text-lg font-medium">Error loading messages</div>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (conversations.length === 0) {
    return (
      <AppShell>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <MessageCircle className="h-12 w-12 text-muted-foreground/50 mx-auto" />
            <div className="text-lg font-medium text-muted-foreground">No conversations yet</div>
            <p className="text-muted-foreground">
              Start following other developers to begin conversations.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  const activeConversation = conversations.find((c) => c.id === activeId);
  const activeMessages = activeId ? messagesById[activeId] ?? [] : [];

  if (isMobile) {
    // Mobile: Show either sidebar or chat, not both
    if (!activeId) {
      return (
        <AppShell mainClassName="p-0">
          <ChatSidebar
            items={conversations}
            selectedId={activeId}
            onSelect={setActiveId}
          />
        </AppShell>
      );
    } else {
      return (
        <AppShell mainClassName="p-0">
          {activeConversation && (
            <ChatWindow
              name={activeConversation.user.name}
              username={activeConversation.user.username}
              avatarUrl={activeConversation.user.avatarUrl}
              online={activeConversation.user.online}
              messages={activeMessages}
              onSend={handleSendMessage}
            />
          )}
        </AppShell>
      );
    }
  }

  // Desktop: Show both sidebar and chat
  return (
    <AppShell>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ChatSidebar
          items={conversations}
          selectedId={activeId}
          onSelect={setActiveId}
        />
        <div className="md:col-span-2">
          {activeConversation ? (
            <ChatWindow
              name={activeConversation.user.name}
              username={activeConversation.user.username}
              avatarUrl={activeConversation.user.avatarUrl}
              online={activeConversation.user.online}
              messages={activeMessages}
              onSend={handleSendMessage}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center space-y-2">
                <MessageCircle className="h-12 w-12 mx-auto opacity-50" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}