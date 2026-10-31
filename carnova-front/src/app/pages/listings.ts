import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { brands, cities, ListingPage, errorMessage } from '../core/models';
import { CarCard } from '../shared/card';
import { Icon } from '../shared/icon';
import { switchMap, tap, catchError, of } from 'rxjs';
@Component({ imports: [ReactiveFormsModule, CarCard, Icon], templateUrl: './listings.html' })
export class Listings {
  private readonly api = inject(Api);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly brands = brands;
  readonly cities = cities;
  readonly mobileFilters = signal(false);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly result = signal<ListingPage>({ items: [], total: 0, page: 0, pages: 0 });
  readonly filters = inject(FormBuilder).nonNullable.group({
    q: '',
    marque: '',
    typeVehicule: '',
    maxPrice: '',
    carburant: '',
    ville: '',
    minYear: '',
    maxKm: '',
    sort: 'recent',
    typeAnnonce: '',
  });
  constructor() {
    this.route.queryParamMap
      .pipe(
        takeUntilDestroyed(),
        tap((params) => {
          const value: Record<string, string> = {};
          for (const key of Object.keys(this.filters.controls))
            value[key] = params.get(key) ?? (key === 'sort' ? 'recent' : '');
          this.filters.patchValue(value);
          this.loading.set(true);
          this.error.set('');
        }),
        switchMap((params) => {
          const query: Record<string, string> = {};
          params.keys.forEach((k) => {
            const v = params.get(k);
            if (v) query[k] = v;
          });
          return this.api.get<ListingPage>('/annonces/search', query).pipe(
            catchError((e) => {
              this.error.set(errorMessage(e));
              return of({ items: [], total: 0, page: 0, pages: 0 });
            }),
          );
        }),
      )
      .subscribe((r) => {
        this.result.set(r);
        this.loading.set(false);
      });
  }
  apply() {
    this.mobileFilters.set(false);
    void this.router
      .navigate([], { relativeTo: this.route, queryParams: this.values() })
      .then((changed) => {
        if (!changed) {
          this.reload();
        }
      });
  }
  private reload() {
    this.loading.set(true);
    this.error.set('');
    this.api.get<ListingPage>('/annonces/search', this.values()).subscribe({
      next: (r) => {
        this.result.set(r);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }
  private values(): Record<string, string> {
    const query: Record<string, string> = {};
    Object.entries(this.filters.getRawValue()).forEach(([k, v]) => {
      if (v !== '' && v != null) query[k] = String(v);
    });
    return query;
  }
  reset() {
    this.filters.reset();
    this.filters.controls.sort.setValue('recent');
    this.apply();
  }
  page(value: number) {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...this.values(), page: value },
    });
    window.scrollTo({
      top: 120,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }
}
