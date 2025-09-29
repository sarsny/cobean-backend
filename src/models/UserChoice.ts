import { supabase } from '../config/database';
import { UserChoice, CreateChoiceRequest } from '../types';

export class UserChoiceModel {
  // Create a new user choice
  static async create(data: CreateChoiceRequest): Promise<UserChoice> {
    const { data: choice, error } = await supabase
      .from('user_choices')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user choice: ${error.message}`);
    }

    return choice;
  }

  // Get choice by ID
  static async findById(id: string): Promise<UserChoice | null> {
    const { data: choice, error } = await supabase
      .from('user_choices')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw new Error(`Failed to fetch user choice: ${error.message}`);
    }

    return choice;
  }

  // Get all choices for a user
  static async findByUserId(userId: string): Promise<UserChoice[]> {
    const { data: choices, error } = await supabase
      .from('user_choices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user choices: ${error.message}`);
    }

    return choices || [];
  }

  // Get all choices for an action
  static async findByActionId(actionId: string): Promise<UserChoice[]> {
    const { data: choices, error } = await supabase
      .from('user_choices')
      .select('*')
      .eq('action_id', actionId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch choices for action: ${error.message}`);
    }

    return choices || [];
  }

  // Get choices for a thought (via actions)
  static async findByThoughtId(thoughtId: string): Promise<UserChoice[]> {
    const { data: choices, error } = await supabase
      .from('user_choices')
      .select(`
        *,
        actions!inner(thought_id)
      `)
      .eq('actions.thought_id', thoughtId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch choices for thought: ${error.message}`);
    }

    return choices || [];
  }

  // Update choice
  static async update(id: string, updates: Partial<Omit<UserChoice, 'id' | 'created_at'>>): Promise<UserChoice> {
    const { data: choice, error } = await supabase
      .from('user_choices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user choice: ${error.message}`);
    }

    return choice;
  }

  // Delete choice
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_choices')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete user choice: ${error.message}`);
    }
  }

  // Check if choice belongs to user
  static async belongsToUser(choiceId: string, userId: string): Promise<boolean> {
    const { data: choice, error } = await supabase
      .from('user_choices')
      .select('user_id')
      .eq('id', choiceId)
      .single();

    if (error || !choice) {
      return false;
    }

    return choice.user_id === userId;
  }

  // Get latest choice for an action by a user
  static async findLatestByActionAndUser(actionId: string, userId: string): Promise<UserChoice | null> {
    const { data: choice, error } = await supabase
      .from('user_choices')
      .select('*')
      .eq('action_id', actionId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw new Error(`Failed to fetch latest choice: ${error.message}`);
    }

    return choice;
  }
}