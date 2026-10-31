import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AnnonceService, Annonce } from '../../services/annonce.service';
import { ShowroomService, Showroom } from '../../services/showroom.service';

@Component({
  selector: 'app-mes-annonces',
  templateUrl: './mes-annonces.component.html',
  styleUrls: ['./mes-annonces.component.css']
})
export class MesAnnoncesComponent implements OnInit, OnDestroy {
  annonces: Annonce[] = [];
  showrooms: Showroom[] = [];
  loading = true;
  error = '';
  successMessage = '';
  isProfessional = false;

  private createdBlobUrls: string[] = [];

  constructor(
    private annonceService: AnnonceService,
    private showroomService: ShowroomService,
    private router: Router
  ) {
    try {
      const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
      this.isProfessional = Array.isArray(roles) && roles.includes('ROLE_PROFESSIONAL');
    } catch { this.isProfessional = false; }
  }

  ngOnInit() { this.loadAnnonces(); this.loadShowrooms(); }

  ngOnDestroy() {
    this.createdBlobUrls.forEach(URL.revokeObjectURL);
    this.createdBlobUrls = [];
    if (this.popup.timer) clearTimeout(this.popup.timer);
  }

  // ---------------- Chargement ----------------
  loadAnnonces() {
    this.loading = true; this.error = '';
    this.annonceService.getMyAnnonces().subscribe({
      next: (data) => { this.annonces = data; this.loading = false; },
      error: (err) => {
        console.error(err);
        this.error = 'Erreur lors du chargement des annonces';
        this.loading = false;
        if (err.status === 401) setTimeout(() => this.router.navigate(['/Login']), 2000);
      }
    });
  }

  loadShowrooms() {
    // Nettoyage blobs
    this.createdBlobUrls.forEach(URL.revokeObjectURL);
    this.createdBlobUrls = [];

    this.showroomService.getMyShowrooms().subscribe({
      next: (data) => {
        const list = data || [];
        this.showrooms = list.map((s: any) => {
          const carCount = s.voitures?.length || 0;
          const rawAll: string[] = s.images || []; // brutes du back

          // IMPORTANT: on garde une copie "raw" pour reconstruire à l'update
          const rawCar = rawAll.slice(0, carCount);
          const rawShowroom = rawAll.slice(carCount);

          // Assigner image aux voitures (affichage)
          if (s.voitures && s.voitures.length) {
            s.voitures = s.voitures.map((v: any, i: number) => ({
              ...v,
              image: rawCar[i] ? this.toDisplayImage(rawCar[i]) : undefined
            }));
          }

          // Galerie showroom pour affichage
          const showroomGallery = rawShowroom.map((img) => this.toDisplayImage(img));

          // On renvoie l'objet en gardant les "raw" pour l'update
          return {
            ...s,
            images: showroomGallery,
            __rawAllImages: rawAll,
            __rawCarImages: rawCar,
            __rawShowroomImages: rawShowroom
          };
        });
      },
      error: (err) => console.error('Erreur showrooms:', err)
    });
  }

  // ---------------- Suppression annonces ----------------
  confirmDialog = { open: false, id: null as number | null, titre: '', loading: false };

  openConfirmDelete(annonce: any) {
    this.confirmDialog = { open: true, id: annonce.id, titre: annonce.titre, loading: false };
  }
  confirmDelete() {
    const id = this.confirmDialog.id; if (!id) return;
    this.confirmDialog.loading = true;
    this.annonceService.deleteAnnonce(id).subscribe({
      next: () => {
        this.annonces = this.annonces.filter(a => a.id !== id);
        this.confirmDialog = { open: false, id: null, titre: '', loading: false };
        this.openToast('success','Annonce supprimée','Votre annonce a été supprimée avec succès.');
      },
      error: (err) => {
        this.confirmDialog.loading = false;
        const msg = err?.error?.message || err?.error || err?.statusText || 'Suppression impossible pour le moment.';
        this.openToast('error','Erreur',msg);
      }
    });
  }
  cancelDelete() { this.confirmDialog = { open: false, id: null, titre: '', loading: false }; }

