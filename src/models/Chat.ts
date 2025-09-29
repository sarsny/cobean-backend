import { supabase } from '../config/database';
import { Chat, CreateChatRequest } from '../types';

export class ChatModel {
  // Create a new conversation
  static async create(data: CreateChatRequest & { user_id: string; coze_conversation_id?: string }): Promise<Chat> {
    const chatData = {
      thought_id: data.thought_id,
      bean_id: data.bean_id,
      user_id: data.user_id,
      external_conversation_id: data.external_conversation_id,
      agent_type: data.agent_type,
      coze_conversation_id: data.coze_conversation_id,
      conversation_type: data.conversation_type || 'thought',
      status: 'active'
    };

    const { data: chat, error } = await supabase
      .from('conversations')
      .insert([chatData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    return chat;
  }

  // Get conversation by ID
  static async findById(id: string): Promise<Chat | null> {
    const { data: chat, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw new Error(`Failed to fetch conversation: ${error.message}`);
    }

    return chat;
  }

  // Get conversation by thought ID and user ID
  static async findByThoughtAndUser(thoughtId: string, userId: string): Promise<Chat | null> {
    const { data: chat, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('thought_id', thoughtId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw new Error(`Failed to fetch conversation: ${error.message}`);
    }

    return chat;
  }

  // Get conversation by thought ID, user ID and conversation type
  static async findByThoughtUserAndType(thoughtId: string, userId: string, conversationType: 'thought' | 'execution'): Promise<Chat | null> {
    const { data: chat, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('thought_id', thoughtId)
      .eq('user_id', userId)
      .eq('conversation_type', conversationType)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw new Error(`Failed to fetch conversation: ${error.message}`);
    }

    return chat;
  }

  // Get all conversations for a user
  static async findByUserId(userId: string): Promise<Chat[]> {
    const { data: chats, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }

    return chats || [];
  }

  // Get conversations by user ID and conversation type
  static async findByUserIdAndType(userId: string, conversationType: 'thought' | 'execution'): Promise<Chat[]> {
    const { data: chats, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('conversation_type', conversationType)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }

    return chats || [];
  }

  // Update conversation
  static async update(id: string, updates: Partial<Omit<Chat, 'id' | 'created_at'>>): Promise<Chat> {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data: chat, error } = await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update conversation: ${error.message}`);
    }

    return chat;
  }

  // Delete conversation
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete conversation: ${error.message}`);
    }
  }

  // Check if conversation belongs to user
  static async belongsToUser(chatId: string, userId: string): Promise<boolean> {
    const { data: chat, error } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', chatId)
      .single();

    if (error || !chat) {
      return false;
    }

    return chat.user_id === userId;
  }
}