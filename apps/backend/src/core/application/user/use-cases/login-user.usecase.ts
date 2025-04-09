import { IUserRepository } from '../../../domain/user/user.repository';
import { UserDto } from '../dtos/user.dto';
import logger from '../../../../shared/logger';
import { handleAndThrowError } from '../../../../shared/error-handler';

/**
 * Use Case: Handles user login verification.
 * Finds an existing user by their Auth ID.
 */
export class LoginUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Executes the login logic based on Firebase Auth user info.
   * @param authUserId - The Firebase Auth UID.
   * @param authUserEmail - The email associated with the Firebase Auth user (optional, for verification/update).
   * @returns The UserDto of the found user.
   * @throws Error if the user is not found or persistence fails.
   */
  async execute(authUserId: string, authUserEmail?: string | undefined): Promise<UserDto> {
    const operationId = `LoginUser-${authUserId.substring(0, 8)}`;
    logger.info({ operationId, authUserId }, `Attempting login for user.`);

    if (!authUserId) {
      logger.error({ operationId }, 'Auth user ID missing.');
      throw new Error('Authentication details are required.');
    }

    try {
      const user = await this.userRepository.findById(authUserId);

      if (!user) {
        logger.warn({ operationId, authUserId }, 'User not found in DB for login attempt.');
        throw new Error(`User not found. Please sign up first.`);
      }

      if (authUserEmail && user.email !== authUserEmail) {
         logger.warn({ operationId, userId: user.id }, 'User email mismatch between DB and Auth token during login. Consider updating DB.');
      }

      logger.info({ operationId, userId: user.id }, 'Existing user found in DB for login.');
      return UserDto.fromEntity(user);

    } catch (error) {
      handleAndThrowError(logger, error, { operationId, authUserId }, `Error during user login.`);
    }
  }
}