import { ITaskRepository } from '../../../domain/task/task.repository';
import { Task } from '../../../domain/task/task.entity';
import { TaskDto } from '../dtos/task.dto';
import logger from '../../../../shared/logger';
import { handleAndThrowError } from '../../../../shared/error-handler';

export class AddTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  /**
   * Executes the logic to create a new task for a user.
   * @param userId - The ID of the user creating the task.
   * @param title - The title of the task.
   * @param description - The description of the task.
   * @returns The created TaskDto.
   * @throws Error if input is invalid or persistence fails.
   */
  async execute(userId: string, title: string, description: string): Promise<TaskDto> {
    const operationId = `AddTask-${userId.substring(0, 8)}`;
    logger.info({ operationId, userId, title }, 'Attempting to add new task.');

    try {
      // Domain entity handles its own validation during construction
      const newTask = new Task(userId, title, description);
      logger.debug({ operationId, taskId: newTask.id }, 'Task entity created.');

      const savedTask = await this.taskRepository.save(newTask);
      logger.info({ operationId, taskId: savedTask.id, userId }, 'Task saved successfully.');

      return TaskDto.fromEntity(savedTask);
    } catch (error) {
      handleAndThrowError(logger, error, { operationId, userId, title }, 'Error adding task.');
    }
  }
}