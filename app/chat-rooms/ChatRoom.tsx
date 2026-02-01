import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Users, Clock, MessageSquare, Smile } from 'lucide-react';

interface Message {
  id: number | string;
  username: string;
  content: string;
  timestamp: string;
}

interface ChatRoomProps {
  room: {
    id: string;
    name: string;
    description: string;
    active_users?: number;
    category?: string;
    is_private?: boolean;
    room_code?: string;
    max_users?: number;
  };
  messages: Message[];
  onSendMessage: (e: React.FormEvent) => void;
  message: string;
  setMessage: (message: string) => void;
  loading?: boolean;
  activeUsername: string;
}

export default function ChatRoom({ room, messages, onSendMessage, message, setMessage, loading = false, activeUsername }: ChatRoomProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const copyRoomCode = () => {
    if (room.room_code) {
      navigator.clipboard.writeText(room.room_code);
      alert(`Room code copied: ${room.room_code}`);
    }
  };

  return (
    <Card className="h-[600px] sm:h-[700px] flex flex-col shadow-xl border border-border bg-card">
      {/* Room Header */}
      <CardHeader className="border-b border-border p-4 sm:p-6 bg-secondary/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2 text-foreground">
                <span className="truncate">{room.name}</span>
                {room.is_private && (
                  <Badge variant="default" className="text-xs flex-shrink-0">
                    Private
                  </Badge>
                )}
                {room.category && !room.is_private && (
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    {room.category}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-sm flex items-center gap-2 text-muted-foreground mt-1">
                <Users className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{room.active_users || 0}/{room.max_users || '∞'} people here now</span>
                <span className="text-border">•</span>
                <span className="truncate">{room.description}</span>
                {room.is_private && room.room_code && (
                  <>
                    <span className="text-border">•</span>
                    <span 
                      className="text-primary font-mono cursor-pointer hover:underline flex-shrink-0 font-medium"
                      onClick={copyRoomCode}
                      title="Click to copy room code"
                    >
                      Code: {room.room_code}
                    </span>
                  </>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
            <Clock className="h-3 w-3" />
            <span>Live chat</span>
            {room.is_private && (
              <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
            )}
          </div>
        </div>
      </CardHeader>
      
      {/* Messages Area */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-background">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Smile className="h-12 w-12 mx-auto mb-4 text-primary/60" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">Welcome to {room.name}!</h3>
                <p className="text-sm sm:text-base mb-4 text-muted-foreground">
                  {room.is_private 
                    ? "This is a private room. Only people with the room code can join."
                    : "Be the first to start the conversation"
                  }
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span>Room is active and ready</span>
                </div>
                {room.is_private && room.room_code && (
                  <div className="mt-4 p-3 bg-secondary/60 rounded-lg border border-border">
                    <p className="text-xs font-semibold mb-1 text-foreground">Share this room code:</p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="text-sm font-mono bg-background px-3 py-1.5 rounded border border-border text-foreground font-semibold">
                        {room.room_code}
                      </code>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={copyRoomCode}
                        className="text-xs"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.username === activeUsername ? 'justify-end' : 'justify-start'} group`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm sm:text-base shadow-sm ${
                      msg.username === activeUsername 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary/80 border border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold text-xs ${
                        msg.username === activeUsername ? 'text-primary-foreground/90' : 'text-foreground'
                      }`}>
                        {msg.username === activeUsername ? 'You' : msg.username}
                      </span>
                      <span className={`text-xs ${
                        msg.username === activeUsername ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <div className={`leading-relaxed ${
                      msg.username === activeUsername ? 'text-primary-foreground' : 'text-foreground'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message Input */}
          <div className="border-t border-border bg-card p-4 sm:p-6">
            <form onSubmit={onSendMessage} className="flex gap-3">
              <div className="flex-1 relative">
                <Input
                  placeholder={`Message in ${room.name}...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="text-sm sm:text-base pr-14 rounded-full border-2 border-border focus:border-primary bg-background text-foreground placeholder:text-muted-foreground"
                  disabled={loading}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground font-medium">
                  {message.length}/500
                </div>
              </div>
              <Button 
                type="submit" 
                className="touch-manipulation rounded-full px-6 shadow-lg"
                disabled={!message.trim() || loading}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>Messages are anonymous and secure</span>
              <span className="flex items-center gap-1.5 font-medium">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Connected
              </span>
            </div>
      </div>
    </div>
      </CardContent>
    </Card>
  );
}
