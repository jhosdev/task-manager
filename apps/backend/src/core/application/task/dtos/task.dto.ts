import { Task } from '../../../domain/task/task.entity';

export class TaskDto {
  id: string;
  userId: string;
  title: string;
  description: string;
  createdAt: string;
  isCompleted: boolean;

  constructor(
    id: string,
    userId: string,
    title: string,
    description: string,
    createdAt: string,
    isCompleted: boolean
  ) {
    this.id = id;
    this.userId = userId;
    this.title = title;
    this.description = description;
    this.createdAt = createdAt;
    this.isCompleted = isCompleted;
  }

  static fromEntity(task: Task): TaskDto {
    return new TaskDto(
      task.id,
      task.userId,
      task.title,
      task.description,
      task.createdAt.toISOString(),
      task.isCompleted
    );
  }
}