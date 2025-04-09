import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';


import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private router = inject(Router); // Inject Router

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });
  isLoading = signal(false); // Signal for loading state

  ngOnInit(): void {}

  get emailControl() {
    return this.loginForm.get('email');
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const email = this.emailControl?.value?.trim() ?? '';

    this.authService.getUserByEmail(email).subscribe({
      next: (user) => {
        if (user) {
          // User exists, attempt session login
          this.authService.sessionLogin(email).subscribe({
            // Navigation is handled within sessionLogin on success
            error: () => this.isLoading.set(false), // Reset loading on login error
            complete: () => this.isLoading.set(false) // Reset on completion if needed, navigation handles it
          });
        } else {
          // User does not exist, ask for confirmation to create
          this.isLoading.set(false); // Stop loading before showing dialog
          this.openSignUpConfirmation(email);
        }
      },
      error: (err) => {
         // Error handled by service, just stop loading indicator
        this.isLoading.set(false);
        console.error("getUserByEmail check failed:", err);
        // Notification already shown by service
      }
    });
  }

  openSignUpConfirmation(email: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: {
        title: 'Crear Usuario',
        message: `El correo ${email} no está registrado. ¿Deseas crear una nueva cuenta?`
       }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) { // User confirmed creation
        this.isLoading.set(true);
        this.authService.signUp(email).subscribe({
           // Navigation is handled within signUp -> signInFirebaseWithCustomToken
           error: () => this.isLoading.set(false), // Stop loading on sign-up error
           // complete: () => this.isLoading.set(false) // Reset on completion if needed
        });
      } else {
          console.log('User cancelled sign up.');
      }
    });
  }
}