import '@angular/compiler';
import {
  createEnvironmentInjector,
  EnvironmentInjector,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, Observable, Subject, of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Api } from '../core/api';
import { Listing, ListingPage } from '../core/models';
import { Ui } from '../core/ui';
import { Detail } from './detail';

const listing = (id: number): Listing => ({ id, titre: 'Véhicule ' + id }) as Listing;
const suggestions: ListingPage = {
  items: [listing(1), listing(2), listing(3)],
  total: 3,
  page: 0,
  pages: 1,
};
const injectors: EnvironmentInjector[] = [];
afterEach(() => {
  injectors.splice(0).forEach((injector) => injector.destroy());
});
function setup(responses: Observable<unknown>[]) {
  const params = new BehaviorSubject(convertToParamMap({ id: '1' }));
  const get = vi.fn();
  responses.forEach((response) => get.mockReturnValueOnce(response));
  const injector = createEnvironmentInjector(
    [
      { provide: Api, useValue: { get } },
      { provide: Ui, useValue: {} },
      { provide: ActivatedRoute, useValue: { paramMap: params.asObservable() } },
    ],
    Injector.NULL as EnvironmentInjector,
  );
  injectors.push(injector);
  return { params, injector, get, component: runInInjectionContext(injector, () => new Detail()) };
}

describe('listing detail request lifecycle', () => {
  it('keeps the listing visible when related suggestions cannot load', () => {
    const { component } = setup([of(listing(1)), throwError(() => new Error('unavailable'))]);
    expect(component.car()?.id).toBe(1);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('');
    expect(component.related()).toEqual([]);
  });
  it('shows a listing error without requesting suggestions for a missing listing', () => {
    const { component, get } = setup([
      throwError(() => ({ status: 404, error: { message: 'Annonce introuvable.' } })),
    ]);
    expect(component.car()).toBeNull();
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Annonce introuvable.');
    expect(get).toHaveBeenCalledOnce();
  });
  it('cancels an outstanding related request when leaving the detail page', () => {
    const cancelled = vi.fn();
    const { injector } = setup([of(listing(1)), new Observable<ListingPage>(() => cancelled)]);
    injector.destroy();
    injectors.pop();
    expect(cancelled).toHaveBeenCalledOnce();
  });

  it('keeps related vehicles tied to the current listing during rapid navigation', () => {
    const first = new Subject<Listing>();
    const oldRelated = new Subject<ListingPage>();
    const second = new Subject<Listing>();
    const newRelated = new Subject<ListingPage>();
    const { component, params } = setup([first, oldRelated, second, newRelated]);
    first.next(listing(1));
    first.complete();
    params.next(convertToParamMap({ id: '2' }));
    second.next(listing(2));
    second.complete();
    newRelated.next(suggestions);
    newRelated.complete();
    oldRelated.next(suggestions);
    oldRelated.complete();
    expect(component.car()?.id).toBe(2);
    expect(component.related().map((car) => car.id)).toEqual([1, 3]);
  });
  it('cancels an outstanding listing request when leaving the detail page', () => {
    const cancelled = vi.fn();
    const { injector } = setup([new Observable<Listing>(() => cancelled)]);
    injector.destroy();
    injectors.pop();
    expect(cancelled).toHaveBeenCalledOnce();
  });
});
