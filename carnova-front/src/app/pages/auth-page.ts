import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth } from '../core/auth';
import { errorMessage } from '../core/models';
import { Icon } from '../shared/icon';
import { nonBlank, passwordBytes } from '../core/password';
@Component({
  imports: [ReactiveFormsModule, RouterLink, Icon],
  styleUrls: ['./auth.css'],
  templateUrl: './auth-page.html',
})
export class AuthPage {
  private readonly auth = inject(Auth);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly signup = signal(false);
  readonly success = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  readonly passwordChanged = this.route.snapshot.queryParamMap.has('passwordChanged');
  readonly expired = this.route.snapshot.queryParamMap.has('expired');
  readonly form = inject(FormBuilder).nonNullable.group({
    prenom: [''],
    nom: [''],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.maxLength(72)]],
  });
  constructor() {
    this.route.data.pipe(takeUntilDestroyed()).subscribe((data) => {
      this.signup.set(data['signup'] === true);
      this.success.set(false);
      this.error.set('');
      for (const k of ['prenom', 'nom'] as const) {
        const c = this.form.controls[k];
        c.setValidators(
          this.signup() ? [Validators.required, nonBlank, Validators.maxLength(80)] : [],
        );
        c.updateValueAndValidity();
      }
      const p = this.form.controls.password;
      p.setValidators([
        Validators.required,
        Validators.maxLength(72),
        passwordBytes,
        ...(this.signup() ? [Validators.minLength(10)] : []),
      ]);
      p.updateValueAndValidity();
    });
  }
  invalid(k: keyof typeof this.form.controls) {
    const c = this.form.controls[k];
    return c.invalid && c.touched;
  }
  returnParams() {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    return url && url.startsWith('/') && !url.startsWith('//') ? { returnUrl: url } : {};
  }
  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    const v = this.form.getRawValue();
    if (this.signup()) {
      this.auth.signup(v).subscribe({
        next: () => {
          this.success.set(true);
          this.busy.set(false);
          this.form.controls.password.reset();
        },
        error: (e) => {
          this.error.set(errorMessage(e));
          this.busy.set(false);
        },
      });
    } else {
      this.auth.signin(v.email, v.password).subscribe({
        next: () => {
          this.busy.set(false);
          const url = this.returnParams().returnUrl;
          void this.router.navigateByUrl(url ?? '/espace');
        },
        error: (e) => {
          this.error.set(errorMessage(e));
          this.busy.set(false);
        },
      });
    }
  }
}
