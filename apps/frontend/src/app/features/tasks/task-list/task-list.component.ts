import { Component, OnInit, inject, signal, ChangeDetectionStrategy, computed, OnDestroy } from '@angular/core'; // Add OnDestroy
import { CommonModule } from '@angular/common';
import { Observable, BehaviorSubject, of, Subject, takeUntil } from 'rxjs'; // Add Subject, takeUntil
import { catchError, startWith, switchMap, tap, finalize } from 'rxjs/operators'; // Add finalize
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar'; // Or use NotificationService

import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task, TaskData } from '../../../core/models/task.model';
import { TaskItemComponent } from '../task-item/task-item.component'; // Import item component
import { TaskFormComponent } from '../task-form/task-form.component'; // Import form component
import { NotificationService } from '../../../core/services/notification.service'; // Import NotificationService

// Interface to manage stream state (data, loading, error)
interface TasksState {
   tasks: Task[];
   loading: boolean;
   error: string | null;
}

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TaskItemComponent, // Include TaskItem component
    TaskFormComponent // Include TaskForm component
  ],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss'],
   changeDetection: ChangeDetectionStrategy.OnPush // Use OnPush for better performance
})
export class TaskListComponent implements OnInit, OnDestroy { // Implement OnDestroy
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService); // Inject NotificationService
  private destroy$ = new Subject<void>(); // Subject to manage subscription cleanup

  // Use a signal to hold the state object
  private tasksState = signal<TasksState>({ tasks: [], loading: true, error: null });

  // Public signals derived from the state signal
  readonly tasks = computed(() => this.tasksState().tasks);
  readonly isLoading = computed(() => this.tasksState().loading);
  readonly error = computed(() => this.tasksState().error);

  // Signal for loading state specifically for adding a task
  isAddingTask = signal(false);
  // Signal to control the visibility of the add task form
  showAddTaskForm = signal(false);

  // Use a BehaviorSubject to trigger refreshes
  private refreshTasks$ = new BehaviorSubject<void>(undefined);

  ngOnInit(): void {
    this.loadTasks();
  }

  ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
  }

  // Method to load/reload tasks based on the refresh trigger
  loadTasks(): void {
      this.tasksState.update(state => ({ ...state, loading: true, error: null }));

      this.refreshTasks$.pipe(
          switchMap(() => this.taskService.getTasks().pipe(
              catchError(err => {
                  console.error("Error loading tasks:", err);
                  // Error message is already handled by the service's handleError
                  // We just need to update the state here
                  this.tasksState.set({ tasks: [], loading: false, error: 'Error al cargar las tareas. Por favor, inténtalo de nuevo.' });
                  return of([] as Task[]); // Return empty array on error to continue stream
              })
          )),
          takeUntil(this.destroy$) // Unsubscribe when component is destroyed
      ).subscribe(tasks => {
         this.tasksState.set({ tasks: tasks, loading: false, error: null });
         console.log("Tasks loaded/refreshed:", tasks);
      });
  }

  // Method to trigger a refresh
  refreshTasks(): void {
      console.log("Refreshing tasks...");
      this.refreshTasks$.next();
  }

  // Method to add a new task
  addTask(taskData: TaskData): void {
      this.isAddingTask.set(true);
      this.taskService.addTask(taskData).pipe(
          finalize(() => this.isAddingTask.set(false)), // Ensure loading state is turned off
          takeUntil(this.destroy$)
      ).subscribe({
          next: (newTask) => {
              console.log("Task added successfully:", newTask);
              this.showAddTaskForm.set(false); // Hide form on success
              this.refreshTasks(); // Refresh the list to show the new task
              // Notification is handled by the service
          },
          error: (err) => {
              console.error("Failed to add task:", err);
              // Notification is handled by the service
              // Keep the form open so the user can retry or correct input
          }
      });
  }

  // Toggle the visibility of the add task form
  toggleAddTaskForm(): void {
      this.showAddTaskForm.update(visible => !visible);
  }

  // Method to handle logout
  logout(): void {
      this.authService.logout().subscribe({
          next: () => {
              console.log("Logout successful, navigating to login.");
              // Navigation is handled by the auth service or guard
          },
          error: (err) => {
              console.error("Logout failed:", err);
              this.notificationService.showError("Error al cerrar sesión.");
          }
      });
  }
}