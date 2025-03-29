import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ChatRoom({ roomId }: { roomId: number }) {
  const { user } = useSupabaseAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // Fetch existing messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) console.error('Error fetching messages:', error);
      else setMessages(data || []);
    };

    fetchMessages();

    // Set up real-time subscription
    const messageSubscription = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, (payload) => {
        if (payload.new.chat_room_id === roomId) {
          setMessages((prevMessages) => [...prevMessages, payload.new]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
    };
  }, [roomId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const { error } = await supabase.from('chat_messages').insert({
      chat_room_id: roomId,
      user_id: user?.id,
      content: newMessage.trim(),
    });

    if (error) console.error('Error sending message:', error);
    else setNewMessage('');
  };

  return (
    <div className="chat-room">
      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className="message">
            <strong>{message.user_id}</strong>: {message.content}
          </div>
        ))}
      </div>
      {/* Removed input area to avoid duplication */}
    </div>
  );
}
