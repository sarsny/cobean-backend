import { Request, Response } from 'express';
import { UserChoiceModel, ActionModel, ThoughtModel } from '../models';
import { CreateChoiceRequest, ApiResponse } from '../types';

export const createChoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const choiceData: CreateChoiceRequest = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    if (!choiceData.action_id || !choiceData.choice_type) {
      res.status(400).json({
        success: false,
        error: 'Action ID and choice type are required'
      } as ApiResponse);
      return;
    }

    // Verify the action exists and belongs to the user through thought
    const action = await ActionModel.findById(choiceData.action_id);
    if (!action) {
      res.status(404).json({
        success: false,
        error: 'Action not found'
      } as ApiResponse);
      return;
    }

    // Check if action belongs to user through thought
    const belongsToUser = await ActionModel.belongsToUser(choiceData.action_id, userId);
    if (!belongsToUser) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    // Add user_id to the choice data
    const choiceWithUserId = {
      ...choiceData,
      user_id: userId
    };

    const choice = await UserChoiceModel.create(choiceWithUserId);

    res.status(201).json({
      success: true,
      data: choice
    } as ApiResponse);
  } catch (error) {
    console.error('Error creating choice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create choice'
    } as ApiResponse);
  }
};

export const getChoice = async (req: Request, res: Response): Promise<void> => {
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

    const choice = await UserChoiceModel.findById(id);

    if (!choice) {
      res.status(404).json({
        success: false,
        error: 'Choice not found'
      } as ApiResponse);
      return;
    }

    // Check if choice belongs to user
    if (choice.user_id !== userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: choice
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching choice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch choice'
    } as ApiResponse);
  }
};

export const getChoicesByAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { actionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    // Check if action belongs to user
    const belongsToUser = await ActionModel.belongsToUser(actionId, userId);
    if (!belongsToUser) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    const choices = await UserChoiceModel.findByActionId(actionId);

    res.json({
      success: true,
      data: choices
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching choices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch choices'
    } as ApiResponse);
  }
};

export const getChoicesByThought = async (req: Request, res: Response): Promise<void> => {
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

    const choices = await UserChoiceModel.findByThoughtId(thoughtId);

    res.json({
      success: true,
      data: choices
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching choices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch choices'
    } as ApiResponse);
  }
};

export const getUserChoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    const choices = await UserChoiceModel.findByUserId(userId);

    res.json({
      success: true,
      data: choices
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching user choices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user choices'
    } as ApiResponse);
  }
};

export const updateChoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      } as ApiResponse);
      return;
    }

    // Check if choice belongs to user
    const belongsToUser = await UserChoiceModel.belongsToUser(id, userId);
    if (!belongsToUser) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    const choice = await UserChoiceModel.update(id, updates);

    res.json({
      success: true,
      data: choice
    } as ApiResponse);
  } catch (error) {
    console.error('Error updating choice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update choice'
    } as ApiResponse);
  }
};

export const deleteChoice = async (req: Request, res: Response): Promise<void> => {
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

    // Check if choice belongs to user
    const belongsToUser = await UserChoiceModel.belongsToUser(id, userId);
    if (!belongsToUser) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse);
      return;
    }

    await UserChoiceModel.delete(id);

    res.json({
      success: true,
      message: 'Choice deleted successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error deleting choice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete choice'
    } as ApiResponse);
  }
};