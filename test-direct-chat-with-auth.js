const axios = require('axios');

async function testDirectChatWithAuth() {
  try {
    console.log('=== 带认证的直接聊天测试 ===');
    
    const baseUrl = 'http://localhost:3000/api/v1';
    const userId = 'test-user-123';
    
    // 1. 先登录获取 token
    console.log('\n1. 用户登录...');
    const loginResponse = await axios.post(`${baseUrl}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    console.log('✅ 登录成功');
    const token = loginResponse.data.data.token;
    console.log('Token:', token ? '已获取' : '未获取');
    
    // 设置认证头
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. 创建聊天会话
    console.log('\n2. 创建聊天会话...');
    const createChatResponse = await axios.post(`${baseUrl}/chats`, {
      user_id: userId,
      title: '测试聊天会话'
    }, { headers: authHeaders });
    
    console.log('✅ 聊天会话创建成功');
    console.log('会话 ID:', createChatResponse.data.data.id);
    
    const chatId = createChatResponse.data.data.id;
    
    // 3. 发送消息
    console.log('\n3. 发送消息...');
    const sendMessageResponse = await axios.post(`${baseUrl}/chats/${chatId}/messages`, {
      content: '你好，我想和你聊天'
    }, { headers: authHeaders });
    
    console.log('✅ 消息发送成功');
    console.log('AI 回复:', sendMessageResponse.data.data.content);
    
    // 4. 获取聊天记录
    console.log('\n4. 获取聊天记录...');
    const messagesResponse = await axios.get(`${baseUrl}/chats/${chatId}/messages`, { 
      headers: authHeaders 
    });
    
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

testDirectChatWithAuth();