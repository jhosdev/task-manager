import { getFirebaseAuth, SESSION_COOKIE_EXPIRES_IN } from '../../config/firebase';
import logger from '../../shared/logger';
import { Auth, DecodedIdToken } from 'firebase-admin/auth';
import { handleAndThrowError } from '../../shared/error-handler';

/**
 * Service responsible for interactions with Firebase Authentication.
 * Singleton pattern might be suitable here if complex initialization is needed,
 * otherwise direct usage of firebaseAuth is often fine.
 */
export class FirebaseAuthService {
  private readonly logContext = { class: 'FirebaseAuthService' };
  private readonly firebaseAuth: Auth;

  constructor() {
    this.firebaseAuth = getFirebaseAuth();
  }
  /**
   * Verifies a Firebase ID token provided by the client.
   * @param idToken - The Firebase ID token string.
   * @returns The decoded ID token containing user claims.
   * @throws Error if the token is invalid or verification fails.
   */
  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    logger.debug({ ...this.logContext, method: 'verifyIdToken' }, 'Verifying ID token...');
    try {
      // true = checkRevoked - ensure token hasn't been revoked
      const decodedToken = await this.firebaseAuth.verifyIdToken(idToken, true);
      logger.info({ ...this.logContext, method: 'verifyIdToken', userId: decodedToken.uid }, 'ID token verified successfully.');
      return decodedToken;
    } catch (error) {
      handleAndThrowError(logger, error, { ...this.logContext, method: 'verifyIdToken' }, `ID token verification failed.`);
    }
  }

  /**
   * Creates a session cookie for the given ID token.
   * @param idToken - The verified Firebase ID token string.
   * @returns The generated session cookie string.
   * @throws Error if cookie creation fails.
   */
  async createSessionCookie(idToken: string): Promise<string> {
    logger.debug({ ...this.logContext, method: 'createSessionCookie' }, 'Creating session cookie...');
    try {
      const expiresIn = SESSION_COOKIE_EXPIRES_IN; // Use configured expiration
      const sessionCookie = await this.firebaseAuth.createSessionCookie(idToken, { expiresIn });
      logger.info({ ...this.logContext, method: 'createSessionCookie' }, 'Session cookie created successfully.');
      return sessionCookie;
    } catch (error) {
      handleAndThrowError(logger, error, { ...this.logContext, method: 'createSessionCookie' }, 'Failed to create session cookie.');
    }
  }

  /**
   * Verifies a session cookie provided by the client.
   * @param sessionCookie - The session cookie string.
   * @returns The decoded claims from the session cookie.
   * @throws Error if the cookie is invalid or verification fails.
   */
  async verifySessionCookie(sessionCookie: string): Promise<DecodedIdToken> {
     logger.debug({ ...this.logContext, method: 'verifySessionCookie' }, 'Verifying session cookie...');
     try {
        // true = checkRevoked
        const decodedClaims = await this.firebaseAuth.verifySessionCookie(sessionCookie, true);
        logger.info({ ...this.logContext, method: 'verifySessionCookie', userId: decodedClaims.uid }, 'Session cookie verified successfully.');
        return decodedClaims;
     } catch (error) {
        handleAndThrowError(logger, error, { ...this.logContext, method: 'verifySessionCookie' }, `Session cookie verification failed.`);
     }
  }

   /**
   * Revokes all refresh tokens for a given user, effectively logging them out everywhere.
   * @param uid - The user's Firebase Auth UID.
   */
  async revokeRefreshTokens(uid: string): Promise<void> {
     logger.debug({ ...this.logContext, method: 'revokeRefreshTokens', userId: uid }, 'Revoking refresh tokens...');
     try {
        await this.firebaseAuth.revokeRefreshTokens(uid);
        logger.info({ ...this.logContext, method: 'revokeRefreshTokens', userId: uid }, 'Refresh tokens revoked successfully.');
     } catch (error) {
        handleAndThrowError(logger, error, { ...this.logContext, method: 'revokeRefreshTokens', userId: uid }, 'Failed to revoke refresh tokens.');
     }
  }

  /**
   * Creates a custom token for a given user.
   * @param uid - The user's Firebase Auth UID.
   * @returns The generated custom token string.
   * @throws Error if token creation fails.
   */
  async createCustomToken(uid: string): Promise<string> {
    logger.debug({ ...this.logContext, method: 'createCustomToken', userId: uid }, 'Creating custom token...');
    try {
      const customToken = await this.firebaseAuth.createCustomToken(uid);
      logger.info({ ...this.logContext, method: 'createCustomToken', userId: uid }, 'Custom token created successfully.');
      return customToken;
    } catch (error) {
      handleAndThrowError(logger, error, { ...this.logContext, method: 'createCustomToken', userId: uid }, 'Failed to create custom token.');
    }
  }
}