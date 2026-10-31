import '@angular/compiler';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { matchingPasswords, nonBlank, passwordBytes } from './password';

describe('account form validation', () => {
  it('enforces the BCrypt byte limit for ASCII, accents and emoji', () => {
    for (const value of ['x'.repeat(72), 'é'.repeat(36), '🚗'.repeat(18)])
      expect(new FormControl(value, passwordBytes).valid).toBe(true);
    for (const value of ['x'.repeat(73), 'é'.repeat(37), '🚗'.repeat(19)])
      expect(new FormControl(value, passwordBytes).hasError('passwordBytes')).toBe(true);
  });
  it('rejects whitespace-only names', () => {
    expect(new FormControl('   ', nonBlank).invalid).toBe(true);
    expect(new FormControl('Amine', nonBlank).valid).toBe(true);
  });
  it('requires matching password confirmation', () => {
    const form = new FormGroup(
      {
        newPassword: new FormControl('Password123!', Validators.required),
        confirmPassword: new FormControl('Different123!', Validators.required),
      },
      matchingPasswords,
    );
    expect(form.hasError('passwordMismatch')).toBe(true);
    form.controls.confirmPassword.setValue('Password123!');
    expect(form.valid).toBe(true);
  });
});
