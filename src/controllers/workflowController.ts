import { Request, Response } from 'express';
import { CobeanService } from '../services/cobeanService';
import { ThoughtModel, ActionModel, UserPreferenceModel } from '../models';
import { ApiResponse } from '../types';

/**
 * 分析用户思考和行为的工作流控制器
 */
export const analyzeThoughtAndActions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { thoughtId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '用户未认证'
      } as ApiResponse<null>);
      return;
    }

    if (!thoughtId) {
      res.status(400).json({
        success: false,
        message: '缺少思考ID参数'
      } as ApiResponse<null>);
      return;
    }

    // 获取思考信息
    const thought = await ThoughtModel.findById(thoughtId);
    if (!thought) {
      res.status(404).json({
        success: false,
        message: '思考不存在'
      } as ApiResponse<null>);
      return;
    }

    // 验证思考是否属于当前用户
    if (thought.user_id !== userId) {
      res.status(403).json({
        success: false,
        message: '无权访问此思考'
      } as ApiResponse<null>);
      return;
    }

    // 获取相关的历史行动
    const actions = await ActionModel.findByThoughtId(thoughtId);
    
    // 转换行动数据为工作流所需格式
    const historicalActions = actions.map(action => ({
      details: {
        decision: action.summary || '无决策信息',
        event: action.event || '无事件信息',
        knowledge: '从行动中获得的知识',
        reflection: '对行动的反思'
      },
      summary: action.summary || '行动摘要',
      type: action.type || 'Event'
    }));

    // 获取用户偏好
    const userPreferences = await UserPreferenceModel.findByUserId(userId);
    const preferencesObj = userPreferences.reduce((acc, pref) => {
      acc[pref.preference_key] = pref.score;
      return acc;
    }, {} as any);

    // 调用 Cobean 服务进行分析
    const cobeanService = new CobeanService();
    
    console.log('=== 开始调用 Cobean 分析服务 ===');
    console.log('思考标题:', thought.title);
    console.log('思考描述:', thought.description);
    console.log('历史行动数量:', historicalActions.length);
    console.log('用户偏好:', preferencesObj);

    const analysisResult = await cobeanService.analyzeUserThoughtAndActions(
      thoughtId,
      userId
    );

    console.log('=== 工作流调用完成 ===');
    console.log('工作流结果:', analysisResult);

    res.json({
      success: true,
      message: '工作流分析完成',
      data: {
        thought: {
          id: thought.id,
          title: thought.title,
          description: thought.description
        },
        historicalActions: historicalActions,
        userPreferences: preferencesObj,
        workflowResult: analysisResult
      }
    } as ApiResponse<any>);

  } catch (error) {
    console.error('工作流分析错误:', error);
    res.status(500).json({
      success: false,
      message: '工作流分析失败',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
};

/**
 * 手动触发工作流分析（用于测试）
 */
export const triggerWorkflowAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const { thoughtId, userId } = req.body;

    if (!thoughtId) {
      res.status(400).json({
        success: false,
        message: '缺少思考ID参数'
      } as ApiResponse<null>);
      return;
    }

    if (!userId) {
      res.status(400).json({
        success: false,
        message: '缺少用户ID参数'
      } as ApiResponse<null>);
      return;
    }

    const cobeanService = new CobeanService();
    
    console.log('=== 触发工作流分析 ===');
    console.log('thoughtId:', thoughtId);
    console.log('userId:', userId);

    // 调用分析方法，内部会从数据库获取所需数据
    const workflowResult = await cobeanService.analyzeUserThoughtAndActions(
      thoughtId,
      userId
    );

    console.log('=== 工作流分析完成 ===');
    console.log('工作流结果:', workflowResult);

    res.json({
      success: true,
      message: '工作流分析完成',
      data: {
        thoughtId,
        userId,
        workflowResult: workflowResult
      }
    } as ApiResponse<any>);

  } catch (error) {
    console.error('工作流分析错误:', error);
    res.status(500).json({
      success: false,
      message: '工作流分析失败',
      error: error instanceof Error ? error.message : '未知错误'
    } as ApiResponse<null>);
  }
};