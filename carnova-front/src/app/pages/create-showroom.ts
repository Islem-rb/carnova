import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Api } from '../core/api';
import { Ui } from '../core/ui';
import { Showroom, Vehicle, imageUrl, errorMessage } from '../core/models';
import { Icon } from '../shared/icon';
@Component({
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './create-showroom.html',
})
export class CreateShowroom {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly ui = inject(Ui);
  readonly editId = inject(ActivatedRoute).snapshot.paramMap.get('id');
  readonly images = signal<string[]>([]);
  readonly uploading = signal(false);
  readonly busy = signal(false);
  readonly loading = signal(!!this.editId);
  readonly error = signal('');
  readonly imageUrl = imageUrl;
  private vehicle(value?: Vehicle) {
    return this.fb.group({
      marque: [value?.marque ?? '', [Validators.required, Validators.maxLength(50)]],
      modele: [value?.modele ?? '', [Validators.required, Validators.maxLength(80)]],
      annee: [
        value?.annee ?? 2024,
        [Validators.required, Validators.min(1900), Validators.max(2028)],
      ],
      prix: [value?.prix ?? 0, [Validators.required, Validators.min(1)]],
      couleur: [value?.couleur ?? '', [Validators.maxLength(40)]],
    });
  }
  readonly vehicles = this.fb.array<ReturnType<typeof this.vehicle>>([]);
  readonly form = this.fb.group({
    nom: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.maxLength(4000)]],
    ville: ['', [Validators.required, Validators.maxLength(80)]],
    telephone: ['', [Validators.required, Validators.pattern(/^[+0-9 ()-]{8,25}$/)]],
    voitures: this.vehicles,
  });
  constructor() {
    if (this.editId)
      this.api.get<Showroom>('/showrooms/' + this.editId).subscribe({
        next: (s) => {
          this.form.patchValue({
            nom: s.nom,
            description: s.description,
            ville: s.ville,
            telephone: s.telephone,
          });
          this.images.set(s.images);
          s.voitures.forEach((v) => this.vehicles.push(this.vehicle(v)));
          this.loading.set(false);
        },
        error: (e) => {
          this.error.set(errorMessage(e));
          this.loading.set(false);
        },
      });
  }
  addVehicle() {
    this.vehicles.push(this.vehicle());
  }
  invalid(k: 'nom' | 'ville' | 'telephone' | 'description') {
    const c = this.form.controls[k];
    return c.invalid && c.touched;
  }
  remove(img: string) {
    this.images.update((v) => v.filter((x) => x !== img));
  }
  async photos(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    if (
      files.length + this.images().length > 8 ||
      files.some((f) => f.size > 8 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(f.type))
    ) {
      this.error.set('Ajoutez au maximum 8 photos JPEG ou PNG de 8 Mo chacune.');
      return;
    }
    this.uploading.set(true);
    this.error.set('');
    try {
      for (const f of files) {
        const data = new FormData();
        data.append('image', f);
        const r = await firstValueFrom(this.api.post<{ url: string }>('/uploads', data));
        this.images.update((v) => [...v, r.url]);
      }
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }
  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) {
      this.error.set('Complétez les informations indiquées avant de continuer.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    const body = { ...this.form.getRawValue(), images: this.images() };
    const req = this.editId
      ? this.api.put<Showroom>('/showrooms/' + this.editId, body)
      : this.api.post<Showroom>('/showrooms', body);
    req.subscribe({
      next: (s) => {
        this.ui.notify(
          this.editId ? 'Showroom mis à jour.' : 'Les portes de votre showroom sont ouvertes.',
        );
        void this.router.navigate(['/showrooms', s.id]);
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.busy.set(false);
      },
    });
  }
}
