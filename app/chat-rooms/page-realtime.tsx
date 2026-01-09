'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { Users, MessageSquare, Loader2, Circle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface ChatRoom {
    id: string
    name: string
    description: string
    category: string
    activeUsers?: number
    created_at: string
}

export default function ChatRoomsPage() {
    const { user } = useSupabaseAuth()
    const router = useRouter()
    const [rooms, setRooms] = useState<ChatRoom[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            router.push('/login')
            return
        }

        fetchRooms()
    }, [user, router])

    const fetchRooms = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('chat_rooms')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (error) throw error

            // Get active user counts for each room
            const roomsWithCounts = await Promise.all(
                (data || []).map(async (room) => {
                    const { count } = await supabase
                        .from('chat_room_participants')
                        .select('*', { count: 'exact', head: true })
                        .eq('room_id', room.id)
                        .eq('is_online', true)
                        .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString())

                    return {
                        ...room,
                        activeUsers: count || 0
                    }
                })
            )

            setRooms(roomsWithCounts)
        } catch (error) {
            console.error('Error fetching rooms:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Chat Rooms</h1>
                <p className="text-muted-foreground">
                    Join a room and start chatting in real-time with others
                </p>
            </div>

            {rooms.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No Chat Rooms Available</CardTitle>
                        <CardDescription>
                            There are no active chat rooms at the moment. Check back later!
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {rooms.map((room) => (
                        <Card key={room.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg mb-2">{room.name}</CardTitle>
                                        <Badge variant="secondary" className="mb-2">
                                            {room.category}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Circle
                                            className={`h-2 w-2 ${(room.activeUsers || 0) > 0
                                                    ? 'fill-green-500 text-green-500'
                                                    : 'fill-gray-400 text-gray-400'
                                                }`}
                                        />
                                        <Users className="h-4 w-4" />
                                        <span>{room.activeUsers || 0}</span>
                                    </div>
                                </div>
                                <CardDescription className="line-clamp-2">
                                    {room.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild className="w-full">
                                    <Link href={`/chat/${room.id}`}>
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Join Room
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <div className="mt-8 p-6 bg-muted rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Real-Time Chat Features</h2>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                        <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                        <span>Live message updates - no refresh needed</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                        <span>See who's currently active in each room</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                        <span>Instant message delivery to all participants</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                        <span>Auto-scroll to latest messages</span>
                    </li>
                </ul>
            </div>

            <div className="mt-6 p-6 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100">
                    Testing with Multiple Accounts
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                    To test real-time messaging with two Gmail accounts on the same laptop:
                </p>
                <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200 list-decimal list-inside">
                    <li>Open a <strong>regular browser window</strong> and log in with your first Gmail account</li>
                    <li>Open an <strong>Incognito/Private window</strong> (Ctrl+Shift+N in Chrome) and log in with your second Gmail account</li>
                    <li>Navigate to the same chat room in both windows</li>
                    <li>Send messages from either window and watch them appear instantly in both!</li>
                </ol>
            </div>
        </div>
    )
}
