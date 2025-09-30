const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Valid JWT token for testing (generated with correct JWT_SECRET)
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlci1pZCIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImlhdCI6MTc1OTE0ODgwNywiZXhwIjoxNzU5NzUzNjA3fQ.Jcqox5gemqa9Of-boz2JeS7qF6STutPvjqY14H9rNTQ';

async function createChat() {
  try {
    console.log('\n=== 创建新的聊天会话 ===');
    
    const chatData = {
      title: "Test Chat Session",
      conversation_type: "general"
    };

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
      content: "Hello, this is a test message for the chat API",
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

async function getMessages(conversationId) {
  try {
    console.log(`\n=== 获取会话 ${conversationId} 的消息 ===`);
    
    const response = await axios.get(
      `${BASE_URL}/chats/${conversationId}/messages`,
      {
        headers: {
          'Authorization': `Bearer ${mockToken}`
        }
      }
    );

    console.log('获取消息成功:', response.status);
    console.log('消息数据:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('获取消息失败:');
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
    // 1. 创建新的聊天会话
    const chat = await createChat();
    const conversationId = chat.id;
    
    // 2. 发送消息
    await sendMessage(conversationId);
    
    // 3. 获取消息列表
    await getMessages(conversationId);
    
    console.log('\n✅ 所有测试完成');
    console.log(`测试的会话 ID: ${conversationId}`);
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  }
}

main();
