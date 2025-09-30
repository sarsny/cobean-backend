const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
const MOCK_BASE_URL = 'http://localhost:3000/api/v1/mock';

// 使用SAT token进行认证
const headers = {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYTZhY2I2NmUtYjE2Mi00YjkzLThiZjEtMWNkYzIwNzBjMDI2IiwidHlwZSI6InNlcnZpY2VfYWNjb3VudCIsImlhdCI6MTczNzM2NzE5MX0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8',
  'Content-Type': 'application/json'
};

async function testThoughtContext() {
  console.log('🔍 测试 GET /api/v1/thoughts/:id/context 接口...\n');

  try {
    const thoughtId = 'a6acb66e-b162-4b93-8bf1-1cdc2070c026';
    
    console.log(`📋 获取 thought ${thoughtId} 的上下文信息...`);
    const response = await axios.get(`${BASE_URL}/thoughts/${thoughtId}/context`, { headers });
    
    console.log('✅ 接口调用成功！');
    console.log('📊 响应状态:', response.status);
    console.log('📄 响应数据结构:');
    console.log('- success:', response.data.success);
    
    if (response.data.success && response.data.data) {
      const context = response.data.data;
      
      console.log('\n🎯 Thought 信息:');
      console.log('- ID:', context.thought?.id);
      console.log('- Title:', context.thought?.title);
      console.log('- Description:', context.thought?.description);
      console.log('- Stage:', context.thought?.stage);
      console.log('- Created:', context.thought?.created_at);
      
      console.log('\n⚡ Current Actions:');
      if (context.current_actions && context.current_actions.length > 0) {
        console.log(`- 找到 ${context.current_actions.length} 个当前行动:`);
        context.current_actions.forEach((action, index) => {
          console.log(`  ${index + 1}. ID: ${action.id}`);
          console.log(`     Summary: ${action.summary || 'N/A'}`);
          console.log(`     Status: ${action.status || 'N/A'}`);
          console.log(`     Event: ${action.event || 'N/A'}`);
          console.log(`     Created: ${action.created_at}`);
        });
      } else {
        console.log('- 暂无当前行动');
      }
      
      console.log('\n🎲 User Choices:');
      if (context.choices && context.choices.length > 0) {
        console.log(`- 找到 ${context.choices.length} 个用户选择:`);
        context.choices.forEach((choice, index) => {
          console.log(`  ${index + 1}. ID: ${choice.id}`);
          console.log(`     Choice: ${choice.choice_text || 'N/A'}`);
          console.log(`     Created: ${choice.created_at}`);
        });
      } else {
        console.log('- 暂无用户选择');
      }
      
      console.log('\n⚙️ User Preferences:');
      if (context.preferences && context.preferences.length > 0) {
        console.log(`- 找到 ${context.preferences.length} 个用户偏好:`);
        context.preferences.forEach((pref, index) => {
          console.log(`  ${index + 1}. Key: ${pref.preference_key}`);
          console.log(`     Value: ${pref.preference_value}`);
          console.log(`     Created: ${pref.created_at}`);
        });
      } else {
        console.log('- 暂无用户偏好');
      }
      
    } else {
      console.log('❌ 响应数据格式异常:', response.data);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('HTTP状态码:', error.response.status);
    }
  }
}

// 运行测试
testThoughtContext();
