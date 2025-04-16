import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private authService: AuthService // Optional
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An unknown error occurred!';

        if (error.error instanceof ErrorEvent) {
          // Client-side or network error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
          if (error.error && typeof error.error === 'string') {
            errorMessage += `\nBackend Message: ${error.error}`;
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }

          // Handle specific HTTP errors
          if (error.status === 401 || error.status === 403) {
             // Unauthorized or Forbidden
             this.notificationService.showError('Authentication failed or session expired. Please log in again.');
             this.authService.logout().subscribe({
              next: () => {
                this.router.navigate(['/login'], { queryParams: { sessionExpired: true } });
              },
              error: (logoutErr) => {
                console.error('Logout failed after auth error:', logoutErr);
                this.router.navigate(['/login'], { queryParams: { sessionExpired: true, logoutError: true } });
              }
            });
          } else if (error.status === 404) {
             errorMessage = 'The requested resource was not found.';
          } else if (error.status === 500) {
             errorMessage = 'A server error occurred. Please try again later.';
          }
        }

        console.error("HTTP Error Interceptor:", error);
        this.notificationService.showError(errorMessage);

        // IMPORTANT: Rethrow the error so components/services can optionally handle it further
        return throwError(() => error);
      })
    );
  }
}