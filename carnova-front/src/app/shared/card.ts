import { Component, input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Listing, imageUrl, label, price } from '../core/models';
import { Ui } from '../core/ui';
import { Icon } from './icon';
@Component({ selector: 'app-car-card', imports: [RouterLink, Icon], templateUrl: './card.html' })
export class CarCard {
  readonly car = input.required<Listing>();
  readonly ui = inject(Ui);
  readonly imageUrl = imageUrl;
  readonly label = label;
  readonly price = price;
  fallback(e: Event) {
    const img = e.target as HTMLImageElement;
    img.onerror = null;
    img.src = '/assets/placeholder.svg';
  }
}
