import { Request, Response, NextFunction } from 'express';
import { mainPool } from '../utils/pool.utils';

export interface RequestWithUserId extends Request {
  userId?: string;
}

export async function apiKeyMiddleware(req: RequestWithUserId, res: Response, next: NextFunction) {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({ message: 'API key missing' });
    }

    const result = await mainPool.query(
      `SELECT user_id FROM databases WHERE api_key = $1 LIMIT 1`,
      [apiKey]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({ message: 'Invalid API key' });
    }

    // Attach userId to request for downstream usage
    req.userId = result.rows[0].user_id;

    next();
  } catch (error) {
    next(error);
  }
}
