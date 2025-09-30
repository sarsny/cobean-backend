require('dotenv').config();
const { CozeService } = require('./src/services/cozeService.ts');

const config = {
  apiKey: process.env.COZE_API_KEY,
  botId: process.env.COZE_BOT_ID,
  baseUrl: 'https://api.coze.cn'
};

console.log('配置信息:');
console.log('API Key:', config.apiKey ? `${config.apiKey.substring(0, 10)}...` : 'undefined');
console.log('Bot ID:', config.botId);

async function testCustomVariables() {
  try {
    console.log('\n=== 测试带 customVariables 的 CozeService.completeChat ===');
    
    const cozeService = new CozeService(config);
    
    const userId = 'test-user-123';
    const message = 'Hello, can you help me develop the intelligent assistant idea?';
    
    // 模拟 chatController 中的 customVariables 构建
    const customVariables = {
      thought: '智能助手开发想法',
      actions: [] // 空数组，因为该 thought 没有 actions
    };
    
    console.log('调用参数:');
    console.log('- userId:', userId);
    console.log('- message:', message);
    console.log('- customVariables:', JSON.stringify(customVariables, null, 2));
    
    // 测试带 customVariables 的调用
    console.log('\n--- 测试: 带 customVariables 的调用 ---');
    const response = await cozeService.completeChat(userId, message, undefined, customVariables);
    console.log('响应:', response);
    
  } catch (error) {
    console.error('测试失败:');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    if (error.stack) {
      console.error('错误堆栈:', error.stack);
    }
  }
}

testCustomVariables();
