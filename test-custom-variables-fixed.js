require('dotenv').config();
const { getCozeService, initCozeService } = require('./src/services/cozeService.ts');

async function testCustomVariablesFixed() {
  try {
    console.log('=== 测试修正后的 customVariables 格式 ===');
    
    // 初始化 CozeService
    const cozeService = initCozeService({
      apiKey: process.env.COZE_API_KEY,
      botId: process.env.COZE_BOT_ID,
      baseUrl: process.env.COZE_BASE_URL
    });

    console.log('CozeService 配置:');
    console.log('- API Key:', process.env.COZE_API_KEY ? '已设置' : '未设置');
    console.log('- Bot ID:', process.env.COZE_BOT_ID);
    console.log('- Base URL:', process.env.COZE_BASE_URL);

    // 测试简化的 customVariables 格式
    const customVariables = {
      thought: "我今天感觉很好",
      actions: "[]", // 将数组转换为字符串
      username: "testuser"
    };

    console.log('\n使用的 customVariables:');
    console.log(JSON.stringify(customVariables, null, 2));

    // 调用 completeChat 方法
    console.log('\n开始调用 completeChat...');
    const response = await cozeService.completeChat(
      'test-user-123',
      '你好，我想分享一下我的想法',
      undefined, // 不使用现有会话
      customVariables
    );

    console.log('\n✅ 测试成功！');
    console.log('AI 回复:', response);

  } catch (error) {
    console.error('\n❌ 测试失败:');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    if (error.stack) {
      console.error('错误堆栈:', error.stack);
    }
  }
}

testCustomVariablesFixed();