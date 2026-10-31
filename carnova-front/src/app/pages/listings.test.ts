import '@angular/compiler';
import { createEnvironmentInjector, EnvironmentInjector, Injector } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Api } from '../core/api';
import { Listing, ListingPage } from '../core/models';
import { Listings } from './listings';
import { runInInjectionContext } from '@angular/core';

const page = (id: number, titre: string): ListingPage => ({
  items: [{ id, titre } as Listing],
  total: 1,
  page: 0,
  pages: 1,
});
const injectors: EnvironmentInjector[] = [];
afterEach(() => {
  injectors.splice(0).forEach((injector) => injector.destroy());
});
function setup(responses: Observable<ListingPage>[]) {
  const params = new BehaviorSubject(convertToParamMap({}));
  const get = vi.fn();
  responses.forEach((response) => get.mockReturnValueOnce(response));
  const injector = createEnvironmentInjector(
    [
      FormBuilder,
      { provide: Api, useValue: { get } },
      { provide: ActivatedRoute, useValue: { queryParamMap: params.asObservable() } },
      { provide: Router, useValue: { navigate: vi.fn().mockResolvedValue(false) } },
    ],
    Injector.NULL as EnvironmentInjector,
  );
  injectors.push(injector);
  return {
    params,
    get,
    injector,
    component: runInInjectionContext(injector, () => new Listings()),
  };
}

describe('listing search request lifecycle', () => {
  it('keeps the newest filters results when an older retry finishes later', async () => {
    const first = new Subject<ListingPage>();
    const retry = new Subject<ListingPage>();
    const newest = new Subject<ListingPage>();
    const { component, params } = setup([first, retry, newest]);
    first.next(page(1, 'Toyota'));
    first.complete();
    component.apply();
    await Promise.resolve();
    params.next(convertToParamMap({ q: 'Tesla' }));
    newest.next(page(2, 'Tesla'));
    newest.complete();
    retry.next(page(1, 'Toyota'));
    retry.complete();
    expect(component.result().items[0].titre).toBe('Tesla');
  });
  it('cancels an outstanding request when leaving the search page', () => {
    const cancelled = vi.fn();
    const { injector } = setup([new Observable<ListingPage>(() => cancelled)]);
    injector.destroy();
    injectors.pop();
    expect(cancelled).toHaveBeenCalledOnce();
  });
});
