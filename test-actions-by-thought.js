const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// 使用SAT token进行认证
const headers = {
  'Authorization': 'Bearer sat_a6acb66eb1624b938bf11cdc2070c026abcdef1234567890abcdef1234567890abcdef12',
  'Content-Type': 'application/json'
};

async function testGetActionsByThought() {
  console.log('🎯 测试 GET /api/v1/actions/thought/:thoughtId 接口...\n');

  try {
    const thoughtId = 'a6acb66e-b162-4b93-8bf1-1cdc2070c026';
    
    console.log(`📋 获取 thought ${thoughtId} 的所有 actions...`);
    const response = await axios.get(`${BASE_URL}/actions/thought/${thoughtId}`, { headers });
    
    console.log('✅ 接口调用成功！');
    console.log('📊 响应状态:', response.status);
    console.log('📄 响应数据结构:');
    console.log('- success:', response.data.success);
    
    if (response.data.success && response.data.data) {
      const actions = response.data.data;
      
      console.log(`\n⚡ Actions 数据 (共 ${actions.length} 个):`);
      
      if (actions.length > 0) {
        actions.forEach((action, index) => {
          console.log(`\n${index + 1}. Action ID: ${action.id}`);
          console.log(`   Type: ${action.type || 'N/A'}`);
          console.log(`   Summary: ${action.summary || 'N/A'}`);
          console.log(`   Status: ${action.status || 'N/A'}`);
          console.log(`   Event: ${action.event || 'N/A'}`);
          console.log(`   Knowledge: ${action.knowledge || 'N/A'}`);
          console.log(`   Decision: ${action.decision || 'N/A'}`);
          console.log(`   Reflection: ${action.reflection || 'N/A'}`);
          console.log(`   Created: ${action.created_at}`);
          console.log(`   Updated: ${action.updated_at}`);
        });
        
        // 统计不同类型的actions
        const typeStats = {};
        actions.forEach(action => {
          const type = action.type || 'Unknown';
          typeStats[type] = (typeStats[type] || 0) + 1;
        });
        
        console.log('\n📈 Actions 类型统计:');
        Object.entries(typeStats).forEach(([type, count]) => {
          console.log(`   ${type}: ${count} 个`);
        });
        
      } else {
        console.log('- 该 thought 暂无 actions');
      }
      
    } else {
      console.log('❌ 响应数据格式异常:', response.data);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('HTTP状态码:', error.response.status);
    }
    if (error.response?.data) {
      console.error('错误详情:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 运行测试
testGetActionsByThought();
