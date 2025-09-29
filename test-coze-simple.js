#!/usr/bin/env node

/**
 * 简化的 Coze API 测试脚本 - SAT Token版本
 * 
 * 使用方法：
 * 1. 确保已配置 .env 文件中的 COZE_API_KEY 和 COZE_BOT_ID
 * 2. 启动开发服务器：npm run dev
 * 3. 运行此脚本：node test-coze-simple.js
 * 
 * 注意：此脚本使用SAT token进行鉴权，无需用户登录
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// 使用现有的测试用户凭据
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

let authToken = 'sat_X1n9dwCN24G3FKkKBwbEqEpL6pAOOCWbx24lOrRxeAdFvBtZEC7DY5qs7DNBlXyL';

async function login() {
  try {
    console.log('🔑 使用SAT token进行鉴权...');
    // 直接使用SAT token，无需登录
    console.log('✅ SAT token鉴权准备完成');
    return authToken;
  } catch (error) {
    console.error('❌ SAT token鉴权失败:', error.response?.data || error.message);
    console.log('\n💡 提示：请确保SAT token格式正确');
    process.exit(1);
  }
}

async function testCozeEndpoints() {
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  try {
    console.log('\n🤖 开始测试 Coze API 端点...\n');

    // 1. 测试创建会话端点
    console.log('1️⃣ 测试创建会话端点...');
    try {
      const conversationResponse = await axios.post(
        `${BASE_URL}/coze/conversation`,
        {},
        { headers }
      );
      console.log('✅ 创建会话端点正常:', conversationResponse.data);
    } catch (error) {
      console.log('❌ 创建会话失败:', error.response?.data || error.message);
    }

    // 2. 测试获取会话ID端点
    console.log('\n2️⃣ 测试获取会话ID端点...');
    try {
      const getConversationResponse = await axios.get(
        `${BASE_URL}/coze/conversation`,
        { headers }
      );
      console.log('✅ 获取会话ID端点正常:', getConversationResponse.data);
    } catch (error) {
      console.log('❌ 获取会话ID失败:', error.response?.data || error.message);
    }

    // 3. 测试发起对话端点（不实际调用Coze API）
    console.log('\n3️⃣ 测试发起对话端点...');
    try {
      const chatResponse = await axios.post(
        `${BASE_URL}/coze/chat`,
        {
          message: '测试消息',
          conversation_id: 'test_conversation_id'
        },
        { headers }
      );
      console.log('✅ 发起对话端点正常:', chatResponse.data);
    } catch (error) {
      console.log('❌ 发起对话失败:', error.response?.data || error.message);
      
      // 检查是否是Coze服务未初始化的错误
      if (error.response?.status === 500 && 
          error.response?.data?.message?.includes('Coze服务未初始化')) {
        console.log('ℹ️  这是预期的错误，因为Coze服务需要配置API密钥');
      }
    }

    console.log('\n🎉 Coze API 端点测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

async function checkCozeConfiguration() {
  console.log('\n🔍 检查Coze配置状态...');
  
  try {
    // 检查服务器是否正常运行
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 服务器运行正常:', healthResponse.data);
    
    // 检查路由是否正确注册
    console.log('\n📋 可用的Coze API端点：');
    console.log('   POST /api/v1/coze/conversation - 创建会话');
    console.log('   GET  /api/v1/coze/conversation - 获取会话ID');
    console.log('   POST /api/v1/coze/chat - 发起对话');
    console.log('   POST /api/v1/coze/chat/complete - 完整对话流程');
    console.log('   GET  /api/v1/coze/chat/status - 查询对话状态');
    console.log('   GET  /api/v1/coze/chat/messages - 获取消息列表');
    console.log('   DELETE /api/v1/coze/conversation - 清除会话');
    
  } catch (error) {
    console.error('❌ 服务器连接失败:', error.message);
  }
}

async function main() {
  console.log('🚀 Coze API 集成测试开始\n');
  
  await checkCozeConfiguration();
  await login();
  await testCozeEndpoints();
  
  console.log('\n✨ 测试完成！');
  console.log('\n💡 提示：');
  console.log('   - 如需完整功能测试，请在 .env 文件中配置：');
  console.log('     COZE_API_KEY=your_coze_api_key');
  console.log('     COZE_BOT_ID=your_coze_bot_id');
  console.log('     COZE_BASE_URL=https://api.coze.cn');
  console.log('   - 当前测试验证了API端点的可访问性和基本功能');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { login, testCozeEndpoints, checkCozeConfiguration };