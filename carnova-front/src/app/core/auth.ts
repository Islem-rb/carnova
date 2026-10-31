import { computed, inject, Injectable, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { Api } from './api';
import { Session } from './models';
function restore(): Session | null {
  try {
    const s = JSON.parse(sessionStorage.getItem('carnova-session') ?? 'null') as Session | null;
    return s && typeof s.token === 'string' && s.expiresAt > Date.now() ? s : null;
  } catch {
    return null;
  }
}
@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly api = inject(Api);
  readonly session = signal<Session | null>(restore());
  readonly signedIn = computed(() => this.session() !== null);
  readonly isAdmin = computed(() => this.session()?.roles.includes('ROLE_ADMIN') ?? false);
  private timer: ReturnType<typeof setTimeout> | undefined;
  constructor() {
    this.scheduleExpiry();
  }
  signin(email: string, password: string) {
    return this.api.post<Session>('/auth/signin', { email, password }).pipe(
      tap((s) => {
        const value = { ...s, expiresAt: Date.now() + s.expiresIn * 1000 };
        this.session.set(value);
        try {
          sessionStorage.setItem('carnova-session', JSON.stringify(value));
        } catch {}
        this.scheduleExpiry();
      }),
    );
  }
  signup(body: { nom: string; prenom: string; email: string; password: string }) {
    return this.api.post<{ message: string }>('/auth/signup', body);
  }
  logout() {
    this.session.set(null);
    try {
      sessionStorage.removeItem('carnova-session');
    } catch {}
    clearTimeout(this.timer);
  }
  private scheduleExpiry() {
    clearTimeout(this.timer);
    const s = this.session();
    if (s) this.timer = setTimeout(() => this.logout(), Math.max(0, s.expiresAt - Date.now()));
  }
}
export const authGuard: CanActivateFn = (_, state) =>
  inject(Auth).signedIn() ||
  inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
export const adminGuard: CanActivateFn = (_, state) => {
  const a = inject(Auth);
  const r = inject(Router);
  return !a.signedIn()
    ? r.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })
    : a.isAdmin() || r.createUrlTree(['/espace']);
};
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const token = auth.session()?.token;
  const local = request.url.startsWith('/api/');
  return next(
    token && local ? request.clone({ setHeaders: { Authorization: 'Bearer ' + token } }) : request,
  ).pipe(
    catchError((e) => {
      if (e.status === 401 && token && local) {
        auth.logout();
        void router.navigate(['/login'], { queryParams: { returnUrl: router.url, expired: '1' } });
      }
      return throwError(() => e);
    }),
  );
};
