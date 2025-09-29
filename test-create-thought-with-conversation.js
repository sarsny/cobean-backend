const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api/v1';

// 测试数据
const testData = {
  // 使用SAT token进行测试
  satToken: 'sat_X1n9dwCN24G3FKkKBwbEqEpL6pAOOCWbx24lOrRxeAdFvBtZEC7DY5qs7DNBlXyL',
  thoughtData: {
    title: '智能助手开发想法',
    description: '我想开发一个能够理解用户需求并提供个性化建议的智能助手。这个智能助手应该能够学习用户的偏好，提供定制化的服务，并且能够处理多种类型的查询',
    is_public: false,
    user_id: 'test-user-123' // SAT token允许指定user_id
  }
};

// 测试创建thought并自动创建conversation和发送初始消息
async function testCreateThoughtWithConversation() {
  try {
    console.log('=== 测试创建thought并自动创建conversation ===');
    console.log('请求数据:', JSON.stringify(testData.thoughtData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/thoughts/with-conversation`, testData.thoughtData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testData.satToken}`
      }
    });

    console.log('✅ 创建成功');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    const { thought, conversation, initial_messages } = response.data.data;
    
    console.log('\n=== 创建结果分析 ===');
    console.log('Thought ID:', thought.id);
    console.log('Thought Title:', thought.title);
    console.log('Conversation ID:', conversation.id);
    console.log('Conversation Type:', conversation.conversation_type);
    console.log('Coze Conversation ID:', conversation.coze_conversation_id);
    
    if (initial_messages) {
      console.log('\n=== 初始消息交互 ===');
      console.log('用户消息:', initial_messages.user_message.content);
      console.log('AI回复:', initial_messages.ai_message.content);
      console.log('AI回复元数据:', initial_messages.ai_message.metadata);
    }
    
    return {
      thoughtId: thought.id,
      conversationId: conversation.id,
      cozeConversationId: conversation.coze_conversation_id
    };

  } catch (error) {
    console.error('❌ 测试失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('网络错误:', error.message);
    }
    return null;
  }
}

// 测试获取thought和conversation数据
async function testGetThoughtWithConversation(thoughtId) {
  try {
    console.log('\n=== 测试获取thought和conversation数据 ===');
    
    const response = await axios.get(`${BASE_URL}/thoughts/${thoughtId}/with-conversation`, {
      headers: {
        'Authorization': `Bearer ${testData.satToken}`
      }
    });

    console.log('✅ 获取成功');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    return response.data.data;

  } catch (error) {
    console.error('❌ 获取失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('网络错误:', error.message);
    }
    return null;
  }
}

// 测试发送后续消息
async function testSendFollowUpMessage(conversationId) {
  try {
    console.log('\n=== 测试发送后续消息 ===');
    
    const messageData = {
      content: '能详细说说这个智能助手的技术实现方案吗？'
    };
    
    const response = await axios.post(`${BASE_URL}/chats/${conversationId}/messages`, messageData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testData.satToken}`
      }
    });

    console.log('✅ 消息发送成功');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    return response.data.data;

  } catch (error) {
    console.error('❌ 消息发送失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('网络错误:', error.message);
    }
    return null;
  }
}

// 主测试流程
async function runTests() {
  console.log('🚀 开始测试创建thought并自动创建conversation功能\n');
  
  // 1. 测试创建thought并自动创建conversation
  const result = await testCreateThoughtWithConversation();
  if (!result) {
    console.log('❌ 主要功能测试失败，停止后续测试');
    return;
  }
  
  // 等待一秒，确保数据已保存
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 2. 测试获取thought和conversation数据
  const thoughtData = await testGetThoughtWithConversation(result.thoughtId);
  if (!thoughtData) {
    console.log('❌ 获取数据测试失败');
    return;
  }
  
  // 3. 测试发送后续消息（如果conversation存在）
  if (result.conversationId) {
    await testSendFollowUpMessage(result.conversationId);
  }
  
  console.log('\n🎉 所有测试完成！');
}

// 运行测试
runTests().catch(console.error);