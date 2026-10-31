import '@angular/compiler';
import {
  createEnvironmentInjector,
  EnvironmentInjector,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Api } from '../core/api';
import { Auth } from '../core/auth';
import { Recovery } from './recovery';
const injectors: EnvironmentInjector[] = [];
afterEach(() => injectors.splice(0).forEach((x) => x.destroy()));
function setup(mode: 'forgot' | 'reset' | 'verify', token = 'x'.repeat(43)) {
  const api = { post: vi.fn().mockReturnValue(of({})) };
  const auth = {
    signedIn: () => false,
    logout: vi.fn(),
    refreshProfile: vi.fn().mockReturnValue(of({})),
  };
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const injector = createEnvironmentInjector(
    [
      FormBuilder,
      { provide: Api, useValue: api },
      { provide: Auth, useValue: auth },
      { provide: Router, useValue: router },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { data: { recovery: mode }, fragment: token ? 'token=' + token : null },
        },
      },
    ],
    Injector.NULL as EnvironmentInjector,
  );
  injectors.push(injector);
  return { api, auth, router, component: runInInjectionContext(injector, () => new Recovery()) };
}
describe('account recovery', () => {
  it('clears the bearer fragment and waits for explicit verification', () => {
    const { component, api, router } = setup('verify');
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ fragment: undefined, replaceUrl: true }),
    );
    expect(api.post).not.toHaveBeenCalled();
    component.submit();
    component.submit();
    expect(api.post).toHaveBeenCalledOnce();
    expect(api.post).toHaveBeenCalledWith('/auth/verify-email', { token: 'x'.repeat(43) });
    expect(component.success()).toBe(true);
  });
  it('does not submit missing or malformed verification links', () => {
    for (const token of ['', 'invalid']) {
      const { component, api } = setup('verify', token);
      component.submit();
      expect(api.post).not.toHaveBeenCalled();
    }
  });
  it('requires matching valid passwords and sends only the new password and link token', () => {
    const { component, api, auth } = setup('reset');
    component.passwordForm.setValue({
      newPassword: 'NewPassword123!',
      confirmPassword: 'Mismatch123!',
    });
    component.submit();
    expect(api.post).not.toHaveBeenCalled();
    component.passwordForm.controls.confirmPassword.setValue('NewPassword123!');
    component.submit();
    expect(api.post).toHaveBeenCalledWith('/auth/reset-password', {
      token: 'x'.repeat(43),
      newPassword: 'NewPassword123!',
    });
    expect(auth.logout).toHaveBeenCalledOnce();
    expect(component.passwordForm.controls.newPassword.value).toBe('');
  });
  it('shows the server error when a link expires', () => {
    const { component, api } = setup('verify');
    api.post.mockReturnValue(
      throwError(() => ({ status: 400, error: { message: 'Ce lien a expiré.' } })),
    );
    component.submit();
    expect(component.success()).toBe(false);
    expect(component.error()).toBe('Ce lien a expiré.');
    expect(component.busy()).toBe(false);
  });
  it('does not reveal whether a reset email belongs to an account', () => {
    const { component, api } = setup('forgot', '');
    component.emailForm.controls.email.setValue('client@example.com');
    component.submit();
    expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'client@example.com' });
    expect(component.success()).toBe(true);
  });
  it('blocks duplicate requests while a previous request is outstanding', () => {
    const { component, api } = setup('verify');
    const pending = new Subject();
    api.post.mockReturnValue(pending);
    component.submit();
    component.submit();
    expect(api.post).toHaveBeenCalledOnce();
    pending.next({});
    pending.complete();
    expect(component.busy()).toBe(false);
  });
});
