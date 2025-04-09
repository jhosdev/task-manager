import { Component, EventEmitter, Input, OnInit, Output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card'; // Optional: wrap form in a card

import { Task, TaskData } from '../../../core/models/task.model';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule
   ],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss']
})
export class TaskFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);

  @Input() taskToEdit: Task | null = null; // Input for editing existing task
  @Input() isLoading: boolean = false; // Input for disabling form during submission
  @Output() saveTask = new EventEmitter<TaskData>(); // Output event for saving
  @Output() cancelEdit = new EventEmitter<void>(); // Output event to cancel editing

  taskForm = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required]
  });

  isEditing = false;

  ngOnInit(): void {
     this.updateForm();
  }

  // Update form when input changes (e.g., when editing starts)
  ngOnChanges(changes: SimpleChanges): void {
      if (changes['taskToEdit']) {
          this.updateForm();
      }
  }

  private updateForm(): void {
    if (this.taskToEdit) {
      this.isEditing = true;
      this.taskForm.patchValue({
        title: this.taskToEdit.title,
        description: this.taskToEdit.description
      });
    } else {
      this.isEditing = false;
      this.taskForm.reset();
    }
  }


  onSubmit(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const taskData: TaskData = {
      title: this.taskForm.value.title?.trim() ?? '',
      description: this.taskForm.value.description?.trim() ?? ''
    };

    // For editing, we only emit the data. The parent component handles the update call.
    // For adding, the same applies.
    this.saveTask.emit(taskData);

     // Only reset form if NOT editing (or after successful save handled by parent)
     // If we reset here, the form clears before parent confirms save
     // Parent component should handle resetting/clearing edit state
     // if (!this.isEditing) {
     //    this.taskForm.reset();
     // }
  }

  onCancel(): void {
      if (this.isEditing) {
          this.cancelEdit.emit(); // Emit cancel event for parent
      } else {
          this.taskForm.reset(); // Just reset the form if adding
      }
  }
}