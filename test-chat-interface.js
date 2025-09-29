const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api/v1';
const SAT_TOKEN = 'sat_X1n9dwCN24G3FKkKBwbEqEpL6pAOOCWbx24lOrRxeAdFvBtZEC7DY5qs7DNBlXyL';

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${SAT_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// 测试数据
const testData = {
  thought_id: '9be12eec-97a9-4cf0-8f16-c2badee5a442',
  bean_id: '11111111-2222-3333-4444-555555555555',
  external_conversation_id: 'test-conv-' + Date.now(),
  agent_type: 'coze'
};

// 颜色输出函数
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 测试函数
async function testChatInterface() {
  console.log('\n🚀 开始测试聊天接口...\n');
  
  let chatId = null;
  
  try {
    // 1. 测试获取聊天列表（初始应该为空）
    log('blue', '📋 测试1: 获取聊天列表');
    const chatsResponse = await api.get('/chats');
    console.log('响应:', JSON.stringify(chatsResponse.data, null, 2));
    
    if (chatsResponse.data.success) {
      log('green', '✅ 获取聊天列表成功');
      console.log(`当前聊天数量: ${chatsResponse.data.data.length}`);
    } else {
      log('red', '❌ 获取聊天列表失败');
    }
    
    // 2. 测试创建新聊天
    log('blue', '\n💬 测试2: 创建新聊天');
    const createResponse = await api.post('/chats', testData);
    console.log('响应:', JSON.stringify(createResponse.data, null, 2));
    
    if (createResponse.data.success) {
      log('green', '✅ 创建聊天成功');
      chatId = createResponse.data.data.id;
      console.log(`聊天ID: ${chatId}`);
    } else {
      log('red', '❌ 创建聊天失败');
      return;
    }
    
    // 3. 测试获取单个聊天详情
    log('blue', '\n🔍 测试3: 获取聊天详情');
    const chatDetailResponse = await api.get(`/chats/${chatId}`);
    console.log('响应:', JSON.stringify(chatDetailResponse.data, null, 2));
    
    if (chatDetailResponse.data.success) {
      log('green', '✅ 获取聊天详情成功');
    } else {
      log('red', '❌ 获取聊天详情失败');
    }
    
    // 4. 测试发送消息
    log('blue', '\n📤 测试4: 发送消息');
    const messageData = {
      conversation_id: chatId,
      content: '你好！这是一个测试消息。请介绍一下你自己。'
    };
    
    const sendMessageResponse = await api.post(`/chats/${chatId}/messages`, messageData);
    console.log('响应:', JSON.stringify(sendMessageResponse.data, null, 2));
    
    if (sendMessageResponse.data.success) {
      log('green', '✅ 发送消息成功');
      console.log('用户消息:', sendMessageResponse.data.data.user_message.content);
      console.log('AI回复:', sendMessageResponse.data.data.ai_message.content);
    } else {
      log('red', '❌ 发送消息失败');
    }
    
    // 5. 测试获取消息历史
    log('blue', '\n📜 测试5: 获取消息历史');
    const messagesResponse = await api.get(`/chats/${chatId}/messages`);
    console.log('响应:', JSON.stringify(messagesResponse.data, null, 2));
    
    if (messagesResponse.data.success) {
      log('green', '✅ 获取消息历史成功');
      console.log(`消息数量: ${messagesResponse.data.data.messages.length}`);
    } else {
      log('red', '❌ 获取消息历史失败');
    }
    
    // 6. 测试再次发送消息
    log('blue', '\n📤 测试6: 发送第二条消息');
    const secondMessageData = {
      conversation_id: chatId,
      content: '能告诉我今天的天气怎么样吗？'
    };
    
    const secondMessageResponse = await api.post(`/chats/${chatId}/messages`, secondMessageData);
    console.log('响应:', JSON.stringify(secondMessageResponse.data, null, 2));
    
    if (secondMessageResponse.data.success) {
      log('green', '✅ 发送第二条消息成功');
    } else {
      log('red', '❌ 发送第二条消息失败');
    }
    
    // 7. 测试再次获取聊天列表（应该有一个聊天）
    log('blue', '\n📋 测试7: 再次获取聊天列表');
    const updatedChatsResponse = await api.get('/chats');
    console.log('响应:', JSON.stringify(updatedChatsResponse.data, null, 2));
    
    if (updatedChatsResponse.data.success) {
      log('green', '✅ 再次获取聊天列表成功');
      console.log(`当前聊天数量: ${updatedChatsResponse.data.data.length}`);
    } else {
      log('red', '❌ 再次获取聊天列表失败');
    }
    
    // 8. 测试删除聊天
    log('blue', '\n🗑️  测试8: 删除聊天');
    const deleteResponse = await api.delete(`/chats/${chatId}`);
    console.log('响应:', JSON.stringify(deleteResponse.data, null, 2));
    
    if (deleteResponse.data.success) {
      log('green', '✅ 删除聊天成功');
    } else {
      log('red', '❌ 删除聊天失败');
    }
    
    // 9. 测试验证聊天已删除
    log('blue', '\n🔍 测试9: 验证聊天已删除');
    try {
      await api.get(`/chats/${chatId}`);
      log('red', '❌ 聊天未被正确删除');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        log('green', '✅ 聊天已成功删除');
      } else {
        log('yellow', '⚠️  删除验证出现意外错误');
        console.log('错误:', error.message);
      }
    }
    
    // 10. 测试最终聊天列表（应该为空）
    log('blue', '\n📋 测试10: 最终聊天列表检查');
    const finalChatsResponse = await api.get('/chats');
    console.log('响应:', JSON.stringify(finalChatsResponse.data, null, 2));
    
    if (finalChatsResponse.data.success) {
      log('green', '✅ 最终聊天列表获取成功');
      console.log(`最终聊天数量: ${finalChatsResponse.data.data.length}`);
      
      if (finalChatsResponse.data.data.length === 0) {
        log('green', '✅ 聊天列表已清空，测试完成！');
      } else {
        log('yellow', '⚠️  聊天列表未完全清空');
      }
    } else {
      log('red', '❌ 最终聊天列表获取失败');
    }
    
    log('green', '\n🎉 所有测试完成！');
    
  } catch (error) {
    log('red', '\n❌ 测试过程中出现错误:');
    console.error('错误详情:', error.response?.data || error.message);
    
    // 如果有创建的聊天，尝试清理
    if (chatId) {
      try {
        log('yellow', '\n🧹 尝试清理测试数据...');
        await api.delete(`/chats/${chatId}`);
        log('green', '✅ 测试数据清理完成');
      } catch (cleanupError) {
        log('red', '❌ 清理测试数据失败');
      }
    }
  }
}

// 运行测试
if (require.main === module) {
  testChatInterface().catch(console.error);
}

module.exports = { testChatInterface };