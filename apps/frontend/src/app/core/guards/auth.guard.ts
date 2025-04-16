import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, filter, map, take } from 'rxjs/operators';
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
      console.error("AuthGuard Error:", err, "Redirecting to login.");
      return of(router.parseUrl('/login'));
    })
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          return router.parseUrl('/tasks');
        }
        return true;
      }),
      catchError(() => {
        console.error("LoginGuard Error: Allowing access to login page.");
        return of(true);
      })
    );
  };