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
    if (n.sourceName !== 'CarNova Journal')
      return 'Cet article provient de notre veille automobile. Retrouvez le contexte complet, les détails et la date de mise à jour auprès de la source indiquée ci-dessous.';
    if (n.title.toLowerCase().includes('électrique'))
      return 'Commencez par vos trajets réels : combien de kilomètres par jour, quelle fréquence de longs déplacements et où pourriez-vous recharger ? Demandez un diagnostic de batterie, les conditions de garantie et le détail des câbles fournis. Lors de l’essai, testez la recharge et les fonctions que vous utiliserez au quotidien. Comparez ensuite le coût total, avec l’assurance et l’entretien, plutôt que le seul prix d’achat.';
    if (n.title.toLowerCase().includes('annonce'))
      return 'Photographiez la voiture de jour, sur un fond simple. Montrez l’extérieur, l’habitacle, le compteur et les défauts éventuels. Décrivez les entretiens réalisés, les équipements utiles et les frais à prévoir. Un dossier clair inspire confiance et permet aux visiteurs de préparer des questions précises. Avant publication, relisez le prix, le kilométrage et votre numéro de contact.';
    return 'Avant le rendez-vous, demandez le dossier d’entretien et préparez vos questions. Prévoyez une inspection à froid et un essai sur plusieurs types de routes. Vérifiez que les documents correspondent à l’identité du vendeur et au véhicule présenté. Un professionnel indépendant pourra compléter votre observation. Prenez votre temps : un achat réussi laisse la place à la vérification et à la réflexion.';
  }
}
