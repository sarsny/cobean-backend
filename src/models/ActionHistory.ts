import { supabase } from '../config/database';
import { ActionHistory, CreateActionHistoryRequest } from '../types';

export class ActionHistoryModel {
  // Create a new action history record
  static async create(data: CreateActionHistoryRequest): Promise<ActionHistory> {
    const { data: history, error } = await supabase
      .from('action_history')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create action history: ${error.message}`);
    }

    return history;
  }

  // Get history by ID
  static async findById(id: string): Promise<ActionHistory | null> {
    const { data: history, error } = await supabase
      .from('action_history')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw new Error(`Failed to fetch action history: ${error.message}`);
    }

    return history;
  }

  // Get history for an action
  static async findByActionId(actionId: string): Promise<ActionHistory[]> {
    const { data: history, error } = await supabase
      .from('action_history')
      .select('*')
      .eq('action_id', actionId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch action history: ${error.message}`);
    }

    return history || [];
  }

  // Get latest history for an action
  static async findLatestByActionId(actionId: string): Promise<ActionHistory | null> {
    const { data: history, error } = await supabase
      .from('action_history')
      .select('*')
      .eq('action_id', actionId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw new Error(`Failed to fetch latest action history: ${error.message}`);
    }

    return history;
  }

  // Get all history for a user
  static async findByUserId(userId: string): Promise<ActionHistory[]> {
    const { data: history, error } = await supabase
      .from('action_history')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user action history: ${error.message}`);
    }

    return history || [];
  }

  // Get history for actions of a specific thought
  static async findByThoughtId(thoughtId: string): Promise<ActionHistory[]> {
    const { data: history, error } = await supabase
      .from('action_history')
      .select(`
        *,
        actions!inner(thought_id)
      `)
      .eq('actions.thought_id', thoughtId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch action history for thought: ${error.message}`);
    }

    return history || [];
  }

  // Update history record
  static async update(id: string, updates: Partial<Omit<ActionHistory, 'id' | 'updated_at'>>): Promise<ActionHistory> {
    const { data: history, error } = await supabase
      .from('action_history')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update action history: ${error.message}`);
    }

    return history;
  }

  // Delete history record
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('action_history')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete action history: ${error.message}`);
    }
  }

  // Check if history belongs to user
  static async belongsToUser(historyId: string, userId: string): Promise<boolean> {
    const { data: history, error } = await supabase
      .from('action_history')
      .select('user_id')
      .eq('id', historyId)
      .single();

    if (error || !history) {
      return false;
    }

    return history.user_id === userId;
  }

  // Create or update history for an action
  static async upsertForAction(actionId: string, userId: string, finalStatus: ActionHistory['final_status'], notes?: string): Promise<ActionHistory> {
    // First, try to find existing history for this action
    const existing = await this.findLatestByActionId(actionId);

    if (existing) {
      // Update existing record
      return this.update(existing.id, {
        final_status: finalStatus,
        notes: notes || existing.notes
      });
    } else {
      // Create new record
      return this.create({
        action_id: actionId,
        user_id: userId,
        final_status: finalStatus,
        notes: notes || ''
      });
    }
  }
}