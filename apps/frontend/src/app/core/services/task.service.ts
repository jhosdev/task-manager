import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { Task, TaskData } from '../models/task.model';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private apiUrl = `${environment.apiUrl}/tasks`; // Base URL for task endpoints


  constructor() { }

  // Get all tasks for the logged-in user (backend handles user context via session)
  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl)
      .pipe(
        map(tasks => tasks.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())),
        tap(tasks => console.log('Fetched tasks:', tasks)),
        catchError(this.handleError<Task[]>('Error al obtener tareas', []))
      );
  }

  // Create a new task
  addTask(taskData: TaskData): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, taskData)
      .pipe(
        tap((newTask) => {
          this.notificationService.showSuccess('Tarea creada exitosamente.');
          console.log('Added task:', newTask);
        }),
        catchError(this.handleError<Task>('Error al crear tarea'))
      );
  }

  // Update an existing task
  updateTask(taskId: string, taskData: Partial<TaskData>): Observable<Task> {
     const payload: Partial<Task> = { ...taskData };
     if (taskData.completed !== undefined) {
         payload.completed = taskData.completed;
     }

     return this.http.put<Task>(`${this.apiUrl}/${taskId}`, payload)
      .pipe(
        tap((updatedTask) => {
          this.notificationService.showSuccess('Tarea actualizada.');
          console.log('Updated task:', updatedTask);
        }),
        catchError(this.handleError<Task>('Error al actualizar tarea'))
      );
  }

  // Delete a task
  deleteTask(taskId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${taskId}`)
      .pipe(
        tap(() => {
          this.notificationService.showSuccess('Tarea eliminada.');
          console.log('Deleted task:', taskId);
        }),
        catchError(this.handleError<{ message: string }>('Error al eliminar tarea'))
      );
  }

  // Centralized error handler (similar to AuthService)
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);
      let userMessage = `Error en ${operation}. ${error.error?.message || error.message}`;
      this.notificationService.showError(userMessage);
      return throwError(() => new Error(userMessage));
    };
  }
}