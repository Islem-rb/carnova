import '@angular/compiler';
import { createEnvironmentInjector, EnvironmentInjector, Injector } from '@angular/core';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { Api } from './api';
import { Site } from './site';

const injectors: EnvironmentInjector[] = [];
afterEach(() => injectors.splice(0).forEach((x) => x.destroy()));
function site(meta: ReturnType<Api['get']>) {
  const injector = createEnvironmentInjector(
    [Site, { provide: Api, useValue: { get: () => meta } }],
    Injector.NULL as EnvironmentInjector,
  );
  injectors.push(injector);
  return injector.get(Site);
}

describe('site facts', () => {
  it('reports a hosted demo without email delivery', () => {
    expect(site(of({ demo: true, mail: false, version: '2.0.0' })).emailDelivery()).toBe(false);
  });
  it('keeps email flows visible when delivery is on or the flag is absent', () => {
    expect(site(of({ demo: true, mail: true, version: '2.0.0' })).emailDelivery()).toBe(true);
    expect(site(of({ demo: true, version: '2.0.0' })).emailDelivery()).toBe(true);
  });
  it('never hides the normal account flows when the lookup fails', () => {
    expect(site(throwError(() => new Error('offline'))).emailDelivery()).toBe(true);
  });
});
