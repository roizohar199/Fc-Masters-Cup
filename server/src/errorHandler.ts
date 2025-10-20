import type { Request, Response, NextFunction } from "express";
import { logger } from "./logger.js";

/**
 * Global error handler for API routes
 * Ensures all errors return JSON instead of HTML
 */
export function apiErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Only handle API routes
  if (!req.path.startsWith('/api/')) {
    return next(err);
  }

  logger.error("api", `Error handling ${req.method} ${req.path}`, err);
  
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";
  
  res.status(status).json({ 
    error: message,
    path: req.path,
    method: req.method
  });
}

/**
 * Middleware to ensure API routes that don't exist return JSON 404
 */
export function apiNotFoundHandler(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      error: "API endpoint not found",
      path: req.path,
      method: req.method
    });
  }
  next();
}

