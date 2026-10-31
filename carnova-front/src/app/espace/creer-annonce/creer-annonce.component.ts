import { Component, AfterViewInit, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AnnonceService } from '../../services/annonce.service';
import { PaymentService } from '../../services/payment.service';

declare var Stripe: any;

@Component({
  selector: 'app-creer-annonce',
  templateUrl: './creer-annonce.component.html',
  styleUrls: ['./creer-annonce.component.css']
})
export class CreerAnnonceComponent implements AfterViewInit {
  titre = '';
  description = '';
  typeAnnonce = 'VENTE';
  imageFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  error = '';

  showPaymentForm = false;
  stripe: any;
  elements: any;
  cardElement: any;
  clientSecret = '';

  constructor(
    private annonceService: AnnonceService,
    private paymentService: PaymentService,
    private router: Router,
    private elRef: ElementRef
  ) {}

  ngAfterViewInit() {
    const fields = this.elRef.nativeElement.querySelectorAll('.animate-field');
    fields.forEach((field: HTMLElement, index: number) => {
      setTimeout(() => field.classList.add('animate-field'), index * 100);
    });

    const form = this.elRef.nativeElement.querySelector('#annonceForm');
    if (form) {
      const observer = new MutationObserver(() => {
        const preview = this.elRef.nativeElement.querySelector('.image-preview');
        if (preview && !preview.classList.contains('animate-slide-in')) {
          preview.classList.add('animate-slide-in');
        }
      });
      observer.observe(form, {
        childList: true,
        subtree: true
      });
    }
  }

  onFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      this.imageFile = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = () => (this.imagePreview = reader.result);
      reader.readAsDataURL(this.imageFile);
    } else {
      this.imageFile = null;
      this.imagePreview = null;
    }
  }

  onSubmit() {
    if (!this.titre || !this.description || !this.typeAnnonce) {
      this.error = 'Tous les champs sont obligatoires';
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      this.error = 'Vous devez être connecté.';
      setTimeout(() => this.router.navigate(['/Login']), 2000);
      return;
    }

    this.openStripePayment();
  }





  popup = { open: false, type: 'success' as 'success'|'error'|'info', title: '', message: '', timer: null as any };
openToast(type: 'success'|'error'|'info', title: string, message: string, autoCloseMs = 1600) {
  this.popup.type = type; this.popup.title = title; this.popup.message = message; this.popup.open = true;
  if (this.popup.timer) clearTimeout(this.popup.timer);
  this.popup.timer = setTimeout(() => this.closeToast(), autoCloseMs);
}
closeToast() { if (this.popup.timer) { clearTimeout(this.popup.timer); this.popup.timer=null; } this.popup.open = false; }

  openStripePayment() {
    this.paymentService.createPaymentIntent(5).subscribe({
      next: (res) => {
        this.clientSecret = res.clientSecret;
        this.showPaymentForm = true;

        setTimeout(() => {
          this.stripe = Stripe('pk_test_51Opf0YGuFNfsyENx0htq4BSfMh8Um5UpSabOOrDAvSO6Wv8h91e62BPaLXbFMzxJxoNg6PD6EsMBXaUqcO69Ak7O009PYjz8IA');
          this.elements = this.stripe.elements();
          this.cardElement = this.elements.create('card', {
            style: {
              base: {
                fontSize: '16px',
                color: '#111827',
                '::placeholder': { color: '#9ca3af' },
              },
              invalid: {
                color: '#ef4444',
              },
            },
            hidePostalCode: true,
          });

          const cardElementDiv = this.elRef.nativeElement.querySelector('#card-element');
          if (cardElementDiv) {
            this.cardElement.mount('#card-element');
          } else {
            console.error('#card-element introuvable');
          }
        }, 200);
      },
      error: (err) => {
        console.error(err);
        this.error = 'Erreur lors de la création du paiement.';
      },
    });
  }

  confirmPaymentAndCreateAnnonce() {
  this.stripe.confirmCardPayment(this.clientSecret, {
    payment_method: {
      card: this.cardElement,
      billing_details: { email: 'test@example.com' }
    }
  }).then((result: any) => {
    if (result.error) {
      this.error = result.error.message;
    } else {
      const paymentIntentId = result.paymentIntent.id;

      // ✅ Confirme le paiement auprès du backend
      this.paymentService.confirmPayment(paymentIntentId).subscribe({
        next: () => {
            this.openToast('success', 'Annonce créée', 'Votre annonce a été créée avec succès.');

          this.createAnnonceAfterPayment(); // ✅ Puis crée l’annonce
        },
        error: (err) => {
          console.error(err);
            this.openToast('success', 'Annonce créée', 'Votre annonce a été créée avec succès.');

        }
      });
    }
  });
}

  createAnnonceAfterPayment() {
    const formData = new FormData();
    formData.append('titre', this.titre);
    formData.append('description', this.description);
    formData.append('typeAnnonce', this.typeAnnonce);
    if (this.imageFile) formData.append('image', this.imageFile);

    this.annonceService.createAnnonce(formData).subscribe({
      next: () => {
        alert('Annonce créée avec succès !');
        this.router.navigate(['/espace/mes-annonces']);
      },
      error: (err) => {
        console.error(err);
        this.error = 'Erreur lors de la création de l’annonce.';
      }
    });
  }
}
