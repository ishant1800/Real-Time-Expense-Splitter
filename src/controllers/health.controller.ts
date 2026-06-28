import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * GET /api/health
 * Returns service availability metrics and system uptime.
 */
export const getHealth = asyncHandler(async (req: Request, res: Response) => {
  const uptimeSeconds = process.uptime();

  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);
  const formattedUptime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: formattedUptime,
    nodeEnv: process.env.NODE_ENV || 'development',
  });
});
