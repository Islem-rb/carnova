import { Component, AfterViewInit, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { ShowroomService, Showroom, Vehicule } from '../../services/showroom.service';

@Component({
  selector: 'app-creer-showroom',
  templateUrl: './creer-showroom.component.html',
  styleUrls: ['./creer-showroom.component.css']
})
export class CreerShowroomComponent implements AfterViewInit {
  showroomName = '';
  description = '';

  // Galerie du showroom (générale)
  images: File[] = [];
  imagePreviews: string[] = []; // base64 pour envoi JSON

  // Voitures
  voitures: Vehicule[] = [
    { marque: '', modele: '', annee: null, prix: null, couleur: '' }
  ];
  carFiles: (File | null)[] = [null];
  carImagePreviews: (string | null)[] = [null]; // base64 de chaque voiture

  error = '';
  success = '';
  loading = false;

  constructor(private router: Router, private showroomService: ShowroomService, private elRef: ElementRef) {}

  ngAfterViewInit() {
    const fields = this.elRef.nativeElement.querySelectorAll('.animate-field');
    fields.forEach((field: HTMLElement, index: number) => {
      setTimeout(() => field.classList.add('animate-field'), index * 100);
    });

    const observer = new MutationObserver(() => {
      const previews = this.elRef.nativeElement.querySelectorAll('.image-preview');
      previews.forEach((preview: HTMLElement, index: number) => {
        if (!preview.classList.contains('animate-field')) {
          setTimeout(() => preview.classList.add('animate-field'), index * 100);
        }
      });
    });
    const form = this.elRef.nativeElement.querySelector('#showroomForm');
    if (form) {
      observer.observe(form, { childList: true, subtree: true });
    }
  }

  // ====== Upload images du showroom (galerie générale) ======
  onFileChange(event: any) {
    const files: File[] = Array.from(event.target.files || []);
    if (files.length > 10) {
      this.error = 'Maximum 10 images autorisées.'; return;
    }
    this.images = [];
    this.imagePreviews = [];
    this.error = '';

    for (let file of files) {
      if (!/image\/(png|jpeg|jpg|webp)/i.test(file.type)) {
        this.error = 'Formats acceptés: PNG, JPG, JPEG, WEBP'; return;
      }
      if (file.size > 8 * 1024 * 1024) {
        this.error = 'Chaque image doit faire moins de 8MB.'; return;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews.push(e.target.result as string); // base64
        this.images.push(file);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number) {
    this.images.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  // ====== Voitures ======
  addVoiture() {
    this.voitures.push({ marque: '', modele: '', annee: null, prix: null, couleur: '' });
    this.carFiles.push(null);
    this.carImagePreviews.push(null);
  }

  removeVoiture(i: number) {
    if (this.voitures.length === 1) return;
    this.voitures.splice(i, 1);
    this.carFiles.splice(i, 1);
    this.carImagePreviews.splice(i, 1);
  }

  onCarFileChange(index: number, event: any) {
    const file: File | undefined = (event.target.files && event.target.files[0]) || undefined;
    if (!file) { this.carFiles[index] = null; this.carImagePreviews[index] = null; return; }

    if (!/image\/(png|jpeg|jpg|webp)/i.test(file.type)) {
      this.error = 'Formats acceptés: PNG, JPG, JPEG, WEBP'; return;
    }
    if (file.size > 8 * 1024 * 1024) {
      this.error = 'Chaque image de voiture doit faire moins de 8MB.'; return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.carImagePreviews[index] = e.target.result as string; // base64
      this.carFiles[index] = file;
    };
    reader.readAsDataURL(file);
  }

  // ====== Validation & Submit ======
  isFormValid(): boolean {
    if (!this.showroomName.trim() || !this.description.trim()) return false;
    // Au moins une image: soit une voiture a une image, soit galerie showroom
    const hasCarImage = this.carImagePreviews.some(x => !!x);
    if (!hasCarImage && this.imagePreviews.length === 0) return false;

    // Voitures: au minimum marque+modèle
    const allCarsValid = this.voitures.every(v => v.marque.trim() && v.modele.trim());
    return allCarsValid;
  }
popup = { open: false, type: 'success' as 'success'|'error'|'info', title: '', message: '', timer: null as any };

openToast(type: 'success'|'error'|'info', title: string, message: string, autoCloseMs = 1600) {
  this.popup.type = type; this.popup.title = title; this.popup.message = message; this.popup.open = true;
  if (this.popup.timer) clearTimeout(this.popup.timer);
  this.popup.timer = setTimeout(() => this.closeToast(), autoCloseMs);
}
closeToast() { if (this.popup.timer) { clearTimeout(this.popup.timer); this.popup.timer=null; } this.popup.open = false; }



onSubmit() {
    if (!this.isFormValid()) {
      this.error = 'Veuillez remplir tous les champs requis et ajouter au moins une image (voiture ou showroom).';
      this.success = '';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    // Ordre important: d’abord les images par voiture (alignées à l’index des voitures), puis les images générales du showroom.
    const carBase64s = this.carImagePreviews.filter((x): x is string => !!x);
    const payloadImages = [...carBase64s, ...this.imagePreviews];

    const showroom: Showroom = {
      nom: this.showroomName.trim(),
      description: this.description.trim(),
      images: payloadImages, // <-- N premières images = N voitures
      voitures: this.voitures.map(v => ({
        marque: v.marque.trim(),
        modele: v.modele.trim(),
        annee: v.annee ? Number(v.annee) : null,
        prix: v.prix ? Number(v.prix) : null,
        couleur: v.couleur?.trim() || ''
      }))
    };

    this.showroomService.createShowroom(showroom).subscribe({
    next: () => {
  this.openToast('success', 'Showroom créé', 'Votre showroom a été créé avec succès.');
  this.loading = false;
  setTimeout(() => this.router.navigate(['/espace/mes-annonces']), 1200);
},
error: () => {
  this.openToast('error', 'Erreur', 'Création du showroom impossible.');
  this.loading = false;
}
    });
  }
}
