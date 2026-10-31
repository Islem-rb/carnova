import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap, catchError, map, of, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Api } from '../core/api';
import { Ui } from '../core/ui';
import { Listing, ListingPage, imageUrl, label, price, errorMessage } from '../core/models';
import { Icon } from '../shared/icon';
import { CarCard } from '../shared/card';
import { Viewer } from '../shared/viewer';
@Component({ imports: [RouterLink, Icon, CarCard, Viewer], templateUrl: './detail.html' })
export class Detail {
  private readonly api = inject(Api);
  readonly ui = inject(Ui);
  readonly car = signal<Listing | null>(null);
  readonly activeImage = signal('');
  readonly related = signal<Listing[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly imageUrl = imageUrl;
  readonly label = label;
  readonly price = price;
  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(
        tap(() => {
          this.loading.set(true);
          this.activeImage.set('');
          this.error.set('');
          this.car.set(null);
          this.related.set([]);
        }),
        switchMap((params) =>
          this.api.get<Listing>('/annonces/' + params.get('id')).pipe(
            catchError((e) => {
              this.error.set(errorMessage(e));
              return of(null);
            }),
            tap((car) => {
              this.car.set(car);
              this.loading.set(false);
            }),
            switchMap((car) =>
              car
                ? this.api.get<ListingPage>('/annonces/search', { size: 4 }).pipe(
                    map((result) => result.items.filter((item) => item.id !== car.id).slice(0, 3)),
                    catchError(() => of([] as Listing[])),
                  )
                : of([] as Listing[]),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((related) => this.related.set(related));
  }
  specs(c: Listing) {
    return [
      { title: 'Année', value: c.annee?.toString() ?? 'Non précisée' },
      {
        title: 'Kilométrage',
        value:
          c.kilometrage == null ? 'Non précisé' : c.kilometrage.toLocaleString('fr-FR') + ' km',
      },
      { title: 'Énergie', value: label(c.carburant) },
      { title: 'Transmission', value: label(c.boiteVitesse) },
      { title: 'Carrosserie', value: label(c.typeVehicule) },
      { title: 'Couleur', value: c.couleur || 'Non précisée' },
    ];
  }
  fallback(e: Event) {
    (e.target as HTMLImageElement).src = '/assets/placeholder.svg';
  }
  async share() {
    try {
      await navigator.clipboard.writeText(location.href);
      this.ui.notify('Lien de l’annonce copié.');
    } catch {
      this.ui.notify('Copiez l’adresse de cette page pour partager l’annonce.');
    }
  }
}
