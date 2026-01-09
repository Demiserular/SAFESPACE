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

// Define types for the application
interface Message {
  id: number;
  username: string;
  content: string;
  timestamp: string;
}

interface ChatRoom {
  id: number;
  name: string;
  description: string;
  category?: string;
  activeUsers: number;
  messages?: Message[];
  interests?: string[];
  matchScore?: number;
  isPrivate?: boolean;
  roomCode?: string;
  createdBy?: string;
  maxUsers?: number;
}

// Interest tags for matching
const INTEREST_TAGS = [
  "Student Life", "Anxiety", "Depression", "Productivity", "Fitness", 
  "Relationships", "Career", "Creativity", "Mindfulness", "Overthinking",
  "Social Anxiety", "Self-Care", "Motivation", "Stress", "Loneliness",
  "Confidence", "Goals", "Habits", "Sleep", "Nutrition"
];

// Mock data for chat rooms
const MOCK_CHAT_ROOMS: ChatRoom[] = [
  {
    id: 1,
    name: "Student Support Hub",
    description: "A safe space for students to discuss academic stress and life challenges",
    category: "Student Life",
    activeUsers: 12,
    interests: ["Student Life", "Stress", "Productivity", "Anxiety"],
    matchScore: 85,
    isPrivate: false,
    messages: [
      { id: 1, username: "StudyBuddy", content: "Anyone else feeling overwhelmed with finals?", timestamp: "2024-01-15T10:30:00Z" },
      { id: 2, username: "ZenStudent", content: "Take it one day at a time! You've got this 💪", timestamp: "2024-01-15T10:32:00Z" },
      { id: 3, username: "AnxiousMind", content: "I'm so stressed about my presentation tomorrow", timestamp: "2024-01-15T10:35:00Z" }
    ]
  },
  {
    id: 2,
    name: "Mental Wellness Circle",
    description: "Supportive community for mental health discussions and coping strategies",
    category: "Mental Health",
    activeUsers: 8,
    interests: ["Anxiety", "Depression", "Mindfulness", "Self-Care"],
    matchScore: 90,
    isPrivate: false,
    messages: [
      { id: 4, username: "PeacefulSoul", content: "Today's meditation really helped me center myself", timestamp: "2024-01-15T09:15:00Z" },
      { id: 5, username: "HealingHeart", content: "Remember to be kind to yourself today", timestamp: "2024-01-15T09:20:00Z" }
    ]
  },
  {
    id: 3,
    name: "Fitness Motivation",
    description: "Get motivated and stay accountable with your fitness goals",
    category: "Fitness",
    activeUsers: 15,
    interests: ["Fitness", "Motivation", "Goals", "Habits"],
    matchScore: 75,
    isPrivate: false,
    messages: [
      { id: 6, username: "FitLife", content: "Just completed my morning workout! 💪", timestamp: "2024-01-15T08:00:00Z" },
      { id: 7, username: "GymBuddy", content: "Great job! What's everyone's fitness goal for this week?", timestamp: "2024-01-15T08:05:00Z" }
    ]
  },
  {
    id: 4,
    name: "Creative Corner",
    description: "Share your creative projects and get inspired by others",
    category: "Creativity",
    activeUsers: 6,
    interests: ["Creativity", "Motivation", "Goals"],
    matchScore: 60,
    isPrivate: false,
    messages: [
      { id: 8, username: "ArtisticSoul", content: "Working on a new painting today", timestamp: "2024-01-15T11:00:00Z" },
      { id: 9, username: "CreativeMind", content: "That sounds amazing! What's your inspiration?", timestamp: "2024-01-15T11:05:00Z" }
    ]
  }
];

