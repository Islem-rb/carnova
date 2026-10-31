import { Injectable, signal } from '@angular/core';
function saved(): number[] {
  try {
    const x: unknown = JSON.parse(localStorage.getItem('carnova-saved') ?? '[]');
    return Array.isArray(x)
      ? x.filter((v): v is number => typeof v === 'number').slice(0, 100)
      : [];
  } catch {
    return [];
  }
}
@Injectable({ providedIn: 'root' })
export class Ui {
  readonly theme = signal(document.documentElement.dataset['theme'] ?? 'light');
  readonly saved = signal<number[]>(saved());
  readonly toast = signal('');
  readonly assistant = signal(false);
  readonly assistantListing = signal<number | undefined>(undefined);
  readonly demo = signal(false);
  private toastTimer: ReturnType<typeof setTimeout> | undefined;
  toggleTheme() {
    const t = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(t);
    document.documentElement.dataset['theme'] = t;
    try {
      localStorage.setItem('carnova-theme', t);
    } catch {}
  }
  toggleSave(id: number) {
    const list = this.saved().includes(id)
      ? this.saved().filter((x) => x !== id)
      : [...this.saved(), id].slice(-100);
    this.saved.set(list);
    try {
      localStorage.setItem('carnova-saved', JSON.stringify(list));
    } catch {}
    this.notify(list.includes(id) ? 'Ajoutée à vos favoris.' : 'Retirée des favoris.');
  }
  notify(message: string) {
    this.toast.set(message);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 4500);
  }
  openAssistant(id?: number) {
    this.assistantListing.set(id);
    this.assistant.set(true);
  }
}
