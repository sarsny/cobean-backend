const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// 测试数据 - 使用数据库中的真实数据
const SAT_TOKEN = 'sat_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const REAL_THOUGHT_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const REAL_BEAN_ID = '11111111-2222-3333-4444-555555555555';
const REAL_USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; // 使用数据库中存在的 SAT 用户 ID

// 检查服务器健康状态
async function checkServerHealth() {
  try {
    const response = await axios.post(`${BASE_URL}/chats/with-thought`, {});
    return true;
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 400)) {
      console.log('✓ 服务器正在运行 (返回认证或参数错误)');
      return true;
    }
    console.log('✗ 服务器未启动或无法访问');
    return false;
  }
}

// 测试无认证请求
async function testWithoutAuthentication() {
  try {
    console.log('\n=== 测试无认证请求 ===');
    const response = await axios.post(`${BASE_URL}/chats/with-thought`, {
      thought_id: REAL_THOUGHT_ID,
      bean_id: REAL_BEAN_ID
    });
    console.log('✗ 应该返回 401 错误，但请求成功了');
    console.log('响应:', response.data);
  } catch (error) {
    if (error.response) {
      console.log(`✓ 状态码: ${error.response.status}`);
      console.log(`✓ 错误信息: ${error.response.data.error}`);
    } else {
      console.log('✗ 网络错误:', error.message);
    }
  }
}

// 测试带认证的请求
async function testWithAuthentication() {
  try {
    console.log('\n=== 测试带 SAT Token 认证的请求 ===');
    
    // 测试用例 1: 使用真实数据
    console.log('\n--- 测试用例 1: 使用真实数据 ---');
    const response1 = await axios.post(`${BASE_URL}/chats/with-thought`, {
      thought_id: REAL_THOUGHT_ID,
      bean_id: REAL_BEAN_ID,
      conversation_type: 'thought'
    }, {
      headers: {
        'Authorization': `Bearer ${SAT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✓ 状态码: ${response1.status}`);
    console.log('✓ 响应数据:', JSON.stringify(response1.data, null, 2));
    
    // 测试用例 2: 测试重复创建（应该返回已存在的会话）
    console.log('\n--- 测试用例 2: 测试重复创建 ---');
    const response2 = await axios.post(`${BASE_URL}/chats/with-thought`, {
      thought_id: REAL_THOUGHT_ID,
      bean_id: REAL_BEAN_ID,
      conversation_type: 'thought'
    }, {
      headers: {
        'Authorization': `Bearer ${SAT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✓ 状态码: ${response2.status}`);
    console.log('✓ 响应数据:', JSON.stringify(response2.data, null, 2));
    
    // 测试用例 3: 缺少必需参数
    console.log('\n--- 测试用例 3: 缺少必需参数 ---');
    try {
      const response3 = await axios.post(`${BASE_URL}/chats/with-thought`, {
        thought_id: REAL_THOUGHT_ID
        // 缺少 bean_id
      }, {
        headers: {
          'Authorization': `Bearer ${SAT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✗ 应该返回 400 错误，但请求成功了');
      console.log('响应:', response3.data);
    } catch (error) {
      if (error.response) {
        console.log(`✓ 状态码: ${error.response.status}`);
        console.log(`✓ 错误信息: ${error.response.data.error}`);
      } else {
        console.log('✗ 网络错误:', error.message);
      }
    }
    
    // 测试用例 4: 使用不存在的 thought_id
    console.log('\n--- 测试用例 4: 使用不存在的 thought_id ---');
    try {
      const response4 = await axios.post(`${BASE_URL}/chats/with-thought`, {
        thought_id: '00000000-0000-0000-0000-000000000000',
        bean_id: REAL_BEAN_ID
      }, {
        headers: {
          'Authorization': `Bearer ${SAT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✗ 应该返回 404 错误，但请求成功了');
      console.log('响应:', response4.data);
    } catch (error) {
      if (error.response) {
        console.log(`✓ 状态码: ${error.response.status}`);
        console.log(`✓ 错误信息: ${error.response.data.error}`);
      } else {
        console.log('✗ 网络错误:', error.message);
      }
    }
    
  } catch (error) {
    if (error.response) {
      console.log(`✗ 状态码: ${error.response.status}`);
      console.log(`✗ 错误信息: ${error.response.data.error || error.response.data}`);
    } else {
      console.log('✗ 网络错误:', error.message);
    }
  }
}

// 分析响应状态码
function analyzeStatusCode(statusCode) {
  const statusMessages = {
    200: '成功 - 返回已存在的会话',
    201: '成功 - 创建新会话',
    400: '请求错误 - 缺少必需参数或参数格式错误',
    401: '未认证 - 缺少或无效的访问令牌',
    403: '权限不足 - 用户无权访问该资源',
    404: '未找到 - Thought 不存在',
    500: '服务器内部错误'
  };
  
  return statusMessages[statusCode] || `未知状态码: ${statusCode}`;
}

// 主测试函数
async function runTests() {
  console.log('开始测试 POST /chats/with-thought 接口...\n');
  
  // 检查服务器状态
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    console.log('请先启动开发服务器: npm run dev');
    return;
  }
  
  // 显示测试数据
  console.log('=== 测试数据 ===');
  console.log('SAT Token:', SAT_TOKEN);
  console.log('Real Thought ID:', REAL_THOUGHT_ID);
  console.log('Real Bean ID:', REAL_BEAN_ID);
  console.log('Real User ID:', REAL_USER_ID);
  
  // 运行测试
  await testWithoutAuthentication();
  await testWithAuthentication();
  
  console.log('\n=== 测试完成 ===');
  console.log('\n接口说明:');
  console.log('- 端点: POST /chats/with-thought');
  console.log('- 认证: 需要 SAT Token (Bearer token)');
  console.log('- 必需参数: thought_id, bean_id');
  console.log('- 可选参数: conversation_type (默认为 "thought")');
  console.log('- 功能: 为指定的 thought 创建聊天会话，如果已存在则返回现有会话');
}

// 运行测试
runTests().catch(console.error);