import { ITaskRepository } from '../../../domain/task/task.repository';
import logger from '../../../../shared/logger';
import { handleAndThrowError } from '../../../../shared/error-handler';

export class DeleteTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  /**
   * Deletes a task. Ensures the user owns the task.
   * @param userId - The ID of the user requesting the deletion.
   * @param taskId - The ID of the task to delete.
   * @returns A promise that resolves when deletion is complete.
   * @throws TaskNotFoundError if the task doesn't exist.
   * @throws UnauthorizedError if the user doesn't own the task.
   * @throws Error if deletion fails.
   */
  async execute(userId: string, taskId: string): Promise<void> {
    const operationId = `DeleteTask-${taskId}`;
    logger.info({ operationId, userId, taskId }, 'Attempting to delete task.');

    try {
      const task = await this.taskRepository.findById(taskId);

      if (!task) {
        logger.warn({ operationId, userId, taskId }, 'Task not found for deletion.');
        throw new Error(`Task not found for deletion.`);
      }

      // --- Authorization Check ---
      if (task.userId !== userId) {
        logger.error({ operationId, userId, taskId, ownerId: task.userId }, 'User unauthorized to delete task.');
        throw new Error('User does not have permission to delete this task.');
      }

      await this.taskRepository.delete(taskId);
      logger.info({ operationId, userId, taskId }, 'Task deleted successfully.');

    } catch (error) {
      handleAndThrowError(logger, error, { operationId, userId, taskId }, 'Error deleting task.');
    }
  }
}