import { Task } from './task.entity';

/**
 * Interface defining the contract for task data persistence.
 */
export interface ITaskRepository {
  /**
   * Finds a task by its unique ID.
   * @param id - The task's unique ID.
   * @returns The Task entity or null if not found.
   */
  findById(id: string): Promise<Task | null>;

  /**
   * Finds all tasks belonging to a specific user.
   * @param userId - The ID of the user whose tasks are to be retrieved.
   * @returns An array of Task entities, ordered by creation date (newest first recommended).
   */
  findAllByUserId(userId: string): Promise<Task[]>;

  /**
   * Creates or updates a task in the persistence layer.
   * @param task - The Task entity to save.
   * @returns The saved Task entity.
   */
  save(task: Task): Promise<Task>;

  /**
   * Deletes a task by its unique ID.
   * @param id - The ID of the task to delete.
   * @returns A promise that resolves when deletion is complete.
   * @throws Error if the task to delete is not found or deletion fails.
   */
  delete(id: string): Promise<void>;
}