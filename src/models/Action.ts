import { supabase } from '../config/database';
import { Action, GenerateActionRequest } from '../types';

export class ActionModel {
  // Create a new action
  static async create(data: Omit<Action, 'id' | 'created_at' | 'updated_at'>): Promise<Action> {
    const { data: action, error } = await supabase
      .from('actions')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create action: ${error.message}`);
    }

    return action;
  }

  // Get action by ID
  static async findById(id: string): Promise<Action | null> {
    const { data: action, error } = await supabase
      .from('actions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw new Error(`Failed to fetch action: ${error.message}`);
    }

    return action;
  }

  // Get all actions for a thought
  static async findByThoughtId(thoughtId: string): Promise<Action[]> {
    const { data: actions, error } = await supabase
      .from('actions')
      .select('*')
      .eq('thought_id', thoughtId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch actions: ${error.message}`);
    }

    return actions || [];
  }

  // Get current (planned) actions for a thought
  static async findCurrentByThoughtId(thoughtId: string): Promise<Action[]> {
    const { data: actions, error } = await supabase
      .from('actions')
      .select('*')
      .eq('thought_id', thoughtId)
      .eq('status', 'planned')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch current actions: ${error.message}`);
    }

    return actions || [];
  }

  // Update action status (deprecated - keeping for backward compatibility)
  static async updateStatus(id: string, status: string): Promise<Action> {
    const { data: action, error } = await supabase
      .from('actions')
      .update({ summary: status }) // Map status to summary for backward compatibility
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update action status: ${error.message}`);
    }

    return action;
  }

  // Update action
  static async update(id: string, updates: Partial<Omit<Action, 'id' | 'created_at' | 'updated_at'>>): Promise<Action> {
    const { data: action, error } = await supabase
      .from('actions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update action: ${error.message}`);
    }

    return action;
  }

  // Delete action
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('actions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete action: ${error.message}`);
    }
  }

  // Generate a new action for a thought (placeholder for AI generation)
  static async generateForThought(thoughtId: string): Promise<Action> {
    // This is a placeholder implementation
    // In a real app, this would integrate with an AI service to generate meaningful actions
    const actionSummaries = [
      'Research market opportunities and competitors',
      'Create a detailed business plan outline',
      'Identify potential locations and requirements',
      'Calculate initial investment and budget',
      'Network with industry professionals',
      'Study legal requirements and regulations',
      'Develop a marketing strategy',
      'Create a timeline for implementation'
    ];

    const randomSummary = actionSummaries[Math.floor(Math.random() * actionSummaries.length)];

    const actionData = {
      thought_id: thoughtId,
      bean_id: 'default-bean-id', // Default bean ID
      summary: randomSummary,
      type: 'Event' as const,
      event: randomSummary
    };

    return this.create(actionData);
  }

  // Check if action belongs to a thought owned by user
  static async belongsToUser(actionId: string, userId: string): Promise<boolean> {
    const { data: result, error } = await supabase
      .from('actions')
      .select(`
        id,
        thoughts!inner(user_id)
      `)
      .eq('id', actionId)
      .single();

    if (error || !result) {
      return false;
    }

    return (result.thoughts as any).user_id === userId;
  }
}