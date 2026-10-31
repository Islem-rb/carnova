import '@angular/compiler';
import {
  createEnvironmentInjector,
  EnvironmentInjector,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Api } from './api';
import { Auth, authInterceptor } from './auth';
import { Profile, Session } from './models';
const injectors: EnvironmentInjector[] = [];
afterEach(() => {
  injectors.splice(0).forEach((x) => x.destroy());
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
function context(providers: Parameters<typeof createEnvironmentInjector>[0]) {
  const injector = createEnvironmentInjector(providers, Injector.NULL as EnvironmentInjector);
  injectors.push(injector);
  return injector;
}
const profile: Profile = {
  id: 1,
  email: 'client@example.com',
  name: 'Amine Updated',
  prenom: 'Amine',
  nom: 'Updated',
  emailVerified: true,
  roles: ['ROLE_USER'],
};
describe('account session updates', () => {
  it('persists profile changes without extending the login expiry or changing its token', () => {
    vi.useFakeTimers();
    const storage = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });
    const response = {
      token: 'unit-test-token',
      id: 1,
      email: profile.email,
      name: 'Amine Client',
      roles: ['ROLE_USER'],
      expiresIn: 3600,
      type: 'Bearer',
    } as Session;
    const injector = context([
      { provide: Api, useValue: { post: () => of(response), get: () => of(profile) } },
    ]);
    const auth = runInInjectionContext(injector, () => new Auth());
    auth.signin(profile.email, 'Password123!').subscribe();
    const expires = auth.session()!.expiresAt;
    vi.advanceTimersByTime(1000);
    auth.refreshProfile().subscribe();
    expect(auth.session()?.name).toBe('Amine Updated');
    expect(auth.session()?.token).toBe('unit-test-token');
    expect(auth.session()?.expiresAt).toBe(expires);
    expect(JSON.parse(storage.get('carnova-session')!).name).toBe('Amine Updated');
    auth.logout();
    auth.updateProfile(profile);
    expect(auth.session()).toBeNull();
  });
});
describe('auth interceptor account flows', () => {
  function request(path: string, status?: number) {
    const auth = { session: () => ({ token: 'unit-test-token' }), logout: vi.fn() };
    const router = { url: '/espace/parametres', navigate: vi.fn().mockResolvedValue(true) };
    const injector = context([
      { provide: Auth, useValue: auth },
      { provide: Router, useValue: router },
    ]);
    const next = vi.fn((_request: HttpRequest<unknown>) =>
      status
        ? throwError(() => new HttpErrorResponse({ status }))
        : of(new HttpResponse({ status: 200 })),
    );
    runInInjectionContext(injector, () =>
      authInterceptor(new HttpRequest('POST', path, {}), next),
    ).subscribe({ error: () => {} });
    return { auth, router, sent: next.mock.calls[0]?.[0] as HttpRequest<unknown> };
  }
  it.each([
    '/api/auth/signin',
    '/api/auth/signup',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email',
  ])('keeps expired session tokens off the public endpoint %s', (path) => {
    const { auth, sent } = request(path, 401);
    expect(sent.headers.has('Authorization')).toBe(false);
    expect(auth.logout).not.toHaveBeenCalled();
  });
  it('sends authentication on protected settings requests', () => {
    expect(request('/api/auth/me').sent.headers.get('Authorization')).toBe(
      'Bearer unit-test-token',
    );
  });
  it('logs out a revoked protected session', () => {
    const { auth, router } = request('/api/auth/me', 401);
    expect(auth.logout).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledOnce();
  });
  it('keeps the session when the current password is incorrect', () => {
    expect(request('/api/auth/change-password', 400).auth.logout).not.toHaveBeenCalled();
  });
  it('does not attach the session token to other origins', () => {
    expect(request('https://example.test/resource').sent.headers.has('Authorization')).toBe(false);
  });
});
