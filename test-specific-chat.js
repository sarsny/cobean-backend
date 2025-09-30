const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
const CONVERSATION_ID = 'eae88efb-2de0-4339-bffd-32e1ce9f95a4';

// Valid JWT token for testing (generated with correct JWT_SECRET)
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlci1pZCIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImlhdCI6MTc1OTE0ODgwNywiZXhwIjoxNzU5NzUzNjA3fQ.Jcqox5gemqa9Of-boz2JeS7qF6STutPvjqY14H9rNTQ';

async function testSendMessage() {
  try {
    console.log(`\n=== 测试发送消息到会话 ${CONVERSATION_ID} ===`);
    
    const messageData = {
      content: "Hello, this is a test message",
      message_type: "text"
    };

    console.log('发送请求:', {
      url: `${BASE_URL}/chats/${CONVERSATION_ID}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      },
      data: messageData
    });

    const response = await axios.post(
      `${BASE_URL}/chats/${CONVERSATION_ID}/messages`,
      messageData,
      {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('响应状态:', response.status);
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

async function testGetConversation() {
  try {
    console.log(`\n=== 检查会话 ${CONVERSATION_ID} 是否存在 ===`);
    
    const response = await axios.get(
      `${BASE_URL}/chats/${CONVERSATION_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${mockToken}`
        }
      }
    );

    console.log('会话信息:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('获取会话失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('网络错误:', error.message);
    }
    return null;
  }
}

async function main() {
  try {
    // 首先检查会话是否存在
    const conversation = await testGetConversation();
    
    if (!conversation) {
      console.log('会话不存在，无法发送消息');
      return;
    }
    
    // 发送消息
    await testSendMessage();
    
    console.log('\n✅ 所有测试完成');
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  }
}

main();
