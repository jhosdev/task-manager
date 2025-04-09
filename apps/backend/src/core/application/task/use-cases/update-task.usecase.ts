import { ITaskRepository } from '../../../domain/task/task.repository';
import { TaskDto } from '../dtos/task.dto';
import logger from '../../../../shared/logger';
import { handleAndThrowError } from '../../../../shared/error-handler';

interface UpdateTaskPayload {
  title?: string;
  description?: string;
  isCompleted?: boolean;
}

export class UpdateTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  /**
   * Updates an existing task. Ensures the user owns the task.
   * @param userId - The ID of the user requesting the update.
   * @param taskId - The ID of the task to update.
   * @param payload - The data to update (title, description, isCompleted).
   * @returns The updated TaskDto.
   * @throws TaskNotFoundError if the task doesn't exist.
   * @throws UnauthorizedError if the user doesn't own the task.
   * @throws Error for validation or persistence issues.
   */
  async execute(userId: string, taskId: string, payload: UpdateTaskPayload): Promise<TaskDto> {
    const operationId = `UpdateTask-${taskId}`;
    logger.info({ operationId, userId, taskId, payload }, 'Attempting to update task.');

    try {
      const task = await this.taskRepository.findById(taskId);

      if (!task) {
        logger.warn({ operationId, userId, taskId }, 'Task not found for update.');
        throw new Error(`Task not found for update.`);
      }

      // --- Authorization Check ---
      if (task.userId !== userId) {
        logger.error({ operationId, userId, taskId, ownerId: task.userId }, 'User unauthorized to update task.');
        throw new Error('User does not have permission to update this task.');
      }

      // Apply updates using domain entity methods for validation and logic
      let updated = false;
      if (payload.title !== undefined || payload.description !== undefined) {
          // Only call updateDetails if title or description is actually present in payload
          const newTitle = payload.title !== undefined ? payload.title : task.title;
          const newDescription = payload.description !== undefined ? payload.description : task.description;
          // Avoid calling if neither changed (optional optimization)
          if(newTitle !== task.title || newDescription !== task.description) {
              task.updateDetails(newTitle, newDescription);
              updated = true;
              logger.debug({ operationId, taskId }, 'Task details updated.');
          }
      }
      if (payload.isCompleted !== undefined && payload.isCompleted !== task.isCompleted) {
        if (payload.isCompleted) {
          task.markAsCompleted();
        } else {
          task.markAsPending();
        }
        updated = true;
        logger.debug({ operationId, taskId, isCompleted: task.isCompleted }, 'Task completion status updated.');
      }

      if (!updated) {
           logger.info({ operationId, taskId }, 'No changes detected for task update.');
           return TaskDto.fromEntity(task);
      }

      const savedTask = await this.taskRepository.save(task);
      logger.info({ operationId, taskId, userId }, 'Task updated successfully.');

      return TaskDto.fromEntity(savedTask);

    } catch (error) {
      handleAndThrowError(logger, error, { operationId, userId, taskId, payload }, 'Error updating task.');
    }
  }
}