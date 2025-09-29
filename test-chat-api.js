const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// 测试用户凭据
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

let authToken = '';
let thoughtId = '';
let chatId = '';

// 辅助函数：发送请求
async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
}

// 1. 用户注册/登录
async function authenticateUser() {
  console.log('\n🔐 测试用户认证...');
  
  // 尝试注册用户
  const registerResult = await makeRequest('POST', '/auth/register', testUser);
  if (registerResult.success) {
    console.log('✅ 用户注册成功');
  } else if (registerResult.status === 400) {
    console.log('ℹ️  用户已存在，尝试登录');
  }
  
  // 登录用户
  const loginResult = await makeRequest('POST', '/auth/login', testUser);
  if (loginResult.success) {
    authToken = loginResult.data.token;
    console.log('✅ 用户登录成功');
    console.log('📝 Token:', authToken.substring(0, 20) + '...');
    return true;
  } else {
    console.log('❌ 用户登录失败:', loginResult.error);
    return false;
  }
}

// 2. 创建思考记录
async function createThought() {
  console.log('\n💭 测试创建思考记录...');
  
  const thoughtData = {
    title: '聊天机器人开发想法',
    description: '探索如何创建一个智能聊天机器人',
    content: '我想要创建一个聊天机器人来帮助用户解答问题',
    category: 'technology',
    is_public: false
  };
  
  const result = await makeRequest('POST', '/thoughts', thoughtData, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    thoughtId = result.data.thought.id;
    console.log('✅ 思考记录创建成功');
    console.log('📝 Thought ID:', thoughtId);
    console.log('📝 Thought Content:', result.data.thought.content);
    return true;
  } else {
    console.log('❌ 思考记录创建失败:', result.error);
    return false;
  }
}

// 3. 创建聊天
async function createChat() {
  console.log('\n💬 测试创建聊天...');
  
  const chatData = {
    title: '测试聊天会话',
    description: '这是一个测试聊天会话',
    thought_id: thoughtId
  };
  
  const result = await makeRequest('POST', '/chats', chatData, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    chatId = result.data.chat.id;
    console.log('✅ 聊天创建成功');
    console.log('📝 Chat ID:', chatId);
    console.log('📝 Chat Title:', result.data.chat.title);
    return true;
  } else {
    console.log('❌ 聊天创建失败:', result.error);
    return false;
  }
}

// 3. 发送消息
async function sendMessage() {
  console.log('\n📤 测试发送消息...');
  
  const messageData = {
    content: '你好！这是一条测试消息。请简单回复一下。',
    type: 'text'
  };
  
  const result = await makeRequest('POST', `/chats/${chatId}/messages`, messageData, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ 消息发送成功');
    console.log('📝 User Message:', result.data.userMessage.content);
    console.log('📝 AI Response:', result.data.aiResponse.content);
    return true;
  } else {
    console.log('❌ 消息发送失败:', result.error);
    return false;
  }
}

// 4. 获取聊天消息
async function getChatMessages() {
  console.log('\n📥 测试获取聊天消息...');
  
  const result = await makeRequest('GET', `/chats/${chatId}/messages?page=1&limit=10`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ 消息获取成功');
    console.log('📝 消息数量:', result.data.messages.length);
    console.log('📝 总数:', result.data.total);
    console.log('📝 分页信息:', {
      page: result.data.page,
      limit: result.data.limit,
      totalPages: result.data.totalPages
    });
    
    // 显示最近的几条消息
    result.data.messages.slice(0, 3).forEach((msg, index) => {
      console.log(`📝 消息 ${index + 1}: [${msg.sender}] ${msg.content.substring(0, 50)}...`);
    });
    return true;
  } else {
    console.log('❌ 消息获取失败:', result.error);
    return false;
  }
}

// 5. 获取用户聊天列表
async function getUserChats() {
  console.log('\n📋 测试获取用户聊天列表...');
  
  const result = await makeRequest('GET', '/chats', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ 聊天列表获取成功');
    console.log('📝 聊天数量:', result.data.chats.length);
    
    result.data.chats.forEach((chat, index) => {
      console.log(`📝 聊天 ${index + 1}: ${chat.title} (${chat.message_count} 条消息)`);
    });
    return true;
  } else {
    console.log('❌ 聊天列表获取失败:', result.error);
    return false;
  }
}

// 6. 获取特定聊天详情
async function getChatDetails() {
  console.log('\n🔍 测试获取聊天详情...');
  
  const result = await makeRequest('GET', `/chats/${chatId}`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ 聊天详情获取成功');
    console.log('📝 聊天标题:', result.data.chat.title);
    console.log('📝 聊天描述:', result.data.chat.description);
    console.log('📝 消息数量:', result.data.chat.message_count);
    console.log('📝 创建时间:', result.data.chat.created_at);
    return true;
  } else {
    console.log('❌ 聊天详情获取失败:', result.error);
    return false;
  }
}

// 7. 发送第二条消息测试对话连续性
async function sendSecondMessage() {
  console.log('\n📤 测试发送第二条消息...');
  
  const messageData = {
    content: '请告诉我今天的天气如何？',
    type: 'text'
  };
  
  const result = await makeRequest('POST', `/chats/${chatId}/messages`, messageData, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ 第二条消息发送成功');
    console.log('📝 User Message:', result.data.userMessage.content);
    console.log('📝 AI Response:', result.data.aiResponse.content);
    return true;
  } else {
    console.log('❌ 第二条消息发送失败:', result.error);
    return false;
  }
}

// 8. 删除聊天（可选）
async function deleteChat() {
  console.log('\n🗑️  测试删除聊天...');
  
  const result = await makeRequest('DELETE', `/chats/${chatId}`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ 聊天删除成功');
    return true;
  } else {
    console.log('❌ 聊天删除失败:', result.error);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试 Chat API...');
  console.log('='.repeat(50));
  
  try {
    // 执行测试步骤
    const steps = [
      { name: '用户认证', fn: authenticateUser },
      { name: '创建思考记录', fn: createThought },
      { name: '创建聊天', fn: createChat },
      { name: '发送消息', fn: sendMessage },
      { name: '获取聊天消息', fn: getChatMessages },
      { name: '获取用户聊天列表', fn: getUserChats },
      { name: '获取聊天详情', fn: getChatDetails },
      { name: '发送第二条消息', fn: sendSecondMessage },
      { name: '再次获取聊天消息', fn: getChatMessages }
      // 注释掉删除测试，保留数据用于检查
      // { name: '删除聊天', fn: deleteChat }
    ];
    
    let passedTests = 0;
    
    for (const step of steps) {
      const success = await step.fn();
      if (success) {
        passedTests++;
      }
      
      // 在步骤之间添加短暂延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`🎉 测试完成！通过 ${passedTests}/${steps.length} 个测试`);
    
    if (passedTests === steps.length) {
      console.log('✅ 所有测试都通过了！Chat API 工作正常。');
    } else {
      console.log('⚠️  部分测试失败，请检查错误信息。');
    }
    
  } catch (error) {
    console.log('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
runTests();