import { IUserRepository } from '../../../domain/user/user.repository';
import { UserDto } from '../dtos/user.dto';
import logger from '../../../../shared/logger';
import { handleAndThrowError } from '../../../../shared/error-handler';

export class GetUserByEmailUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Executes the logic to retrieve a user by their email.
   * @param email - The email of the user to retrieve.
   * @returns The UserDto of the found user.
   * @throws NotFoundError if the user with the specified email does not exist.
   * @throws Error for other potential issues (e.g., invalid email format, database errors).
   */
  async execute(email: string): Promise<UserDto | null> {
    const operationId = `GetUserByEmail-${email.substring(0, 8)}`;
    logger.info({ operationId, email }, `Attempting to retrieve user by email.`);

    if (!email) {
      logger.error({ operationId }, 'Email parameter is missing.');
      throw new Error('Email is required to retrieve a user.');
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
        logger.error({ operationId, email }, 'Invalid email format provided for retrieval.');
        throw new Error('Invalid email format provided.');
    }

    try {
      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        logger.warn({ operationId, email }, 'User not found with the provided email.');
        return null;
      }

      logger.info({ operationId, userId: user.id }, 'User successfully retrieved by email.');
      return UserDto.fromEntity(user);

    } catch (error) {
      handleAndThrowError(logger, error, { operationId, email }, `Error retrieving user by email.`);
    }
  }
}