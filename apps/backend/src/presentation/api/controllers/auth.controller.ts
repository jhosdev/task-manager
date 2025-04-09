import { Request, Response, NextFunction } from 'express';
import { LoginUserUseCase } from '../../../core/application/user/use-cases/login-user.usecase'; // Added
import { CreateUserUseCase } from '../../../core/application/user/use-cases/create-user.usecase'; // Added
import { FirebaseAuthService } from '../../../infrastructure/auth/firebase-auth.service';
import { SESSION_COOKIE_EXPIRES_IN } from '../../../config/firebase';
import logger from '../../../shared/logger';
import { UserDto } from '../../../core/application/user/dtos/user.dto';
import { GetUserByEmailUseCase } from '../../../core/application/user/use-cases/get-user-by-email.usecase';
import { RequestWithUser } from '../middleware/auth.middleware';
/**
 * Controller handling authentication-related requests.
 */
export class AuthController {
  constructor(
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly firebaseAuthService: FirebaseAuthService,
    private readonly getUserByEmailUseCase: GetUserByEmailUseCase
  ) {}

  /**
   * Handles POST /api/auth/session-login
   * Verifies ID token, ensures user exists, creates session cookie.
   */
  async sessionLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { idToken } = req.body; // Assumes validateRequest middleware ran
    const logContext = { controller: 'AuthController', method: 'sessionLogin', ip: req.ip };
    logger.info({ ...logContext }, 'Processing session login request.');

    try {
      const decodedToken = await this.firebaseAuthService.verifyIdToken(idToken);
      logger.debug({ ...logContext, userId: decodedToken.uid }, 'ID token verified.');


      const userDto: UserDto = await this.loginUserUseCase.execute(
        decodedToken.uid,
        decodedToken.email
      );
      logger.debug({ ...logContext, userId: userDto.id }, 'User found in DB.');

      const sessionCookie = await this.firebaseAuthService.createSessionCookie(idToken);
      logger.debug({ ...logContext, userId: userDto.id }, 'Session cookie created.');

      const options = {
        maxAge: SESSION_COOKIE_EXPIRES_IN,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
      };
      res.cookie('__session', sessionCookie, options);
      logger.info({ ...logContext, userId: userDto.id }, 'Session login successful.');

      res.status(200).json(userDto);

    } catch (error) {
      if (error instanceof Error) {
        logger.error({ ...logContext, error: error.message, stack: error.stack }, `Session login failed.`);
        const statusCode = error.message.includes('User not found') ? 404 : 401;
        res.status(statusCode).json({ message: error.message || 'Authentication failed.' });
      } else {
        logger.error({ ...logContext, error: error }, `Session login failed.`);
        res.status(401).json({ message: 'Authentication failed.' });
      }
    }
  }

  /**
   * Handles POST /api/auth/sign-up
   * Verifies ID token, creates a new user, creates session cookie (auto-login).
   */
  async signUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { email } = req.body; // Assumes validateRequest middleware ran
    const logContext = { controller: 'AuthController', method: 'signUp', ip: req.ip };
    logger.info({ ...logContext }, 'Processing sign up request.');

    try {
      const userDto: UserDto = await this.createUserUseCase.execute(
        email
      );
      logger.debug({ ...logContext, userId: userDto.id }, 'User created in DB.'); 
      
      const customToken = await this.firebaseAuthService.createCustomToken(userDto.id);
      logger.debug({ ...logContext, userId: userDto.id }, 'Custom token created for new user.');

      const sessionCookie = await this.firebaseAuthService.createSessionCookie(customToken);
      logger.debug({ ...logContext, userId: userDto.id }, 'Session cookie created for new user.');

      const options = {
        maxAge: SESSION_COOKIE_EXPIRES_IN,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
      };
      res.cookie('__session', sessionCookie, options);
      logger.info({ ...logContext, userId: userDto.id }, 'Sign up and auto-login successful.');

      res.status(201).json(userDto);

    } catch (error) {
      if (error instanceof Error) {
        logger.error({ ...logContext, error: error.message, stack: error.stack }, `Sign up failed.`);
        const statusCode = error.message.includes('User already exists') ? 409 : 400; // 409 Conflict, 400 Bad Request
        res.status(statusCode).json({ message: error.message || 'Sign up failed.' });
      } else {
        logger.error({ ...logContext, error: error }, `Sign up failed.`);
        res.status(500).json({ message: 'Sign up failed due to an internal error.' });
      }
    }
  }


  /**
   * Handles POST /api/auth/session-logout
   * Clears the session cookie and revokes the session server-side.
   */
  async sessionLogout(req: Request, res: Response, next: NextFunction): Promise<void> {
    const sessionCookie = req.cookies.__session || '';
    const logContext = { controller: 'AuthController', method: 'sessionLogout', ip: req.ip };
    logger.info({ ...logContext }, 'Processing session logout request.');

    res.clearCookie('__session');

    if (sessionCookie) {
        try {
            const decodedClaims = await this.firebaseAuthService.verifySessionCookie(sessionCookie).catch(() => null);
            if (decodedClaims) {
                await this.firebaseAuthService.revokeRefreshTokens(decodedClaims.sub);
                logger.info({ ...logContext, userId: decodedClaims.sub }, 'User session revoked server-side.');
            } else {
                 logger.warn({ ...logContext }, 'Logout attempted with an invalid session cookie (already expired/revoked?).');
            }
        } catch (error) {
            if (error instanceof Error) {
                logger.error({ ...logContext, error: error.message, stack: error.stack }, 'Error revoking session server-side during logout.');
            } else {
                logger.error({ ...logContext, error }, 'Error revoking session server-side during logout.');
            }
        }
    } else {
        logger.info({ ...logContext }, 'Logout processed, no session cookie found.');
    }

    res.status(200).json({ message: 'Logout successful.' });
  }

   /**
   * Handles GET /api/auth/me
   * Returns the currently authenticated user's profile.
   */
  async getMyProfile(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    // AuthMiddleware should have run and attached req.user
    const logContext = { controller: 'AuthController', method: 'getMyProfile', userId: req.user?.uid, ip: req.ip };
     if (!req.user) {
        logger.error({ ...logContext }, 'User object missing from request after AuthMiddleware.');
        res.status(401).json({ message: 'Unauthorized.' });
        return;
    }
    logger.info({ ...logContext }, 'Fetching profile for authenticated user.');
    res.status(200).json({
        id: req.user.uid,
        email: req.user.email,
    });
  }

  /**
   * Handles GET /api/auth/user-by-email
   * Returns the user profile for a given email.
   */
  async getUserByEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { email } = req.params;
    const logContext = { controller: 'AuthController', method: 'getUserByEmail', email, ip: req.ip };
    logger.info({ ...logContext }, 'Fetching user profile by email.');

    try {
      const userDto = await this.getUserByEmailUseCase.execute(email);
      if (!userDto) {
        logger.warn({ ...logContext }, 'User not found with the provided email.');
        res.status(404).json({ message: 'User not found.' });
        return;
      }
      res.status(200).json({
        id: userDto.id,
      });
    } catch (error) {
      logger.error({ ...logContext, error }, 'Error fetching user profile by email.');
      res.status(500).json({ message: 'Error fetching user profile by email.' });
    } 
    
  }
  
}