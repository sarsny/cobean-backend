const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// 测试数据
const testData = {
  thoughtId: 'a6acb66e-b162-4b93-8bf1-1cdc2070c026',
  userId: '62f95408-b740-413d-988d-90f3400a70ee'
};

async function testTriggerWorkflowAnalysis() {
  try {
    console.log('=== 测试 triggerWorkflowAnalysis 接口 ===');
    console.log('测试数据:', testData);
    console.log('');

    // 使用测试路由（无需认证）
    const response = await axios.post(`${BASE_URL}/workflow/test`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('=== 响应结果 ===');
    console.log('状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n✅ 工作流分析测试成功！');
      
      if (response.data.data && response.data.data.workflowResult) {
        console.log('\n=== 工作流分析结果详情 ===');
        const workflowResult = response.data.data.workflowResult;
        
        if (workflowResult.actions && workflowResult.actions.length > 0) {
          console.log(`发现 ${workflowResult.actions.length} 个行动建议:`);
          workflowResult.actions.forEach((action, index) => {
            console.log(`${index + 1}. ${action.title || action.name || '未命名行动'}`);
            if (action.description) {
              console.log(`   描述: ${action.description}`);
            }
          });
        }
        
        if (workflowResult.conversationId) {
          console.log(`\n创建的对话ID: ${workflowResult.conversationId}`);
        }
        
        if (workflowResult.message) {
          console.log(`\nAI 分析消息: ${workflowResult.message}`);
        }
      }
    } else {
      console.log('\n❌ 工作流分析测试失败');
    }

  } catch (error) {
    console.error('=== 测试出错 ===');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误响应:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('请求错误:', error.message);
      console.error('请确保服务器正在运行在 http://localhost:3000');
    } else {
      console.error('未知错误:', error.message);
    }
  }
}

// 运行测试
testTriggerWorkflowAnalysis();