import { Response } from 'express';
import logger from '../../../shared/logger';
// Import Use Cases
import { AddTaskUseCase } from '../../../core/application/task/use-cases/add-task.usecase';
import { GetTasksUseCase } from '../../../core/application/task/use-cases/get-tasks.usecase';
import { UpdateTaskUseCase } from '../../../core/application/task/use-cases/update-task.usecase';
import { DeleteTaskUseCase } from '../../../core/application/task/use-cases/delete-task.usecase';

import { RequestWithUser } from '../middleware/auth.middleware';

/**
 * Controller handling task-related API requests.
 */
export class TaskController {
  constructor(
    private readonly addTaskUseCase: AddTaskUseCase,
    private readonly getTasksUseCase: GetTasksUseCase,
    private readonly updateTaskUseCase: UpdateTaskUseCase,
    private readonly deleteTaskUseCase: DeleteTaskUseCase
  ) {}

  // --- Helper to get authenticated user ID ---
  private getUserId(req: RequestWithUser): string {
      if (!req.user?.uid) {
          logger.error({ controller: 'TaskController', method: 'getUserId', url: req.originalUrl }, 'User ID missing from request after AuthMiddleware.');
          throw new Error('Authentication context missing.'); // Internal error
      }
      return req.user.uid;
  }

  /** 
   * Handles POST /api/tasks
   * Creates a new task for the authenticated user.
   */
  async createTask(req: RequestWithUser, res: Response): Promise<void> {
    const logContext = { controller: 'TaskController', method: 'createTask', ip: req.ip };
    try {
      const userId = this.getUserId(req);
      const { title, description } = req.body; // Assumes validateRequest middleware ran
      logger.info({ ...logContext, userId, title }, 'Processing create task request.');

      const taskDto = await this.addTaskUseCase.execute(userId, title, description);

      logger.info({ ...logContext, userId, taskId: taskDto.id }, 'Task created successfully.');
      res.status(201).json(taskDto);

    } catch (error) {
      if (error instanceof Error) {
        logger.error({ ...logContext, userId: req.user?.uid, error: error.message, stack: error.stack }, 'Create task failed.');
        res.status(400).json({ message: error.message });
      } else {
        logger.error({ ...logContext, userId: req.user?.uid, error }, 'Create task failed.');
        res.status(500).json({ message: 'Create task failed due to an internal error.' });
      }
    }
  }

  /**
   * Handles GET /api/tasks
   * Retrieves all tasks for the authenticated user.
   */
  async getUserTasks(req: RequestWithUser, res: Response): Promise<void> {
    const logContext = { controller: 'TaskController', method: 'getUserTasks', ip: req.ip };
     try {
        const userId = this.getUserId(req);
        logger.info({ ...logContext, userId }, 'Processing get user tasks request.');

        const tasks = await this.getTasksUseCase.execute(userId);

        logger.info({ ...logContext, userId, count: tasks.length }, 'Tasks retrieved successfully.');
        res.status(200).json(tasks);

     } catch (error) {
        if (error instanceof Error) {
          logger.error({ ...logContext, userId: req.user?.uid, error: error.message, stack: error.stack }, 'Get tasks failed.');
          res.status(400).json({ message: error.message });
        } else {
          logger.error({ ...logContext, userId: req.user?.uid, error }, 'Get tasks failed.');
          res.status(500).json({ message: 'Get tasks failed due to an internal error.' });
        }
     }
  }

  /**
   * Handles PUT /api/tasks/:taskId
   * Updates a specific task for the authenticated user.
   */
  async updateTask(req: RequestWithUser, res: Response): Promise<void> {
     const { taskId } = req.params; // Assumes validateRequest middleware ran
     const logContext = { controller: 'TaskController', method: 'updateTask', taskId, ip: req.ip };
     try {
        const userId = this.getUserId(req);
        const updatePayload = req.body; // Contains optional fields title, description, isCompleted
        logger.info({ ...logContext, userId, payload: updatePayload }, 'Processing update task request.');

        const updatedTaskDto = await this.updateTaskUseCase.execute(userId, taskId, updatePayload);

        logger.info({ ...logContext, userId, taskId }, 'Task updated successfully.');
        res.status(200).json(updatedTaskDto);

     } catch (error) {
        if (error instanceof Error) {
          logger.error({ ...logContext, userId: req.user?.uid, taskId, error: error.message, stack: error.stack }, 'Update task failed.');
          res.status(400).json({ message: error.message });
        } else {
          logger.error({ ...logContext, userId: req.user?.uid, taskId, error }, 'Update task failed.');
          res.status(500).json({ message: 'Update task failed due to an internal error.' });
        }
     }
  }

  /**
   * Handles DELETE /api/tasks/:taskId
   * Deletes a specific task for the authenticated user.
   */
  async deleteTask(req: RequestWithUser, res: Response): Promise<void> {
    const { taskId } = req.params; // Assumes validateRequest middleware ran
    const logContext = { controller: 'TaskController', method: 'deleteTask', taskId, ip: req.ip };
    try {
        const userId = this.getUserId(req);
        logger.info({ ...logContext, userId }, 'Processing delete task request.');

        await this.deleteTaskUseCase.execute(userId, taskId);

        logger.info({ ...logContext, userId, taskId }, 'Task deleted successfully.');
        res.status(204).send(); // No Content success response for DELETE

    } catch (error) {
        if (error instanceof Error) {
          logger.error({ ...logContext, userId: req.user?.uid, taskId, error: error.message, stack: error.stack }, 'Delete task failed.');
          res.status(400).json({ message: error.message });
        } else {
          logger.error({ ...logContext, userId: req.user?.uid, taskId, error }, 'Delete task failed.');
          res.status(500).json({ message: 'Delete task failed due to an internal error.' });
        }
    }
  }
}