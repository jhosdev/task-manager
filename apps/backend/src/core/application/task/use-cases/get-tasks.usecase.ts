import { ITaskRepository } from '../../../domain/task/task.repository';
import { TaskDto } from '../dtos/task.dto';
import logger from '../../../../shared/logger';
import { handleAndThrowError } from '../../../../shared/error-handler';

export class GetTasksUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  /**
   * Retrieves all tasks for a specific user.
   * @param userId - The ID of the user whose tasks are requested.
   * @returns An array of TaskDto, ordered by creation date.
   * @throws Error if retrieval fails.
   */
  async execute(userId: string): Promise<TaskDto[]> {
    const operationId = `GetTasks-${userId.substring(0, 8)}`;
    logger.info({ operationId, userId }, 'Attempting to get tasks for user.');

    try {
      const tasks = await this.taskRepository.findAllByUserId(userId);
      logger.info({ operationId, userId, count: tasks.length }, 'Tasks retrieved successfully.');

      return tasks.map(TaskDto.fromEntity);
    } catch (error) {
      handleAndThrowError(logger, error, { operationId, userId }, 'Error getting tasks.');
    }
  }
}