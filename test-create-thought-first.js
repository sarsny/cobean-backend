const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api/v1';

// 测试数据
const testData = {
  // 使用SAT token进行测试（Service Account Token）
  satToken: 'sat_' + 'a'.repeat(48), // 生成一个符合格式的SAT token
  // 创建thought的数据
  thoughtData: {
    title: '测试想法标题',
    description: '这是测试想法的描述',
    stage: 'idea', // 添加stage字段
    is_public: false,
    is_collaborative: false,
    tags: ['test', 'api']
  }
};

// 步骤1: 创建一个thought
async function createThought() {
  try {
    console.log('=== 步骤1: 创建测试想法 ===');
    console.log('请求数据:', JSON.stringify(testData.thoughtData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/thoughts`, testData.thoughtData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testData.satToken}`
      }
    });

    console.log('✅ 想法创建成功');
    console.log('想法ID:', response.data.data.id);
    return response.data.data.id;

  } catch (error) {
    console.error('❌ 创建想法失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('网络错误:', error.message);
    }
    return null;
  }
}

// 步骤2: 使用真实的thought_id创建聊天
async function createChatWithThought(thoughtId) {
  try {
    console.log('\n=== 步骤2: 创建聊天会话 ===');
    
    const chatData = {
      thought_id: thoughtId,
      bean_id: 'test-bean-id-456',
      conversation_type: 'thought'
    };
    
    console.log('请求数据:', JSON.stringify(chatData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/chats/with-thought`, chatData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testData.satToken}`
      }
    });

    console.log('✅ 聊天会话创建成功');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    return response.data.data;

  } catch (error) {
    console.error('❌ 创建聊天会话失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('网络错误:', error.message);
    }
    return null;
  }
}

// 步骤3: 测试重复创建（应该返回现有的聊天）
async function testDuplicateChat(thoughtId) {
  try {
    console.log('\n=== 步骤3: 测试重复创建聊天 ===');
    
    const chatData = {
      thought_id: thoughtId,
      bean_id: 'test-bean-id-456',
      conversation_type: 'thought'
    };
    
    const response = await axios.post(`${BASE_URL}/chats/with-thought`, chatData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testData.satToken}`
      }
    });

    console.log('✅ 重复创建测试成功（应该返回现有聊天）');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ 重复创建测试失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('网络错误:', error.message);
    }
  }
}

// 主测试函数
async function runCompleteTest() {
  console.log('开始完整的 POST /chats/with-thought 接口测试...\n');
  
  // 步骤1: 创建想法
  const thoughtId = await createThought();
  if (!thoughtId) {
    console.log('无法创建想法，测试终止');
    return;
  }

  // 步骤2: 创建聊天
  const chat = await createChatWithThought(thoughtId);
  if (!chat) {
    console.log('无法创建聊天，测试终止');
    return;
  }

  // 步骤3: 测试重复创建
  await testDuplicateChat(thoughtId);
  
  console.log('\n✅ 完整测试完成！');
  console.log('总结:');
  console.log('- 想法ID:', thoughtId);
  console.log('- 聊天ID:', chat.id);
  console.log('- 会话类型:', chat.conversation_type);
}

// 运行测试
runCompleteTest().catch(console.error);