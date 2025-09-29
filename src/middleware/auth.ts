import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { StringValue } from 'ms';
import { config } from '../config';
import { JWTPayload } from '../types';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// SAT Token validation function
const validateSATToken = (token: string): JWTPayload | null => {
  // Check if SAT tokens are enabled
  if (!config.sat.enabled) {
    return null;
  }

  // SAT tokens start with 'sat_' prefix
  if (!token.startsWith('sat_')) {
    return null;
  }

  // Validate token format
  const satTokenPattern = /^sat_[A-Za-z0-9]{48,}$/;
  if (!satTokenPattern.test(token)) {
    return null;
  }

  // If specific tokens are configured, check against the allowlist
  if (config.sat.allowedTokens.length > 0 && !config.sat.allowedTokens.includes(token)) {
    return null;
  }

  // Extract a pseudo user ID from the SAT token for tracking
  const tokenHash = token.substring(4); // Remove 'sat_' prefix
  // Generate a UUID-like format from the token hash
  const hash8 = tokenHash.substring(0, 8);
  const hash4_1 = tokenHash.substring(8, 12);
  const hash4_2 = tokenHash.substring(12, 16);
  const hash4_3 = tokenHash.substring(16, 20);
  const hash12 = tokenHash.substring(20, 32);
  const pseudoUserId = `${hash8}-${hash4_1}-${hash4_2}-${hash4_3}-${hash12}`;

  return {
    id: pseudoUserId,
    email: `sat-user-${hash8}@service.account`,
    type: 'service_account'
  };
};

// JWT Authentication middleware with SAT token support
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access token is required'
    });
    return;
  }

  // Check if it's a SAT token
  if (token.startsWith('sat_')) {
    const satUser = validateSATToken(token);
    if (!satUser) {
      res.status(403).json({
        success: false,
        error: 'Invalid SAT token'
      });
      return;
    }

    req.user = satUser;
    next();
    return;
  }

  // Handle regular JWT tokens
  jwt.verify(token, config.jwt.secret as string, (err, decoded) => {
    if (err) {
      res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      });
      return;
    }

    req.user = decoded as JWTPayload;
    next();
  });
};

// Mock authentication middleware for development
export const mockAuth = (req: Request, res: Response, next: NextFunction): void => {
  // Mock user for development
  req.user = {
    id: 'mock-user-id',
    email: 'mock@example.com'
  };
  next();
};

// Helper function to generate JWT token
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.expiresIn as StringValue
  };
  return jwt.sign(payload, config.jwt.secret as string, options);
};

// Helper function to extract user ID from request
export const getUserId = (req: Request): string => {
  return req.user?.id || '';
};