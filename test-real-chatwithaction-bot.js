const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api/v1';
const MOCK_BASE_URL = 'http://localhost:3000/api/v1/mock';
const SAT_TOKEN = 'sat_X1n9dwCN24G3FKkKBwbEqEpL6pAOOCWbx24lOrRxeAdFvBtZEC7DY5qs7DNBlXyL';

// 请求头配置
const headers = {
  'Authorization': `Bearer ${SAT_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testRealChatWithActionBot() {
  console.log('🤖 测试 chatWithAction 接口的专用 bot_id（真实模式）...\n');

  try {
    // 1. 创建想法（使用mock路由）
    console.log('1️⃣ 创建测试想法...');
    const thoughtResponse = await axios.post(`${MOCK_BASE_URL}/thoughts`, {
      title: '学习编程的计划',
      description: '我想制定一个系统的编程学习计划，包括前端、后端和数据库技术',
      category: 'learning',
      priority: 'high'
    }, { headers });

    const thoughtId = thoughtResponse.data.data.id;
    console.log(`✅ 想法创建成功，ID: ${thoughtId}\n`);

    // 2. 创建真实聊天（使用正式路由）
    console.log('2️⃣ 创建真实聊天会话...');
    const chatResponse = await axios.post(`${BASE_URL}/chats`, {
      title: '编程学习咨询',
      description: '关于编程学习计划的专业咨询',
      thought_id: thoughtId,
      bean_id: 'default-bean-id' // 添加必需的bean_id参数
    }, { headers });

    const chatId = chatResponse.data.data.id;
    console.log(`✅ 真实聊天创建成功，ID: ${chatId}\n`);

    // 3. 使用 chatWithAction 接口发送消息（这将使用专用bot_id）
    console.log('3️⃣ 使用 chatWithAction 接口发送消息（专用bot_id: 7553108566920626185）...');
    const messageResponse = await axios.post(`${BASE_URL}/chats/${chatId}/messages/with-action`, {
      content: '你好！我想制定一个编程学习计划。请根据我的想法背景，给我一些具体的建议和学习路径。',
      thought_id: thoughtId
    }, { headers });

    console.log('✅ chatWithAction 消息发送成功！');
    console.log('📝 用户消息:', messageResponse.data.data.user_message.content);
    console.log('🤖 AI回复:', messageResponse.data.data.ai_message.content);
    console.log('📊 消息元数据:', JSON.stringify(messageResponse.data.data.user_message.metadata, null, 2));

    console.log('\n🎉 专用bot测试完成！');
    console.log('💡 此次测试使用了专门为chatWithAction配置的bot_id: 7553108566920626185');
    console.log('🔍 与普通聊天不同，这个bot专门针对带有想法上下文的对话进行了优化');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n💡 可能的问题：');
      console.log('   1. Coze服务配置问题');
      console.log('   2. 专用bot_id (7553108566920626185) 配置错误');
      console.log('   3. API密钥权限问题');
      console.log('   4. 网络连接问题');
    }
  }
}

// 运行测试
testRealChatWithActionBot();