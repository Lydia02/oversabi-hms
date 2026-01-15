import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors.js';
import { config } from '../config/index.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error in development
  if (config.nodeEnv === 'development') {
    console.error('Error:', err);
  }

  // Handle known operational errors
  if (err instanceof AppError) {
    const response: Record<string, unknown> = {
      success: false,
      message: err.message
    };

    if (err instanceof ValidationError && err.errors.length > 0) {
      response.errors = err.errors;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Firebase errors
  if (err.name === 'FirebaseError') {
    res.status(500).json({
      success: false,
      message: 'Database operation failed',
      error: config.nodeEnv === 'development' ? err.message : undefined
    });
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: config.nodeEnv === 'development' ? err.message : undefined
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
}
