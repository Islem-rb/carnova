import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { News, errorMessage, imageUrl } from '../core/models';
import { Icon } from '../shared/icon';
@Component({ imports: [Icon, RouterLink], templateUrl: './news.html' })
export class NewsPage {
  private readonly api = inject(Api);
  readonly tab = signal('Tout le Journal');
  readonly tabs = ['Tout le Journal', 'Nos conseils', 'La veille auto'];
  readonly items = signal<News[]>([]);
  readonly expanded = signal(inject(ActivatedRoute).snapshot.queryParamMap.get('article') ?? '');
  readonly error = signal('');
  readonly loading = signal(true);
  readonly imageUrl = imageUrl;
  readonly filtered = computed(() =>
    this.items().filter(
      (n) =>
        this.tab() === 'Tout le Journal' ||
        (this.tab() === 'Nos conseils'
          ? n.sourceName === 'CarNova Journal'
          : n.sourceName !== 'CarNova Journal'),
    ),
  );
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    this.api.get<News[]>('/news', { sinceHours: 8760, limit: 50 }).subscribe({
      next: (n) => {
        this.items.set(n);
        this.loading.set(false);
        if (this.expanded())
          setTimeout(() =>
            document
              .getElementById('article-' + this.expanded())
              ?.scrollIntoView({ block: 'center' }),
          );
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }
  date(value: string) {
    return new Date(value).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  source(n: News) {
    return /^https:\/\//.test(n.sourceUrl) ? n.sourceUrl : n.sourceUrl === '/guide' ? '/guide' : '';
  }
  body(n: News) {
    return n.sourceName === 'CarNova Journal'
      ? n.summary
      : 'Cet article provient de notre veille automobile. Retrouvez le contexte complet, les détails et la date de mise à jour auprès de la source indiquée ci-dessous.';
  }
}
