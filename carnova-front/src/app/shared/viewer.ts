import {
  Component,
  ElementRef,
  afterNextRender,
  inject,
  input,
  signal,
  viewChild,
  effect,
  DestroyRef,
} from '@angular/core';
import { Icon } from './icon';
import type { SceneHandle } from './three-engine';
@Component({ selector: 'app-viewer', imports: [Icon], templateUrl: './viewer.html' })
export class Viewer {
  readonly url = input('/api/models/bmw.glb');
  readonly drive = input(false);
  readonly paint = input('');
  readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly progress = signal(0);
  readonly rotating = signal(false);
  readonly speed = signal(0);
  scene: SceneHandle | undefined;
  private controller: AbortController | undefined;
  private ready = false;
  private generation = 0;
  private disposed = false;
  constructor() {
    effect(() => {
      const url = this.url();
      const drive = this.drive();
      if (this.ready) void this.load(url, drive);
    });
    effect(() => {
      const color = this.paint();
      if (color) this.scene?.color(color);
    });
    afterNextRender(() => {
      this.ready = true;
      void this.load(this.url(), this.drive());
    });
    inject(DestroyRef).onDestroy(() => {
      this.disposed = true;
      this.controller?.abort();
      this.generation++;
      this.scene?.dispose();
    });
  }
  private async load(url: string, drive: boolean) {
    const generation = ++this.generation;
    this.controller?.abort();
    this.controller = new AbortController();
    const abort = this.controller.signal;
    this.scene?.dispose();
    this.scene = undefined;
    this.failed.set(false);
    this.loading.set(true);
    this.progress.set(0);
    this.rotating.set(false);
    if (!/^\/(?:api\/models\/[a-zA-Z0-9_.-]+|assets\/original-models\/3d.glb)$/.test(url)) {
      this.failed.set(true);
      this.loading.set(false);
      return;
    }
    try {
      const { createScene } = await import('./three-engine');
      if (this.disposed || generation !== this.generation) return;
      const scene = await createScene(
        this.host().nativeElement,
        url,
        drive,
        (n) => {
          if (generation === this.generation) this.progress.set(n);
        },
        (n) => {
          if (generation === this.generation) this.speed.set(n);
        },
        abort,
      );
      if (this.disposed || generation !== this.generation) {
        scene.dispose();
        return;
      }
      this.scene = scene;
      if (this.paint()) scene.color(this.paint());
      this.loading.set(false);
    } catch {
      if (!this.disposed && generation === this.generation) {
        this.failed.set(true);
        this.loading.set(false);
      }
    }
  }
  retry() {
    void this.load(this.url(), this.drive());
  }
  toggleRotate() {
    this.rotating.update((v) => !v);
    this.scene?.rotate(this.rotating());
  }
  async fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await this.host().nativeElement.requestFullscreen();
    } catch {}
  }
  key(value: string, down: boolean) {
    this.scene?.key(value, down);
  }
  press(key: string, e: PointerEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.key(key, true);
  }
  release(key: string, e: PointerEvent) {
    e.preventDefault();
    this.key(key, false);
  }
}
