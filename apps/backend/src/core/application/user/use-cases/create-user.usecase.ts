import { IUserRepository } from '../../../domain/user/user.repository';
import { User } from '../../../domain/user/user.entity';
import { UserDto } from '../dtos/user.dto';
import logger from '../../../../shared/logger';
import { handleAndThrowError } from '../../../../shared/error-handler';


export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Executes the user creation logic.
   * @param authUserEmail - The email associated with the Firebase Auth user.
   * @returns The UserDto of the created user.
   * @throws Error if user data is invalid, user already exists, or persistence fails.
   */
  async execute(authUserEmail: string): Promise<UserDto> {
    const operationId = `CreateUser-${authUserEmail.substring(0, 8)}`;
    logger.info({ operationId, authUserEmail }, `Attempting creation for user.`);

    if (!authUserEmail) {
      logger.error({ operationId, authUserEmail }, 'Auth user ID or Email missing for creation.');
      throw new Error('Valid authentication details (ID and Email) are required for sign up.');
    }

    if (!/\S+@\S+\.\S+/.test(authUserEmail)) {
        logger.error({ operationId, authUserEmail }, 'Invalid email format for new user.');
        throw new Error('Invalid email format provided.');
    }

    try {
      const existingUser = await this.userRepository.findByEmail(authUserEmail);
      if (existingUser) {
        logger.warn({ operationId, authUserEmail }, 'Attempted to create a user that already exists.');
        throw new Error(`User already exists. Please log in.`);
      }

      logger.info({ operationId, authUserEmail }, 'User not found in DB, proceeding with creation...');
      const newUser = new User(null, authUserEmail);
      const savedUser = await this.userRepository.save(newUser);
      logger.info({ operationId, userId: savedUser.id }, 'New user successfully created in DB.');

      return UserDto.fromEntity(savedUser);

    } catch (error) {
      handleAndThrowError(logger, error, { operationId, authUserEmail }, `Error during user creation.`);
    }
  }
}