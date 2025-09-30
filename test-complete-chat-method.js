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

async function testCompleteChat() {
  try {
    console.log('\n=== 测试 CozeService.completeChat 方法 ===');
    
    const cozeService = new CozeService(config);
    
    const userId = 'test-user-123';
    const message = 'Hello, can you help me develop the intelligent assistant idea?';
    const customVariables = {
      "thought": "智能助手开发想法",
      "actions": []
    };
    
    console.log('调用参数:');
    console.log('- userId:', userId);
    console.log('- message:', message);
    console.log('- customVariables:', JSON.stringify(customVariables, null, 2));
    
    // 测试不带 conversationId 的调用
    console.log('\n--- 测试 1: 不带 conversationId ---');
    const response1 = await cozeService.completeChat(userId, message, undefined, customVariables);
    console.log('响应 1:', response1);
    
    // 测试带 conversationId 的调用
    console.log('\n--- 测试 2: 创建会话后再调用 ---');
    const conversationId = await cozeService.createConversation(userId);
    console.log('创建的会话 ID:', conversationId);
    
    const response2 = await cozeService.completeChat(userId, message, conversationId, customVariables);
    console.log('响应 2:', response2);
    
  } catch (error) {
    console.error('测试失败:');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    if (error.stack) {
      console.error('错误堆栈:', error.stack);
    }
  }
}

testCompleteChat();
