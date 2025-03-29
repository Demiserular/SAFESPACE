"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { generateUsername } from "@/lib/username-generator"
import { supabase } from "@/lib/supabase"
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
      const { data, error } = await supabase
        .from("chat_rooms")
        .select("*")
        .eq("id", roomId)
        .single()

      if (error) {
        console.error("Error fetching room:", error)
        router.push("/chat-rooms")
      } else if (data) {
        setRoom(data)
        
        // Add system welcome message
        const welcomeMessage: Message = {
          id: Date.now(),
          username: "System",
          content: `Welcome to ${data.name}! Please be respectful and follow our community guidelines.`,
          timestamp: new Date().toISOString(),
          isSystemMessage: true
        }
        setMessages([welcomeMessage])
        
        // Simulate fetching messages (replace with actual fetch)
        setTimeout(() => {
          setLoading(false)
        }, 1000)
      }
    }

    fetchRoom()
    
    // Set up subscription for real-time updates
    const roomSubscription = supabase
      .channel(`room:${roomId}`)
      .on('presence', { event: 'sync' }, () => {
        // Update active users count
        setActiveUsers(Math.floor(Math.random() * 10) + 1) // Simulated for now
      })
      .on('broadcast', { event: 'message' }, payload => {
        // Handle new messages
        if (payload.message && payload.username) {
          const newMessage: Message = {
            id: Date.now(),
            username: payload.username,
            content: payload.message,
            timestamp: new Date().toISOString()
          }
          setMessages(prev => [...prev, newMessage])
        }
      })
      .subscribe()
      
    // Cleanup subscription
    return () => {
      roomSubscription.unsubscribe()
    }
  }, [roomId, router])

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

    // Send to Supabase realtime channel
    supabase
      .channel(`room:${roomId}`)
      .send({
        type: 'broadcast',
        event: 'message',
        payload: { message: message.trim(), username }
      })
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
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase()
  }

  // Get random color for avatar based on username
  const getAvatarColor = (username: string) => {
    const colors = [
      "bg-red-500", "bg-blue-500", "bg-green-500", 
      "bg-yellow-500", "bg-purple-500", "bg-pink-500",
      "bg-indigo-500", "bg-teal-500", "bg-orange-500"
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
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const chatTheme = {
    background: "bg-[#1a1a1a]",
    secondaryBg: "bg-[#2a2a2a]",
    accent: "bg-indigo-600",
    text: "text-white",
    textSecondary: "text-gray-400",
    border: "border-gray-700",
    hoverBg: "hover:bg-[#333333]",
    buttonBg: "bg-indigo-600",
    buttonHoverBg: "hover:bg-indigo-700",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-400">Connecting to chat room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${chatTheme.background}`}>
      {/* Sidebar */}
      <div className={`w-64 ${chatTheme.secondaryBg} border-r ${chatTheme.border} hidden md:flex flex-col`}>
        <div className="p-4 border-b border-gray-700">
          <h2 className={`text-lg font-semibold ${chatTheme.text}`}>{room?.name}</h2>
          <p className={`text-sm ${chatTheme.textSecondary}`}>{room?.description}</p>
        </div>
        <div className="p-4">
          <h3 className={`text-sm font-medium ${chatTheme.textSecondary} uppercase tracking-wider mb-3`}>Online Users</h3>
          <div className={`flex items-center gap-2 ${chatTheme.text}`}>
            <Users className="h-4 w-4" />
            <span>{activeUsers} online</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className={`px-4 h-16 flex items-center justify-between ${chatTheme.secondaryBg} border-b ${chatTheme.border}`}>
          <div className="flex items-center gap-3">
            <Link href="/chat-rooms">
              <Button variant="ghost" size="icon" className={`rounded-full ${chatTheme.hoverBg}`}>
                <ArrowLeft className={`h-5 w-5 ${chatTheme.text}`} />
              </Button>
            </Link>
            <div>
              <h1 className={`font-semibold text-lg ${chatTheme.text}`}>{room?.name}</h1>
              <p className={`text-xs ${chatTheme.textSecondary}`}>{activeUsers} people active</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className={`rounded-full ${chatTheme.hoverBg}`} onClick={() => setShowInfo(!showInfo)}>
                    <Info className={`h-5 w-5 ${chatTheme.text}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Room Info</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className={`rounded-full ${chatTheme.hoverBg}`}>
                    <Settings className={`h-5 w-5 ${chatTheme.text}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`group flex items-start gap-3 hover:bg-[#222222] rounded-lg p-2 transition-colors`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={msg.avatarUrl} />
                <AvatarFallback className={`${chatTheme.accent} ${chatTheme.text}`}>
                  {getInitials(msg.username)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${chatTheme.text}`}>{msg.username}</span>
                  <span className={`text-xs ${chatTheme.textSecondary}`}>
                    {formatTimestamp(msg.timestamp)}
                  </span>
                </div>
                
                <div className={`mt-1 ${msg.isSystemMessage ? chatTheme.textSecondary : chatTheme.text}`}>
                  {msg.content}
                </div>
                
                {msg.reactions && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(msg.reactions).map(([emoji, count]) => (
                      <button
                        key={emoji}
                        onClick={() => handleAddReaction(msg.id, emoji)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${chatTheme.secondaryBg} ${chatTheme.text} hover:bg-opacity-80`}
                      >
                        <span>{emoji}</span>
                        <span className={chatTheme.textSecondary}>{count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 ${chatTheme.text}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => handleAddReaction(msg.id, "👍")}
                >
                  <span>👍</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => handleAddReaction(msg.id, "❤️")}
                >
                  <span>❤️</span>
                </Button>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className={`flex items-center gap-2 ${chatTheme.textSecondary} text-sm`}>
              <div className="flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
              </div>
              <span>Someone is typing</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className={`p-4 ${chatTheme.secondaryBg} border-t ${chatTheme.border}`}>
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea 
                placeholder="Type a message..." 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyUp={handleTyping}
                className={`min-h-[2.5rem] max-h-[10rem] ${chatTheme.background} ${chatTheme.text} border-none resize-none`}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-2">
                <label className={`cursor-pointer ${chatTheme.buttonBg} ${chatTheme.buttonHoverBg} p-2 rounded-full`}>
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2h4.586A2 2 0 0112 3.414L15.586 7A2 2 0 0116 8.414V15a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm4.707 4.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 001.414 1.414L7 11.414V15a1 1 0 102 0v-3.586l1.293 1.293a1 1 0 001.414-1.414l-3-3z" clipRule="evenodd" />
                  </svg>
                </label>
              </div>
            </div>
            <Button 
              type="submit" 
              className={`${chatTheme.buttonBg} ${chatTheme.buttonHoverBg} rounded-full p-3`}
              disabled={!message.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Server component that awaits the params and passes them to the client component
export default async function ChatPage({ params }: { params: { roomId: string } }) {
  // Await the params
  const roomId = params.roomId
  
  // Pass the roomId to the client component
  return <ChatClient roomId={roomId} />
}
