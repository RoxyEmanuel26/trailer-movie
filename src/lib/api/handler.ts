import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from './response';
import { AppError } from '../errors';
import { ZodError } from 'zod';

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
      return await handler(request, context);
    } catch (error: any) {
      console.error('[API_ERROR]', error);

      // Handle Zod Validation Errors
      if (error instanceof ZodError) {
        const message = error.issues
          .map((e: any) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        return errorResponse(message, 'VALIDATION_ERROR', 400);
      }

      // Handle custom Domain Errors
      if (error instanceof AppError) {
        // Map specific error types to specific code strings if needed
        let code = 'INTERNAL_ERROR';
        if (error.name === 'ValidationError') code = 'VALIDATION_ERROR';
        else if (error.name === 'UnauthorizedError') code = 'UNAUTHORIZED';
        else if (error.name === 'PermissionError') code = 'FORBIDDEN';
        else if (error.name === 'NotFoundError') code = 'NOT_FOUND';
        else if (error.name === 'ConflictError') code = 'CONFLICT';
        else if (error.name === 'ExternalApiError') code = 'BAD_GATEWAY';

        return errorResponse(error.message, code, error.statusCode);
      }

      // Handle generic/unknown errors
      return errorResponse('An unexpected error occurred', 'INTERNAL_SERVER_ERROR', 500);
    }
  };
}
