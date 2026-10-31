import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { Api } from '../core/api';
import { Auth } from '../core/auth';
import { errorMessage } from '../core/models';
import { matchingPasswords, passwordBytes } from '../core/password';
import { Icon } from '../shared/icon';

@Component({
  imports: [ReactiveFormsModule, RouterLink, Icon],
  styleUrls: ['./auth.css', './recovery.css'],
  templateUrl: './recovery.html',
})
export class Recovery {
  private readonly api = inject(Api);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(Auth);
  readonly mode = this.route.snapshot.data['recovery'] as 'forgot' | 'reset' | 'verify';
  private readonly token =
    new URLSearchParams(this.route.snapshot.fragment ?? '').get('token') ?? '';
  readonly hasToken = /^[A-Za-z0-9_-]{43}$/.test(this.token);
  readonly busy = signal(false);
  readonly success = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  readonly emailForm = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
  });
  readonly passwordForm = inject(FormBuilder).nonNullable.group(
    {
      newPassword: [
        '',
        [Validators.required, Validators.minLength(10), Validators.maxLength(72), passwordBytes],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: matchingPasswords },
  );
  constructor() {
    if (this.route.snapshot.fragment)
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParamsHandling: 'preserve',
        replaceUrl: true,
        fragment: undefined,
      });
  }
  invalidPassword() {
    return (
      this.passwordForm.controls.newPassword.touched &&
      this.passwordForm.controls.newPassword.invalid
    );
  }
  mismatch() {
    return (
      this.passwordForm.controls.confirmPassword.touched &&
      (this.passwordForm.controls.confirmPassword.invalid ||
        this.passwordForm.hasError('passwordMismatch'))
    );
  }
  submit() {
    if (this.busy() || this.success()) return;
    const form = this.mode === 'forgot' ? this.emailForm : this.passwordForm;
    if (this.mode !== 'verify') {
      form.markAllAsTouched();
      if (form.invalid) return;
    }
    if (this.mode !== 'forgot' && !this.hasToken) return;
    this.busy.set(true);
    this.error.set('');
    const request =
      this.mode === 'forgot'
        ? this.api.post('/auth/forgot-password', this.emailForm.getRawValue())
        : this.mode === 'reset'
          ? this.api.post('/auth/reset-password', {
              token: this.token,
              newPassword: this.passwordForm.controls.newPassword.value,
            })
          : this.api.post('/auth/verify-email', { token: this.token });
    request
      .pipe(
        switchMap(() =>
          this.mode === 'verify' && this.auth.signedIn()
            ? this.auth.refreshProfile().pipe(catchError(() => of(null)))
            : of(null),
        ),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: () => {
          this.success.set(true);
          this.passwordForm.reset();
          if (this.mode === 'reset') this.auth.logout();
        },
        error: (e) => this.error.set(errorMessage(e)),
      });
  }
}
