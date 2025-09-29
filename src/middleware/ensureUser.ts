import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/database';

/**
 * Middleware to ensure that SAT token users exist in the users table
 * This creates pseudo users for SAT tokens if they don't exist
 */
export const ensureUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    
    // Only handle SAT token users
    if (!user || user.type !== 'service_account') {
      next();
      return;
    }

    // Check if user exists in the users table
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, other errors are actual problems
      console.error('Error checking user existence:', selectError);
      res.status(500).json({
        success: false,
        error: 'Database error'
      });
      return;
    }

    // If user doesn't exist, create them
    if (!existingUser) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          username: `sat-user-${user.id.substring(0, 8)}`,
          email: user.email,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating SAT user:', insertError);
        res.status(500).json({
          success: false,
          error: 'Failed to create user'
        });
        return;
      }

      console.log(`✅ Created SAT user: ${user.id}`);
    }

    next();
  } catch (error) {
    console.error('Error in ensureUser middleware:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};