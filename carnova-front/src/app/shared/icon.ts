import { Component, input, computed } from '@angular/core';
const icons: Record<string, string[]> = {
  arrow: ['M5 12h14', 'm12 5 7 7-7 7'],
  diagonal: ['M6 18 18 6', 'M6 6h12v12'],
  chevron: ['m9 5 7 7-7 7'],
  search: ['M21 21l-5-5', 'M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0'],
  heart: [
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  ],
  close: ['m6 6 12 12', 'M6 18 18 6'],
  menu: ['M4 6h16M4 12h16M4 18h16'],
  sun: [
    'M12 3V1m0 22v-2M3 12H1m22 0h-2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2',
    'M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
  ],
  moon: ['M21 13A9 9 0 0 1 11 3 9 9 0 1 0 21 13Z'],
  check: ['m5 12 4 4L19 6'],
  plus: ['M12 4v16M4 12h16'],
  pin: ['M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z', 'M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0'],
  car: ['m3 10 2-6h14l2 6', 'M3 10h18v8H3z', 'M5 18v3m14-3v3M6 14h2m8 0h2'],
  cube: ['m12 2 10 6v9l-10 6-10-6V8L12 2Z', 'm2 8 10 6 10-6M12 14v9M7 5l10 6'],
  spark: ['m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z'],
  user: ['M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0', 'M4 22v-3a8 8 0 0 1 16 0v3'],
  shield: ['m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6l9-4Z', 'm8 12 3 3 5-6'],
  gauge: ['M3 18a10 10 0 1 1 18 0', 'm12 13 5-5', 'M6 17h12'],
  fuel: ['M4 21V3h9v18M2 21h13M4 10h9m0 3h3v4a2 2 0 0 0 4 0V8l-3-3'],
  gear: [
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
    'M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',
  ],
  phone: ['M22 16v3a3 3 0 0 1-3 3C9 21 3 15 2 5a3 3 0 0 1 3-3h3l2 6-3 2a15 15 0 0 0 7 7l2-3 6 2Z'],
  mail: ['M3 5h18v14H3z', 'm3 5 9 8 9-8'],
  upload: ['M12 16V3m-5 5 5-5 5 5', 'M3 15v6h18v-6'],
  image: ['M3 3h18v18H3z', 'm3 17 6-6 4 4 3-3 5 5', 'M8 7h.01'],
  filter: ['M4 5h16M7 12h10M10 19h4', 'M8 3v4m8 3v4m-4 3v4'],
  book: ['M12 5c-3-3-7-3-10-1v16c3-2 7-2 10 1 3-3 7-3 10-1V4c-3-2-7-2-10 1Zm0 0v16'],
  store: ['M3 10h18l-2-7H5l-2 7Zm1 0v11h16V10M9 21v-7h6v7'],
  chart: ['M4 3v18h17M8 16v-5m5 5V7m5 9v-8'],
  logout: ['M9 3H3v18h6M9 12h12m-5-5 5 5-5 5'],
  back: ['M19 12H5m7-7-7 7 7 7'],
  info: ['M12 11v6m0-10h.01', 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0'],
  rotate: ['M20 7V2m0 5h-5', 'M20 7a9 9 0 1 0 1 8'],
  pause: ['M8 4v16M16 4v16'],
  play: ['m7 3 14 9-14 9V3Z'],
  fullscreen: ['M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5'],
  trash: ['M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7'],
  eye: ['M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12Z', 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0'],
  lock: ['M5 10h14v11H5zM8 10V6a4 4 0 1 1 8 0v4'],
  calendar: ['M3 5h18v16H3zM7 2v6m10-6v6M3 11h18'],
  clock: ['M12 7v5l3 2', 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0'],
};
@Component({
  selector: 'app-icon',
  template:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">@for (d of paths(); track $index) {<path [attr.d]="d"/>}</svg>',
  styles:
    ':host{display:inline-flex;flex-shrink:0;width:1.25em;height:1.25em;vertical-align:middle}svg{width:100%;height:100%}',
})
export class Icon {
  readonly name = input('arrow');
  readonly paths = computed(() => icons[this.name()] ?? icons['arrow']);
}
