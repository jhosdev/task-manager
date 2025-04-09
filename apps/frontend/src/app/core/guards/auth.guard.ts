import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, filter, map, skip, switchMap, take, tap } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isLoading$ = toObservable(authService.isLoading);

  return isLoading$.pipe(
    filter(loading => !loading),
    take(1),
    map(() => {
      const user = authService.currentUser();
      const isLoggedIn = !!user;
      console.log('AuthGuard Check: User logged in?', isLoggedIn);

      if (isLoggedIn) {
        return true;
      } else {
        console.log('AuthGuard: No user found, redirecting to login.');
        return router.parseUrl(`/login?returnUrl=${encodeURIComponent(state.url)}`);
      }
    }),
    catchError((err) => {
      // Handle potential errors during the guard execution
      console.error("AuthGuard Error:", err, "Redirecting to login.");
      // Return UrlTree for clean redirection
      return of(router.parseUrl('/login'));
    })
  );
};

export const loginGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router      = inject(Router);

    const isLoading$ = toObservable(authService.isLoading);

    return isLoading$.pipe(
      filter(loading => !loading),
      take(1),
      map(() => {
        const user = authService.currentUser();
        if (user) {
          console.log('LoginGuard: User already logged in, redirecting to tasks.');
          return router.parseUrl('/tasks'); // Redirect to default logged-in area
        }
        return true;
      }),
      catchError(() => {
        // If there's an error, it's safest to allow access to the login page
        console.error("LoginGuard Error: Allowing access to login page.");
        return of(true);
      })
    );
  };