  // ---------------- Suppression showrooms ----------------
  confirmSR = { open: false, id: null as number | null, nom: '', loading: false };

  openConfirmDeleteShowroom(s: any, event?: Event) {
    if (event) event.stopPropagation();
    this.confirmSR = { open: true, id: s.id ?? null, nom: s.nom ?? '', loading: false };
  }
  confirmDeleteShowroom() {
    const id = this.confirmSR.id; if (!id) return;
    const backup = [...this.showrooms];
    this.showrooms = this.showrooms.filter(sr => sr.id !== id);
    this.confirmSR.loading = true;
    this.showroomService.deleteShowroom(id).subscribe({
      next: () => {
        this.confirmSR = { open: false, id: null, nom: '', loading: false };
        this.openToast('success','Showroom supprimé','Le showroom a été supprimé avec succès.');
      },
      error: (err) => {
        this.showrooms = backup;
        this.confirmSR.loading = false;
        const msg = err?.error?.message || err?.error || err?.statusText || 'Suppression showroom impossible.';
        this.openToast('error','Erreur',msg);
      }
    });
  }
  cancelDeleteShowroom() { this.confirmSR = { open: false, id: null, nom: '', loading: false }; }

  // ---------------- Update Showroom (form complet) ----------------
  editSR = {
    open: false,
    id: null as number | null,
    nom: '',
    description: '',
    generalPreviews: [] as string[], // nouvelles images showroom (base64)
    generalFiles: [] as File[],
    voitures: [] as Array<{
      id?: number;
      marque: string; modele: string; annee: number | null; prix: number | null; couleur: string;
      currentImage?: string | null; // affichage
      newFile?: File | null;        // file choisi
      preview?: string | null;      // base64 à envoyer si remplacé
    }>,
    loading: false,
    original: null as any // conserver __rawCarImages / __rawShowroomImages
  };

  openEditShowroom(s: any, event?: Event) {
    if (event) event.stopPropagation();
    this.editSR.open = true;
    this.editSR.id = s.id ?? null;
    this.editSR.nom = s.nom || '';
    this.editSR.description = s.description || '';
    this.editSR.generalPreviews = [];
    this.editSR.generalFiles = [];
    // On garde l'objet complet "s" (contenant les __raw*)
    this.editSR.original = s;

    // Pré-remplir voitures
    this.editSR.voitures = (s.voitures || []).map((v: any) => ({
      id: v.id,
      marque: v.marque || '',
      modele: v.modele || '',
      annee: typeof v.annee === 'number' ? v.annee : (v.annee ? Number(v.annee) : null),
      prix: typeof v.prix === 'number' ? v.prix : (v.prix ? Number(v.prix) : null),
      couleur: v.couleur || '',
      currentImage: v.image || null,
      newFile: null,
      preview: null
    }));
    if (this.editSR.voitures.length === 0) {
      this.editSR.voitures.push({ marque: '', modele: '', annee: null, prix: null, couleur: '', currentImage: null, newFile: null, preview: null });
    }
    this.editSR.loading = false;
  }

  cancelEditShowroom() {
    this.editSR = {
      open: false, id: null, nom: '', description: '',
      generalPreviews: [], generalFiles: [],
      voitures: [], loading: false, original: null
    };
  }

