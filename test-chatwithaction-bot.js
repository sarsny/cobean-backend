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

async function testChatWithActionBot() {
  console.log('🤖 测试 chatWithAction 接口的专用 bot_id...\n');

  try {
    // 1. 创建想法（使用mock路由）
    console.log('1️⃣ 创建测试想法...');
    const thoughtResponse = await axios.post(`${MOCK_BASE_URL}/thoughts`, {
      title: '测试专用bot的想法',
      description: '这是一个用于测试chatWithAction接口专用bot_id的想法',
      category: 'personal',
      priority: 'medium'
    }, { headers });

    const thoughtId = thoughtResponse.data.data.id;
    console.log(`✅ 想法创建成功，ID: ${thoughtId}\n`);

    // 2. 创建聊天（使用mock路由）
    console.log('2️⃣ 创建聊天会话...');
    const chatResponse = await axios.post(`${MOCK_BASE_URL}/chats`, {
      title: '测试专用bot聊天',
      description: '测试chatWithAction接口的专用bot功能'
    }, { headers });

    const chatId = chatResponse.data.id;
    console.log(`✅ 聊天创建成功，ID: ${chatId}\n`);

    // 3. 使用 chatWithAction 接口发送消息（使用正式路由，因为这是我们要测试的功能）
    console.log('3️⃣ 使用 chatWithAction 接口发送消息...');
    const messageResponse = await axios.post(`${BASE_URL}/chats/${chatId}/messages/with-action`, {
      content: '你好，我想了解一下如何更好地实现我的想法。请根据我的想法背景给出建议。',
      thought_id: thoughtId
    }, { headers });

    console.log('✅ chatWithAction 消息发送成功！');
    console.log('📝 用户消息:', messageResponse.data.data.user_message.content);
    console.log('🤖 AI回复:', messageResponse.data.data.ai_message.content);
    console.log('📊 消息元数据:', JSON.stringify(messageResponse.data.data.user_message.metadata, null, 2));

    console.log('\n🎉 专用bot测试完成！');
    console.log('💡 注意：此次测试使用了专门为chatWithAction配置的bot_id: 7553108566920626185');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n💡 可能的问题：');
      console.log('   1. Coze服务配置问题');
      console.log('   2. 专用bot_id配置错误');
      console.log('   3. API密钥权限问题');
    }
  }
}

// 运行测试
testChatWithActionBot();