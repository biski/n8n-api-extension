import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

// Simple token - should be stored in environment variable
const API_TOKEN = process.env.API_TOKEN || 'your-secret-token-here';

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ 
            success: false,
            error: 'Missing authorization header. Use: Authorization: Bearer YOUR_TOKEN' 
        });
    }

    // Extract token from "Bearer TOKEN" format
    const token = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : authHeader;

    if (token !== API_TOKEN) {
        return res.status(401).json({ 
            success: false,
            error: 'Invalid authorization token' 
        });
    }

    // Attach user info to request
    req.user = { id: 'api-user' };
    next();
}