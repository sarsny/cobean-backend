const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
const THOUGHT_ID = 'f730a43f-6b6a-49bb-aee4-5dd103d2cfff';

// Valid JWT token for testing (generated with correct JWT_SECRET and matching user_id)
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlci0xMjMiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE3NTkxNDg5NjgsImV4cCI6MTc1OTc1Mzc2OH0.8_LoJvvfj_AsuD4CWceCfJVHK360QhdKUNcDaUQZS9k';

async function createChat(thoughtId) {
  try {
    console.log('\n=== 创建新的聊天会话 ===');
    
    const chatData = {
      title: "Test Chat Session",
      thought_id: thoughtId,
      bean_id: "test-bean-id",
      conversation_type: "general"
    };

    console.log('创建聊天请求数据:', JSON.stringify(chatData, null, 2));

    const response = await axios.post(
      `${BASE_URL}/chats`,
      chatData,
      {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('创建会话成功:', response.status);
    console.log('会话数据:', JSON.stringify(response.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('创建会话失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('网络错误:', error.message);
    }
    throw error;
  }
}

async function sendMessage(conversationId) {
  try {
    console.log(`\n=== 发送消息到会话 ${conversationId} ===`);
    
    const messageData = {
      content: "Hello, this is a test message for the chat API. Can you help me develop the intelligent assistant idea?",
      message_type: "text"
    };

    console.log('发送请求:', {
      url: `${BASE_URL}/chats/${conversationId}/messages`,
      method: 'POST',
      data: messageData
    });

    const response = await axios.post(
      `${BASE_URL}/chats/${conversationId}/messages`,
      messageData,
      {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('发送消息成功:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('发送消息失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('网络错误:', error.message);
    }
    throw error;
  }
}

async function main() {
  try {
    console.log(`使用现有的 Thought ID: ${THOUGHT_ID}`);
    
    // 1. 创建聊天会话
    const chat = await createChat(THOUGHT_ID);
    const conversationId = chat.id;
    
    // 2. 发送消息 (测试 POST /api/v1/chats/{conversationId}/messages)
    await sendMessage(conversationId);
    
    console.log('\n✅ 所有测试完成');
    console.log(`测试的 Thought ID: ${THOUGHT_ID}`);
    console.log(`测试的会话 ID: ${conversationId}`);
    console.log(`测试的接口: POST /api/v1/chats/${conversationId}/messages`);
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  }
}

main();
