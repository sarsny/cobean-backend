import app from './app';
import { config } from './config';
import { initCozeService } from './services/cozeService';

// Initialize Coze service if configuration is available
if (config.coze.apiKey && config.coze.botId) {
  try {
    initCozeService({
      apiKey: config.coze.apiKey,
      botId: config.coze.botId,
      baseUrl: config.coze.baseUrl,
    });
    console.log('✅ Coze service initialized successfully');
  } catch (error) {
    console.warn('⚠️  Failed to initialize Coze service:', error);
  }
} else {
  console.warn('⚠️  Coze configuration missing, service not initialized');
}

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`🚀 Cobean API server is running on port ${PORT}`);
  console.log(`📍 Environment: ${config.nodeEnv}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/api/v1/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

export default server;