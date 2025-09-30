const axios = require('axios');

async function testCompleteFlow() {
  try {
    console.log('=== 完整流程测试 ===');
    
    const baseUrl = 'http://localhost:3000/api/v1';
    
    // 1. 注册用户
    console.log('\n1. 注册用户...');
    const registerResponse = await axios.post(`${baseUrl}/auth/register`, {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      username: 'testuser'
    });
    
    console.log('✅ 用户注册成功');
    const token = registerResponse.data.token;
    const userId = registerResponse.data.user.id;
    
    console.log('Token:', token ? '已获取' : '未获取');
    console.log('User ID:', userId);
    
    // 设置认证头
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. 创建 thought
    console.log('\n2. 创建 thought...');
    const thoughtResponse = await axios.post(`${baseUrl}/thoughts`, {
      title: '学习新技能',
      description: '我今天想要学习新技能',
      user_id: userId // 明确指定 user_id
    }, { headers: authHeaders });
    
    console.log('✅ Thought 创建成功');
    console.log('Thought ID:', thoughtResponse.data.data.id);
    const thoughtId = thoughtResponse.data.data.id;
    
    // 3. 创建 bean (假设有这个接口)
    console.log('\n3. 创建 bean...');
    let beanId = '11111111-2222-3333-4444-555555555555'; // 使用数据库中存在的 bean ID
    
    try {
      const beanResponse = await axios.post(`${baseUrl}/beans`, {
        name: 'Test Bean',
        type: 'assistant'
      }, { headers: authHeaders });
      
      beanId = beanResponse.data.data.id;
      console.log('✅ Bean 创建成功');
      console.log('Bean ID:', beanId);
    } catch (beanError) {
      console.log('⚠️ Bean 创建失败，使用默认 Bean ID');
    }
    
    // 4. 创建聊天会话
    console.log('\n4. 创建聊天会话...');
    const createChatResponse = await axios.post(`${baseUrl}/chats`, {
      thought_id: thoughtId,
      bean_id: beanId,
      title: '测试聊天会话'
    }, { headers: authHeaders });
    
    console.log('✅ 聊天会话创建成功');
    console.log('会话 ID:', createChatResponse.data.data.id);
    
    const chatId = createChatResponse.data.data.id;
    
    // 5. 发送消息
    console.log('\n5. 发送消息...');
    const sendMessageResponse = await axios.post(`${baseUrl}/chats/${chatId}/messages`, {
      content: '你好，我想和你聊天'
    }, { headers: authHeaders });
    
    console.log('✅ 消息发送成功');
    console.log('完整响应:', JSON.stringify(sendMessageResponse.data, null, 2));
    console.log('AI 回复:', sendMessageResponse.data.data.ai_message.content);
    
    console.log('\n=== 测试完成 ===');
    
  } catch (error) {
    console.error('\n❌ 测试失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('错误:', error.message);
    }
  }
}

testCompleteFlow();