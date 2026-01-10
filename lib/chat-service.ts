// Chat service for real-time messaging
import { getSupabaseClient } from './supabase';

export interface ChatMessage {
  id: string;
  room_id: string;
  username: string;
  content: string;
  created_at: string;
  user_id?: string;
  is_system?: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  category?: string;
  created_by: string;
  created_at: string;
  max_users?: number;
  is_private?: boolean;
  room_code?: string;
}

export class ChatService {
  private static supabase = getSupabaseClient();

  // Get all available chat rooms
  static async getChatRooms(): Promise<ChatRoom[]> {
    const { data, error } = await this.supabase
      .from('chat_rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get a specific chat room
  static async getChatRoom(roomId: string): Promise<ChatRoom | null> {
    const { data, error } = await this.supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) return null;
    return data;
  }

  // Get a chat room by its code
  static async getChatRoomByCode(code: string): Promise<ChatRoom | null> {
    const { data, error } = await this.supabase
      .from('chat_rooms')
      .select('*')
      .eq('room_code', code)
      .single();

    if (error) return null;
    return data;
  }

  // Create a new chat room
  static async createChatRoom(roomData: {
    name: string;
    description: string;
    category?: string;
    max_users?: number;
    is_private?: boolean;
    room_code?: string;
  }): Promise<ChatRoom> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .from('chat_rooms')
      .insert({
        ...roomData,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get messages for a chat room
  static async getChatMessages(roomId: string, limit = 50): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data?.reverse() || [];
  }

  // Send a message to a chat room
  static async sendMessage(roomId: string, content: string, username: string): Promise<ChatMessage> {
    const { data: { user } } = await this.supabase.auth.getUser();

    const messageData = {
      room_id: roomId,
      content,
      username,
      user_id: user?.id,
    };

    const { data, error } = await this.supabase
      .from('chat_messages')
      .insert(messageData)
      .select()
      .single();

    if (error) throw error;

    // Broadcast the message via real-time
    await this.supabase
      .channel(`chat_room:${roomId}`)
      .send({
        type: 'broadcast',
        event: 'new_message',
        payload: { message: data }
      });

    return data;
  }

  // Subscribe to real-time messages in a chat room
  static subscribeToMessages(roomId: string, callback: (message: ChatMessage) => void) {
    const channel = this.supabase
      .channel(`chat_room:${roomId}`)
      .on(
        'broadcast',
        { event: 'new_message' },
        (payload) => {
          callback(payload.payload.message);
        }
      )
      .subscribe();

    return () => {
      this.supabase.removeChannel(channel);
    };
  }

  // Get active users in a room (this would need a separate table for tracking)
  static async getActiveUsers(roomId: string): Promise<number> {
    // For now, return a mock count. In a real implementation,
    // you'd track active users in a separate table
    const { count, error } = await this.supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

    if (error) return 0;
    return Math.min(count || 0, 50); // Cap at 50 for demo
  }

  // Join a chat room (add user to active users tracking)
  static async joinRoom(roomId: string, username: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();

    // Add a system message for user joining
    await this.supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        content: `${username} joined the room`,
        username: 'System',
        is_system: true,
        user_id: user?.id,
      });

    // Broadcast join event
    await this.supabase
      .channel(`chat_room:${roomId}`)
      .send({
        type: 'broadcast',
        event: 'user_joined',
        payload: { username, user_id: user?.id }
      });
  }

  // Leave a chat room
  static async leaveRoom(roomId: string, username: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();

    // Add a system message for user leaving
    await this.supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        content: `${username} left the room`,
        username: 'System',
        is_system: true,
        user_id: user?.id,
      });

    // Broadcast leave event
    await this.supabase
      .channel(`chat_room:${roomId}`)
      .send({
        type: 'broadcast',
        event: 'user_left',
        payload: { username, user_id: user?.id }
      });
  }
}