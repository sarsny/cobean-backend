import { supabase, supabaseAdmin } from '../config/database';
import { Thought, CreateThoughtRequest } from '../types';

export class ThoughtModel {
  // Create a new thought
  static async create(data: CreateThoughtRequest): Promise<Thought> {
    // Use admin client to bypass RLS for thought creation
    const client = supabaseAdmin || supabase;
    
    const { data: thought, error } = await client
      .from('thoughts')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create thought: ${error.message}`);
    }

    return thought;
  }

  // Get thought by ID
  static async findById(id: string): Promise<Thought | null> {
    const { data: thought, error } = await supabase
      .from('thoughts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw new Error(`Failed to fetch thought: ${error.message}`);
    }

    return thought;
  }

  // Get all thoughts for a user
  static async findByUserId(userId: string): Promise<Thought[]> {
    const { data: thoughts, error } = await supabase
      .from('thoughts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch thoughts: ${error.message}`);
    }

    return thoughts || [];
  }

  // Get all thoughts for a user with conversation information
  static async findByUserIdWithConversations(userId: string): Promise<(Thought & { conversation?: any })[]> {
    const { data: thoughtsWithConversations, error } = await supabase
      .from('thoughts')
      .select(`
        *,
        conversations!conversations_thought_id_fkey (
          id,
          bean_id,
          external_conversation_id,
          agent_type,
          coze_conversation_id,
          conversation_type,
          status,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch thoughts with conversations: ${error.message}`);
    }

    // Transform the data to flatten conversation information
    const result = (thoughtsWithConversations || []).map(thought => {
      const { conversations, ...thoughtData } = thought;
      const conversation = conversations && conversations.length > 0 ? conversations[0] : null;
      
      return {
        ...thoughtData,
        ...(conversation && { conversation })
      };
    });

    return result;
  }

  // Update thought
  static async update(id: string, updates: Partial<Omit<Thought, 'id' | 'created_at'>>): Promise<Thought> {
    const { data: thought, error } = await supabase
      .from('thoughts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update thought: ${error.message}`);
    }

    return thought;
  }

  // Delete thought
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('thoughts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete thought: ${error.message}`);
    }
  }

  // Get all public thoughts
  static async findPublicThoughts(): Promise<Thought[]> {
    const { data: thoughts, error } = await supabase
      .from('thoughts')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch public thoughts: ${error.message}`);
    }

    return thoughts || [];
  }

  // Check if thought belongs to user
  static async belongsToUser(thoughtId: string, userId: string): Promise<boolean> {
    const { data: thought, error } = await supabase
      .from('thoughts')
      .select('user_id')
      .eq('id', thoughtId)
      .single();

    if (error || !thought) {
      return false;
    }

    return thought.user_id === userId;
  }
}