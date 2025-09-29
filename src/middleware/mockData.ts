import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Mock data storage
const mockData = {
  thoughts: new Map(),
  actions: new Map(),
  choices: new Map(),
  actionHistory: new Map(),
  userPreferences: new Map()
};

// Mock Thought operations
export const mockThoughtOperations = {
  create: (req: Request, res: Response) => {
    const { title, description } = req.body;
    const userId = (req as any).user?.id;
    
    const thought = {
      id: uuidv4(),
      user_id: userId,
      title,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockData.thoughts.set(thought.id, thought);
    
    res.status(201).json({
      success: true,
      data: thought
    });
  },

  getAll: (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const userThoughts = Array.from(mockData.thoughts.values())
      .filter(thought => thought.user_id === userId);
    
    res.json({
      success: true,
      data: userThoughts
    });
  },

  getById: (req: Request, res: Response): void => {
    const { id } = req.params;
    const thought = mockData.thoughts.get(id);
    
    if (!thought) {
      res.status(404).json({
        success: false,
        error: 'Thought not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: thought
    });
  },

  update: (req: Request, res: Response): void => {
    const { id } = req.params;
    const { title, description } = req.body;
    const thought = mockData.thoughts.get(id);
    
    if (!thought) {
      res.status(404).json({
        success: false,
        error: 'Thought not found'
      });
      return;
    }
    
    const updatedThought = {
      ...thought,
      title: title || thought.title,
      description: description || thought.description,
      updated_at: new Date().toISOString()
    };
    
    mockData.thoughts.set(id, updatedThought);
    
    res.json({
      success: true,
      data: updatedThought
    });
  },

  delete: (req: Request, res: Response): void => {
    const { id } = req.params;
    const deleted = mockData.thoughts.delete(id);
    
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Thought not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Thought deleted successfully'
    });
  }
};

// Mock Action operations
export const mockActionOperations = {
  generate: (req: Request, res: Response) => {
    const { thought_id, context } = req.body;
    const userId = (req as any).user?.id;
    
    // Mock AI-generated actions
    const mockActions = [
      'Take a 10-minute walk to clear your mind',
      'Write down three positive aspects of this situation',
      'Practice deep breathing for 5 minutes',
      'Call a trusted friend or family member',
      'Create a simple action plan with small steps'
    ];
    
    const action = {
      id: uuidv4(),
      user_id: userId,
      thought_id,
      title: 'AI-Generated Action',
      description: mockActions[Math.floor(Math.random() * mockActions.length)],
      action_type: 'mindfulness',
      status: 'pending',
      context: context || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockData.actions.set(action.id, action);
    
    res.status(201).json({
      success: true,
      data: action
    });
  },

  getAll: (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const userActions = Array.from(mockData.actions.values())
      .filter(action => action.user_id === userId);
    
    res.json({
      success: true,
      data: userActions
    });
  },

  getById: (req: Request, res: Response): void => {
    const { id } = req.params;
    const action = mockData.actions.get(id);
    
    if (!action) {
      res.status(404).json({
        success: false,
        error: 'Action not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: action
    });
  },

  updateStatus: (req: Request, res: Response): void => {
    const { id } = req.params;
    const { status } = req.body;
    const action = mockData.actions.get(id);
    
    if (!action) {
      res.status(404).json({
        success: false,
        error: 'Action not found'
      });
      return;
    }
    
    const updatedAction = {
      ...action,
      status,
      updated_at: new Date().toISOString()
    };
    
    mockData.actions.set(id, updatedAction);
    
    res.json({
      success: true,
      data: updatedAction
    });
  }
};

// Mock Choice operations
export const mockChoiceOperations = {
  create: (req: Request, res: Response) => {
    const { thought_id, action_id, choice_type, selected_option, context } = req.body;
    const userId = (req as any).user?.id;
    
    const choice = {
      id: uuidv4(),
      user_id: userId,
      thought_id,
      action_id,
      choice_type,
      selected_option,
      context: context || null,
      created_at: new Date().toISOString()
    };
    
    mockData.choices.set(choice.id, choice);
    
    res.status(201).json({
      success: true,
      data: choice
    });
  },

  getAll: (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const userChoices = Array.from(mockData.choices.values())
      .filter(choice => choice.user_id === userId);
    
    res.json({
      success: true,
      data: userChoices
    });
  },

  getById: (req: Request, res: Response): void => {
    const { id } = req.params;
    const choice = mockData.choices.get(id);
    
    if (!choice) {
      res.status(404).json({
        success: false,
        error: 'Choice not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: choice
    });
  }
};

// Middleware to enable mock mode
export const enableMockMode = (req: Request, res: Response, next: NextFunction) => {
  // Add mock flag to request
  (req as any).mockMode = true;
  next();
};

// Clear all mock data (useful for testing)
export const clearMockData = () => {
  mockData.thoughts.clear();
  mockData.actions.clear();
  mockData.choices.clear();
  mockData.actionHistory.clear();
  mockData.userPreferences.clear();
};

export default {
  mockThoughtOperations,
  mockActionOperations,
  mockChoiceOperations,
  enableMockMode,
  clearMockData
};