import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const passwordBytes: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && new TextEncoder().encode(control.value).length > 72
    ? { passwordBytes: true }
    : null;

export const nonBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && !control.value.trim() ? { required: true } : null;

export const matchingPasswords: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null =>
  control.get('newPassword')?.value === control.get('confirmPassword')?.value
    ? null
    : { passwordMismatch: true };
