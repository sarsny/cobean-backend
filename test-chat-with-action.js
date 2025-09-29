const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api/v1';
const SAT_TOKEN = 'sat_X1n9dwCN24G3FKkKBwbEqEpL6pAOOCWbx24lOrRxeAdFvBtZEC7DY5qs7DNBlXyL';

// 请求头配置
const headers = {
  'Authorization': `Bearer ${SAT_TOKEN}`,
  'Content-Type': 'application/json'
};

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 测试数据
let testData = {
  thoughtId: null,
  chatId: null,
  actionId: null
};

// 1. 创建测试thought
async function createTestThought() {
  try {
    console.log('\n🔵 创建测试thought...');
    const response = await axios.post(`${BASE_URL}/thoughts`, {
      title: '测试chatWithAction功能',
      description: '这是一个用于测试chatWithAction接口的thought',
      content: '详细内容：测试chatWithAction接口的功能和上下文拼接',
      is_public: false
    }, { headers });
    
    testData.thoughtId = response.data.data.id;
    console.log('✅ Thought创建成功:', testData.thoughtId);
    return response.data.data;
  } catch (error) {
    console.error('❌ 创建thought失败:', error.response?.data || error.message);
    throw error;
  }
}

// 2. 为thought生成action
async function generateTestAction() {
  try {
    console.log('\n🔵 为thought生成action...');
    const response = await axios.post(`${BASE_URL}/actions/generate`, {
      thought_id: testData.thoughtId,
      context: '需要为这个thought创建一些行动计划'
    }, { headers });
    
    testData.actionId = response.data.data.id;
    console.log('✅ Action生成成功:', testData.actionId);
    return response.data.data;
  } catch (error) {
    console.error('❌ 生成action失败:', error.response?.data || error.message);
    throw error;
  }
}

// 3. 创建chat
async function createTestChat() {
  try {
    console.log('\n🔵 创建chat...');
    const response = await axios.post(`${BASE_URL}/chats`, {
      thought_id: testData.thoughtId,
      bean_id: 'test-bean-id'
    }, { headers });
    
    testData.chatId = response.data.data.id;
    console.log('✅ Chat创建成功:', testData.chatId);
    return response.data.data;
  } catch (error) {
    console.error('❌ 创建chat失败:', error.response?.data || error.message);
    throw error;
  }
}

// 4. 测试普通sendMessage
async function testNormalSendMessage() {
  try {
    console.log('\n🔵 测试普通sendMessage...');
    const response = await axios.post(`${BASE_URL}/chats/${testData.chatId}/messages`, {
      content: '这是一条普通的消息，没有action上下文'
    }, { headers });
    
    console.log('✅ 普通消息发送成功');
    console.log('用户消息:', response.data.data.user_message.content);
    console.log('AI回复:', response.data.data.ai_message.content);
    return response.data.data;
  } catch (error) {
    console.error('❌ 普通消息发送失败:', error.response?.data || error.message);
    throw error;
  }
}

// 5. 测试chatWithAction
async function testChatWithAction() {
  try {
    console.log('\n🔵 测试chatWithAction...');
    const response = await axios.post(`${BASE_URL}/chats/${testData.chatId}/messages/with-action`, {
      content: '请根据相关的actions给我一些建议',
      thought_id: testData.thoughtId
    }, { headers });
    
    console.log('✅ ChatWithAction消息发送成功');
    console.log('用户消息:', response.data.data.user_message.content);
    console.log('AI回复:', response.data.data.ai_message.content);
    return response.data.data;
  } catch (error) {
    console.error('❌ ChatWithAction消息发送失败:', error.response?.data || error.message);
    throw error;
  }
}

// 6. 清理测试数据
async function cleanup() {
  try {
    console.log('\n🔵 清理测试数据...');
    
    // 删除chat
    if (testData.chatId) {
      await axios.delete(`${BASE_URL}/chats/${testData.chatId}`, { headers });
      console.log('✅ Chat删除成功');
    }
    
    // 删除thought
    if (testData.thoughtId) {
      await axios.delete(`${BASE_URL}/thoughts/${testData.thoughtId}`, { headers });
      console.log('✅ Thought删除成功');
    }
    
  } catch (error) {
    console.error('❌ 清理失败:', error.response?.data || error.message);
  }
}

// 主测试函数
async function runTests() {
  try {
    console.log('🚀 开始测试chatWithAction接口...\n');
    
    // 创建测试数据
    await createTestThought();
    await delay(1000);
    
    await generateTestAction();
    await delay(1000);
    
    await createTestChat();
    await delay(1000);
    
    // 测试接口
    await testNormalSendMessage();
    await delay(2000);
    
    await testChatWithAction();
    await delay(2000);
    
    console.log('\n🎉 所有测试完成！');
    
  } catch (error) {
    console.error('\n💥 测试失败:', error.message);
  } finally {
    // 清理测试数据
    await cleanup();
  }
}

// 运行测试
runTests();