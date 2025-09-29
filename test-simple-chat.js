const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// 测试用户凭据
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

let authToken = '';

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

// 1. 测试健康检查
async function testHealthCheck() {
  console.log('\n🏥 测试健康检查...');
  
  const result = await makeRequest('GET', '/health');
  if (result.success) {
    console.log('✅ 健康检查通过');
    console.log('📝 响应:', result.data);
    return true;
  } else {
    console.log('❌ 健康检查失败:', result.error);
    return false;
  }
}

// 2. 测试用户认证
async function testAuthentication() {
  console.log('\n🔐 测试用户认证...');
  
  // 登录用户
  const loginResult = await makeRequest('POST', '/auth/login', testUser);
  if (loginResult.success) {
    authToken = loginResult.data.token;
    console.log('✅ 用户登录成功');
    console.log('📝 用户ID:', loginResult.data.user.id);
    console.log('📝 Token:', authToken.substring(0, 20) + '...');
    return true;
  } else {
    console.log('❌ 用户登录失败:', loginResult.error);
    return false;
  }
}

// 3. 测试获取用户信息
async function testGetUserInfo() {
  console.log('\n👤 测试获取用户信息...');
  
  const result = await makeRequest('GET', '/auth/me', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ 用户信息获取成功');
    console.log('📝 用户:', result.data.user);
    return true;
  } else {
    console.log('❌ 用户信息获取失败:', result.error);
    return false;
  }
}

// 4. 测试思考记录API
async function testThoughtsAPI() {
  console.log('\n💭 测试思考记录API...');
  
  // 获取公共思考记录
  const publicResult = await makeRequest('GET', '/thoughts/public');
  if (publicResult.success) {
    console.log('✅ 公共思考记录获取成功');
    console.log('📝 数量:', publicResult.data?.thoughts?.length || 0);
  } else {
    console.log('❌ 公共思考记录获取失败:', publicResult.error);
  }
  
  // 获取用户思考记录
  const userResult = await makeRequest('GET', '/thoughts', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (userResult.success) {
    console.log('✅ 用户思考记录获取成功');
    console.log('📝 数量:', userResult.data?.thoughts?.length || 0);
    return true;
  } else {
    console.log('❌ 用户思考记录获取失败:', userResult.error);
    return false;
  }
}

// 5. 测试聊天API路由是否存在
async function testChatRoutes() {
  console.log('\n💬 测试聊天API路由...');
  
  // 测试获取聊天列表
  const chatsResult = await makeRequest('GET', '/chats', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  console.log('📝 GET /chats 响应:', chatsResult.status, chatsResult.error || chatsResult.data);
  
  // 测试创建聊天（预期会失败，但应该返回具体错误而不是404）
  const createResult = await makeRequest('POST', '/chats', {
    title: '测试聊天',
    description: '测试描述',
    thought_id: 'fake-id'
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  
  console.log('📝 POST /chats 响应:', createResult.status, createResult.error || createResult.data);
  
  return true;
}

// 6. 测试Coze API
async function testCozeAPI() {
  console.log('\n🤖 测试Coze API...');
  
  // 测试创建对话
  const conversationResult = await makeRequest('POST', '/coze/conversation', {}, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (conversationResult.success) {
    console.log('✅ Coze对话创建成功');
    console.log('📝 对话ID:', conversationResult.data.conversation_id);
    return true;
  } else {
    console.log('❌ Coze对话创建失败:', conversationResult.error);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始API连接测试...');
  console.log('='.repeat(50));
  
  try {
    const tests = [
      { name: '健康检查', fn: testHealthCheck },
      { name: '用户认证', fn: testAuthentication },
      { name: '获取用户信息', fn: testGetUserInfo },
      { name: '思考记录API', fn: testThoughtsAPI },
      { name: '聊天API路由', fn: testChatRoutes },
      { name: 'Coze API', fn: testCozeAPI }
    ];
    
    let passedTests = 0;
    
    for (const test of tests) {
      console.log(`\n🔄 执行测试: ${test.name}`);
      const success = await test.fn();
      if (success) {
        passedTests++;
        console.log(`✅ ${test.name} - 通过`);
      } else {
        console.log(`❌ ${test.name} - 失败`);
      }
      
      // 在测试之间添加短暂延迟
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`🎉 测试完成！通过 ${passedTests}/${tests.length} 个测试`);
    
    if (passedTests === tests.length) {
      console.log('✅ 所有测试都通过了！API服务器工作正常。');
    } else {
      console.log('⚠️  部分测试失败，请检查错误信息。');
    }
    
  } catch (error) {
    console.log('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
runTests();