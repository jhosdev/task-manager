import { randomUUID } from 'crypto';

export class Task {
  public readonly id: string;
  public readonly userId: string;
  public title: string;
  public description: string;
  public readonly createdAt: Date;
  public isCompleted: boolean;

  constructor(
    userId: string,
    title: string,
    description: string,
    id?: string,
    createdAt?: Date,
    isCompleted?: boolean
  ) {
    if (!userId) throw new Error('Task must belong to a user (userId is required).');
    if (!title || title.trim().length === 0) throw new Error('Task title cannot be empty.');
    if (title.length > 100) throw new Error('Task title cannot exceed 100 characters.');
    if (description === null || description === undefined) throw new Error('Task description must be provided (can be empty string).');
    if (description.length > 500) throw new Error('Task description cannot exceed 500 characters.');

    this.id = id || randomUUID();
    this.userId = userId;
    this.title = title.trim();
    this.description = description;
    this.createdAt = createdAt || new Date();
    this.isCompleted = isCompleted === undefined ? false : isCompleted;
  }

  updateDetails(title: string, description: string): void {
      if (!title || title.trim().length === 0) throw new Error('Task title cannot be empty.');
      if (title.length > 100) throw new Error('Task title cannot exceed 100 characters.');
      if (description === null || description === undefined) throw new Error('Task description must be provided.');
      if (description.length > 500) throw new Error('Task description cannot exceed 500 characters.');

      this.title = title.trim();
      this.description = description;
  }


  markAsCompleted(): void {
    if (this.isCompleted) {
        // Optional: Log or handle idempotency - already completed
        return;
    }
    this.isCompleted = true;
  }

  markAsPending(): void {
     if (!this.isCompleted) {
        // Optional: Log or handle idempotency - already pending
        return;
    }
    this.isCompleted = false;
  }

  toggleCompletion(): void {
    this.isCompleted = !this.isCompleted;
  }
}