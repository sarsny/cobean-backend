import { supabase } from '../config/database';
import { UserPreference } from '../types';

export class UserPreferenceModel {
  // Create a new user preference
  static async create(data: Omit<UserPreference, 'id' | 'created_at' | 'updated_at'>): Promise<UserPreference> {
    const { data: preference, error } = await supabase
      .from('user_preferences')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user preference: ${error.message}`);
    }

    return preference;
  }

  // Get preference by ID
  static async findById(id: string): Promise<UserPreference | null> {
    const { data: preference, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw new Error(`Failed to fetch user preference: ${error.message}`);
    }

    return preference;
  }

  // Get all preferences for a user
  static async findByUserId(userId: string): Promise<UserPreference[]> {
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .order('score', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user preferences: ${error.message}`);
    }

    return preferences || [];
  }

  // Get preference by user and key
  static async findByUserAndKey(userId: string, preferenceKey: string): Promise<UserPreference | null> {
    const { data: preference, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('preference_key', preferenceKey)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw new Error(`Failed to fetch user preference: ${error.message}`);
    }

    return preference;
  }

  // Update preference
  static async update(id: string, updates: Partial<Omit<UserPreference, 'id' | 'created_at' | 'updated_at'>>): Promise<UserPreference> {
    const { data: preference, error } = await supabase
      .from('user_preferences')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user preference: ${error.message}`);
    }

    return preference;
  }

  // Delete preference
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_preferences')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete user preference: ${error.message}`);
    }
  }

  // Check if preference belongs to user
  static async belongsToUser(preferenceId: string, userId: string): Promise<boolean> {
    const { data: preference, error } = await supabase
      .from('user_preferences')
      .select('user_id')
      .eq('id', preferenceId)
      .single();

    if (error || !preference) {
      return false;
    }

    return preference.user_id === userId;
  }

  // Upsert preference (create or update based on user_id and preference_key)
  static async upsert(userId: string, preferenceKey: string, score: number): Promise<UserPreference> {
    const existing = await this.findByUserAndKey(userId, preferenceKey);

    if (existing) {
      // Update existing preference
      return this.update(existing.id, { score });
    } else {
      // Create new preference
      return this.create({
        user_id: userId,
        preference_key: preferenceKey,
        score
      });
    }
  }

  // Get top preferences for a user (highest scores)
  static async getTopPreferences(userId: string, limit: number = 5): Promise<UserPreference[]> {
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch top preferences: ${error.message}`);
    }

    return preferences || [];
  }

  // Increment preference score
  static async incrementScore(userId: string, preferenceKey: string, increment: number = 1): Promise<UserPreference> {
    const existing = await this.findByUserAndKey(userId, preferenceKey);

    if (existing) {
      const newScore = Math.min(10, Math.max(1, existing.score + increment)); // Keep score between 1-10
      return this.update(existing.id, { score: newScore });
    } else {
      // Create new preference with initial score
      const initialScore = Math.min(10, Math.max(1, increment));
      return this.create({
        user_id: userId,
        preference_key: preferenceKey,
        score: initialScore
      });
    }
  }

  // Batch update multiple preferences
  static async batchUpsert(userId: string, preferences: Array<{ key: string; score: number }>): Promise<UserPreference[]> {
    const results: UserPreference[] = [];

    for (const pref of preferences) {
      const result = await this.upsert(userId, pref.key, pref.score);
      results.push(result);
    }

    return results;
  }
}