  onEditShowroomFilesChange(event: any) {
    const files: File[] = Array.from(event?.target?.files || []);
    this.editSR.generalPreviews = [];
    this.editSR.generalFiles = [];
    for (const f of files) {
      if (!/image\/(png|jpg|jpeg|webp)/i.test(f.type)) { this.openToast('error','Format non supporté','PNG/JPG/JPEG/WEBP uniquement.'); return; }
      if (f.size > 8 * 1024 * 1024) { this.openToast('error','Image trop lourde','< 8MB.'); return; }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editSR.generalPreviews.push(e.target.result as string);
        this.editSR.generalFiles.push(f);
      };
      reader.readAsDataURL(f);
    }
  }
  removeEditShowroomImage(index: number) {
    this.editSR.generalPreviews.splice(index, 1);
    this.editSR.generalFiles.splice(index, 1);
  }

  onEditCarFileChange(i: number, event: any) {
    const f: File | undefined = (event?.target?.files && event.target.files[0]) || undefined;
    if (!f) { this.editSR.voitures[i].newFile = null; this.editSR.voitures[i].preview = null; return; }
    if (!/image\/(png|jpg|jpeg|webp)/i.test(f.type)) { this.openToast('error','Format non supporté','PNG/JPG/JPEG/WEBP uniquement.'); return; }
    if (f.size > 8 * 1024 * 1024) { this.openToast('error','Image trop lourde','< 8MB.'); return; }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.editSR.voitures[i].newFile = f;
      this.editSR.voitures[i].preview = e.target.result as string;
    };
    reader.readAsDataURL(f);
  }

  addEditCar() {
    this.editSR.voitures.push({ marque: '', modele: '', annee: null, prix: null, couleur: '', currentImage: null, newFile: null, preview: null });
  }
  removeEditCar(i: number) {
    if (this.editSR.voitures.length > 1) this.editSR.voitures.splice(i, 1);
  }

  isEditFormValid(): boolean {
    if (!this.editSR.nom.trim() || !this.editSR.description.trim()) return false;
    return this.editSR.voitures.every(v => (v.marque || '').trim() && (v.modele || '').trim());
  }

  saveEditShowroom() {
    if (!this.editSR.id) return;
    if (!this.isEditFormValid()) { this.openToast('error','Champs manquants','Complétez nom, description et voitures.'); return; }
    this.editSR.loading = true;

    // Construire voitures (ids inclus pour mise à jour)
    const voituresPayload = this.editSR.voitures.map(v => ({
      id: v.id ?? null,
      marque: (v.marque || '').trim(),
      modele: (v.modele || '').trim(),
      annee: v.annee != null ? Number(v.annee) : null,
      prix: v.prix != null ? Number(v.prix) : null,
      couleur: (v.couleur || '').trim()
    }));

    // Conserver l'ordre: [images voitures] puis [images showroom].
    // On reprend les images voitures existantes si non remplacées
    const original = this.editSR.original || {};
    const rawCar: string[] = original.__rawCarImages || [];
    const rawShowroom: string[] = original.__rawShowroomImages || [];
    const carCount = this.editSR.voitures.length;

    const carCombined: string[] = [];
    for (let i = 0; i < carCount; i++) {
      const changed = this.editSR.voitures[i].preview;
      if (changed) carCombined.push(changed);
      else if (rawCar[i]) carCombined.push(rawCar[i]);       // on garde l’ancienne image voiture
      else carCombined.push('');                              // slot vide pour ne pas décaler les images showroom
    }

    // Showroom images: si pas de nouvelles, on garde les anciennes
    const showroomCombined: string[] =
      this.editSR.generalPreviews.length > 0 ? this.editSR.generalPreviews : rawShowroom;

    // On n’envoie "images" que si on a au moins un changement par rapport à la version reçue
    const willSendImages = (this.editSR.generalPreviews.length > 0) ||
                           this.editSR.voitures.some(v => !!v.preview);

    const payload: any = {
      nom: (this.editSR.nom || '').trim(),
      description: (this.editSR.description || '').trim(),
      voitures: voituresPayload
    };
    if (willSendImages) {
      payload.images = [...carCombined, ...showroomCombined];
    }

    this.showroomService.updateShowroom(this.editSR.id, payload).subscribe({
      next: () => {
        this.editSR.loading = false;
        this.editSR.open = false;
        this.openToast('success', 'Showroom mis à jour', 'Les informations ont été enregistrées.');
        this.loadShowrooms();
      },
      error: (err) => {
        this.editSR.loading = false;
        const msg = err?.error?.message || err?.error || err?.statusText || 'Mise à jour impossible.';
        this.openToast('error', 'Erreur', msg);
      }
    });
  }

  // ---------------- Toast ----------------
  popup = { open: false, type: 'success' as 'success'|'error'|'info', title: '', message: '', timer: null as any };
  openToast(type: 'success'|'error'|'info', title: string, message: string, autoCloseMs = 1800) {
    this.popup.type = type; this.popup.title = title; this.popup.message = message; this.popup.open = true;
    if (this.popup.timer) clearTimeout(this.popup.timer);
    this.popup.timer = setTimeout(() => this.closeToast(), autoCloseMs);
  }
  closeToast() { if (this.popup.timer) { clearTimeout(this.popup.timer); this.popup.timer = null; } this.popup.open = false; }

  // ---------------- Helpers UI ----------------
  editAnnonce(id: number) { console.log('Éditer:', id); }
  getTypeAnnonceClass(type: string): string {
    switch (type) { case 'VENTE': return 'badge bg-success'; case 'LOCATION': return 'badge bg-primary'; case 'ACHAT': return 'badge bg-warning'; default: return 'badge bg-secondary'; }
  }
  getStatutClass(statut: string): string {
    switch (statut) { case 'DISPONIBLE': return 'badge bg-success'; case 'RESERVE': return 'badge bg-warning'; case 'VENDU': return 'badge bg-danger'; default: return 'badge bg-secondary'; }
  }
  getDefaultImage(): string { return this.annonceService.getDefaultImageUrl(); }
  getImageUrl(imagePath: string): string { return this.annonceService.buildImageUrl(imagePath); }
  getShowroomImage(img: string): string { return this.toDisplayImage(img); }

  getVehiculePrimaryImage(v: any, showroom?: Showroom): string {
    if (Array.isArray(v?.images) && v.images.length > 0) return this.toDisplayImage(v.images[0]);
    if (v?.imageUrl) { if (/^https?:\/\//i.test(v.imageUrl)) return v.imageUrl; return this.getImageUrl(v.imageUrl); }
    if (typeof v?.image === 'string' && v.image) return this.toDisplayImage(v.image);
    if ((showroom as any)?.images?.length) return this.getShowroomImage((showroom as any).images[0]);
    return this.getDefaultImage();
  }

  // ---------------- Gestion images util ----------------
  private toDisplayImage(img: string): string {
    if (!img) return this.getDefaultImage();
    if (img.startsWith('blob:')) return img;
    if (img.startsWith('data:image/')) {
      try { const blob = this.dataURLtoBlob(img); const url = URL.createObjectURL(blob); this.createdBlobUrls.push(url); return url; }
      catch { return this.getDefaultImage(); }
    }
    if (/^https?:\/\//i.test(img)) return img;
    if (img.startsWith('/uploads/') || img.startsWith('/api/annonces/uploads/')) return this.getImageUrl(img);
    if (/^[A-Za-z0-9+/]+={0,2}$/.test(img) && img.length % 4 === 0) return this.toDisplayImage(`data:image/png;base64,${img}`);
    return this.getImageUrl(img);
  }
  private dataURLtoBlob(dataUrl: string): Blob {
    const [meta, b64] = dataUrl.split(','); const mime = /:(.*?);/.exec(meta)?.[1] || 'image/png';
    const bin = atob(b64 || ''); const len = bin.length; const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
    return new Blob([u8], { type: mime });
  }
  onImageError(event: Event): void { (event.target as HTMLImageElement).src = this.getDefaultImage(); }

  // Stats
  get totalAnnonces(): number     { return this.annonces?.length || 0; }
  get totalDisponibles(): number  { return this.annonces?.filter(a => a.statut === 'DISPONIBLE').length || 0; }
  get totalReservees(): number    { return this.annonces?.filter(a => a.statut === 'RESERVE').length || 0; }
  get totalVendues(): number      { return this.annonces?.filter(a => a.statut === 'VENDU').length || 0; }
}
