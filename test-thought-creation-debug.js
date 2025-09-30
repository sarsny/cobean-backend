const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// 测试用户信息
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

let authToken = null;
let userId = null;

// 通用请求函数
async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      error: error.response?.data?.error || error.message,
      data: error.response?.data
    };
  }
}

// 1. 用户认证
async function authenticateUser() {
  console.log('\n🔐 用户认证...');
  
  // 登录用户
  const loginResult = await makeRequest('POST', '/auth/login', testUser);
  if (loginResult.success) {
    authToken = loginResult.data.token;
    userId = loginResult.data.user.id;
    console.log('✅ 用户登录成功');
    console.log('📝 用户ID:', userId);
    console.log('📝 Token:', authToken.substring(0, 20) + '...');
    return true;
  } else {
    console.log('❌ 用户登录失败:', loginResult.error);
    return false;
  }
}

// 2. 测试直接数据库插入
async function testDirectDatabaseInsert() {
  console.log('\n🗄️ 测试直接数据库插入...');
  
  try {
    // 使用 Supabase 客户端直接插入
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || 'https://vyfbbniyaafjjygnzusn.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZmJibml5YWFmamp5Z256dXNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODUxNjUwMiwiZXhwIjoyMDc0MDkyNTAyfQ.VfuMcewaxVazZB9Hj4K-wzBG7_rJ4nhL0hNx-E0H7wI';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const thoughtData = {
      user_id: userId,
      title: 'Direct DB Test Thought',
      description: 'This is a test thought created directly via Supabase client',
      is_public: false,
      is_collaborative: false,
      tags: []
    };
    
    const { data, error } = await supabase
      .from('thoughts')
      .insert([thoughtData])
      .select()
      .single();
    
    if (error) {
      console.log('❌ 直接数据库插入失败:', error.message);
      console.log('错误详情:', error);
      return false;
    } else {
      console.log('✅ 直接数据库插入成功');
      console.log('📝 Thought ID:', data.id);
      return data.id;
    }
  } catch (error) {
    console.log('❌ 直接数据库插入异常:', error.message);
    return false;
  }
}

// 3. 测试 API 创建
async function testAPICreation() {
  console.log('\n🌐 测试 API 创建...');
  
  const thoughtData = {
    title: 'API Test Thought',
    description: 'This is a test thought created via API',
    user_id: userId
  };
  
  const result = await makeRequest('POST', '/thoughts', thoughtData, authToken);
  
  if (result.success) {
    console.log('✅ API 创建成功');
    console.log('📝 Thought ID:', result.data.data.id);
    return result.data.data.id;
  } else {
    console.log('❌ API 创建失败');
    console.log('状态码:', result.status);
    console.log('错误信息:', result.error);
    console.log('完整响应:', result.data);
    return false;
  }
}

// 4. 检查数据库表结构
async function checkTableStructure() {
  console.log('\n🔍 检查数据库表结构...');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || 'https://vyfbbniyaafjjygnzusn.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZmJibml5YWFmamp5Z256dXNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODUxNjUwMiwiZXhwIjoyMDc0MDkyNTAyfQ.VfuMcewaxVazZB9Hj4K-wzBG7_rJ4nhL0hNx-E0H7wI';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 直接查询 thoughts 表
    const { data: testQuery, error: testError } = await supabase
      .from('thoughts')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('❌ thoughts 表查询失败:', testError.message);
      console.log('错误详情:', testError);
      return false;
    }
    
    console.log('✅ thoughts 表存在且可访问');
    console.log('📋 表中现有记录数:', testQuery.length);
    
    return true;
  } catch (error) {
    console.log('❌ 检查表结构异常:', error.message);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('=== Thought 创建调试测试 ===');
  
  // 1. 用户认证
  const authSuccess = await authenticateUser();
  if (!authSuccess) {
    console.log('\n❌ 测试终止：用户认证失败');
    return;
  }
  
  // 2. 检查数据库表结构
  const tableCheck = await checkTableStructure();
  if (!tableCheck) {
    console.log('\n❌ 测试终止：数据库表检查失败');
    return;
  }
  
  // 3. 测试直接数据库插入
  const directInsertResult = await testDirectDatabaseInsert();
  
  // 4. 测试 API 创建
  const apiCreateResult = await testAPICreation();
  
  console.log('\n=== 测试总结 ===');
  console.log('直接数据库插入:', directInsertResult ? '✅ 成功' : '❌ 失败');
  console.log('API 创建:', apiCreateResult ? '✅ 成功' : '❌ 失败');
  
  if (directInsertResult && !apiCreateResult) {
    console.log('\n💡 分析：数据库层面正常，问题可能在 API 层面');
  } else if (!directInsertResult && !apiCreateResult) {
    console.log('\n💡 分析：问题可能在数据库层面或权限配置');
  } else if (directInsertResult && apiCreateResult) {
    console.log('\n💡 分析：所有测试都通过，问题可能已解决');
  }
}

// 运行测试
runTests().catch(console.error);