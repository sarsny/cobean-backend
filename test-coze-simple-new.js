const axios = require('axios');

const COZE_BASE_URL = 'https://api.coze.cn';
const COZE_API_KEY = 'sat_X1n9dwCN24G3FKkKBwbEqEpL6pAOOCWbx24lOrRxeAdFvBtZEC7DY5qs7DNBlXyL';
const BOT_ID = '7531406778865549312';

async function testCozeAPI() {
  console.log('🤖 开始测试 Coze API 完整流程...\n');

  try {
    // 1. 创建对话
    console.log('1️⃣ 创建新的对话会话...');
    const conversationResponse = await axios.post(
      `${COZE_BASE_URL}/v1/conversation/create`,
      {
        bot_id: BOT_ID,
        user_id: 'test-user-123'
      },
      {
        headers: {
          'Authorization': `Bearer ${COZE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (conversationResponse.data.code !== 0) {
      throw new Error(`创建对话失败: ${conversationResponse.data.msg}`);
    }

    const conversationId = conversationResponse.data.data.id;
    console.log(`✅ 会话创建成功: ${conversationId}\n`);

    // 2. 发起聊天
    console.log('2️⃣ 发起聊天...');
    const chatResponse = await axios.post(
      `${COZE_BASE_URL}/v1/chat`,
      {
        bot_id: BOT_ID,
        user_id: 'test-user-123',
        conversation_id: conversationId,
        stream: false,
        auto_save_history: true,
        additional_messages: [{
          role: 'user',
          content: '你好，请简单回复一下',
          content_type: 'text'
        }]
      },
      {
        headers: {
          'Authorization': `Bearer ${COZE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (chatResponse.data.code !== 0) {
      throw new Error(`发起聊天失败: ${chatResponse.data.msg}`);
    }

    const chatId = chatResponse.data.data.id;
    console.log(`✅ 聊天发起成功: ${chatId}`);
    console.log(`   状态: ${chatResponse.data.data.status}\n`);

    // 3. 等待一段时间让聊天完成
    console.log('3️⃣ 等待聊天完成...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. 测试状态查询 API
    console.log('4️⃣ 测试状态查询 API...');
    try {
      const statusResponse = await axios.get(
        `${COZE_BASE_URL}/v3/chat/retrieve`,
        {
          params: {
            conversation_id: conversationId,
            chat_id: chatId
          },
          headers: {
            'Authorization': `Bearer ${COZE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`✅ 状态查询成功: ${JSON.stringify(statusResponse.data, null, 2)}\n`);
    } catch (error) {
      console.log(`❌ 状态查询失败: ${error.response?.data?.msg || error.message}\n`);
    }

    // 5. 测试消息列表 API
    console.log('5️⃣ 测试消息列表 API...');
    try {
      const messagesResponse = await axios.get(
        `${COZE_BASE_URL}/v1/conversation/message/list`,
        {
          params: {
            conversation_id: conversationId,
            chat_id: chatId
          },
          headers: {
            'Authorization': `Bearer ${COZE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`✅ 消息列表获取成功: ${JSON.stringify(messagesResponse.data, null, 2)}\n`);
    } catch (error) {
      console.log(`❌ 消息列表获取失败: ${error.response?.data?.msg || error.message}\n`);
    }

    console.log('🎉 测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testCozeAPI();