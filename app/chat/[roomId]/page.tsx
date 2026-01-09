'use client'

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { generateUsername } from "@/lib/username-generator"
import { ArrowLeft, Send, Users, Info, Settings, LogOut, Shield, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface Message {
  id: number
  username: string
  content: string
  timestamp: string
  isSystemMessage?: boolean
  avatarUrl?: string
  reactions?: { [emoji: string]: number }
}

interface ChatRoom {
  id: number
  name: string
  description: string
  category?: string
  activeUsers: number
}

// Mock data for chat rooms
const MOCK_ROOMS: { [key: string]: ChatRoom } = {
  "1": {
    id: 1,
    name: "Student Support Hub",
    description: "A safe space for students to discuss academic stress and life challenges",
    category: "Student Life",
    activeUsers: 12
  },
  "2": {
    id: 2,
    name: "Mental Wellness Circle",
    description: "Supportive community for mental health discussions and coping strategies",
    category: "Mental Health",
    activeUsers: 8
  },
  "3": {
    id: 3,
    name: "Fitness Motivation",
    description: "Get motivated and stay accountable with your fitness goals",
    category: "Fitness",
    activeUsers: 15
  },
  "4": {
    id: 4,
    name: "Creative Corner",
    description: "Share your creative projects and get inspired by others",
    category: "Creativity",
    activeUsers: 6
  }
};

// Create a client component that receives the roomId as a prop
function ChatClient({ roomId }: { roomId: string }) {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [room, setRoom] = useState<ChatRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [activeUsers, setActiveUsers] = useState(0)
  const [showInfo, setShowInfo] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  // Generate username on client side only
  useEffect(() => {
    setUsername(generateUsername());
  }, []);

  // Fetch room details
  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true)
      
      // Use mock data instead of Supabase
      const mockRoom = MOCK_ROOMS[roomId];
      
      if (!mockRoom) {
        console.error("Room not found");
        router.push("/chat-rooms");
        return;
      }
      
      setRoom(mockRoom);
      setActiveUsers(mockRoom.activeUsers);
      
      // Add system welcome message
      const welcomeMessage: Message = {
        id: Date.now(),
        username: "System",
        content: `Welcome to ${mockRoom.name}! Please be respectful and follow our community guidelines.`, 
        timestamp: new Date().toISOString(),
        isSystemMessage: true
      }
      setMessages([welcomeMessage]);
      
      // Simulate loading
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }

    fetchRoom();
  }, [roomId, router]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle sending a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    const newMessage: Message = {
      id: Date.now(),
      username,
      content: message,
      timestamp: new Date().toISOString()
    }

    // Add message to local state immediately
    setMessages(prev => [...prev, newMessage])
    setMessage("")

    // Simulate other users typing and responding
    setTimeout(() => {
      const responses = [
        "That's a great point!",
        "I totally agree with you",
        "Thanks for sharing that",
        "Interesting perspective",
        "I can relate to that"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const botUsername = generateUsername();
      
      const botMessage: Message = {
        id: Date.now() + 1,
        username: botUsername,
        content: randomResponse,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, botMessage]);
    }, 2000 + Math.random() * 3000); // Random delay between 2-5 seconds
  }

  // Function to handle adding a reaction to a message
  const handleAddReaction = (messageId: number, emoji: string) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId
          ? {
              ...msg,
              reactions: {
                ...msg.reactions,
                [emoji]: (msg.reactions?.[emoji] || 0) + 1,
              },
            }
          : msg
      )
    );
  };

  // Function to indicate typing
  const handleTyping = () => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1000); // Simulate typing indicator
  };

  // Function to handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Handle file upload logic
      console.log("File uploaded:", file.name);
      alert(`File "${file.name}" uploaded successfully! (Demo mode)`);
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase()
  }

  // Get random color for avatar based on username
  const getAvatarColor = (username: string) => {
    const colors = [
      "bg-primary", "bg-secondary", "bg-accent", 
      "bg-muted", "bg-destructive", "bg-border",
      "bg-ring", "bg-input", "bg-popover"
    ]
    const index = username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
  }

  // Format timestamp to a readable format
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Room Not Found</h2>
          <p className="text-muted-foreground mb-4">The chat room you're looking for doesn't exist.</p>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/chat-rooms">Back to Chat Rooms</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="bg-card rounded-xl shadow-lg border border-border mb-6">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
            <div className="flex items-center gap-4 min-w-0">
              <Button variant="ghost" size="sm" asChild className="hover:bg-accent">
                <Link href="/chat-rooms" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Link>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground truncate">{room.name}</h1>
                <p className="text-sm text-muted-foreground truncate">{room.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{activeUsers} active</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInfo(!showInfo)}
                className="flex items-center gap-2 hover:bg-accent"
              >
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">Info</span>
              </Button>
            </div>
          </div>
          
          {showInfo && (
            <div className="p-4 sm:p-6 bg-accent/50 border-t border-border">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-medium text-foreground mb-2">Room Information</h3>
                  <p className="text-muted-foreground">Category: {room.category}</p>
                  <p className="text-muted-foreground">Active Users: {activeUsers}</p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">Guidelines</h3>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Be respectful and kind</li>
                    <li>• Keep conversations supportive</li>
                    <li>• No personal information</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div className="bg-card rounded-xl shadow-lg border border-border flex flex-col" style={{ height: 'calc(100vh - 14rem)' }}>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-background">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.username === username ? 'justify-end' : 'justify-start'} group`}
              >
                <div className="flex gap-3 max-w-[80%]">
                  {msg.username !== username && !msg.isSystemMessage && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={getAvatarColor(msg.username)}>
                        {getInitials(msg.username)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 ${ 
                      msg.isSystemMessage
                        ? 'bg-accent text-accent-foreground border border-border'
                        : msg.username === username
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border text-foreground'
                    }`}
                  >
                    {!msg.isSystemMessage && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium text-xs ${ 
                          msg.username === username ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        }`}>
                          {msg.username === username ? 'You' : msg.username}
                        </span>
                        <span className={`text-xs ${ 
                          msg.username === username ? 'text-primary-foreground/60' : 'text-muted-foreground/70'
                        }`}>
                          {formatTimestamp(msg.timestamp)}
                        </span>
                      </div>
                    )}
                    <div className="text-sm">{msg.content}</div>
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {Object.entries(msg.reactions).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            className="text-xs bg-white/20 rounded-full px-2 py-1 hover:bg-white/30"
                            onClick={() => handleAddReaction(msg.id, emoji)}
                          >
                            {emoji} {count}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-muted-foreground">Someone is typing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-border p-4 sm:p-6 bg-card">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    handleTyping();
                  }}
                  className="rounded-full border-border focus:border-primary focus:ring-primary"
                />
              </div>
              <Button type="submit" disabled={!message.trim()} className="rounded-full bg-primary hover:bg-primary/90 shadow-lg">
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>Messages are anonymous and secure</span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Connected
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ChatPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return <ChatClient roomId={roomId} />
}