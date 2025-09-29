import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

// Validation helper functions
export const validateRequired = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields: string[] = [];
    
    for (const field of fields) {
      if (!req.body[field] || (typeof req.body[field] === 'string' && req.body[field].trim() === '')) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      };
      res.status(400).json(response);
      return;
    }
    
    next();
  };
};

export const validateEmail = (field: string = 'email') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const email = req.body[field];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Invalid email format for field: ${field}`
      };
      res.status(400).json(response);
      return;
    }
    
    next();
  };
};

export const validateStringLength = (field: string, minLength: number = 1, maxLength: number = 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.body[field];
    
    if (value && typeof value === 'string') {
      if (value.length < minLength || value.length > maxLength) {
        const response: ApiResponse<null> = {
          success: false,
          error: `Field '${field}' must be between ${minLength} and ${maxLength} characters`
        };
        res.status(400).json(response);
        return;
      }
    }
    
    next();
  };
};

export const validateArray = (field: string, minItems: number = 0, maxItems: number = 100) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.body[field];
    
    if (value && Array.isArray(value)) {
      if (value.length < minItems || value.length > maxItems) {
        const response: ApiResponse<null> = {
          success: false,
          error: `Field '${field}' must contain between ${minItems} and ${maxItems} items`
        };
        res.status(400).json(response);
        return;
      }
    }
    
    next();
  };
};

export const validateEnum = (field: string, allowedValues: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.body[field];
    
    if (value && !allowedValues.includes(value)) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Field '${field}' must be one of: ${allowedValues.join(', ')}`
      };
      res.status(400).json(response);
      return;
    }
    
    next();
  };
};

export const validateUUID = (field: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.body[field] || req.params[field];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (value && !uuidRegex.test(value)) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Invalid UUID format for field: ${field}`
      };
      res.status(400).json(response);
      return;
    }
    
    next();
  };
};

// Sanitization helpers
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  const sanitizeString = (str: string): string => {
    return str.trim().replace(/[<>]/g, '');
  };
  
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };
  
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  next();
};

// Composite validation functions for specific endpoints
export const validateCreateThought = [
  sanitizeInput,
  validateRequired(['title', 'description']),
  validateStringLength('title', 1, 200),
  validateStringLength('description', 1, 2000)
];

export const validateGenerateAction = [
  sanitizeInput,
  validateRequired(['thought_id']),
  validateUUID('thought_id'),
  validateStringLength('context', 0, 1000),
  validateArray('preferences', 0, 10)
];

export const validateCreateChoice = [
  sanitizeInput,
  validateRequired(['action_id', 'thought_id', 'choice_type', 'selected_option']),
  validateUUID('action_id'),
  validateUUID('thought_id'),
  validateEnum('choice_type', ['action_selection', 'preference', 'rating', 'custom']),
  validateStringLength('selected_option', 1, 500),
  validateArray('available_options', 0, 20),
  validateStringLength('context', 0, 1000)
];

export const validateUpdateActionStatus = [
  sanitizeInput,
  validateRequired(['status']),
  validateEnum('status', ['pending', 'in_progress', 'completed', 'cancelled'])
];

export const validateCreateActionHistory = [
  sanitizeInput,
  validateRequired(['action_id', 'status_change']),
  validateUUID('action_id'),
  validateStringLength('status_change', 1, 100),
  validateStringLength('notes', 0, 1000)
];

export const validateUpdateThought = [
  sanitizeInput,
  validateStringLength('title', 1, 200),
  validateStringLength('description', 1, 2000)
];

export const validateUpdateChoice = [
  sanitizeInput,
  validateStringLength('selected_option', 1, 500),
  validateArray('available_options', 0, 20),
  validateStringLength('context', 0, 1000)
];