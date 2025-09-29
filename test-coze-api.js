#!/usr/bin/env node

/**
 * Coze API 测试脚本
 * 
 * 使用方法：
 * 1. 确保已配置 .env 文件中的 COZE_API_KEY 和 COZE_BOT_ID
 * 2. 启动开发服务器：npm run dev
 * 3. 运行此脚本：node test-coze-api.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// 测试用户凭据（需要先注册/登录获取token）
const TEST_USER = {
  email: 'test@coze.com',
  password: 'password123'
};

let authToken = 'sat_X1n9dwCN24G3FKkKBwbEqEpL6pAOOCWbx24lOrRxeAdFvBtZEC7DY5qs7DNBlXyL';

async function registerAndLogin() {
  try {
    console.log('🔐 正在注册测试用户...');
    
    // 尝试注册用户
    try {
      await axios.post(`${BASE_URL}/auth/register`, TEST_USER);
      console.log('✅ 用户注册成功');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('ℹ️  用户已存在，跳过注册');
      } else {
        throw error;
      }
    }

    // 登录获取token
    console.log('🔑 正在登录...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    authToken = loginResponse.data.data.token;
    console.log('✅ 登录成功，获取到token');
    
    return authToken;
  } catch (error) {
    console.error('❌ 认证失败:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function testCozeAPI() {
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  try {
    console.log('\n🤖 开始测试 Coze API...\n');

    // 1. 创建会话
    console.log('1️⃣ 测试创建会话...');
    const conversationResponse = await axios.post(
      `${BASE_URL}/coze/conversation`,
      {},
      { headers }
    );
    console.log('✅ 创建会话成功:', conversationResponse.data);
    const conversationId = conversationResponse.data.data.conversation_id;

    // 2. 获取会话ID
    console.log('\n2️⃣ 测试获取会话ID...');
    const getConversationResponse = await axios.get(
      `${BASE_URL}/coze/conversation`,
      { headers }
    );
    console.log('✅ 获取会话ID成功:', getConversationResponse.data);

    // 3. 发起异步对话
    console.log('\n3️⃣ 测试发起异步对话...');
    const chatResponse = await axios.post(
      `${BASE_URL}/coze/chat`,
      {
        message: '你好，请介绍一下你自己',
        conversation_id: conversationId
      },
      { headers }
    );
    console.log('✅ 发起对话成功:', chatResponse.data);
    const chatId = chatResponse.data.data.id;

    // 4. 查询对话状态
    console.log('\n4️⃣ 测试查询对话状态...');
    const statusResponse = await axios.get(
      `${BASE_URL}/coze/chat/status`,
      {
        params: {
          conversation_id: conversationId,
          chat_id: chatId
        },
        headers
      }
    );
    console.log('✅ 查询状态成功:', statusResponse.data);

    // 5. 获取消息列表
    console.log('\n5️⃣ 测试获取消息列表...');
    const messagesResponse = await axios.get(
      `${BASE_URL}/coze/chat/messages`,
      {
        params: {
          conversation_id: conversationId,
          chat_id: chatId
        },
        headers
      }
    );
    console.log('✅ 获取消息列表成功:', messagesResponse.data);

    // 6. 完整对话流程（同步）
    console.log('\n6️⃣ 测试完整对话流程...');
    const completeChatResponse = await axios.post(
      `${BASE_URL}/coze/chat/complete`,
      {
        message: '请给我一个关于学习编程的建议',
        conversation_id: conversationId
      },
      { headers }
    );
    console.log('✅ 完整对话成功:', completeChatResponse.data);

    // 7. 清除会话
    console.log('\n7️⃣ 测试清除会话...');
    const clearResponse = await axios.delete(
      `${BASE_URL}/coze/conversation`,
      { headers }
    );
    console.log('✅ 清除会话成功:', clearResponse.data);

    console.log('\n🎉 所有 Coze API 测试完成！');

  } catch (error) {
    console.error('❌ Coze API 测试失败:', error.response?.data || error.message);
    
    if (error.response?.status === 500 && error.response?.data?.message?.includes('Coze服务未初始化')) {
      console.log('\n💡 提示：请确保在 .env 文件中配置了以下环境变量：');
      console.log('   COZE_API_KEY=your_coze_api_key');
      console.log('   COZE_BOT_ID=your_coze_bot_id');
      console.log('   COZE_BASE_URL=https://api.coze.cn');
    }
  }
}

async function main() {
  console.log('🚀 Coze API 集成测试开始\n');
  
  await registerAndLogin();
  await testCozeAPI();
  
  console.log('\n✨ 测试完成！');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { registerAndLogin, testCozeAPI };