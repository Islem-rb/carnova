import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Icon } from '../shared/icon';
import { Viewer } from '../shared/viewer';
@Component({ imports: [Icon, Viewer, RouterLink], templateUrl: './studio.html' })
export class Studio {
  readonly drive = inject(ActivatedRoute).snapshot.data['drive'] === true;
  readonly model = signal('/api/models/bmw.glb');
  readonly color = signal('');
  readonly colors = [
    { name: 'argent', value: '#aab0b5' },
    { name: 'bleu nuit', value: '#243849' },
    { name: 'vert olive', value: '#65724a' },
    { name: 'rouge', value: '#7e2e29' },
  ];
  select(url: string) {
    this.model.set(url);
    this.color.set('');
  }
}
