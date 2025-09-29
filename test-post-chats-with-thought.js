const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api/v1';

// 测试数据
const testData = {
  // 使用SAT token进行测试（Service Account Token）
  satToken: 'sat_' + 'a'.repeat(48), // 生成一个符合格式的SAT token
  // 测试请求体数据
  requestBody: {
    thought_id: 'test-thought-id-123',  // 修正字段名
    bean_id: 'test-bean-id-456',        // 添加必需的bean_id
    message: '我想和这个想法聊聊',
    conversation_type: 'thought',        // 添加会话类型
    metadata: {
      source: 'test',
      timestamp: new Date().toISOString()
    }
  }
};

// 检查服务器状态
async function checkServerHealth() {
  try {
    // 直接测试目标接口来检查服务器状态
    const response = await axios.post(`${BASE_URL}/chats/with-thought`, {}, {
      validateStatus: () => true // 接受所有状态码
    });
    
    if (response.status === 404) {
      console.log('❌ 服务器未启动或路由不存在');
      return false;
    }
    
    console.log('✅ 服务器正在运行');
    return true;
  } catch (error) {
    console.log('❌ 无法连接到服务器:', error.message);
    return false;
  }
}

// 测试无认证的请求
async function testWithoutAuthentication() {
  try {
    console.log('\n=== 测试 POST /chats/with-thought 接口（无认证） ===');
    console.log('发送请求到:', `${BASE_URL}/chats/with-thought`);
    console.log('请求体:', JSON.stringify(testData.requestBody, null, 2));
    
    const response = await axios.post(`${BASE_URL}/chats/with-thought`, testData.requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n=== 请求成功 ===');
    console.log('状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('\n=== 请求失败 ===');
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('错误信息:', error.response.data);
      
      // 分析错误类型
      switch (error.response.status) {
        case 401:
          console.log('🔐 需要认证token');
          break;
        case 403:
          console.log('🚫 权限不足');
          break;
        case 404:
          console.log('❓ 路由不存在');
          break;
        case 422:
          console.log('📝 请求参数验证失败');
          break;
        case 500:
          console.log('💥 服务器内部错误');
          break;
        default:
          console.log('❌ 其他错误');
      }
    } else {
      console.log('网络错误:', error.message);
    }
  }
}

// 测试带认证的请求
async function testWithAuthentication() {
  try {
    console.log('\n=== 测试带SAT Token认证的请求 ===');
    console.log('使用SAT Token:', testData.satToken);
    console.log('请求体:', JSON.stringify(testData.requestBody, null, 2));
    
    const response = await axios.post(`${BASE_URL}/chats/with-thought`, testData.requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testData.satToken}`
      }
    });

    console.log('认证请求成功:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('认证请求失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
      
      // 分析错误类型
      switch (error.response.status) {
        case 400:
          console.log('📝 请求参数错误');
          break;
        case 403:
          console.log('🚫 Token无效或过期');
          break;
        case 422:
          console.log('📋 数据验证失败');
          break;
        case 500:
          console.log('💥 服务器内部错误');
          break;
        default:
          console.log('❌ 其他错误');
      }
    } else {
      console.error('网络错误:', error.message);
    }
  }
}

// 测试不同的请求体数据
async function testWithDifferentData() {
  const testCases = [
    {
      name: '最小必需数据',
      data: {
        thought_id: 'minimal-thought-id',
        bean_id: 'minimal-bean-id'
      }
    },
    {
      name: '完整数据',
      data: {
        thought_id: 'full-thought-id-456',
        bean_id: 'full-bean-id-789',
        message: '这是一个完整的测试消息',
        conversation_type: 'thought',
        metadata: {
          source: 'mobile_app',
          version: '1.0.0',
          timestamp: new Date().toISOString()
        }
      }
    },
    {
      name: '空数据',
      data: {}
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n=== 测试${testCase.name} ===`);
      console.log('请求数据:', JSON.stringify(testCase.data, null, 2));
      
      const response = await axios.post(`${BASE_URL}/chats/with-thought`, testCase.data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testData.satToken}`
        }
      });

      console.log('✅ 成功 - 状态码:', response.status);
      console.log('响应:', JSON.stringify(response.data, null, 2));

    } catch (error) {
      console.log('❌ 失败 - 状态码:', error.response?.status || 'N/A');
      console.log('错误:', error.response?.data || error.message);
    }
  }
}

// 主测试函数
async function runTests() {
  console.log('开始测试 POST /chats/with-thought 接口...\n');
  
  // 检查服务器状态
  const serverRunning = await checkServerHealth();
  if (!serverRunning) {
    console.log('请先启动服务器: npm run dev');
    return;
  }

  // 运行测试
  await testWithoutAuthentication();
  await testWithAuthentication();
  await testWithDifferentData();
  
  console.log('\n测试完成！');
}

// 运行测试
runTests().catch(console.error);