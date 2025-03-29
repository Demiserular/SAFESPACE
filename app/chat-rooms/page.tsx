"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash, Share, Users } from "lucide-react"
import Link from "next/link"
import { generateUsername } from "@/lib/username-generator"
import { supabase } from '@/lib/supabase';
import ChatRoom from './ChatRoom';
import Loader from '@/components/ui/Loader';

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
}

export default function ChatRooms() {
  const [activeUsername, setActiveUsername] = useState('')
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [deletingRoom, setDeletingRoom] = useState<number | null>(null);
  const [sharingRoom, setSharingRoom] = useState<number | null>(null);

  useEffect(() => {
    setActiveUsername(generateUsername());
  }, []);

  useEffect(() => {
    const fetchChatRooms = async () => {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*');

      if (error) console.error('Error fetching chat rooms:', error);
      else setChatRooms(data || []);
    };

    fetchChatRooms();
  }, []);

  useEffect(() => {
    if (chatRooms.length > 0 && !selectedRoom) {
      setSelectedRoom(chatRooms[0]);
      setMessages(chatRooms[0].messages || []);
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
      timestamp: new Date().toISOString(), // Use ISO string for consistent formatting
    };

    setTimeout(() => {
      setMessages([...messages, newMessage]);
      setMessage("");
      setLoading(false);
    }, 1000);
  }

  const handleDeleteRoom = async (roomId: number) => {
    setDeletingRoom(roomId);
    const { error } = await supabase
      .from('chat_rooms')
      .delete()
      .eq('id', roomId);

    if (error) {
      console.error('Error deleting room:', error);
    } else {
      setChatRooms((prevRooms) => prevRooms.filter(room => room.id !== roomId));
    }
    setDeletingRoom(null);
  };

  const handleShareRoom = (roomId: number) => {
    setSharingRoom(roomId);
    // Implement sharing logic here, e.g., open a modal with sharing options
    console.log('Open sharing options for room:', roomId);
    setTimeout(() => setSharingRoom(null), 1000);
  };

  const handleRoomCreation = (newRoom: ChatRoom) => {
    setChatRooms((prevRooms) => [...prevRooms, newRoom]);
    setSelectedRoom(newRoom);
  };

  function openChatInterface(roomId: number) {
    // Navigate to the dedicated chat page for this room
    window.location.href = `/chat/${roomId}`;
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6">
      <style jsx global>{`
        .h-5.w-5.cursor-pointer {
          transition: all 0.2s ease;
        }
        .h-5.w-5.cursor-pointer:hover {
          transform: scale(1.1);
        }
        .tooltip {
          position: relative;
          display: inline-block;
        }
        .tooltip .tooltiptext {
          visibility: hidden;
          width: 60px;
          background-color: rgba(0, 0, 0, 0.8);
          color: #fff;
          text-align: center;
          border-radius: 6px;
          padding: 5px;
          position: absolute;
          z-index: 1;
          bottom: 125%;
          left: 50%;
          margin-left: -30px;
          opacity: 0;
          transition: opacity 0.3s;
          font-size: 12px;
        }
        .tooltip:hover .tooltiptext {
          visibility: visible;
          opacity: 1;
        }
      `}</style>
      {loading && <Loader />}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Chat Rooms</h1>
          <p className="text-muted-foreground">Join anonymous group discussions</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" asChild className="bg-black text-white hover:bg-gray-800 flex-1 sm:flex-none">
            <Link href="/">Back to Posts</Link>
          </Button>
          <CreateRoomDialog setChatRooms={setChatRooms} onRoomCreation={handleRoomCreation} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <Card className="md:col-span-1">
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Available Rooms
            </CardTitle>
            <CardDescription>
              You are: <span className="font-medium">{activeUsername}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {chatRooms.map((room) => (
                <div key={room.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full p-2">
                  <Button
                    variant={selectedRoom && selectedRoom.id === room.id ? "secondary" : "ghost"}
                    className={`w-full justify-start px-3 py-2 h-auto text-left ${selectedRoom && selectedRoom.id === room.id ? 'bg-gray-200' : ''}`}
                    onClick={() => {
                      setSelectedRoom(room);
                      setMessages(room.messages || []);
                    }}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{room.name}</span>
                      <span className="text-xs text-muted-foreground">{room.activeUsers} active users</span>
                      <span 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the parent Button's onClick
                          openChatInterface(room.id);
                        }} 
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        Join Room
                      </span>
                    </div>
                  </Button>
                  <div className="flex items-center gap-3 mt-2 sm:mt-0 px-3 sm:px-0">
                    <div className="tooltip">
                      <Trash
                        className={`h-5 w-5 cursor-pointer text-gray-500 hover:text-red-500 ${deletingRoom === room.id ? 'animate-pulse text-red-500' : ''}`}
                        onClick={() => handleDeleteRoom(room.id)}
                      />
                      <span className="tooltiptext">Delete</span>
                    </div>
                    <div className="tooltip">
                      <Share
                        className={`h-5 w-5 cursor-pointer text-gray-500 hover:text-green-500 ${sharingRoom === room.id ? 'animate-bounce text-green-500' : ''}`}
                        onClick={() => handleShareRoom(room.id)}
                      />
                      <span className="tooltiptext">Share</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="border-b p-4">
            <CardTitle className="text-lg sm:text-xl">{selectedRoom ? selectedRoom.name : ''}</CardTitle>
            <CardDescription>
              {selectedRoom ? selectedRoom.description : ''} • {selectedRoom ? selectedRoom.activeUsers : 0} people here now
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-[300px] sm:h-[400px] overflow-y-auto">
            {selectedRoom && <ChatRoom roomId={selectedRoom.id} />}
          </CardContent>
          <CardFooter className="border-t p-3 sm:p-4">
            {selectedRoom && (
              <form onSubmit={handleSendMessage} className="w-full flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" className="bg-black text-white hover:bg-gray-800 whitespace-nowrap">Send</Button>
              </form>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

function CreateRoomDialog({ setChatRooms, onRoomCreation }: { setChatRooms: React.Dispatch<React.SetStateAction<ChatRoom[]>>, onRoomCreation: (room: ChatRoom) => void }) {
  const [roomName, setRoomName] = useState("")
  const [roomCategory, setRoomCategory] = useState("")
  const [roomDescription, setRoomDescription] = useState("")
  const [open, setOpen] = useState(false)

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
      messages: []
    };
    
    // Add the new room to the UI immediately for better user experience
    onRoomCreation(newRoom);
    
    // Reset form fields
    setRoomName("");
    setRoomCategory("");
    setRoomDescription("");
    
    // Then send to database
    const { data, error } = await supabase
      .from('chat_rooms')
      .insert({
        name: roomName,
        description: roomDescription,
        category: roomCategory,
      })
      .select();

    if (error) {
      console.error('Error creating room:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      // Could add error handling UI here
    } else if (data && data.length > 0) {
      // Update the room with the real database ID if needed
      const serverRoom = data[0] as ChatRoom;
      setChatRooms(prevRooms => 
        prevRooms.map(room => 
          room.id === newRoom.id ? { ...serverRoom, messages: [] } : room
        )
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-black text-white hover:bg-gray-800 flex-1 sm:flex-none">
          <Plus className="h-4 w-4 mr-2" />
          Create Room
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-w-[90vw] p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg sm:text-xl">Create a new chat room</DialogTitle>
          <DialogDescription>Create a safe space for anonymous group discussions</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-3 py-3">
            <div className="grid gap-2">
              <Label htmlFor="roomName">Room name</Label>
              <Input
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Give your room a clear, descriptive name"
                required
                className="text-sm"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="roomCategory">Category</Label>
              <Select onValueChange={setRoomCategory} required>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Depression Help">Depression Help</SelectItem>
                  <SelectItem value="Career Stress">Career Stress</SelectItem>
                  <SelectItem value="Relationship Advice">Relationship Advice</SelectItem>
                  <SelectItem value="General Support">General Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="roomDescription">Description</Label>
              <Input
                id="roomDescription"
                value={roomDescription}
                onChange={(e) => setRoomDescription(e.target.value)}
                placeholder="Briefly describe what this room is for"
                required
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="submit" className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto">Create Room</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
