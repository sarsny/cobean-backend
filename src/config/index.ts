import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // SAT Token Configuration
  sat: {
    enabled: process.env.SAT_ENABLED === 'true' || true, // Enable SAT tokens by default
    allowedTokens: process.env.SAT_ALLOWED_TOKENS?.split(',') || [], // Comma-separated list of allowed SAT tokens
  },
  
  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  
  // Supabase Configuration
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // Coze Configuration
  coze: {
    apiKey: process.env.COZE_API_KEY,
    botId: process.env.COZE_BOT_ID,
    baseUrl: process.env.COZE_BASE_URL || 'https://api.coze.cn',
  },
};

export default config;