import { Component, EventEmitter, Input, OnInit, Output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

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

  @Input() taskToEdit: Task | null = null;
  @Input() isLoading: boolean = false;
  @Output() saveTask = new EventEmitter<TaskData>();
  @Output() cancelEdit = new EventEmitter<void>();

  taskForm = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required]
  });

  isEditing = false;

  ngOnInit(): void {
     this.updateForm();
  }

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

    this.saveTask.emit(taskData);
  }

  onCancel(): void {
      if (this.isEditing) {
          this.cancelEdit.emit(); // Emit cancel event for parent
      } else {
          this.taskForm.reset(); // Just reset the form if adding
      }
  }
}