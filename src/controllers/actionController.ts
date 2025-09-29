import { Request, Response } from 'express';
import { ActionModel, ThoughtModel, ActionHistoryModel } from '../models';
import { GenerateActionRequest, CreateActionHistoryRequest, ApiResponse } from '../types';

export const generateAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { thought_id }: GenerateActionRequest = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    if (!thought_id) {
      res.status(400).json({
        success: false,
        error: 'Thought ID is required'
      } as ApiResponse);
      return;
    }

    // Verify the thought exists and belongs to the user
    const thought = await ThoughtModel.findById(thought_id);
    if (!thought) {
      res.status(404).json({
        success: false,
        error: 'Thought not found'
      } as ApiResponse);
      return;
    }

    if (thought.user_id !== userId && req.user?.type !== 'service_account') {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    // Generate action using AI (placeholder implementation)
    const action = await ActionModel.generateForThought(thought_id);

    res.status(201).json({
      success: true,
      data: action
    } as ApiResponse);
  } catch (error) {
    console.error('Error generating action:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate action'
    } as ApiResponse);
  }
};

export const getAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    const action = await ActionModel.findById(id);

    if (!action) {
      res.status(404).json({
        success: false,
        error: 'Action not found'
      } as ApiResponse);
      return;
    }

    // Check if action belongs to user through thought
    const belongsToUser = await ActionModel.belongsToUser(id, userId);
    if (!belongsToUser) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: action
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching action:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch action'
    } as ApiResponse);
  }
};

export const getActionsByThought = async (req: Request, res: Response): Promise<void> => {
  try {
    const { thoughtId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    // Verify the thought exists and belongs to the user
    const thought = await ThoughtModel.findById(thoughtId);
    if (!thought) {
      res.status(404).json({
        success: false,
        error: 'Thought not found'
      } as ApiResponse);
      return;
    }

    if (thought.user_id !== userId && req.user?.type !== 'service_account') {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    const actions = await ActionModel.findByThoughtId(thoughtId);

    res.json({
      success: true,
      data: actions
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching actions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch actions'
    } as ApiResponse);
  }
};

export const updateActionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    if (!status) {
      res.status(400).json({
        success: false,
        error: 'Status is required'
      } as ApiResponse);
      return;
    }

    // Check if action belongs to user
    const belongsToUser = await ActionModel.belongsToUser(id, userId);
    if (!belongsToUser) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    const action = await ActionModel.updateStatus(id, status);

    res.json({
      success: true,
      data: action
    } as ApiResponse);
  } catch (error) {
    console.error('Error updating action status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update action status'
    } as ApiResponse);
  }
};

export const createActionHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: action_id } = req.params;
    const historyData: Omit<CreateActionHistoryRequest, 'action_id'> = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    if (!historyData.final_status) {
      res.status(400).json({
        success: false,
        error: 'Final status is required'
      } as ApiResponse);
      return;
    }

    // Check if action belongs to user
    const belongsToUser = await ActionModel.belongsToUser(action_id, userId);
    if (!belongsToUser) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    // Create the history record
    const historyWithActionId = {
      ...historyData,
      action_id,
      user_id: userId
    };

    const history = await ActionHistoryModel.create(historyWithActionId);

    res.status(201).json({
      success: true,
      data: history
    } as ApiResponse);
  } catch (error) {
    console.error('Error creating action history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create action history'
    } as ApiResponse);
  }
};

export const getActionHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: action_id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    // Check if action belongs to user
    const belongsToUser = await ActionModel.belongsToUser(action_id, userId);
    if (!belongsToUser) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    const history = await ActionHistoryModel.findByActionId(action_id);

    res.json({
      success: true,
      data: history
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching action history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch action history'
    } as ApiResponse);
  }
};