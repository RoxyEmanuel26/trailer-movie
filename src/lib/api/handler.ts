import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from './response';
import { AppError } from '../errors';
import { ZodError } from 'zod';
import { rateLimit } from '../security/rateLimiter';
import { Prisma } from '@prisma/client';
import { logger } from '../logger';

type ApiHandler<T = any> = (
  request: NextRequest,
  context: any
) => Promise<NextResponse<T> | Response>;

/**
 * Higher-Order Function to wrap all API Route handlers.
 * It enforces standardized error catching and maps domain errors to HTTP responses.
 */
export function apiHandler(handler: ApiHandler): ApiHandler {
  return async (request, context) => {
    try {
      // Global rate limiter using IP address
      const ip = request.headers.get('x-forwarded-for') || 'unknown-ip';
      rateLimit(ip, 200, 60000); // Max 200 requests per minute globally per IP

      return await handler(request, context);
    } catch (error: any) {
      logger.error({ err: error }, '[API_ERROR] Uncaught exception in API handler');

      // Handle Zod Validation Errors
      if (error instanceof ZodError) {
        const message = error.issues
          .map((e: any) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        return errorResponse(message, 'VALIDATION_ERROR', 400);
      }

      // Handle custom Domain Errors
      if (error instanceof AppError) {
        let code = 'INTERNAL_ERROR';
        if (error.name === 'ValidationError') code = 'VALIDATION_ERROR';
        else if (error.name === 'UnauthorizedError') code = 'UNAUTHORIZED';
        else if (error.name === 'PermissionError') code = 'FORBIDDEN';
        else if (error.name === 'NotFoundError') code = 'NOT_FOUND';
        else if (error.name === 'ConflictError') code = 'CONFLICT';
        else if (error.name === 'ExternalApiError') code = 'BAD_GATEWAY';
        
        // 429 logic
        if (error.statusCode === 429) code = 'TOO_MANY_REQUESTS';

        return errorResponse(error.message, code, error.statusCode);
      }

      // Hide Database Implementation Details
      if (error instanceof Prisma.PrismaClientKnownRequestError || 
          error instanceof Prisma.PrismaClientUnknownRequestError || 
          error instanceof Prisma.PrismaClientValidationError) {
        return errorResponse('A database error occurred. Please try again later.', 'DATABASE_ERROR', 500);
      }

      // Handle generic/unknown errors
      return errorResponse('An unexpected error occurred', 'INTERNAL_SERVER_ERROR', 500);
    }
  };
}
