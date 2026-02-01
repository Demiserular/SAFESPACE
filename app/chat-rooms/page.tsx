"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash, Share, Users, MessageSquare, Hash, Clock, Users2, Target, Sparkles } from "lucide-react"
import Link from "next/link"
import { generateUsername } from "@/lib/username-generator"
import ChatRoom from './ChatRoom';
import Loader from '@/components/ui/Loader';
import { Badge } from "@/components/ui/badge"
import { useIsMobile } from "@/hooks/use-mobile"
import { MobileChatRoomCircles } from "@/components/MobileChatRoomCircles"
import { ChatService, ChatRoom as ChatRoomType } from "@/lib/chat-service"

// Define types for the application
interface Message {
  id: number | string;
  username: string;
  content: string;
  timestamp: string;
}

// Extended ChatRoom with UI-specific properties
interface ChatRoom extends ChatRoomType {
  active_users?: number;
  messages?: Message[];
  interests?: string[];
  match_score?: number;
}

// Interest tags for matching
const INTEREST_TAGS = [
  "Student Life", "Anxiety", "Depression", "Productivity", "Fitness",
  "Relationships", "Career", "Creativity", "Mindfulness", "Overthinking",
  "Social Anxiety", "Self-Care", "Motivation", "Stress", "Loneliness",
  "Confidence", "Goals", "Habits", "Sleep", "Nutrition"
];

