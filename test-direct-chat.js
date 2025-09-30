const axios = require('axios');

async function testDirectChat() {
  try {
    console.log('=== 直接测试聊天功能 ===');
    
    const baseUrl = 'http://localhost:3000/api/v1';
    const userId = 'test-user-123';
    
    // 1. 创建聊天会话
    console.log('\n1. 创建聊天会话...');
    const createChatResponse = await axios.post(`${baseUrl}/chats`, {
      user_id: userId,
      title: '测试聊天会话'
    });
    
    console.log('✅ 聊天会话创建成功');
    console.log('会话 ID:', createChatResponse.data.data.id);
    
    const chatId = createChatResponse.data.data.id;
    
    // 2. 发送消息
    console.log('\n2. 发送消息...');
    const sendMessageResponse = await axios.post(`${baseUrl}/chats/${chatId}/messages`, {
      content: '你好，我想和你聊天'
    });
    
    console.log('✅ 消息发送成功');
    console.log('AI 回复:', sendMessageResponse.data.data.content);
    
    // 3. 获取聊天记录
    console.log('\n3. 获取聊天记录...');
    const messagesResponse = await axios.get(`${baseUrl}/chats/${chatId}/messages`);
    
    console.log('✅ 聊天记录获取成功');
    console.log('消息数量:', messagesResponse.data.data.length);
    
    console.log('\n=== 测试完成 ===');
    
  } catch (error) {
    console.error('\n❌ 测试失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
  }
}

testDirectChat();