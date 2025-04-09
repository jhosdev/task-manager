import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Needed for ngModel checkbox two-way binding
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // For showing loading state during operations

import { Task, TaskData } from '../../../core/models/task.model';
import { TaskFormComponent } from '../task-form/task-form.component'; // Import form component
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { TaskService } from '../../../core/services/task.service'; // Inject TaskService for direct actions

@Component({
  selector: 'app-task-item',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // For [(ngModel)]
    DatePipe, // To format dates
    MatCardModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
     TaskFormComponent, // Include the form component here
  ],
  templateUrl: './task-item.component.html',
  styleUrls: ['./task-item.component.scss']
})
export class TaskItemComponent {
  @Input({ required: true }) task!: Task; // Make task input required
  @Output() taskUpdated = new EventEmitter<void>(); // Notify parent list to refresh
  @Output() taskDeleted = new EventEmitter<string>(); // Emit deleted task ID

  private taskService = inject(TaskService);
  private dialog = inject(MatDialog);

  isEditing = signal(false); // Signal to control edit mode
  isLoading = signal(false); // Signal for loading state during actions

  // Use ngModel for direct binding, emit update on change
  onStatusChange(newStatus: boolean): void {
    console.log(`Status change for ${this.task.id}: ${newStatus}`);
    this.isLoading.set(true);
    this.taskService.updateTask(this.task.id, { completed: newStatus }).subscribe({
      next: (updatedTask) => {
         // Update local task object immutably
         this.task = { ...this.task, completed: updatedTask.completed };
         this.taskUpdated.emit(); // Notify parent
         this.isLoading.set(false);
      },
      error: (err) => {
         // Revert checkbox state visually on error? Optional.
         console.error("Failed to update status:", err);
         // Notification handled by service
         this.isLoading.set(false);
      }
    });
  }

  toggleEdit(): void {
    this.isEditing.update(editing => !editing);
  }

  // Handle saving the edited task from the form component
  saveEditedTask(taskData: TaskData): void {
    this.isLoading.set(true);
    this.taskService.updateTask(this.task.id, taskData).subscribe({
        next: (updatedTask) => {
            // Update local task immutably
            this.task = { ...this.task, ...updatedTask }; // Merge updates
            this.isEditing.set(false); // Exit edit mode
            this.taskUpdated.emit(); // Notify parent
            this.isLoading.set(false);
        },
        error: (err) => {
            console.error("Failed to save edited task:", err);
            // Notification handled by service
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
            // No need to set loading false, component might be destroyed
            this.taskDeleted.emit(this.task.id); // Notify parent
        },
        error: (err) => {
            console.error("Failed to delete task:", err);
            // Notification handled by service
            this.isLoading.set(false); // Set loading false on error
        }
    });
  }
}