export default function ChatRooms() {
  const isMobile = useIsMobile();
  const [activeUsername, setActiveUsername] = useState('')
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [deletingRoom, setDeletingRoom] = useState<string | null>(null);
  const [sharingRoom, setSharingRoom] = useState<string | null>(null);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [showInterestDialog, setShowInterestDialog] = useState(false);

  useEffect(() => {
    setActiveUsername(generateUsername());
    // Load user interests from localStorage
    const savedInterests = localStorage.getItem('userInterests');
    if (savedInterests) {
      setUserInterests(JSON.parse(savedInterests));
    } else {
      setShowInterestDialog(true);
    }
  }, []);

  useEffect(() => {
    const loadChatRooms = async () => {
      setLoading(true)
      try {
        const rooms = await ChatService.getChatRooms()
        // Map Supabase rooms to local ChatRoom type if needed
        const mappedRooms: ChatRoom[] = rooms.map(room => ({
          ...room,
          active_users: 0,
          messages: [],
          interests: [],
        }))
        setChatRooms(mappedRooms)
      } catch (error) {
        console.error("Failed to load chat rooms:", error)
        // Could show error message to user
      } finally {
        setLoading(false)
      }
    }

    loadChatRooms()
  }, []);

  // Calculate match score based on shared interests
  const calculateMatchScore = (roomInterests: string[]) => {
    if (userInterests.length === 0 || roomInterests.length === 0) return 0;
    const sharedInterests = userInterests.filter(interest => roomInterests.includes(interest));
    return Math.round((sharedInterests.length / Math.max(userInterests.length, roomInterests.length)) * 100);
  };

  const handleInterestSelection = (interests: string[]) => {
    setUserInterests(interests);
    localStorage.setItem('userInterests', JSON.stringify(interests));
    setShowInterestDialog(false);
  };

  const handleJoinPrivateRoom = async (roomCode: string) => {
    setLoading(true);
    
    try {
      // Try to find the room in the database specifically by code
      const room = await ChatService.getChatRoomByCode(roomCode);
      
      if (room) {
        // Map the database room to the local ChatRoom interface
        const mappedRoom: ChatRoom = {
          ...room,
          active_users: 0,
          interests: [],
          messages: []
        };

        setChatRooms(prevRooms => {
          const existing = prevRooms.find(r => r.id === mappedRoom.id);
          if (existing) {
             return prevRooms;
          }
           return [mappedRoom, ...prevRooms];
        });
        
        setSelectedRoom(mappedRoom);
        setMessages([]);
      } else {
        // Fallback for DEMO123 to keep existing behavior if desired, or remove it.
        // User complained about the message, so let's change behavior to only accept valid DB codes OR keep demo if needed but change message? 
        // User report says "whenever i try to join a room with in real time with code its says "Invalid room code. Try "DEMO123" for demo purposes.""
        // This implies they tried a code they thought was valid (maybe from another user).
        
        if (roomCode === "DEMO123") {
           // Keep the demo legacy logic for now just in case
            const privateRoom: ChatRoom = {
              id: "demo-999",
              name: "Demo Private Room",
              description: "A private room for demonstration",
              category: "Private",
              created_by: "demo",
              created_at: new Date().toISOString(),
              active_users: 3,
              interests: ["Student Life", "Anxiety"],
              match_score: 80,
              is_private: true,
              room_code: "DEMO123",
              max_users: 10,
              messages: [
                { id: 100, username: "PrivateUser", content: "Welcome to the private room!", timestamp: "2024-01-15T12:00:00Z" }
              ]
            };

            setChatRooms(prevRooms => {
              const existing = prevRooms.find(room => room.id === privateRoom.id);
              if (existing) {
                return prevRooms;
              }
              return [privateRoom, ...prevRooms];
            });

            setSelectedRoom(privateRoom);
            setMessages(privateRoom.messages || []);
        } else {
            alert('Invalid room code. Please check code and try again.');
        }
      }
    } catch (error) {
       console.error("Error joining private room:", error);
       alert('Failed to verify room code.');
    } finally {
       setLoading(false);
    }
  };

  useEffect(() => {
    if (chatRooms.length > 0 && !selectedRoom) {
      // Auto-select room with highest match score
      const bestMatch = chatRooms.reduce((best, current) => 
        (current.match_score || 0) > (best.match_score || 0) ? current : best
      );
      setSelectedRoom(bestMatch);
      setMessages(bestMatch.messages || []);
    }
  }, [chatRooms, selectedRoom]);

  // Subscribe to real-time messages when room is selected
  useEffect(() => {
    if (!selectedRoom) return;

    let unsubscribe: (() => void) | undefined;

    const setupChat = async () => {
        // Load initial messages
        try {
            const msgs = await ChatService.getChatMessages(String(selectedRoom.id));
            setMessages(msgs.map(m => ({
                id: m.id,
                username: m.username,
                content: m.content,
                timestamp: m.created_at
            }))); // Service returns oldest first (asc) after reverse.
        } catch (e) {
            console.error("Error loading messages:", e);
        }

        // Subscribe
        unsubscribe = ChatService.subscribeToMessages(String(selectedRoom.id), (newMsg) => {
            setMessages(prev => {
                // Prevent duplicates
                if (prev.some(m => m.id === newMsg.id)) return prev;
                
                return [...prev, {
                    id: newMsg.id,
                    username: newMsg.username,
                    content: newMsg.content,
                    timestamp: newMsg.created_at
                }]
            });
        });
    };

    setupChat();

    return () => {
        if (unsubscribe) unsubscribe();
    };
  }, [selectedRoom?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedRoom) return;

    const content = message;
    setMessage("");

    try {
      await ChatService.sendMessage(String(selectedRoom.id), content, activeUsername);
    } catch (error) {
       console.error("Error sending message:", error);
       alert("Failed to send message");
       setMessage(content);
    }
  }

  const handleDeleteRoom = async (roomId: string) => {
    setDeletingRoom(roomId);

    // Mock deletion
    setTimeout(() => {
      setChatRooms((prevRooms) => prevRooms.filter(room => room.id !== roomId));
      setDeletingRoom(null);
    }, 1000);
  };

  const handleShareRoom = (roomId: string) => {
    setSharingRoom(roomId);
    const room = chatRooms.find(r => r.id === roomId);
    if (room?.is_private && room?.room_code) {
      // Copy room code to clipboard
      navigator.clipboard.writeText(room.room_code);
      alert(`Room code copied: ${room.room_code}`);
    } else {
      // Share public room link
      const roomLink = `${window.location.origin}/chat/${roomId}`;
      navigator.clipboard.writeText(roomLink);
      alert('Room link copied to clipboard!');
    }
    setSharingRoom(null);
  };

  const handleRoomCreation = (newRoom: ChatRoom) => {
    setChatRooms(prevRooms => [newRoom, ...prevRooms]);
    setSelectedRoom(newRoom);
    setMessages(newRoom.messages || []);
  };

  function openChatInterface(roomId: string) {
    const room = chatRooms.find(r => r.id === roomId);
    if (room) {
      setSelectedRoom(room);
      setMessages(room.messages || []);
    }
  }

  if (showInterestDialog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-md border border-border">
          <InterestSelector
            selectedInterests={userInterests}
            onInterestsChange={handleInterestSelection}
            onSkip={() => {
              setUserInterests([]);
              setShowInterestDialog(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Chat Rooms</h1>
            <p className="text-muted-foreground text-sm mt-1">Connect with peers who share your interests</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <JoinPrivateRoomDialog onJoinRoom={handleJoinPrivateRoom} />
            <CreateRoomDialog setChatRooms={setChatRooms} onRoomCreation={handleRoomCreation} />
          </div>
        </div>

        {/* Mobile Chat Room Circles */}
        {isMobile && (
          <div className="mb-5">
            <MobileChatRoomCircles 
              rooms={chatRooms}
              selectedRoomId={selectedRoom?.id || null}
              onRoomSelect={openChatInterface}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Chat Rooms List - Desktop Only - Compact sidebar */}
          {!isMobile && (
            <div className="lg:col-span-3">
              <div className="bg-card rounded-lg shadow border border-border p-3 lg:sticky lg:top-4">
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  Rooms ({chatRooms.length})
                </h2>
                <div className="space-y-2 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
                  {chatRooms.map((room) => (
                    <div
                      key={room.id}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedRoom?.id === room.id
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border bg-card hover:border-primary/40 hover:bg-secondary/60'
                      }`}
                      onClick={() => openChatInterface(room.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs font-medium truncate text-foreground">
                            {room.name}
                          </h3>
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                            {room.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {room.is_private && room.room_code && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareRoom(room.id);
                              }}
                              className="h-5 w-5 p-0"
                            >
                              <Share className="w-2.5 h-2.5 text-muted-foreground" />
                            </Button>
                          )}
                          {room.created_by === activeUsername && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRoom(room.id);
                              }}
                              className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                              disabled={deletingRoom === room.id}
                            >
                              {deletingRoom === room.id ? (
                                <Loader className="w-2.5 h-2.5" />
                              ) : (
                                <Trash className="w-2.5 h-2.5" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                          {room.category || 'General'}
                        </Badge>
                        {room.match_score && room.match_score > 0 && (
                          <span className="text-[9px] text-primary flex items-center gap-0.5">
                            <Target className="w-2.5 h-2.5" />
                            {room.match_score}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chat Interface - Takes more space */}
          <div className="lg:col-span-9">
            {selectedRoom ? (
              <ChatRoom
                room={selectedRoom}
                messages={messages}
                onSendMessage={handleSendMessage}
                message={message}
                setMessage={setMessage}
                loading={loading}
                activeUsername={activeUsername}
              />
            ) : (
              <div className="bg-card rounded-lg shadow border border-border p-6 text-center h-[500px] flex flex-col items-center justify-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Select a Chat Room</h3>
                <p className="text-muted-foreground text-sm max-w-sm">Choose a room from the list to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Interest Selector Component
function InterestSelector({ 
  selectedInterests, 
  onInterestsChange, 
  onSkip 
}: { 
  selectedInterests: string[];
  onInterestsChange: (interests: string[]) => void;
  onSkip: () => void;
}) {
  const [interests, setInterests] = useState<string[]>(selectedInterests);

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = () => {
    onInterestsChange(interests);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">What interests you?</h2>
        <p className="text-muted-foreground">Select topics that interest you to find better chat room matches</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-2">
        {INTEREST_TAGS.map((tag) => (
          <Button
            key={tag}
            variant={interests.includes(tag) ? "default" : "secondary"}
            size="sm"
            onClick={() => toggleInterest(tag)}
            className="text-xs touch-manipulation transition-all"
          >
            {tag}
          </Button>
        ))}
      </div>
      <div className="flex justify-between items-center pt-4">
        <Button variant="ghost" onClick={onSkip} className="text-sm text-muted-foreground hover:text-foreground">
          Skip for now
        </Button>
        <Button onClick={handleSave} className="text-sm">
          Save Interests
        </Button>
      </div>
    </div>
  );
}

function CreateRoomDialog({ setChatRooms, onRoomCreation }: { setChatRooms: React.Dispatch<React.SetStateAction<ChatRoom[]>>, onRoomCreation: (room: ChatRoom) => void }) {
  const [roomName, setRoomName] = useState("")
  const [roomCategory, setRoomCategory] = useState("")
  const [roomDescription, setRoomDescription] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [maxUsers, setMaxUsers] = useState(10)
  const [roomCode, setRoomCode] = useState("")
  const [open, setOpen] = useState(false)

  // Generate room code for private rooms
  useEffect(() => {
    if (isPrivate && !roomCode) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setRoomCode(code);
    }
  }, [isPrivate, roomCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const createdRoom = await ChatService.createChatRoom({
        name: roomName,
        description: roomDescription,
        category: roomCategory,
        max_users: maxUsers,
        is_private: isPrivate,
        room_code: isPrivate ? roomCode : undefined,
      });

      // Map Supabase room to local ChatRoom interface
      const newRoom: ChatRoom = {
        ...createdRoom,
        active_users: 0,
        messages: [],
        interests: [],
      };
      
      onRoomCreation(newRoom);
      setOpen(false);
      
      // Reset form fields
      setRoomName("");
      setRoomCategory("");
      setRoomDescription("");
      setIsPrivate(false);
      setMaxUsers(10);
      setRoomCode("");
      
    } catch (error) {
       console.error("Failed to create room:", error);
       alert("Failed to create room. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 sm:flex-none shadow-lg">
          <Plus className="h-4 w-4 mr-2" />
          Create Room
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-w-[90vw] p-4 sm:p-6 border border-border">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg sm:text-xl text-foreground">Create a new chat room</DialogTitle>
          <DialogDescription className="text-muted-foreground">Create a safe space for anonymous group discussions</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="roomName" className="text-foreground font-medium">Room name</Label>
              <Input
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Give your room a clear, descriptive name"
                required
                className="text-sm border-border focus:border-primary focus:ring-primary"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="roomCategory" className="text-foreground font-medium">Category</Label>
              <Select onValueChange={setRoomCategory} required>
                <SelectTrigger className="text-sm border-border focus:border-primary focus:ring-primary">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Depression Help">Depression Help</SelectItem>
                  <SelectItem value="Career Stress">Career Stress</SelectItem>
                  <SelectItem value="Relationship Advice">Relationship Advice</SelectItem>
                  <SelectItem value="General Support">General Support</SelectItem>
                  <SelectItem value="Private Discussion">Private Discussion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="roomDescription" className="text-foreground font-medium">Description</Label>
              <Input
                id="roomDescription"
                value={roomDescription}
                onChange={(e) => setRoomDescription(e.target.value)}
                placeholder="Briefly describe what this room is for"
                required
                className="text-sm border-border focus:border-primary focus:ring-primary"
              />
            </div>
            
            {/* Privacy Settings */}
            <div className="grid gap-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded border-border focus:ring-primary"
                />
                <Label htmlFor="isPrivate" className="text-sm font-medium text-foreground">
                  Make this room private (invite-only)
                </Label>
              </div>
              {isPrivate && (
                <div className="pl-6 space-y-3 border-l-2 border-border">
                  <div className="grid gap-2">
                    <Label htmlFor="roomCode" className="text-xs text-muted-foreground font-medium">Room Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="roomCode"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        placeholder="Room code"
                        className="text-sm font-mono border-border focus:border-primary focus:ring-primary"
                        maxLength={6}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const code = Math.random().toString(36).substring(2, 8).toUpperCase();
                          setRoomCode(code);
                        }}
                        className="text-xs border-border hover:bg-accent"
                      >
                        Generate
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Share this code with people you want to invite
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="maxUsers" className="text-xs text-muted-foreground font-medium">Maximum Users</Label>
                    <Select value={maxUsers.toString()} onValueChange={(value) => setMaxUsers(parseInt(value))}>
                      <SelectTrigger className="text-sm border-border focus:border-primary focus:ring-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 users</SelectItem>
                        <SelectItem value="10">10 users</SelectItem>
                        <SelectItem value="20">20 users</SelectItem>
                        <SelectItem value="50">50 users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto shadow-lg">
              {isPrivate ? 'Create Private Room' : 'Create Room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Join Private Room Dialog
function JoinPrivateRoomDialog({ onJoinRoom }: { onJoinRoom: (roomCode: string) => void }) {
  const [roomCode, setRoomCode] = useState("")
  const [open, setOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      onJoinRoom(roomCode.trim().toUpperCase());
      setRoomCode("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex-1 sm:flex-none border-border hover:bg-accent">
          <Users className="h-4 w-4 mr-2" />
          Join Private Room
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-w-[90vw] p-4 sm:p-6 border border-border">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg sm:text-xl text-foreground">Join Private Room</DialogTitle>
          <DialogDescription className="text-muted-foreground">Enter the room code to join a private chat room</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="joinRoomCode" className="text-foreground font-medium">Room Code</Label>
              <Input
                id="joinRoomCode"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit room code"
                className="font-mono text-center text-lg border-border focus:border-primary focus:ring-primary"
                maxLength={6}
                required
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto shadow-lg">
              Join Room
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
