"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Hash, Lock, Users, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { ChatRoom } from "@/lib/chat-service"

// Define room category colors
const CATEGORY_COLORS: Record<string, { bg: string, text: string, icon: string }> = {
  "Student Life": { bg: "bg-blue-500", text: "text-blue-500", icon: "🎓" },
  "Mental Health": { bg: "bg-purple-500", text: "text-purple-500", icon: "🧠" },
  "Fitness": { bg: "bg-green-500", text: "text-green-500", icon: "💪" },
  "Creativity": { bg: "bg-orange-500", text: "text-orange-500", icon: "🎨" },
  "Career Stress": { bg: "bg-yellow-500", text: "text-yellow-500", icon: "💼" },
  "Relationship Advice": { bg: "bg-pink-500", text: "text-pink-500", icon: "❤️" },
  "General Support": { bg: "bg-indigo-500", text: "text-indigo-500", icon: "🤝" },
  "Private Discussion": { bg: "bg-red-500", text: "text-red-500", icon: "🔒" },
  "Depression Help": { bg: "bg-violet-500", text: "text-violet-500", icon: "🌧️" },
  "Private": { bg: "bg-gray-500", text: "text-gray-500", icon: "🔒" },
  "default": { bg: "bg-slate-500", text: "text-slate-500", icon: "#" }
};

interface MobileChatRoomCirclesProps {
  rooms: ChatRoom[];
  selectedRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
  onCreateRoom?: () => void;
}

export function MobileChatRoomCircles({ 
  rooms, 
  selectedRoomId, 
  onRoomSelect,
  onCreateRoom 
}: MobileChatRoomCirclesProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Handle touch/mouse events for smooth scrolling
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - (scrollContainerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Scroll selected room into view
  useEffect(() => {
    if (selectedRoomId && scrollContainerRef.current) {
      const selectedElement = document.getElementById(`room-circle-${selectedRoomId}`);
      if (selectedElement) {
        const containerWidth = scrollContainerRef.current.offsetWidth;
        const elementLeft = selectedElement.offsetLeft;
        const elementWidth = selectedElement.offsetWidth;
        
        // Center the element in the container
        scrollContainerRef.current.scrollLeft = 
          elementLeft - (containerWidth / 2) + (elementWidth / 2);
      }
    }
  }, [selectedRoomId]);

  // Get category color or default
  const getCategoryStyle = (category?: string) => {
    return category && CATEGORY_COLORS[category] 
      ? CATEGORY_COLORS[category] 
      : CATEGORY_COLORS.default;
  };

  // Get icon for room
  const getRoomIcon = (room: ChatRoom) => {
    const categoryStyle = getCategoryStyle(room.category);
    
    if (room.is_private) {
      return <Lock className="w-4 h-4 text-white" />;
    }
    
    if (categoryStyle.icon && categoryStyle.icon !== "#") {
      return <span className="text-base">{categoryStyle.icon}</span>;
    }
    
    return <Hash className="w-4 h-4 text-white" />;
  };

  return (
    <div className="w-full mb-4 pt-2">
      <h2 className="text-base font-semibold mb-4 px-4">Available Rooms</h2>
      
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto pb-4 pt-2 px-4 hide-scrollbar snap-x snap-mandatory"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
      >
        {rooms.map((room) => {
          const categoryStyle = getCategoryStyle(room.category);
          const isSelected = room.id === selectedRoomId;
          
          return (
            <TooltipProvider key={room.id} delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    id={`room-circle-${room.id}`}
                    className={`flex-shrink-0 snap-center mx-3 first:ml-0 last:mr-0 cursor-pointer touch-manipulation`}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onRoomSelect(room.id)}
                  >
                    <div 
                      className={`relative flex items-center justify-center rounded-full w-14 h-14 ${categoryStyle.bg} ${
                        isSelected 
                          ? 'ring-3 ring-primary ring-offset-2 ring-offset-background' 
                          : ''
                      }`}
                    >
                      {getRoomIcon(room)}
                      
                      {/* Active users indicator - disabled until added to ChatRoom */}
                      {false && (
                        <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          0
                        </div>
                      )}
                      
                      {/* Match score indicator - disabled until added to ChatRoom */}
                      {false && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          ✓
                        </div>
                      )}
                    </div>
                    
                    {/* Room name (truncated) */}
                    <div className="mt-2 text-[11px] text-center w-14 truncate text-muted-foreground">
                      {room.name.split(' ')[0]}
                    </div>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <div className="space-y-1">
                    <p className="font-medium">{room.name}</p>
                    <p className="text-xs text-muted-foreground">{room.description}</p>
                    <div className="flex items-center gap-1 text-xs">
                      <Users className="w-3 h-3" />
                      <span>0 active</span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}