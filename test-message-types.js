const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// 查询最新的消息来验证消息类型处理
async function testMessageTypes() {
  try {
    console.log('=== 验证消息类型处理 ===');
    
    // 查询execution对话中的消息
    const conversationId = '4057115f-010c-4160-a6dd-19b9a82786ab';
    
    const response = await axios.get(`${BASE_URL}/chats/${conversationId}/messages`, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MmY5NTQwOC1iNzQwLTQxM2QtOTg4ZC05MGYzNDAwYTcwZWUiLCJpYXQiOjE3Mjc2MTU0MjEsImV4cCI6MTcyNzYxOTAyMX0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
      }
    });

    if (response.data.success && response.data.data) {
      const messages = response.data.data;
      console.log(`\n找到 ${messages.length} 条消息`);
      
      let actionCount = 0;
      let textCount = 0;
      let otherCount = 0;
      
      console.log('\n=== 消息类型分析 ===');
      messages.slice(0, 10).forEach((message, index) => {
        const messageType = message.metadata?.message_type || 'unknown';
        const hasAction = message.metadata?.action_data ? '✓' : '✗';
        const hasMessage = message.metadata?.message_data ? '✓' : '✗';
        
        console.log(`\n${index + 1}. 消息ID: ${message.id}`);
        console.log(`   类型: ${messageType}`);
        console.log(`   发送者: ${message.sender}`);
        console.log(`   包含action字段: ${hasAction}`);
        console.log(`   包含message字段: ${hasMessage}`);
        console.log(`   内容预览: ${message.content.substring(0, 50)}...`);
        console.log(`   创建时间: ${message.created_at}`);
        
        if (messageType === 'action') actionCount++;
        else if (messageType === 'text') textCount++;
        else otherCount++;
      });
      
      console.log('\n=== 统计结果 ===');
      console.log(`Action类型消息: ${actionCount} 条`);
      console.log(`Text类型消息: ${textCount} 条`);
      console.log(`其他类型消息: ${otherCount} 条`);
      
      // 显示一个action类型消息的详细信息
      const actionMessage = messages.find(m => m.metadata?.message_type === 'action');
      if (actionMessage) {
        console.log('\n=== Action类型消息示例 ===');
        console.log('消息内容:', actionMessage.content);
        console.log('Action数据:', actionMessage.metadata.action_data);
        console.log('原始数据:', JSON.stringify(actionMessage.metadata.original_data, null, 2));
      }
      
      // 显示一个text类型消息的详细信息
      const textMessage = messages.find(m => m.metadata?.message_type === 'text');
      if (textMessage) {
        console.log('\n=== Text类型消息示例 ===');
        console.log('消息内容:', textMessage.content);
        if (textMessage.metadata.message_data) {
          console.log('Message数据:', textMessage.metadata.message_data);
        }
      }
      
    } else {
      console.log('❌ 获取消息失败');
    }

  } catch (error) {
    console.error('=== 测试出错 ===');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误响应:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('错误:', error.message);
    }
  }
}

// 运行测试
testMessageTypes();