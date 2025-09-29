import { supabase } from '../config/database';
import { Bean, CreateBeanRequest, UpdateBeanRequest } from '../types';

export class BeanModel {
  // Create a new bean
  static async create(data: CreateBeanRequest): Promise<Bean> {
    const { data: bean, error } = await supabase
      .from('beans')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create bean: ${error.message}`);
    }

    return bean;
  }

  // Get bean by ID
  static async findById(id: string): Promise<Bean | null> {
    const { data: bean, error } = await supabase
      .from('beans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw new Error(`Failed to fetch bean: ${error.message}`);
    }

    return bean;
  }

  // Get all beans for a user
  static async findByUserId(userId: string): Promise<Bean[]> {
    const { data: beans, error } = await supabase
      .from('beans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch beans: ${error.message}`);
    }

    return beans || [];
  }

  // Update bean
  static async update(id: string, updates: UpdateBeanRequest): Promise<Bean> {
    const { data: bean, error } = await supabase
      .from('beans')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update bean: ${error.message}`);
    }

    return bean;
  }

  // Delete bean
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('beans')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete bean: ${error.message}`);
    }
  }

  // Check if bean belongs to user
  static async belongsToUser(beanId: string, userId: string): Promise<boolean> {
    const { data: bean, error } = await supabase
      .from('beans')
      .select('user_id')
      .eq('id', beanId)
      .single();

    if (error || !bean) {
      return false;
    }

    return bean.user_id === userId;
  }

  // Get beans by status
  static async findByStatus(userId: string, status: string): Promise<Bean[]> {
    const { data: beans, error } = await supabase
      .from('beans')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch beans by status: ${error.message}`);
    }

    return beans || [];
  }
}