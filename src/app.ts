import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import routes from './routes';
import mockRoutes from './routes/mockRoutes';
import { errorHandler, notFoundHandler } from './middleware';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Custom middleware to log request and response details
app.use((req: Request, res: Response, next) => {
  const startTime = Date.now();
  
  // Log request details
  console.log('\n🔵 ===== INCOMING REQUEST =====');
  console.log(`📅 Time: ${new Date().toISOString()}`);
  console.log(`🌐 ${req.method} ${req.originalUrl}`);
  console.log(`📍 IP: ${req.ip || req.connection.remoteAddress}`);
  console.log(`🔧 User-Agent: ${req.get('User-Agent') || 'N/A'}`);
  
  // Log headers
  console.log('📋 Headers:');
  Object.entries(req.headers).forEach(([key, value]) => {
    if (key.toLowerCase().includes('authorization')) {
      console.log(`  ${key}: ${typeof value === 'string' ? value.substring(0, 20) + '...' : '[HIDDEN]'}`);
    } else {
      console.log(`  ${key}: ${value}`);
    }
  });
  
  // Log request body (if exists)
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Request Body:');
    console.log(JSON.stringify(req.body, null, 2));
  }
  
  // Log query parameters
  if (Object.keys(req.query).length > 0) {
    console.log('🔍 Query Parameters:');
    console.log(JSON.stringify(req.query, null, 2));
  }
  
  // Capture original res.json to log response
  const originalJson = res.json;
  res.json = function(body) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('\n🟢 ===== OUTGOING RESPONSE =====');
    console.log(`📅 Time: ${new Date().toISOString()}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Status: ${res.statusCode}`);
    console.log('📋 Response Headers:');
    Object.entries(res.getHeaders()).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('📦 Response Body:');
    console.log(JSON.stringify(body, null, 2));
    console.log('🔵 ===== END REQUEST =====\n');
    
    return originalJson.call(this, body);
  };
  
  next();
});

// Logging middleware - Custom format for better readability
const logFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

// Add colors for different status codes
morgan.token('status-color', (req, res) => {
  const status = res.statusCode;
  if (status >= 500) return `\x1b[31m${status}\x1b[0m`; // Red for 5xx
  if (status >= 400) return `\x1b[33m${status}\x1b[0m`; // Yellow for 4xx
  if (status >= 300) return `\x1b[36m${status}\x1b[0m`; // Cyan for 3xx
  if (status >= 200) return `\x1b[32m${status}\x1b[0m`; // Green for 2xx
  return `\x1b[37m${status}\x1b[0m`; // White for others
});

// Custom colored format
const coloredFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status-color :res[content-length] ":referrer" ":user-agent" - :response-time ms';

app.use(morgan(coloredFormat));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api/v1', routes);

// Mock API routes (for testing without Supabase)
app.use('/api/v1/mock', mockRoutes);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Welcome to Cobean API',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      thoughts: '/api/v1/thoughts',
      actions: '/api/v1/actions',
      choices: '/api/v1/choices'
    }
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;