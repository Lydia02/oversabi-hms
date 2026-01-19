import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors.js';
import { config } from '../config/index.js';

interface ErrorResponse {
  success: boolean;
  message: string;
  error?: string;
  errors?: Record<string, string>[];
  code?: string;
  stack?: string;
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error details
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack
  };

  if (config.nodeEnv === 'development') {
    console.error('Error:', errorLog);
  } else {
    // In production, log without stack trace
    console.error('Error:', { ...errorLog, stack: undefined });
  }

  // Handle known operational errors
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      message: err.message
    };

    if (err instanceof ValidationError && err.errors.length > 0) {
      response.errors = err.errors;
    }

    // Add error code for client-side handling
    response.code = getErrorCode(err.statusCode);

    if (config.nodeEnv === 'development') {
      response.stack = err.stack;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token has expired',
      code: 'TOKEN_EXPIRED'
    });
    return;
  }

  // Handle Firebase errors
  if (err.name === 'FirebaseError' || (err as NodeJS.ErrnoException).code?.startsWith('firestore')) {
    const firebaseError = err as NodeJS.ErrnoException;
    let message = 'Database operation failed';
    let statusCode = 500;

    // Handle specific Firebase error codes
    if (firebaseError.code === 'permission-denied') {
      message = 'Access denied';
      statusCode = 403;
    } else if (firebaseError.code === 'not-found') {
      message = 'Resource not found';
      statusCode = 404;
    } else if (firebaseError.code === 'already-exists') {
      message = 'Resource already exists';
      statusCode = 409;
    } else if (firebaseError.code === 'resource-exhausted') {
      message = 'Too many requests. Please try again later.';
      statusCode = 429;
    }

    res.status(statusCode).json({
      success: false,
      message,
      code: 'DATABASE_ERROR',
      error: config.nodeEnv === 'development' ? err.message : undefined
    });
    return;
  }

  // Handle syntax errors (malformed JSON)
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body',
      code: 'INVALID_JSON'
    });
    return;
  }

  // Handle email service errors
  if (err.message?.includes('SMTP') || err.message?.includes('email')) {
    res.status(503).json({
      success: false,
      message: 'Email service temporarily unavailable. Please try again later.',
      code: 'EMAIL_SERVICE_ERROR'
    });
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred. Please try again later.',
    code: 'INTERNAL_ERROR',
    error: config.nodeEnv === 'development' ? err.message : undefined,
    stack: config.nodeEnv === 'development' ? err.stack : undefined
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND'
  });
}

/**
 * Get error code from HTTP status code
 */
function getErrorCode(statusCode: number): string {
  const codes: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'VALIDATION_ERROR',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_ERROR',
    503: 'SERVICE_UNAVAILABLE'
  };
  return codes[statusCode] || 'UNKNOWN_ERROR';
}
