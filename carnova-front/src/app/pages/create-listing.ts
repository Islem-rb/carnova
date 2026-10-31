import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { Stripe, StripeElements } from '@stripe/stripe-js';
import { Api } from '../core/api';
import { Ui } from '../core/ui';
import {
  Listing,
  BillingConfig,
  PaymentIntent,
  brands,
  cities,
  price,
  label,
  imageUrl,
  errorMessage,
} from '../core/models';
import { Icon } from '../shared/icon';
@Component({
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './create-listing.html',
})
export class CreateListing {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly ui = inject(Ui);
  readonly editId = inject(ActivatedRoute).snapshot.paramMap.get('id');
  readonly step = signal(0);
  readonly error = signal('');
  readonly loading = signal(!!this.editId);
  readonly busy = signal(false);
  readonly uploading = signal(false);
  readonly images = signal<string[]>([]);
  readonly modelUrl = signal<string | null>(null);
  readonly config = signal<BillingConfig | null>(null);
  readonly paid = signal(false);
  readonly paying = signal(false);
  readonly stripeReady = signal(false);
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private intentId = '';
  readonly brands = brands;
  readonly cities = cities;
  readonly price = price;
  readonly label = label;
  readonly imageUrl = imageUrl;
  readonly steps = [
    { title: 'Votre voiture', description: 'Les premières présentations.' },
    { title: 'Votre annonce', description: 'Le prix, l’histoire, les détails.' },
    { title: 'Les photos', description: 'Le premier regard compte.' },
    { title: 'Le dernier regard', description: 'Tout est prêt pour la rencontre.' },
  ];
  readonly form = inject(FormBuilder).nonNullable.group({
    titre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    marque: ['', [Validators.required, Validators.maxLength(50)]],
    modele: ['', [Validators.required, Validators.maxLength(80)]],
    annee: [2024, [Validators.required, Validators.min(1900), Validators.max(2028)]],
    typeVehicule: ['BERLINE'],
    carburant: ['ESSENCE'],
    boiteVitesse: ['AUTOMATIQUE'],
    couleur: ['', [Validators.maxLength(40)]],
    typeAnnonce: ['VENTE'],
    prix: [0, [Validators.required, Validators.min(1), Validators.max(100000000)]],
    kilometrage: [0, [Validators.required, Validators.min(0), Validators.max(3000000)]],
    ville: ['', [Validators.required, Validators.maxLength(80)]],
    telephone: ['', [Validators.required, Validators.pattern(/^[+0-9 ()-]{8,25}$/)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(4000)]],
  });
  constructor() {
    this.api
      .get<BillingConfig>('/payments/config')
      .subscribe({
        next: (c) => this.config.set(c),
        error: (e) => this.error.set(errorMessage(e)),
      });
    if (this.editId)
      this.api.get<Listing>('/annonces/' + this.editId).subscribe({
        next: (c) => {
          this.form.patchValue({
            titre: c.titre,
            description: c.description,
            typeAnnonce: c.typeAnnonce,
            marque: c.marque ?? '',
            modele: c.modele ?? '',
            annee: c.annee ?? 2024,
            prix: c.prix ?? 0,
            kilometrage: c.kilometrage ?? 0,
            carburant: c.carburant ?? 'ESSENCE',
            boiteVitesse: c.boiteVitesse ?? 'AUTOMATIQUE',
            couleur: c.couleur ?? '',
            ville: c.ville ?? '',
            typeVehicule: c.typeVehicule ?? 'BERLINE',
            telephone: c.telephone ?? '',
          });
          this.images.set(c.images);
          this.modelUrl.set(c.model3dUrl);
          this.loading.set(false);
        },
        error: (e) => {
          this.error.set(errorMessage(e));
          this.loading.set(false);
        },
      });
  }
  invalid(k: keyof typeof this.form.controls) {
    return this.form.controls[k].invalid && this.form.controls[k].touched;
  }
  previous() {
    this.step.update((v) => v - 1);
    this.error.set('');
    this.focus();
  }
  next() {
    this.error.set('');
    const keys: (keyof typeof this.form.controls)[] =
      this.step() === 0
        ? ['titre', 'marque', 'modele', 'annee', 'couleur']
        : this.step() === 1
          ? ['prix', 'kilometrage', 'ville', 'telephone', 'description']
          : [];
    keys.forEach((k) => this.form.controls[k].markAsTouched());
    if (keys.some((k) => this.form.controls[k].invalid)) {
      this.error.set('Complétez les champs indiqués pour continuer.');
      return;
    }
    if (this.step() < 3) {
      this.step.update((v) => v + 1);
      this.focus();
    } else this.publish();
  }
  private focus() {
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>('.wizard-card');
      if (el) {
        el.tabIndex = -1;
        el.focus({ preventScroll: true });
        el.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    });
  }
  async photos(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    if (files.length + this.images().length > 8) {
      this.error.set('Ajoutez au maximum 8 photos.');
      input.value = '';
      return;
    }
    if (
      files.some((f) => f.size > 8 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(f.type))
    ) {
      this.error.set('Utilisez des photos JPEG ou PNG de 8 Mo maximum.');
      input.value = '';
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
  remove(img: string) {
    this.images.update((v) => v.filter((x) => x !== img));
  }
  async model(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 40 * 1024 * 1024 || !file.name.toLowerCase().endsWith('.glb')) {
      this.error.set('Ajoutez un modèle GLB de 40 Mo maximum.');
      return;
    }
    this.uploading.set(true);
    try {
      const data = new FormData();
      data.append('glb', file);
      const r = await firstValueFrom(this.api.post<{ model3dUrl: string }>('/models/upload', data));
      this.modelUrl.set(r.model3dUrl);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }
  private publish() {
    if (this.form.invalid) {
      this.step.set(0);
      this.form.markAllAsTouched();
      this.error.set('Vérifiez les informations de votre annonce.');
      return;
    }
    this.busy.set(true);
    const body = { ...this.form.getRawValue(), images: this.images(), model3dUrl: this.modelUrl() };
    const request = this.editId
      ? this.api.put<Listing>('/annonces/' + this.editId, body)
      : this.api.post<Listing>('/annonces', body);
    request.subscribe({
      next: (c) => {
        this.ui.notify(
          this.editId
            ? 'Votre annonce a été mise à jour.'
            : 'Votre annonce est en ligne. Bonne route !',
        );
        void this.router.navigate(['/annonces', c.id]);
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.busy.set(false);
      },
    });
  }
  async startPayment() {
    if (this.paid() || this.paying()) return;
    if (this.stripeReady()) return;
    this.paying.set(true);
    this.error.set('');
    try {
      const intent = await firstValueFrom(
        this.api.post<PaymentIntent>('/payments/create-payment-intent', {}),
      );
      this.intentId = intent.paymentIntentId;
      if (intent.mode === 'mock') {
        await firstValueFrom(
          this.api.post('/payments/confirm', { paymentIntentId: this.intentId }),
        );
        this.paid.set(true);
      } else {
        const { loadStripe } = await import('@stripe/stripe-js');
        this.stripe = await loadStripe(this.config()!.publishableKey);
        if (!this.stripe) throw new Error();
        this.elements = this.stripe.elements({
          clientSecret: intent.clientSecret,
          appearance: {
            theme: 'stripe',
            variables: { colorPrimary: '#596f17', borderRadius: '8px' },
          },
        });
        this.elements.create('payment').mount('#payment-element');
        this.stripeReady.set(true);
      }
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.paying.set(false);
    }
  }
  async confirmStripe() {
    if (!this.stripe || !this.elements) return;
    this.paying.set(true);
    try {
      const result = await this.stripe.confirmPayment({
        elements: this.elements,
        redirect: 'if_required',
        confirmParams: { return_url: location.origin + '/espace' },
      });
      if (result.error) {
        this.error.set(result.error.message ?? 'Le paiement test a échoué.');
        return;
      }
      await firstValueFrom(this.api.post('/payments/confirm', { paymentIntentId: this.intentId }));
      this.paid.set(true);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.paying.set(false);
    }
  }
}
