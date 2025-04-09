import { ITaskRepository } from '../../../../core/domain/task/task.repository';
import { Task } from '../../../../core/domain/task/task.entity';
import { getFirestoreDb } from '../../../../config/firebase';
import logger from '../../../../shared/logger';
import { handleAndThrowError } from '../../../../shared/error-handler';

/**
 * Firestore implementation of the ITaskRepository interface.
 */
export class FirebaseTaskRepository implements ITaskRepository {
  private readonly collectionRef = getFirestoreDb().collection('tasks');
  private readonly logContext = { class: 'FirebaseTaskRepository' };

  private mapDocToTask(doc: FirebaseFirestore.DocumentSnapshot): Task | null {
       const data = doc.data();
        if (!data || typeof data.userId !== 'string' || typeof data.title !== 'string' || typeof data.description !== 'string' || typeof data.isCompleted !== 'boolean') {
            logger.error({ ...this.logContext, method: 'mapDocToTask', taskId: doc.id, data }, 'Invalid data structure found in Firestore task document.');
            return null;
        }
        return new Task(
            data.userId,
            data.title,
            data.description,
            doc.id,
            data.createdAt?.toDate(),
            data.isCompleted
        );
  }

  async findById(id: string): Promise<Task | null> {
    logger.debug({ ...this.logContext, method: 'findById', taskId: id }, 'Finding task by ID...');
    try {
      const doc = await this.collectionRef.doc(id).get();
      if (!doc.exists) {
        logger.debug({ ...this.logContext, method: 'findById', taskId: id }, 'Task not found.');
        return null;
      }
      const task = this.mapDocToTask(doc);
       if(task) {
           logger.debug({ ...this.logContext, method: 'findById', taskId: id }, 'Task found.');
       }
      return task;
    } catch (error) {
      handleAndThrowError(logger, error, { ...this.logContext, method: 'findById', taskId: id }, 'Error finding task by ID.');
    }
  }

  async findAllByUserId(userId: string): Promise<Task[]> {
    logger.debug({ ...this.logContext, method: 'findAllByUserId', userId }, 'Finding tasks by user ID...');
    try {
      const snapshot = await this.collectionRef
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      if (snapshot.empty) {
        logger.debug({ ...this.logContext, method: 'findAllByUserId', userId }, 'No tasks found for user.');
        return [];
      }

      const tasks: Task[] = [];
      snapshot.forEach(doc => {
           const task = this.mapDocToTask(doc);
            if (task) {
                tasks.push(task);
            } else {
                logger.warn({ ...this.logContext, method: 'findAllByUserId', userId, taskId: doc.id }, 'Skipping invalid task document.');
            }
      });

      logger.debug({ ...this.logContext, method: 'findAllByUserId', userId, count: tasks.length }, 'Tasks found.');
      return tasks;
    } catch (error) {
      handleAndThrowError(logger, error, { ...this.logContext, method: 'findAllByUserId', userId }, 'Error finding tasks by user ID.');
    }
  }

  async save(task: Task): Promise<Task> {
    const taskData = {
      userId: task.userId,
      title: task.title,
      description: task.description,
      createdAt: task.createdAt,
      isCompleted: task.isCompleted,
    };
    logger.debug({ ...this.logContext, method: 'save', taskId: task.id, data: taskData }, 'Saving task...');
    try {
      await this.collectionRef.doc(task.id).set(taskData);
      logger.info({ ...this.logContext, method: 'save', taskId: task.id }, 'Task saved successfully.');
      return task;
    } catch (error) {
      handleAndThrowError(logger, error, { ...this.logContext, method: 'save', taskId: task.id }, 'Error saving task.');
    }
  }

  async delete(id: string): Promise<void> {
    logger.debug({ ...this.logContext, method: 'delete', taskId: id }, 'Deleting task...');
    try {
      await this.collectionRef.doc(id).delete();
      logger.info({ ...this.logContext, method: 'delete', taskId: id }, 'Task deleted successfully.');
    } catch (error) {
      handleAndThrowError(logger, error, { ...this.logContext, method: 'delete', taskId: id }, 'Error deleting task.');
    }
  }
}