import { Paperclip, Send, Code, ArrowLeft } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useResponsive } from "@/hooks/useResponsive";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type Message = {
  id: string;
  text: string;
  self?: boolean;
  createdAt: string;
};

export function ChatWindow({
  name,
  username,
  avatarUrl,
  online,
  messages,
  onSend,
  onBack,
  showHeader = true,
}: {
  name: string;
  username: string;
  avatarUrl?: string;
  online?: boolean;
  messages: Message[];
  onSend: (text: string) => void;
  onBack?: () => void;
  showHeader?: boolean;
}) {
  const { isMobile } = useResponsive();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const submit = () => {
    const trimmedText = text.trim();
    if (!trimmedText) return;
    onSend(trimmedText);
    setText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const insertCodeTemplate = () => {
    setText(prev => `${prev}

\`\`\`tsx
// code here
\`\`\``);
  };

  return (
    <section className={`rounded-3xl border border-white/10 bg-card/80 shadow-[16px_16px_40px_rgba(0,0,0,0.18),_-12px_-12px_32px_rgba(255,255,255,0.05)] backdrop-blur flex flex-col ${
      isMobile ? 'h-[calc(100vh-8rem)] mx-2' : 'h-[70vh]'
    }`}>
      {/* Header */}
      {showHeader && (
        <header className={`flex items-center gap-3 border-b ${
          isMobile ? 'p-3' : 'p-4'
        }`}>
          {onBack && isMobile && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          <Avatar className={isMobile ? 'h-8 w-8' : 'h-10 w-10'}>
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="min-w-0 flex-1">
            <p className={`truncate font-medium ${
              isMobile ? 'text-sm' : 'text-base'
            }`}>
              {name}
            </p>
            <p className={`text-muted-foreground ${
              isMobile ? 'text-xs' : 'text-sm'
            }`}>
              @{username}
            </p>
          </div>
          
          {online && (
            <span className={`inline-flex rounded-full bg-emerald-500 ${
              isMobile ? 'h-2 w-2' : 'h-2.5 w-2.5'
            }`} />
          )}
        </header>
      )}

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className={`flex-1 overflow-y-auto space-y-3 ${
          isMobile ? 'p-3' : 'p-4'
        }`}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <p className={isMobile ? 'text-sm' : 'text-base'}>
                No messages yet
              </p>
              <p className={isMobile ? 'text-xs' : 'text-sm'}>
                Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${
                message.self ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-[8px_8px_20px_rgba(0,0,0,0.15),_-8px_-8px_20px_rgba(255,255,255,0.04)] ${
                  isMobile ? 'text-sm' : 'text-base'
                } ${
                  message.self
                    ? "bg-brand text-brand-foreground"
                    : "bg-background/70 border"
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.text}
                </div>
                <div className={`mt-1 opacity-70 ${
                  isMobile ? 'text-xs' : 'text-sm'
                }`}>
                  {message.createdAt}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className={`border-t ${
        isMobile ? 'p-2' : 'p-3'
      }`}>
        <div className={`flex items-end gap-2 rounded-2xl border bg-background/70 ${
          isMobile ? 'p-1' : 'p-2'
        }`}>
          {/* Attachment button */}
          <Button
            type="button"
            variant="ghost"
            size={isMobile ? "sm" : "default"}
            className={`flex-shrink-0 ${isMobile ? 'h-8 w-8' : 'h-9 w-9'}`}
            title="Attach file"
          >
            <Paperclip className={isMobile ? 'h-4 w-4' : 'h-5 w-5'} />
          </Button>
          
          {/* Code template button */}
          <Button
            type="button"
            variant="ghost"
            size={isMobile ? "sm" : "default"}
            className={`flex-shrink-0 ${isMobile ? 'h-8 w-8' : 'h-9 w-9'}`}
            title="Insert code template"
            onClick={insertCodeTemplate}
          >
            <Code className={isMobile ? 'h-4 w-4' : 'h-5 w-5'} />
          </Button>
          
          {/* Text input */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Write a message..."
            className={`flex-1 rounded-xl bg-transparent resize-none outline-none ${
              isMobile ? 'px-2 py-1 text-sm max-h-20' : 'px-3 py-2 text-base max-h-32'
            }`}
            rows={1}
            style={{
              minHeight: isMobile ? '2rem' : '2.5rem',
              maxHeight: isMobile ? '5rem' : '8rem'
            }}
          />
          
          {/* Send button */}
          <Button
            onClick={submit}
            disabled={!text.trim()}
            className={`flex-shrink-0 shadow-[8px_8px_20px_rgba(0,0,0,0.15),_-8px_-8px_20px_rgba(255,255,255,0.04)] ${
              isMobile ? 'px-3 py-1 text-sm' : 'px-4 py-2'
            }`}
          >
            <Send className={`mr-1 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} /> 
            {!isMobile && 'Send'}
          </Button>
        </div>
      </div>
    </section>
  );
}
