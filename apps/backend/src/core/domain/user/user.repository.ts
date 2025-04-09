import { User } from './user.entity';

/**
 * Interface defining the contract for user data persistence.
 * Abstracts away the specific storage mechanism.
 */
export interface IUserRepository {
  /**
   * Finds a user by their unique ID (Firebase Auth UID).
   * @param id - The user's Firebase Auth UID.
   * @returns The User entity or null if not found.
   */
  findById(id: string): Promise<User | null>;

  /**
   * Finds a user by their email address.
   * Useful for initial checks but ID should be the primary key.
   * @param email - The user's email address.
   * @returns The User entity or null if not found.
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Creates or updates a user in the persistence layer.
   * Uses the User entity's ID (Firebase Auth UID) as the document ID.
   * @param user - The User entity to save.
   * @returns The saved User entity.
   */
  save(user: User): Promise<User>;
}