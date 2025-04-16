import { Injectable, inject, signal, effect, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Auth, onAuthStateChanged, signInWithCustomToken, signInWithEmailAndPassword, signOut, User } from '@angular/fire/auth';
import { from, Observable, of, throwError } from 'rxjs';
import { switchMap, tap, map, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private afAuth = inject(Auth);
  private notificationService = inject(NotificationService);
  private apiUrl = `${environment.apiUrl}/auth`;

  readonly currentUser: WritableSignal<User | null> = signal(null);
  readonly isLoading: WritableSignal<boolean> = signal(true);

  private initialUserChecked: boolean = false;

  constructor() {
    onAuthStateChanged(this.afAuth, user => {
        this.currentUser.set(user);
        if (!this.initialUserChecked) {
            this.isLoading.set(false);
            this.initialUserChecked = true;
            if (user && (this.router.url === '/login' || this.router.url === '/')) {
               this.router.navigate(['/tasks']);
            } else if (!user && !this.router.url.startsWith('/login')) {
               console.log('Auth State Changed: User not logged in, redirecting to login');
               this.router.navigate(['/login']);
            }
        }
    }, error => {
        console.error("Auth State Error:", error);
        this.currentUser.set(null);
        if (!this.initialUserChecked) {
            this.isLoading.set(false);
            this.initialUserChecked = true;
             if (!this.router.url.startsWith('/login')) {
                 console.log('Auth State Error: User not logged in, redirecting to login');
                 this.router.navigate(['/login']);
             }
        }
    });

    effect(() => {
        const user = this.currentUser();
        if (this.initialUserChecked && !this.isLoading()) {
             if (!user && !this.router.url.startsWith('/login')) {
               this.router.navigate(['/login']);
            }
         }
     }, { allowSignalWrites: true });
  }

  getUserByEmail(email: string): Observable<User | null> {
    return this.http.get<User>(`${this.apiUrl}/user-by-email/${encodeURIComponent(email)}`).pipe(
      catchError(err => {
        if (err.status === 404) {
          return of(null);
        }
        this.notificationService.showError('Error al verificar el correo.');
        console.error('getUserByEmail Error:', err);
        return throwError(() => err);
      })
    );
  }

  sessionLogin(email: string): Observable<void> {
    this.isLoading.set(true);
    return from(signInWithEmailAndPassword(this.afAuth, email, email)).pipe(
      switchMap(userCredential => from(userCredential.user.getIdToken())),
      switchMap(token => this.http.post(`${this.apiUrl}/session-login`, { idToken: token })),
      tap(() => {
        // SUCCESS: Both Firebase and Backend login OK
        this.notificationService.showSuccess('Inicio de sesión exitoso.');
        // Navigate AFTER backend confirmation
        this.router.navigate(['/tasks']);
      }),
      map(() => void 0),
      catchError(err => {
        this.notificationService.showError(err.error?.message || 'Error en inicio de sesión');
        console.error('sessionLogin Error:', err);
        signOut(this.afAuth).catch(e => console.error("Firebase sign out failed after login error:", e));
        return throwError(() => err);
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  signUp(email: string): Observable<void> {
    this.isLoading.set(true);
    return this.http.post<{ customToken: string }>(`${this.apiUrl}/sign-up`, { email }).pipe(
      tap(res => console.log('signUp: Received response from /sign-up endpoint.', res)),
      switchMap(res => {
        if (!res?.customToken) {
          console.error('signUp Error: No custom token received from backend.');
          return throwError(() => new Error('No custom token received from backend.'));
        }
        return from(signInWithCustomToken(this.afAuth, res.customToken));
      }),
      switchMap(userCredential => {
        return from(userCredential.user.getIdToken()); // Returns idToken (string)
      }),
      switchMap(idToken => {
        return this.http.post(`${this.apiUrl}/session-login`, { idToken });
      }),
      tap(() => {
        this.notificationService.showSuccess('Usuario creado e inicio de sesión exitoso.');
        this.router.navigate(['/tasks']);
      }),
      map(() => void 0),
      catchError(err => {
        this.notificationService.showError(err.error?.message || 'Error al crear usuario');
        console.error('signUp Error:', err);
        return throwError(() => err);
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  logout(): Observable<void> {
    this.isLoading.set(true);
    const backendLogout$ = this.http.post(`${this.apiUrl}/session-logout`, {}).pipe(
        catchError(err => {
            console.warn('Backend session logout failed:', err);
            return of(null);
        })
    );
    const firebaseSignOut$ = from(signOut(this.afAuth)).pipe(
         catchError(err => {
             console.error('Firebase sign out failed:', err);
             return of(null);
         })
    );

    return backendLogout$.pipe(
      switchMap(() => firebaseSignOut$),
      tap(() => {
        this.notificationService.showSuccess('Sesión cerrada.');
      }),
      map(() => void 0),
      catchError(err => {
        this.notificationService.showError('Error inesperado al cerrar sesión.');
        console.error('logout orchestration Error:', err);
        this.currentUser.set(null);
        return throwError(() => err);
      }),
       finalize(() => {
          this.isLoading.set(false);
          if (!this.router.url.startsWith('/login')) {
             this.router.navigate(['/login']);
          }
       })
    );
  }
}