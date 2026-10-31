import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Api } from '../core/api';
import { Showroom, errorMessage, imageUrl } from '../core/models';
import { Icon } from '../shared/icon';
@Component({ imports: [RouterLink, ReactiveFormsModule, Icon], templateUrl: './showrooms.html' })
export class Showrooms {
  private readonly api = inject(Api);
  readonly imageUrl = imageUrl;
  readonly search = new FormControl('', { nonNullable: true });
  private readonly query = toSignal(this.search.valueChanges, { initialValue: '' });
  readonly items = signal<Showroom[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly filtered = computed(() => {
    const q = this.query().toLocaleLowerCase('fr');
    return this.items().filter((s) => (s.nom + ' ' + s.ville).toLocaleLowerCase('fr').includes(q));
  });
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    this.api.get<Showroom[]>('/showrooms').subscribe({
      next: (r) => {
        this.items.set(r);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }
}
