import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { Api } from '../core/api';
import { Auth } from '../core/auth';
import { Ui } from '../core/ui';
import { Listing, Showroom, price, label, imageUrl, errorMessage } from '../core/models';
import { Icon } from '../shared/icon';
import { CarCard } from '../shared/card';
@Component({ imports: [RouterLink, Icon, CarCard], templateUrl: './account.html' })
export class Account {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  readonly auth = inject(Auth);
  readonly ui = inject(Ui);
  readonly cars = signal<Listing[]>([]);
  readonly favorites = signal<Listing[]>([]);
  readonly showrooms = signal<Showroom[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly tab = signal('annonces');
  readonly busy = signal<number | null>(null);
  readonly pendingDelete = signal('');
  readonly price = price;
  readonly label = label;
  readonly imageUrl = imageUrl;
  readonly tabs = [
    { value: 'annonces', text: 'Mes annonces' },
    { value: 'favoris', text: 'Mes favoris' },
    { value: 'showrooms', text: 'Mes showrooms' },
  ];
  constructor() {
    this.load();
  }
  firstName() {
    return this.auth.session()?.name.split(' ')[0] ?? 'à vous';
  }
  available() {
    return this.cars().filter((c) => c.statut === 'DISPONIBLE').length;
  }
  visibleFavorites() {
    return this.favorites().filter((c) => this.ui.saved().includes(c.id));
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      cars: this.api.get<Listing[]>('/annonces/my-annonces'),
      showrooms: this.api.get<Showroom[]>('/showrooms/me'),
      favorites: this.ui.saved().length
        ? forkJoin(
            this.ui
              .saved()
              .map((id) =>
                this.api.get<Listing>('/annonces/' + id).pipe(catchError(() => of(null))),
              ),
          )
        : of([]),
    }).subscribe({
      next: (r) => {
        this.cars.set(r.cars);
        this.showrooms.set(r.showrooms);
        this.favorites.set(r.favorites.filter((c): c is Listing => c !== null));
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }
  logout() {
    this.auth.logout();
    void this.router.navigate(['/']);
  }
  cancelDelete() {
    this.pendingDelete.set('');
  }
  status(c: Listing, e: Event) {
    const input = e.target as HTMLSelectElement;
    this.busy.set(c.id);
    this.api.patch<Listing>('/annonces/' + c.id + '/status', { statut: input.value }).subscribe({
      next: (r) => {
        this.cars.update((list) => list.map((x) => (x.id === r.id ? r : x)));
        this.busy.set(null);
        this.ui.notify('Statut de l’annonce mis à jour.');
      },
      error: (err) => {
        input.value = c.statut;
        this.error.set(errorMessage(err));
        this.busy.set(null);
      },
    });
  }
  deleteCar(id: number) {
    this.busy.set(id);
    this.api.delete('/annonces/' + id).subscribe({
      next: () => {
        this.cars.update((list) => list.filter((c) => c.id !== id));
        this.busy.set(null);
        this.cancelDelete();
        this.ui.notify('Annonce supprimée.');
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.busy.set(null);
      },
    });
  }
  deleteShowroom(id: number) {
    this.busy.set(id);
    this.api.delete('/showrooms/' + id).subscribe({
      next: () => {
        this.showrooms.update((list) => list.filter((c) => c.id !== id));
        this.busy.set(null);
        this.cancelDelete();
        this.ui.notify('Showroom supprimé.');
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.busy.set(null);
      },
    });
  }
}