export default function ChatRooms() {
  const isMobile = useIsMobile();
  const [activeUsername, setActiveUsername] = useState('')
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [deletingRoom, setDeletingRoom] = useState<number | null>(null);
  const [sharingRoom, setSharingRoom] = useState<number | null>(null);
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
    // Use mock data instead of fetching from backend
    const roomsWithInterests = MOCK_CHAT_ROOMS.map(room => ({
      ...room,
      interests: room.interests || [],
      matchScore: calculateMatchScore(room.interests || [])
    }));
    setChatRooms(roomsWithInterests);
  }, [userInterests]);

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
    
    // Mock private room validation
    setTimeout(() => {
      if (roomCode === "DEMO123") {
        const privateRoom: ChatRoom = {
          id: 999,
          name: "Demo Private Room",
          description: "A private room for demonstration",
          category: "Private",
          activeUsers: 3,
          interests: ["Student Life", "Anxiety"],
          matchScore: 80,
          isPrivate: true,
          roomCode: "DEMO123",
          maxUsers: 10,
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
        alert('Invalid room code. Try "DEMO123" for demo purposes.');
      }
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    if (chatRooms.length > 0 && !selectedRoom) {
      // Auto-select room with highest match score
      const bestMatch = chatRooms.reduce((best, current) => 
        (current.matchScore || 0) > (best.matchScore || 0) ? current : best
      );
      setSelectedRoom(bestMatch);
      setMessages(bestMatch.messages || []);
    }
  }, [chatRooms, selectedRoom]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    const newMessage: Message = {
      id: Date.now(),
      username: activeUsername,
      content: message,
      timestamp: new Date().toISOString(),
    };

    setTimeout(() => {
      setMessages([...messages, newMessage]);
      setMessage("");
      setLoading(false);
    }, 1000);
  }

  const handleDeleteRoom = async (roomId: number) => {
    setDeletingRoom(roomId);

    // Mock deletion
    setTimeout(() => {
      setChatRooms((prevRooms) => prevRooms.filter(room => room.id !== roomId));
    setDeletingRoom(null);
    }, 1000);
  };

  const handleShareRoom = (roomId: number) => {
    setSharingRoom(roomId);
    const room = chatRooms.find(r => r.id === roomId);
    if (room?.isPrivate && room?.roomCode) {
      // Copy room code to clipboard
      navigator.clipboard.writeText(room.roomCode);
      alert(`Room code copied: ${room.roomCode}`);
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

  function openChatInterface(roomId: number) {
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
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Chat Rooms</h1>
            <p className="text-muted-foreground text-base sm:text-lg">Connect with peers who share your interests</p>
        </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <JoinPrivateRoomDialog onJoinRoom={handleJoinPrivateRoom} />
          <CreateRoomDialog setChatRooms={setChatRooms} onRoomCreation={handleRoomCreation} />
        </div>
      </div>

        {/* Mobile Chat Room Circles */}
        {isMobile && (
          <div className="mb-6">
            <MobileChatRoomCircles 
              rooms={chatRooms}
              selectedRoomId={selectedRoom?.id || null}
              onRoomSelect={openChatInterface}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Chat Rooms List - Desktop Only */}
          {!isMobile && (
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl shadow-lg border border-border p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-3 text-foreground">
                  <Hash className="w-5 h-5 text-muted-foreground" />
                  Available Rooms
                </h2>
                <div className="space-y-4">
                  {chatRooms.map((room) => (
                    <Card
                      key={room.id}
                      className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                        selectedRoom?.id === room.id 
                          ? 'border-primary bg-accent shadow-lg' 
                          : 'border-border hover:border-border/60 bg-card'
                      }`}
                      onClick={() => openChatInterface(room.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                              <span className="truncate">{room.name}</span>
                              {room.isPrivate && (
                                <Badge variant="secondary" className="text-xs bg-primary text-primary-foreground">
                                  Private
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {room.description}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground ml-2">
                            <Users className="w-3 h-3" />
                            <span className="font-medium">{room.activeUsers}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {room.matchScore && room.matchScore > 0 && (
                              <div className="flex items-center gap-1">
                                <Target className="w-3 h-3 text-primary" />
                                <span className="text-xs text-primary font-medium">
                                  {room.matchScore}% match
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {room.isPrivate && room.roomCode && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShareRoom(room.id);
                                }}
                                className="h-7 w-7 p-0 hover:bg-accent"
                              >
                                <Share className="w-3 h-3 text-muted-foreground" />
                              </Button>
                            )}
                            {room.createdBy === activeUsername && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRoom(room.id);
                                }}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={deletingRoom === room.id}
                              >
                                {deletingRoom === room.id ? (
                                  <Loader className="w-3 h-3" />
                                ) : (
                                  <Trash className="w-3 h-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chat Interface */}
          <div className="lg:col-span-3">
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
              <div className="bg-card rounded-xl shadow-lg border border-border p-8 sm:p-12 text-center h-[600px] flex flex-col items-center justify-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Select a Chat Room</h3>
                <p className="text-muted-foreground text-base sm:text-lg max-w-md">Choose a room from the list to start chatting with others who share your interests</p>
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
            variant={interests.includes(tag) ? "default" : "outline"}
            size="sm"
            onClick={() => toggleInterest(tag)}
            className={`text-xs touch-manipulation transition-all ${
              interests.includes(tag) 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                : 'border-border text-muted-foreground hover:bg-accent'
            }`}
          >
            {tag}
          </Button>
        ))}
      </div>
      <div className="flex justify-between items-center pt-4">
        <Button variant="ghost" onClick={onSkip} className="text-sm text-muted-foreground hover:text-foreground">
          Skip for now
        </Button>
        <Button onClick={handleSave} className="text-sm bg-primary text-primary-foreground hover:bg-primary/90">
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
    
    // Close the dialog immediately
    setOpen(false);
    
    // Create a new room object with default values
    const newRoom: ChatRoom = {
      id: Date.now(), // Temporary ID until we get the real one from the database
      name: roomName,
      description: roomDescription,
      category: roomCategory,
      activeUsers: 0,
      messages: [],
      isPrivate: isPrivate,
      roomCode: isPrivate ? roomCode : undefined,
      createdBy: generateUsername(),
      maxUsers: maxUsers
    };
    
    // Add the new room to the UI immediately for better user experience
    onRoomCreation(newRoom);
    
    // Reset form fields
    setRoomName("");
    setRoomCategory("");
    setRoomDescription("");
    setIsPrivate(false);
    setMaxUsers(10);
    setRoomCode("");
    
    // Mock database creation (simulate success)
    setTimeout(() => {
      console.log('Room created successfully:', newRoom);
    }, 1000);
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
                className="text-sm font-mono text-center text-lg border-border focus:border-primary focus:ring-primary"
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
