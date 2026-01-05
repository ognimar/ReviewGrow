import { Request, Response, NextFunction } from 'express';
import { verifyToken, isAdmin } from '../firebase';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    isAdmin: boolean;
  };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      isAdmin: isAdmin(decodedToken.email || ''),
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
