import '@angular/compiler';
import {
  createEnvironmentInjector,
  EnvironmentInjector,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Api } from '../core/api';
import { Site } from '../core/site';
import { Auth } from '../core/auth';
import { Profile } from '../core/models';
import { Settings } from './settings';
const injectors: EnvironmentInjector[] = [];
afterEach(() => {
  injectors.splice(0).forEach((x) => x.destroy());
  vi.useRealTimers();
});
const profile: Profile = {
  id: 1,
  email: 'client@example.com',
  name: 'Amine Client',
  prenom: 'Amine',
  nom: 'Client',
  roles: ['ROLE_USER'],
  emailVerified: false,
};
function setup() {
  const api = {
    patch: vi.fn().mockReturnValue(of({ ...profile, name: 'Amine Updated', nom: 'Updated' })),
    post: vi.fn().mockReturnValue(of({})),
  };
  const auth = {
    refreshProfile: vi.fn().mockReturnValue(of(profile)),
    updateProfile: vi.fn(),
    logout: vi.fn(),
  };
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const injector = createEnvironmentInjector(
    [
      FormBuilder,
      { provide: Api, useValue: api },
      { provide: Site, useValue: { emailDelivery: () => true } },
      { provide: Auth, useValue: auth },
      { provide: Router, useValue: router },
    ],
    Injector.NULL as EnvironmentInjector,
  );
  injectors.push(injector);
  return { api, auth, router, component: runInInjectionContext(injector, () => new Settings()) };
}
describe('account settings', () => {
  it('loads the current profile and saves trimmed names into the active session', () => {
    const { component, api, auth } = setup();
    expect(component.profileForm.controls.prenom.value).toBe('Amine');
    component.profileForm.controls.nom.setValue(' Updated ');
    component.saveProfile();
    expect(api.patch).toHaveBeenCalledWith('/auth/me', { prenom: 'Amine', nom: 'Updated' });
    expect(auth.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Amine Updated' }),
    );
    expect(component.profileForm.dirty).toBe(false);
    expect(component.profileSuccess()).not.toBe('');
  });
  it('rejects whitespace-only profile names', () => {
    const { component, api } = setup();
    component.profileForm.controls.prenom.setValue('   ');
    component.saveProfile();
    expect(api.patch).not.toHaveBeenCalled();
  });
  it('keeps the user signed in on an incorrect current password', () => {
    const { component, api, auth } = setup();
    api.post.mockReturnValue(
      throwError(() => ({
        status: 400,
        error: { message: 'Le mot de passe actuel est incorrect.' },
      })),
    );
    component.passwordForm.setValue({
      currentPassword: 'WrongPassword123!',
      newPassword: 'NewPassword123!',
      confirmPassword: 'NewPassword123!',
    });
    component.changePassword();
    expect(auth.logout).not.toHaveBeenCalled();
    expect(component.passwordError()).toContain('actuel est incorrect');
    expect(component.passwordBusy()).toBe(false);
  });
  it('clears passwords and returns to sign-in after a successful password change', () => {
    const { component, api, auth, router } = setup();
    component.passwordForm.setValue({
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword123!',
      confirmPassword: 'NewPassword123!',
    });
    component.changePassword();
    expect(api.post).toHaveBeenCalledWith('/auth/change-password', {
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword123!',
    });
    expect(auth.logout).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { passwordChanged: '1' },
    });
    expect(component.passwordForm.controls.currentPassword.value).toBe('');
  });
  it('respects the resend cooldown and allows another link after sixty seconds', () => {
    vi.useFakeTimers();
    const { component, api } = setup();
    component.resendVerification();
    component.resendVerification();
    expect(api.post).toHaveBeenCalledOnce();
    expect(component.cooldown()).toBe(60);
    vi.advanceTimersByTime(60000);
    expect(component.cooldown()).toBe(0);
    component.resendVerification();
    expect(api.post).toHaveBeenCalledTimes(2);
  });
  it('does not resend to an already verified address', () => {
    const { component, api } = setup();
    component.profile.set({ ...profile, emailVerified: true });
    component.resendVerification();
    expect(api.post).not.toHaveBeenCalled();
  });
});
