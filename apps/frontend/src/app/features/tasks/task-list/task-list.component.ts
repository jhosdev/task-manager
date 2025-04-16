import { Component, OnInit, inject, signal, ChangeDetectionStrategy, computed, OnDestroy } from '@angular/core'; // Add OnDestroy
import { CommonModule } from '@angular/common';
import { BehaviorSubject, of, Subject, takeUntil } from 'rxjs';
import { catchError, switchMap, finalize } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task, TaskData } from '../../../core/models/task.model';
import { TaskItemComponent } from '../task-item/task-item.component';
import { TaskFormComponent } from '../task-form/task-form.component';
import { NotificationService } from '../../../core/services/notification.service';

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
    TaskItemComponent,
    TaskFormComponent
  ],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskListComponent implements OnInit, OnDestroy {
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private destroy$ = new Subject<void>();

  private tasksState = signal<TasksState>({ tasks: [], loading: true, error: null });

  readonly tasks = computed(() => this.tasksState().tasks);
  readonly isLoading = computed(() => this.tasksState().loading);
  readonly error = computed(() => this.tasksState().error);

  isAddingTask = signal(false);
  showAddTaskForm = signal(false);

  private refreshTasks$ = new BehaviorSubject<void>(undefined);

  ngOnInit(): void {
    this.loadTasks();
  }

  ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
  }

  loadTasks(): void {
      this.tasksState.update(state => ({ ...state, loading: true, error: null }));

      this.refreshTasks$.pipe(
          switchMap(() => this.taskService.getTasks().pipe(
              catchError(err => {
                  console.error("Error loading tasks:", err);
                  this.tasksState.set({ tasks: [], loading: false, error: 'Error al cargar las tareas. Por favor, inténtalo de nuevo.' });
                  return of([] as Task[]);
              })
          )),
          takeUntil(this.destroy$)
      ).subscribe(tasks => {
         this.tasksState.set({ tasks: tasks, loading: false, error: null });
         console.log("Tasks loaded/refreshed:", tasks);
      });
  }

  refreshTasks(): void {
      console.log("Refreshing tasks...");
      this.refreshTasks$.next();
  }

  addTask(taskData: TaskData): void {
      this.isAddingTask.set(true);
      this.taskService.addTask(taskData).pipe(
          finalize(() => this.isAddingTask.set(false)),
          takeUntil(this.destroy$)
      ).subscribe({
          next: (newTask) => {
              console.log("Task added successfully:", newTask);
              this.showAddTaskForm.set(false);
              this.refreshTasks();
          },
          error: (err) => {
              console.error("Failed to add task:", err);
          }
      });
  }

  toggleAddTaskForm(): void {
      this.showAddTaskForm.update(visible => !visible);
  }

  logout(): void {
      this.authService.logout().subscribe({
          next: () => {
              console.log("Logout successful, navigating to login.");
          },
          error: (err) => {
              console.error("Logout failed:", err);
              this.notificationService.showError("Error al cerrar sesión.");
          }
      });
  }
}