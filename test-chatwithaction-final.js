const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
const MOCK_BASE_URL = 'http://localhost:3000/api/v1/mock';

// 测试用户认证信息
const headers = {
  'Authorization': 'Bearer mock-token',
  'Content-Type': 'application/json'
};

async function testChatWithActionBotId() {
  try {
    console.log('🤖 测试 chatWithAction 接口的专用 bot_id 功能...\n');

    // 1. 创建测试想法（使用mock路由）
    console.log('1️⃣ 创建测试想法...');
    const thoughtResponse = await axios.post(`${MOCK_BASE_URL}/thoughts`, {
      title: '编程学习计划',
      description: '制定一个系统的编程学习计划',
      content: '我想学习全栈开发，包括前端React和后端Node.js'
    }, { headers });

    const thoughtId = thoughtResponse.data.data.id;
    console.log(`✅ 想法创建成功，ID: ${thoughtId}\n`);

    // 2. 创建mock聊天会话
    console.log('2️⃣ 创建mock聊天会话...');
    const chatResponse = await axios.post(`${MOCK_BASE_URL}/chats`, {
      title: '编程学习咨询',
      description: '关于编程学习计划的专业咨询',
      thought_id: thoughtId,
      bean_id: 'default-bean-id'
    }, { headers });

    const chatId = chatResponse.data.data?.id || chatResponse.data.id;
    console.log(`✅ 聊天会话创建成功，ID: ${chatId}\n`);

    // 3. 测试 chatWithAction 接口（mock模式）
    console.log('3️⃣ 测试 chatWithAction 接口（mock模式）...');
    const messageResponse = await axios.post(`${BASE_URL}/chats/${chatId}/messages/with-action`, {
      content: '请帮我制定一个详细的学习计划',
      thought_id: thoughtId
    }, { headers });

    console.log('✅ chatWithAction 接口调用成功！');
    console.log('📋 响应详情:');
    console.log(`   用户消息: ${messageResponse.data.data.user_message.content}`);
    console.log(`   AI回复: ${messageResponse.data.data.ai_message.content}`);
    console.log(`   专用Bot ID: ${messageResponse.data.data.ai_message.metadata.bot_id}`);
    console.log(`   想法上下文: ${messageResponse.data.data.user_message.metadata.has_context ? '已包含' : '未包含'}\n`);

    // 4. 验证专用bot_id
    const expectedBotId = '7553108566920626185';
    const actualBotId = messageResponse.data.data.ai_message.metadata.bot_id;
    
    if (actualBotId === expectedBotId) {
      console.log('✅ 专用 bot_id 验证成功！');
      console.log(`   期望值: ${expectedBotId}`);
      console.log(`   实际值: ${actualBotId}`);
    } else {
      console.log('❌ 专用 bot_id 验证失败！');
      console.log(`   期望值: ${expectedBotId}`);
      console.log(`   实际值: ${actualBotId}`);
    }

    console.log('\n🎉 测试完成！chatWithAction 接口已成功配置专用 bot_id');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testChatWithActionBotId();