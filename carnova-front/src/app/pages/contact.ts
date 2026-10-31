import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { Ui } from '../core/ui';
import { errorMessage } from '../core/models';
import { Icon } from '../shared/icon';
@Component({ imports: [ReactiveFormsModule, RouterLink, Icon], templateUrl: './contact.html' })
export class Contact {
  private readonly api = inject(Api);
  readonly ui = inject(Ui);
  readonly sent = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(3000)]],
  });
  invalid(k: keyof typeof this.form.controls) {
    return this.form.controls[k].invalid && this.form.controls[k].touched;
  }
  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.api.post('/contact', this.form.getRawValue()).subscribe({
      next: () => {
        this.sent.set(true);
        this.busy.set(false);
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.busy.set(false);
      },
    });
  }
}
