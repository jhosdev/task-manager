import { Request, Response, NextFunction } from 'express';
import { FirebaseAuthService } from '../../../infrastructure/auth/firebase-auth.service';
import logger from '../../../shared/logger';


export interface RequestWithUser extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

/**
 * Middleware to verify the session cookie and attach user info to the request.
 * Uses FirebaseAuthService.
 */
export const AuthMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
  const sessionCookie = req.cookies.__session || ''; // Ensure cookie-parser middleware is used
  const logContext = { middleware: 'AuthMiddleware', url: req.originalUrl, ip: req.ip };

  if (!sessionCookie) {
    logger.warn({ ...logContext }, 'Access denied: No session cookie provided.');
    res.status(401).send({ message: 'Unauthorized: No session cookie provided.' });
    return;
  }

  // Instantiate the service (or get from DI container)
  const authService = new FirebaseAuthService();

  try {
    const decodedClaims = await authService.verifySessionCookie(sessionCookie);
    // Attach user info to the request object for downstream handlers
    req.user = {
      uid: decodedClaims.uid,
      email: decodedClaims.email,
    };
    logger.info({ ...logContext, userId: req.user.uid }, 'User authenticated via session cookie.');
    next();
  } catch (error) {
    // Session cookie is invalid or revoked.
    if (error instanceof Error) {
      logger.warn({ ...logContext, error: error.message }, 'Access denied: Invalid session cookie.');
    } else {
      logger.warn({ ...logContext, error: error }, 'Access denied: Invalid session cookie.');
    }
    // Clear the potentially invalid cookie on the client
    res.clearCookie('__session');
    res.status(401).send({ message: 'Unauthorized: Invalid session.' });
  }
};