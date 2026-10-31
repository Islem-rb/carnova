import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { Ui } from '../core/ui';
import { Showroom, price, imageUrl, errorMessage } from '../core/models';
import { Icon } from '../shared/icon';
@Component({ imports: [RouterLink, Icon], templateUrl: './showroom-detail.html' })
export class ShowroomDetail {
  private readonly api = inject(Api);
  readonly ui = inject(Ui);
  readonly showroom = signal<Showroom | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly price = price;
  readonly imageUrl = imageUrl;
  constructor() {
    this.api
      .get<Showroom>('/showrooms/' + inject(ActivatedRoute).snapshot.paramMap.get('id'))
      .subscribe({
        next: (s) => {
          this.showroom.set(s);
          this.loading.set(false);
        },
        error: (e) => {
          this.error.set(errorMessage(e));
          this.loading.set(false);
        },
      });
  }
}
