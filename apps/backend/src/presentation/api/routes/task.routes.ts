import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';
import { createTaskSchema, updateTaskSchema, taskIdParamSchema } from '../validators/task.validators';

import { FirebaseTaskRepository } from '../../../infrastructure/persistence/firebase/repositories/firebase-task.repository';
import { AddTaskUseCase } from '../../../core/application/task/use-cases/add-task.usecase';
import { GetTasksUseCase } from '../../../core/application/task/use-cases/get-tasks.usecase';
import { UpdateTaskUseCase } from '../../../core/application/task/use-cases/update-task.usecase';
import { DeleteTaskUseCase } from '../../../core/application/task/use-cases/delete-task.usecase';


const taskRepository = new FirebaseTaskRepository();
const addTaskUseCase = new AddTaskUseCase(taskRepository);
const getTasksUseCase = new GetTasksUseCase(taskRepository);
const updateTaskUseCase = new UpdateTaskUseCase(taskRepository);
const deleteTaskUseCase = new DeleteTaskUseCase(taskRepository);
const taskController = new TaskController(
    addTaskUseCase,
    getTasksUseCase,
    updateTaskUseCase,
    deleteTaskUseCase
);

const router: Router  = Router();

router.use(AuthMiddleware);

// --- Define Task Routes ---

// POST /api/tasks - Create a new task
router.post(
  '/',
  validateRequest(createTaskSchema),
  (req, res) => taskController.createTask(req, res)
);

// GET /api/tasks - Get all tasks for the logged-in user
router.get(
  '/',
  (req, res) => taskController.getUserTasks(req, res)
);

// PUT /api/tasks/:taskId - Update a specific task
router.put(
  '/:taskId',
  validateRequest(updateTaskSchema), // Validates both params.taskId and body
  (req, res) => taskController.updateTask(req, res)
);

// DELETE /api/tasks/:taskId - Delete a specific task
router.delete(
  '/:taskId',
   validateRequest(taskIdParamSchema), // Validates params.taskId
  (req, res) => taskController.deleteTask(req, res)
);

export default router;