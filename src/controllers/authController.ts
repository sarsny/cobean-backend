import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/database';
import { RegisterRequest, LoginRequest, AuthResponse, User } from '../types';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_for_development_only';

// 用户注册
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: RegisterRequest = req.body;

    // 验证输入
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required'
      } as AuthResponse);
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: 'Invalid email format'
      } as AuthResponse);
      return;
    }

    // 验证密码长度
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      } as AuthResponse);
      return;
    }

    // 使用Supabase Auth进行注册（匿名注册）
    let { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    // 当 Supabase 返回 500 unexpected_failure（常见于自定义 SMTP 失败等）时，使用 service role 兜底创建并跳过邮箱确认
    if (error && supabaseAdmin) {
      const isUnexpectedFailure = (error.status === 500) || /unexpected_failure/i.test(error.message || '');
      if (isUnexpectedFailure) {
        try {
          const adminResult = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true
          });
          if (adminResult.error) {
            // 兜底也失败，按原错误返回
            console.error('Admin createUser failed:', adminResult.error);
          } else {
            // 构造与 signUp 相同的数据结构以复用后续逻辑
            data = { user: adminResult.data.user!, session: null } as any;
            error = null as any;
            console.log('✅ Fallback: created user via service role and confirmed email.');
          }
        } catch (e) {
          console.error('Admin createUser exception:', e);
        }
      }
    }

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      } as AuthResponse);
      return;
    }

    if (!data.user) {
      res.status(400).json({
        success: false,
        error: 'Failed to create user'
      } as AuthResponse);
      return;
    }

    // 创建用户信息对象
    const user: User = {
      id: data.user.id,
      email: data.user.email!,
      is_active: true, // Default to active
      created_at: data.user.created_at,
      updated_at: data.user.updated_at || data.user.created_at
    };

    // 同步用户到应用的 users 表（使用 Service Role 绕过 RLS）
    try {
      if (supabaseAdmin) {
        const { error: upsertError } = await supabaseAdmin
          .from('users')
          .upsert({
            id: user.id,
            email: user.email,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });

        if (upsertError) {
          // 不中断注册流程，但记录日志以便排查
          console.error('Failed to upsert user into users table:', upsertError);
        }
      } else {
        console.warn('supabaseAdmin is not configured; skipping users table upsert');
      }
    } catch (e) {
      console.error('Error syncing user to users table:', e);
      // 不影响注册成功返回
    }

    // 生成JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      user,
      token,
      message: 'User registered successfully'
    } as AuthResponse);

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as AuthResponse);
  }
};

// 用户登录
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    // 验证输入
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required'
      } as AuthResponse);
      return;
    }

    // 使用Supabase Auth进行登录
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401).json({
        success: false,
        error: error.message
      } as AuthResponse);
      return;
    }

    if (!data.user) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      } as AuthResponse);
      return;
    }

    // 创建用户信息对象
    const user: User = {
      id: data.user.id,
      email: data.user.email!,
      is_active: true, // Default to active
      created_at: data.user.created_at,
      updated_at: data.user.updated_at || data.user.created_at
    };

    // 生成JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      user,
      token,
      message: 'Login successful'
    } as AuthResponse);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as AuthResponse);
  }
};

// 获取当前用户信息
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as AuthResponse);
      return;
    }

    // 从Supabase获取用户信息
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      } as AuthResponse);
      return;
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email!,
      is_active: true, // Default to active
      created_at: data.user.created_at,
      updated_at: data.user.updated_at || data.user.created_at
    };

    res.status(200).json({
      success: true,
      user,
      message: 'User information retrieved successfully'
    } as AuthResponse);

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as AuthResponse);
  }
};

// 用户登出
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // 使用Supabase Auth进行登出
    const { error } = await supabase.auth.signOut();

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      } as AuthResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    } as AuthResponse);

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as AuthResponse);
  }
};