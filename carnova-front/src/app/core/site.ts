import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import { Api } from './api';

export interface SiteMeta {
  demo: boolean;
  mail?: boolean;
  version: string;
}

/** Deployment facts the UI must be honest about, such as a hosted demo without email. */
@Injectable({ providedIn: 'root' })
export class Site {
  private readonly api = inject(Api);
  /** Optimistic until known: a failed lookup never hides the normal account flows. */
  readonly emailDelivery = toSignal(
    this.api.get<SiteMeta>('/meta').pipe(
      map((meta) => meta.mail !== false),
      catchError(() => of(true)),
    ),
    { initialValue: true },
  );
}
