import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from './response';
import { AppError } from '../errors';
import { ZodError } from 'zod';
import { resolveIp, enforceRateLimit, RateLimitTiers } from '../security/rateLimiter';
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
      // 1. Resolve true IP addressing Cloudflare/Vercel proxies
      const ip = resolveIp(request);
      
      // 2. Select appropriate Rate Limit tier based on route and method
      const path = request.nextUrl.pathname;
      const method = request.method;
      
      let limitTier = RateLimitTiers.PUBLIC_GET;
      
      if (path.startsWith('/api/admin/analytics')) {
        limitTier = RateLimitTiers.ANALYTICS;
      } else if (path.startsWith('/api/admin')) {
        limitTier = RateLimitTiers.ADMIN;
      } else if (path.startsWith('/api/import')) {
        limitTier = RateLimitTiers.IMPORT;
      } else if (path.startsWith('/api/search')) {
        limitTier = RateLimitTiers.SEARCH;
      } else if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
        limitTier = RateLimitTiers.PUBLIC_POST;
      }
      
      await enforceRateLimit(ip, limitTier, path);

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

        const res = errorResponse(error.message, code, error.statusCode);
        
        // Inject rate limit headers if present on the error object
        if ((error as any).headers) {
          const headersObj = (error as any).headers;
          for (const [key, value] of Object.entries(headersObj)) {
            res.headers.set(key, value as string);
          }
        }
        
        return res;
      }

      // Hide Database Implementation Details (decoupled from Prisma client)
      const errorName = error?.name || '';
      if (typeof errorName === 'string' && errorName.startsWith('PrismaClient')) {
        return errorResponse('A database error occurred. Please try again later.', 'DATABASE_ERROR', 500);
      }

      // Handle generic/unknown errors
      return errorResponse('An unexpected error occurred', 'INTERNAL_SERVER_ERROR', 500);
    }
  };
}

