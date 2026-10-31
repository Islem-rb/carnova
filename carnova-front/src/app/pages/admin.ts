import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Api } from '../core/api';
import { Ui } from '../core/ui';
import { Overview, News, price, label, errorMessage } from '../core/models';
import { Icon } from '../shared/icon';
@Component({ imports: [RouterLink, ReactiveFormsModule, Icon], templateUrl: './admin.html' })
export class Admin {
  private readonly api = inject(Api);
  private readonly ui = inject(Ui);
  readonly data = signal<Overview | null>(null);
  readonly news = signal<News[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly refreshing = signal(false);
  readonly publishing = signal(false);
  readonly deleteId = signal('');
  readonly price = price;
  readonly label = label;
  readonly newsForm = inject(FormBuilder).nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(300)]],
    summary: ['', [Validators.required, Validators.maxLength(3000)]],
    imageUrl: ['/assets/market/hero.webp'],
  });
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    this.api.get<Overview>('/admin/overview').subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
    this.api
      .get<News[]>('/news', { limit: 100, sinceHours: 87600 })
      .subscribe({ next: (n) => this.news.set(n), error: () => {} });
  }
  stats(d: Overview) {
    return [
      { title: 'Comptes', value: d.users, icon: 'user' },
      { title: 'Annonces', value: d.listings, icon: 'car' },
      { title: 'Showrooms', value: d.showrooms, icon: 'store' },
      { title: 'Articles', value: d.news, icon: 'book' },
    ];
  }
  max(d: Overview) {
    return Math.max(...d.months.map((m) => m.count), 1);
  }
  month(value: string) {
    return new Date(value + '-01T12:00:00Z').toLocaleDateString('fr-FR', { month: 'short' });
  }
  chartDescription(d: Overview) {
    return d.months.map((m) => this.month(m.month) + ': ' + m.count + ' annonces').join(', ');
  }
  date(value: string) {
    return new Date(value).toLocaleDateString('fr-FR');
  }
  refresh() {
    this.refreshing.set(true);
    this.api.post<{ inserted: number }>('/news/refresh', {}).subscribe({
      next: (r) => {
        this.ui.notify(r.inserted + ' nouvel(s) article(s).');
        this.refreshing.set(false);
        this.load();
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.refreshing.set(false);
      },
    });
  }
  publish() {
    if (this.newsForm.invalid || this.publishing()) return;
    this.publishing.set(true);
    this.api.post<News>('/news', this.newsForm.getRawValue()).subscribe({
      next: () => {
        this.ui.notify('Article publié.');
        this.publishing.set(false);
        this.newsForm.reset({ imageUrl: '/assets/market/hero.webp' });
        this.load();
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.publishing.set(false);
      },
    });
  }
  removeNews(id: string) {
    this.api.delete('/news/' + id).subscribe({
      next: () => {
        this.deleteId.set('');
        this.ui.notify('Article supprimé.');
        this.load();
      },
      error: (e) => this.error.set(errorMessage(e)),
    });
  }
}
