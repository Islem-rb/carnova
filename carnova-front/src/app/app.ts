import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { Auth } from './core/auth';
import { Ui } from './core/ui';
import { Api } from './core/api';
import { Icon } from './shared/icon';
import { Assistant } from './shared/assistant';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, Assistant],
  templateUrl: './app.html',
})
export class App {
  readonly auth = inject(Auth);
  readonly ui = inject(Ui);
  readonly menu = signal(false);
  readonly year = new Date().getFullYear();
  constructor() {
    inject(Api)
      .get<{ demo: boolean }>('/meta')
      .subscribe({ next: (r) => this.ui.demo.set(r.demo), error: () => {} });
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.menu.set(false);
        setTimeout(() => document.getElementById('main')?.focus({ preventScroll: true }));
      });
  }
}
