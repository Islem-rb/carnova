import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { Ui } from '../core/ui';
import { brands, cities, ListingPage, Listing, News, errorMessage, imageUrl } from '../core/models';
import { CarCard } from '../shared/card';
import { Icon } from '../shared/icon';
@Component({
  imports: [RouterLink, ReactiveFormsModule, CarCard, Icon],
  templateUrl: './home.html',
})
export class Home {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  readonly ui = inject(Ui);
  readonly brands = brands;
  readonly cities = cities;
  readonly imageUrl = imageUrl;
  readonly type = signal('VENTE');
  readonly category = signal('');
  readonly cars = signal<Listing[]>([]);
  readonly news = signal<News[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly types = [
    { value: 'VENTE', text: 'Acheter une voiture' },
    { value: 'LOCATION', text: 'Louer' },
    { value: 'ACHAT', text: 'Demandes d’achat' },
  ];
  readonly categories = [
    { value: '', text: 'Toutes les envies' },
    { value: 'BERLINE', text: 'Berlines' },
    { value: 'SUV', text: 'SUV & 4×4' },
    { value: 'COUPE', text: 'Coupés' },
    { value: 'ELECTRIQUE', text: 'Électriques' },
  ];
  readonly search = inject(FormBuilder).nonNullable.group({
    marque: '',
    q: '',
    maxPrice: '',
    ville: '',
  });
  constructor() {
    this.load();
    this.api
      .get<News[]>('/news', { limit: 3 })
      .subscribe({ next: (n) => this.news.set(n), error: () => {} });
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    const value = this.category();
    this.api
      .get<ListingPage>('/annonces/search', {
        size: 3,
        ...(value === 'ELECTRIQUE' ? { carburant: value } : value ? { typeVehicule: value } : {}),
      })
      .subscribe({
        next: (r) => {
          this.cars.set(r.items);
          this.loading.set(false);
        },
        error: (e) => {
          this.error.set(errorMessage(e));
          this.loading.set(false);
        },
      });
  }
  selectCategory(value: string) {
    this.category.set(value);
    this.load();
  }
  find() {
    void this.router.navigate(['/annonces'], {
      queryParams: { ...this.search.getRawValue(), typeAnnonce: this.type() },
    });
  }
  brandValue(value: string) {
    return (
      ({ PORSCHE: 'Porsche', AUDI: 'Audi', 'LAND ROVER': 'Land Rover' } as Record<string, string>)[
        value
      ] ?? value
    );
  }
}
