'use client'

import { useState, useEffect, useRef, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { generateUsername } from "@/lib/username-generator"
import { ArrowLeft, Send, Users, Loader2, Circle } from "lucide-react"
import Link from "next/link"
import type { RealtimeChannel } from '@supabase/supabase-js'

interface Message {
    id: string
    room_id: string
    user_id: string
    username: string
    content: string
    is_system_message: boolean
    created_at: string
}

interface ChatRoom {
    id: string
    name: string
    description: string
    category: string
    created_at: string
}

interface Participant {
    id: string
    username: string
    is_online: boolean
    last_seen: string
}

export default function ChatRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
    const { roomId } = use(params)
    return <ChatClient roomId={roomId} />
}

function ChatClient({ roomId }: { roomId: string }) {
    const router = useRouter()
    const { user } = useSupabaseAuth()
    const [username, setUsername] = useState("")
    const [message, setMessage] = useState("")
    const [messages, setMessages] = useState<Message[]>([])
    const [room, setRoom] = useState<ChatRoom | null>(null)
    const [participants, setParticipants] = useState<Participant[]>([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const channelRef = useRef<RealtimeChannel | null>(null)
    const heartbeatRef = useRef<NodeJS.Timeout | null>(null)

    // Generate or get username
    useEffect(() => {
        const storedUsername = localStorage.getItem('chat_username')
        if (storedUsername) {
            setUsername(storedUsername)
        } else {
            const newUsername = generateUsername()
            setUsername(newUsername)
            localStorage.setItem('chat_username', newUsername)
        }
    }, [])

    // Fetch room details and messages
    useEffect(() => {
        if (!user || !username) return

        const fetchRoomData = async () => {
            setLoading(true)

            try {
                // Fetch room details
                const { data: roomData, error: roomError } = await supabase
                    .from('chat_rooms')
                    .select('*')
                    .eq('id', roomId)
                    .eq('is_active', true)
                    .single()

                if (roomError || !roomData) {
                    console.error('Room not found:', roomError)
                    router.push('/chat-rooms')
                    return
                }

                setRoom(roomData)

                // Join room as participant
                await supabase
                    .from('chat_room_participants')
                    .upsert({
                        room_id: roomId,
                        user_id: user.id,
                        username: username,
                        is_online: true,
                        last_seen: new Date().toISOString()
                    }, {
                        onConflict: 'room_id,user_id'
                    })

                // Fetch existing messages
                const { data: messagesData, error: messagesError } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .eq('room_id', roomId)
                    .order('created_at', { ascending: true })
                    .limit(100)

                if (!messagesError && messagesData) {
                    setMessages(messagesData)
                }

                // Fetch participants
                await fetchParticipants()

            } catch (error) {
                console.error('Error fetching room data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchRoomData()
    }, [roomId, user, username, router])

    // Fetch participants
    const fetchParticipants = async () => {
        const { data, error } = await supabase
            .from('chat_room_participants')
            .select('*')
            .eq('room_id', roomId)
            .eq('is_online', true)
            .order('last_seen', { ascending: false })

        if (!error && data) {
            setParticipants(data)
        }
    }

    // Setup real-time subscription
    useEffect(() => {
        if (!user || !room) return

        // Subscribe to new messages
        const channel = supabase
            .channel(`room:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `room_id=eq.${roomId}`
                },
                (payload) => {
                    const newMessage = payload.new as Message
                    setMessages((prev) => {
                        // Avoid duplicates
                        if (prev.find(m => m.id === newMessage.id)) return prev
                        return [...prev, newMessage]
                    })
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chat_room_participants',
                    filter: `room_id=eq.${roomId}`
                },
                () => {
                    fetchParticipants()
                }
            )
            .subscribe()

        channelRef.current = channel

        // Heartbeat to keep user online
        heartbeatRef.current = setInterval(async () => {
            await supabase
                .from('chat_room_participants')
                .update({
                    last_seen: new Date().toISOString(),
                    is_online: true
                })
                .eq('room_id', roomId)
                .eq('user_id', user.id)
        }, 30000) // Every 30 seconds

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
            }
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current)
            }
            // Mark as offline when leaving
            supabase
                .from('chat_room_participants')
                .update({ is_online: false })
                .eq('room_id', roomId)
                .eq('user_id', user.id)
                .then()
        }
    }, [roomId, user, room])

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Handle sending message
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim() || !user || sending) return

        setSending(true)

        try {
            const { error } = await supabase
                .from('chat_messages')
                .insert({
                    room_id: roomId,
                    user_id: user.id,
                    username: username,
                    content: message.trim(),
                    is_system_message: false
                })

            if (error) throw error

            setMessage("")
        } catch (error) {
            console.error('Error sending message:', error)
            alert('Failed to send message. Please try again.')
        } finally {
            setSending(false)
        }
    }

    // Get initials for avatar
    const getInitials = (name: string) => {
        return name.substring(0, 2).toUpperCase()
    }

    // Format timestamp
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!room) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Room Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">The chat room you're looking for doesn't exist.</p>
                        <Button asChild className="mt-4">
                            <Link href="/chat-rooms">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Chat Rooms
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen max-w-6xl mx-auto">
            {/* Header */}
            <Card className="rounded-none border-x-0 border-t-0">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/chat-rooms">
                                    <ArrowLeft className="h-4 w-4" />
                                </Link>
                            </Button>
                            <div>
                                <CardTitle className="text-xl">{room.name}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">{room.description}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="gap-1">
                                <Users className="h-3 w-3" />
                                {participants.length}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Chat Area */}
                <div className="flex flex-col flex-1">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.is_system_message ? 'justify-center' : ''
                                    } ${msg.user_id === user?.id ? 'flex-row-reverse' : ''}`}
                            >
                                {!msg.is_system_message && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs">
                                            {getInitials(msg.username)}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                <div
                                    className={`flex flex-col ${msg.user_id === user?.id ? 'items-end' : 'items-start'
                                        }`}
                                >
                                    {!msg.is_system_message && (
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium">{msg.username}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatTime(msg.created_at)}
                                            </span>
                                        </div>
                                    )}
                                    <div
                                        className={`rounded-lg px-3 py-2 max-w-md ${msg.is_system_message
                                                ? 'bg-muted text-muted-foreground text-xs italic'
                                                : msg.user_id === user?.id
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <Card className="rounded-none border-x-0 border-b-0">
                        <CardFooter className="p-4">
                            <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
                                <Input
                                    placeholder={`Message as ${username}`}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    disabled={sending}
                                    maxLength={2000}
                                    className="flex-1"
                                />
                                <Button type="submit" disabled={!message.trim() || sending}>
                                    {sending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </form>
                        </CardFooter>
                    </Card>
                </div>

                {/* Participants Sidebar */}
                <Card className="w-64 rounded-none border-y-0 border-r-0 hidden lg:block">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Active Users ({participants.length})
                        </CardTitle>
                    </CardHeader>
                    <Separator />
                    <CardContent className="p-4">
                        <div className="space-y-3">
                            {participants.map((participant) => (
                                <div key={participant.id} className="flex items-center gap-2">
                                    <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                                    <span className="text-sm">{participant.username}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
