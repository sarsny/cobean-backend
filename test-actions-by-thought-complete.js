const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
const MOCK_BASE_URL = 'http://localhost:3000/api/v1/mock';

async function testActionsWorkflow() {
  console.log('🎯 完整测试 Actions by Thought 工作流程...\n');

  try {
    const thoughtId = 'a6acb66e-b162-4b93-8bf1-1cdc2070c026';
    
    // 1. 先生成一些mock actions
    console.log('📝 步骤1: 生成mock actions...');
    
    const actionTypes = ['Challenge', 'Knowledge', 'Decision', 'Event'];
    const generatedActions = [];
    
    for (let i = 0; i < 3; i++) {
      const actionData = {
        thought_id: thoughtId,
        type: actionTypes[i % actionTypes.length],
        summary: `Test action ${i + 1} for thought ${thoughtId}`,
        event: `Test event ${i + 1}`,
        knowledge: `Test knowledge ${i + 1}`,
        decision: `Test decision ${i + 1}`,
        reflection: `Test reflection ${i + 1}`
      };
      
      try {
        const response = await axios.post(`${MOCK_BASE_URL}/actions/generate`, actionData, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.data.success) {
          generatedActions.push(response.data.data);
          console.log(`✅ 生成 action ${i + 1}: ${response.data.data.id} (${response.data.data.type})`);
        } else {
          console.log(`❌ 生成 action ${i + 1} 失败:`, response.data.error);
        }
      } catch (error) {
        console.log(`❌ 生成 action ${i + 1} 异常:`, error.response?.data || error.message);
      }
    }
    
    console.log(`\n📊 成功生成 ${generatedActions.length} 个 actions\n`);
    
    // 2. 测试获取所有mock actions
    console.log('📋 步骤2: 获取所有mock actions...');
    try {
      const allActionsResponse = await axios.get(`${MOCK_BASE_URL}/actions`, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (allActionsResponse.data.success) {
        console.log(`✅ 获取到 ${allActionsResponse.data.data.length} 个总actions`);
      }
    } catch (error) {
      console.log('❌ 获取所有actions失败:', error.response?.data || error.message);
    }
    
    // 3. 测试通过thought ID获取actions (mock路由)
    console.log(`\n🎯 步骤3: 测试 GET ${MOCK_BASE_URL}/actions/thought/${thoughtId}...`);
    try {
      const response = await axios.get(`${MOCK_BASE_URL}/actions/thought/${thoughtId}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('✅ Mock路由调用成功！');
      console.log('📊 响应状态:', response.status);
      console.log('📄 响应数据:');
      console.log('- success:', response.data.success);
      
      if (response.data.success && response.data.data) {
        const actions = response.data.data;
        console.log(`- actions数量: ${actions.length}`);
        
        if (actions.length > 0) {
          console.log('\n⚡ Actions 详情:');
          actions.forEach((action, index) => {
            console.log(`\n${index + 1}. Action ID: ${action.id}`);
            console.log(`   Thought ID: ${action.thought_id}`);
            console.log(`   Type: ${action.type || 'N/A'}`);
            console.log(`   Summary: ${action.summary || 'N/A'}`);
            console.log(`   Status: ${action.status || 'N/A'}`);
            console.log(`   Created: ${action.created_at}`);
          });
          
          // 统计类型
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
      }
      
    } catch (error) {
      console.error('❌ Mock路由测试失败:', error.response?.data || error.message);
      if (error.response?.status) {
        console.error('HTTP状态码:', error.response.status);
      }
    }
    
    // 4. 对比真实API路由 (会失败，但展示差异)
    console.log(`\n🔍 步骤4: 对比真实API路由 GET ${BASE_URL}/actions/thought/${thoughtId}...`);
    try {
      const response = await axios.get(`${BASE_URL}/actions/thought/${thoughtId}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('✅ 真实API路由调用成功！');
      console.log('📊 响应数据:', response.data);
      
    } catch (error) {
      console.log('❌ 真实API路由失败 (预期):', error.response?.data?.error || error.message);
      console.log('�� 失败原因: 需要认证token');
    }
    
    console.log('\n🎉 测试完成！');
    console.log('📋 总结:');
    console.log(`- Mock路由可用: GET ${MOCK_BASE_URL}/actions/thought/:thoughtId`);
    console.log(`- 真实路由需认证: GET ${BASE_URL}/actions/thought/:thoughtId`);
    console.log(`- 成功生成并获取了 ${generatedActions.length} 个测试actions`);
    
  } catch (error) {
    console.error('❌ 测试流程异常:', error.message);
  }
}

// 运行测试
testActionsWorkflow();
