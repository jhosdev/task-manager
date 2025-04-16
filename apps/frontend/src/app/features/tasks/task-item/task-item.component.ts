import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Task, TaskData } from '../../../core/models/task.model';
import { TaskFormComponent } from '../task-form/task-form.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { TaskService } from '../../../core/services/task.service';

@Component({
  selector: 'app-task-item',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    MatCardModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TaskFormComponent,
  ],
  templateUrl: './task-item.component.html',
  styleUrls: ['./task-item.component.scss']
})
export class TaskItemComponent {
  @Input({ required: true }) task!: Task;
  @Output() taskUpdated = new EventEmitter<void>();
  @Output() taskDeleted = new EventEmitter<string>();

  private taskService = inject(TaskService);
  private dialog = inject(MatDialog);

  isEditing = signal(false);
  isLoading = signal(false);

  onStatusChange(newStatus: boolean): void {
    console.log(`Status change for ${this.task.id}: ${newStatus}`);
    this.isLoading.set(true);
    this.taskService.updateTask(this.task.id, { completed: newStatus }).subscribe({
      next: (updatedTask) => {
         this.task = { ...this.task, completed: updatedTask.completed };
         this.taskUpdated.emit();
         this.isLoading.set(false);
      },
      error: (err) => {
         console.error("Failed to update status:", err);
         this.isLoading.set(false);
      }
    });
  }

  toggleEdit(): void {
    this.isEditing.update(editing => !editing);
  }
  
  saveEditedTask(taskData: TaskData): void {
    this.isLoading.set(true);
    this.taskService.updateTask(this.task.id, taskData).subscribe({
        next: (updatedTask) => {
            this.task = { ...this.task, ...updatedTask };
            this.isEditing.set(false);
            this.taskUpdated.emit();
            this.isLoading.set(false);
        },
        error: (err) => {
            console.error("Failed to save edited task:", err);
            this.isLoading.set(false);
        }
    });
  }

  cancelEditTask(): void {
      this.isEditing.set(false);
  }


  confirmDelete(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: {
        title: 'Confirmar Eliminación',
        message: `¿Estás seguro de que deseas eliminar la tarea "${this.task.title}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
       }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteTask();
      }
    });
  }

  private deleteTask(): void {
    this.isLoading.set(true);
    this.taskService.deleteTask(this.task.id).subscribe({
        next: () => {
            this.taskDeleted.emit(this.task.id);
        },
        error: (err) => {
            console.error("Failed to delete task:", err);
            this.isLoading.set(false);
        }
    });
  }
}