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

async function testCozeChat() {
  console.log('🤖 开始测试 Coze Agent 对话功能...\n');

  try {
    // 1. 创建会话
    console.log('1️⃣ 创建新的对话会话...');
    const conversationResponse = await axios.post(`${BASE_URL}/coze/conversation`, {}, { headers });
    
    if (!conversationResponse.data.success) {
      throw new Error('创建会话失败');
    }
    
    const { conversation_id, user_id } = conversationResponse.data.data;
    console.log(`✅ 会话创建成功:`);
    console.log(`   - 会话ID: ${conversation_id}`);
    console.log(`   - 用户ID: ${user_id}\n`);

    // 2. 发起对话
    console.log('2️⃣ 向Agent发送消息...');
    const testMessage = '你好，我想了解一下今天的天气如何？';
    console.log(`📝 发送消息: "${testMessage}"`);
    
    const chatResponse = await axios.post(`${BASE_URL}/coze/chat`, {
      message: testMessage,
      conversation_id: conversation_id
    }, { headers });

    if (!chatResponse.data.success) {
      throw new Error('发起对话失败: ' + JSON.stringify(chatResponse.data));
    }

    const chatData = chatResponse.data.data;
    console.log(`✅ 对话发起成功:`);
    console.log(`   - 对话ID: ${chatData.id}`);
    console.log(`   - 状态: ${chatData.status}`);
    console.log(`   - 创建时间: ${new Date(chatData.created_at * 1000).toLocaleString()}\n`);

    // 3. 轮询对话状态
    console.log('3️⃣ 等待Agent回复...');
    let attempts = 0;
    const maxAttempts = 10;
    let finalStatus = null;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`   🔄 检查状态 (${attempts}/${maxAttempts})...`);
      
      try {
        const statusResponse = await axios.get(`${BASE_URL}/coze/chat/status?conversation_id=${conversation_id}&chat_id=${chatData.id}`, { headers });
        
        if (statusResponse.data.success) {
          const status = statusResponse.data.data;
          console.log(`   📊 当前状态: ${status.status}`);
          
          if (status.status === 'completed') {
            finalStatus = status;
            console.log('✅ 对话完成！\n');
            break;
          } else if (status.status === 'failed') {
            console.log('❌ 对话失败\n');
            finalStatus = status;
            break;
          }
        }
      } catch (error) {
        console.log(`   ⚠️  状态检查失败: ${error.message}`);
      }
      
      // 等待2秒后再次检查
      await delay(2000);
    }

    // 4. 获取消息列表
    console.log('4️⃣ 获取对话消息...');
    try {
      const messagesResponse = await axios.get(`${BASE_URL}/coze/chat/messages?conversation_id=${conversation_id}&chat_id=${chatData.id}`, { headers });
      
      if (messagesResponse.data.success) {
        const messages = messagesResponse.data.data;
        console.log(`✅ 获取到 ${messages.length} 条消息:`);
        
        messages.forEach((msg, index) => {
          console.log(`\n📨 消息 ${index + 1}:`);
          console.log(`   - 角色: ${msg.role}`);
          console.log(`   - 类型: ${msg.type}`);
          console.log(`   - 内容: ${msg.content}`);
          console.log(`   - 时间: ${new Date(msg.created_at * 1000).toLocaleString()}`);
        });
      } else {
        console.log('⚠️  获取消息失败:', messagesResponse.data);
      }
    } catch (error) {
      console.log('⚠️  获取消息时出错:', error.message);
    }

    // 5. 测试完整对话流程
    console.log('\n5️⃣ 测试完整对话流程...');
    try {
      const completeResponse = await axios.post(`${BASE_URL}/coze/chat/complete`, {
        message: '请简单介绍一下你自己',
        user_id: user_id
      }, { headers });

      if (completeResponse.data.success) {
        console.log('✅ 完整对话流程测试成功:');
        console.log('📋 响应数据:', JSON.stringify(completeResponse.data.data, null, 2));
      } else {
        console.log('⚠️  完整对话流程失败:', completeResponse.data);
      }
    } catch (error) {
      console.log('⚠️  完整对话流程出错:', error.message);
    }

    console.log('\n🎉 Coze Agent 对话测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
    if (error.response) {
      console.error('📋 错误详情:', error.response.data);
    }
  }
}

// 运行测试
testCozeChat();