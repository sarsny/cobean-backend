require('dotenv').config();
const { CozeAPI, COZE_CN_BASE_URL, ChatStatus, RoleType } = require('@coze/api');

const config = {
  apiKey: process.env.COZE_API_KEY,
  botId: process.env.COZE_BOT_ID || '7555486948610097215',
  baseUrl: COZE_CN_BASE_URL
};

console.log('配置信息:');
console.log('API Key:', config.apiKey ? `${config.apiKey.substring(0, 10)}...` : 'undefined');
console.log('Bot ID:', config.botId);
console.log('Base URL:', config.baseUrl);

async function testCozeAPI() {
  try {
    const client = new CozeAPI({
      token: config.apiKey,
      baseURL: config.baseUrl,
    });

    console.log('\n=== 测试 Coze API ===');
    
    const chatParams = {
      bot_id: config.botId,
      user_id: 'test-user-123',
      auto_save_history: true,
      additional_messages: [
        {
          role: RoleType.User,
          content: 'Hello, this is a test message',
          content_type: 'text',
        },
      ],
    };

    console.log('请求参数:', JSON.stringify(chatParams, null, 2));
    
    const chatResult = await client.chat.createAndPoll(chatParams);
    
    console.log('API 调用成功!');
    console.log('Chat ID:', chatResult.chat.id);
    console.log('Status:', chatResult.chat.status);
    console.log('Messages count:', chatResult.messages.length);
    
    // 查找 AI 回复
    const aiMessages = chatResult.messages.filter(msg => 
      msg.role === RoleType.Assistant && msg.type === 'answer'
    );
    
    if (aiMessages.length > 0) {
      console.log('AI 回复:', aiMessages[aiMessages.length - 1].content);
    } else {
      console.log('未找到 AI 回复');
      console.log('所有消息:', JSON.stringify(chatResult.messages, null, 2));
    }
    
  } catch (error) {
    console.error('API 调用失败:');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    if (error.stack) {
      console.error('错误堆栈:', error.stack);
    }
  }
}

testCozeAPI();
