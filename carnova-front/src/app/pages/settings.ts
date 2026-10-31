import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, take, timer } from 'rxjs';
import { Api } from '../core/api';
import { Site } from '../core/site';
import { Auth } from '../core/auth';
import { Profile, errorMessage } from '../core/models';
import { matchingPasswords, nonBlank, passwordBytes } from '../core/password';
import { Icon } from '../shared/icon';

@Component({
  imports: [ReactiveFormsModule, RouterLink, Icon],
  styleUrls: ['./settings.css'],
  templateUrl: './settings.html',
})
export class Settings {
  private readonly api = inject(Api);
  readonly site = inject(Site);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(Auth);
  readonly profile = signal<Profile | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly profileBusy = signal(false);
  readonly profileError = signal('');
  readonly profileSuccess = signal('');
  readonly passwordBusy = signal(false);
  readonly passwordError = signal('');
  readonly verificationBusy = signal(false);
  readonly verificationError = signal('');
  readonly verificationSuccess = signal('');
  readonly cooldown = signal(0);
  readonly showPassword = signal(false);
  readonly profileForm = inject(FormBuilder).nonNullable.group({
    prenom: ['', [Validators.required, nonBlank, Validators.maxLength(80)]],
    nom: ['', [Validators.required, nonBlank, Validators.maxLength(80)]],
  });
  readonly passwordForm = inject(FormBuilder).nonNullable.group(
    {
      currentPassword: ['', [Validators.required, Validators.maxLength(72), passwordBytes]],
      newPassword: [
        '',
        [Validators.required, Validators.minLength(10), Validators.maxLength(72), passwordBytes],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: matchingPasswords },
  );
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.loadError.set('');
    this.auth
      .refreshProfile()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.profileForm.reset({ prenom: profile.prenom, nom: profile.nom });
        },
        error: (e) => this.loadError.set(errorMessage(e)),
      });
  }
  invalidName(key: 'prenom' | 'nom') {
    return this.profileForm.controls[key].touched && this.profileForm.controls[key].invalid;
  }
  invalidPassword(key: 'currentPassword' | 'newPassword' | 'confirmPassword') {
    const field = this.passwordForm.controls[key];
    return (
      field.touched &&
      (field.invalid ||
        (key === 'confirmPassword' && this.passwordForm.hasError('passwordMismatch')))
    );
  }
  saveProfile() {
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid || this.profileBusy() || !this.profile()) return;
    this.profileBusy.set(true);
    this.profileError.set('');
    this.profileSuccess.set('');
    const value = this.profileForm.getRawValue();
    this.api
      .patch<Profile>('/auth/me', { prenom: value.prenom.trim(), nom: value.nom.trim() })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.profileBusy.set(false)),
      )
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.auth.updateProfile(profile);
          this.profileForm.reset({ prenom: profile.prenom, nom: profile.nom });
          this.profileSuccess.set('Votre profil a été mis à jour.');
        },
        error: (e) => this.profileError.set(errorMessage(e)),
      });
  }
  changePassword() {
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid || this.passwordBusy()) return;
    this.passwordBusy.set(true);
    this.passwordError.set('');
    const value = this.passwordForm.getRawValue();
    this.api
      .post('/auth/change-password', {
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.passwordBusy.set(false)),
      )
      .subscribe({
        next: () => {
          this.passwordForm.reset();
          this.auth.logout();
          void this.router.navigate(['/login'], { queryParams: { passwordChanged: '1' } });
        },
        error: (e) => this.passwordError.set(errorMessage(e)),
      });
  }
  resendVerification() {
    if (this.verificationBusy() || this.cooldown() > 0 || this.profile()?.emailVerified) return;
    this.verificationBusy.set(true);
    this.verificationError.set('');
    this.verificationSuccess.set('');
    this.api
      .post('/auth/verification-email', {})
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.verificationBusy.set(false)),
      )
      .subscribe({
        next: () => {
          this.verificationSuccess.set(
            'Un lien de confirmation vous sera envoyé. Il est valable 24 heures.',
          );
          this.startCooldown();
        },
        error: (e) => {
          this.verificationError.set(errorMessage(e));
          if (e.status === 429) this.startCooldown();
        },
      });
  }
  private startCooldown() {
    this.cooldown.set(60);
    timer(1000, 1000)
      .pipe(take(60), takeUntilDestroyed(this.destroyRef))
      .subscribe((i) => this.cooldown.set(59 - i));
  }
}
