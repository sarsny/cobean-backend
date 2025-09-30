import { supabase } from '../config/database';
import { ChatMessage } from '../types';

export class ChatMessageModel {
  // Create a new message
  static async create(data: {
    conversation_id: string;
    sender: 'user' | 'bean' | 'agent';
    content: string;
    metadata?: Record<string, any>; 
    type?: string;
  }): Promise<ChatMessage> {
    const { data: message, error } = await supabase
      .from('messages')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create message: ${error.message}`);
    }

    return message;
  }

  // Get message by ID
  static async findById(id: string): Promise<ChatMessage | null> {
    const { data: message, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw new Error(`Failed to fetch message: ${error.message}`);
    }

    return message;
  }

  // Get all messages for a conversation
  static async findByConversationId(conversationId: string): Promise<ChatMessage[]> {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return messages || [];
  }

  // Get messages with pagination
  static async findByConversationIdWithPagination(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatMessage[]> {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return messages || [];
  }

  // Update message (only for user messages)
  static async update(id: string, updates: { content: string; metadata?: Record<string, any> }): Promise<ChatMessage> {
    const { data: message, error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', id)
      .eq('sender', 'user') // Only allow updating user messages
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update message: ${error.message}`);
    }

    return message;
  }

  // Delete message (only for user messages)
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id)
      .eq('sender', 'user'); // Only allow deleting user messages

    if (error) {
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }

  // Get latest message for a conversation
  static async getLatestByConversationId(conversationId: string): Promise<ChatMessage | null> {
    const { data: message, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw new Error(`Failed to fetch latest message: ${error.message}`);
    }

    return message;
  }

  // Get messages by sender type
  static async findBySender(conversationId: string, sender: 'user' | 'bean' | 'agent'): Promise<ChatMessage[]> {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('sender', sender)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch messages by sender: ${error.message}`);
    }

    return messages || [];
  }
}