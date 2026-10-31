import { describe, it, expect } from 'vitest';
import { imageUrl, price, label, errorMessage } from './models';
describe('public content rendering', () => {
  it('accepts local marketplace and uploaded images', () => {
    expect(imageUrl('/assets/market/bmw.webp')).toBe('/assets/market/bmw.webp');
    expect(imageUrl('/uploads/a.png')).toBe('/uploads/a.png');
    expect(imageUrl('/api/annonces/uploads/a.png')).toBe('/api/annonces/uploads/a.png');
  });
  it.each([
    'https://tracker.example/car.png',
    '//tracker.example/car.png',
    'javascript:alert(1)',
    'data:image/svg+xml,bad',
    '/uploads/../../.env',
    null,
    undefined,
  ])('uses a safe fallback for untrusted image URL %s', (value) => {
    expect(imageUrl(value)).toBe('/assets/placeholder.svg');
  });
  it('keeps unknown legacy prices distinct from zero', () => {
    expect(price(null)).toBe('Prix sur demande');
    expect(price(148000)).toContain('148');
    expect(price(148000)).toContain('TND');
  });
  it('uses readable French labels and preserves unknown legacy values', () => {
    expect(label('ELECTRIQUE')).toBe('Électrique');
    expect(label(null)).toBe('Non précisé');
    expect(label('COLLECTION')).toBe('COLLECTION');
  });
  it('provides actionable network failures and safe server errors', () => {
    expect(errorMessage({ status: 0 })).toContain('Connexion');
    expect(errorMessage({ status: 400, error: { message: 'Vérifiez les champs.' } })).toBe(
      'Vérifiez les champs.',
    );
    expect(errorMessage(new Error('internal trace'))).not.toContain('internal trace');
  });
});
