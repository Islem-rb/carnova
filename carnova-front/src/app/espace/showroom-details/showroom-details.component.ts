import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ShowroomService, Showroom } from '../../services/showroom.service';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-showroom-details',
  templateUrl: './showroom-details.component.html',
  styleUrls: ['./showroom-details.component.css']
})
export class ShowroomDetailsComponent implements OnInit, OnDestroy {
  loading = true;
  error = '';
  showroom: Showroom | null = null;
  isCarModalOpen = false;
selectedCar: any = null;

  // Galerie showroom
  gallery: string[] = [];
  selectedIndex = 0;

  // URLs blob à nettoyer
  private createdBlobUrls: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private showroomService: ShowroomService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'Showroom introuvable';
      this.loading = false;
      return;
    }

    this.showroomService.getShowroomById(id).subscribe({
      next: (data) => {
        if (!data) { this.error = 'Showroom introuvable'; this.loading = false; return; }

        // Redistribution des images: N premières = voitures, reste = galerie showroom
        const carCount = data.voitures?.length || 0;
        const allImgs = data.images || [];

        const carImgs = allImgs.slice(0, carCount);
        const showroomImgs = allImgs.slice(carCount);

        // Assigner image à chaque voiture (front only)
        if (data.voitures && data.voitures.length) {
          data.voitures = data.voitures.map((v, i) => ({
            ...v,
            image: carImgs[i] ? this.toDisplayImage(carImgs[i]) : undefined
          })) as any;
        }

        // Galerie showroom transformée (blob/http/uploads)
        this.gallery = showroomImgs.map(img => this.toDisplayImage(img));
        this.selectedIndex = 0;

        this.showroom = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error || 'Erreur de chargement';
        this.loading = false;
      }
    });
  }
openCarModal(v: any) {
  this.selectedCar = v;
  this.isCarModalOpen = true;
}

closeCarModal() {
  this.isCarModalOpen = false;
  this.selectedCar = null;
}

@HostListener('document:keydown.escape', ['$event'])
onEsc(event: KeyboardEvent) {
  if (this.isCarModalOpen) this.closeCarModal();
}
  ngOnDestroy(): void {
    this.createdBlobUrls.forEach(URL.revokeObjectURL);
    this.createdBlobUrls = [];
  }

  // Helpers images
  get selectedImage(): string {
    if ((this.gallery?.length || 0) > 0) return this.gallery[this.selectedIndex];
    return this.getDefaultImage();
  }

  selectImage(i: number) {
    if (i >= 0 && i < (this.gallery?.length || 0)) {
      this.selectedIndex = i;
    }
  }

  getVehiculePrimaryImage(v: any): string {
    if (Array.isArray(v?.images) && v.images.length > 0) return this.toDisplayImage(v.images[0]);
    if (typeof v?.image === 'string' && v.image) return this.toDisplayImage(v.image);
    if (v?.imageUrl) {
      if (/^https?:\/\//i.test(v.imageUrl)) return v.imageUrl;
      return this.getImageUrl(v.imageUrl);
    }
    return this.gallery?.[0] || this.getDefaultImage();
  }

  toDisplayImage(img: string): string {
    if (!img) return this.getDefaultImage();
    if (img.startsWith('blob:')) return img;

    if (img.startsWith('data:image/')) {
      try {
        const blob = this.dataURLtoBlob(img);
        const url = URL.createObjectURL(blob);
        this.createdBlobUrls.push(url);
        return url;
      } catch {
        return this.getDefaultImage();
      }
    }

    if (/^https?:\/\//i.test(img)) return img;
    if (img.startsWith('/uploads/') || img.startsWith('/api/annonces/uploads/')) {
      return this.getImageUrl(img);
    }

    // base64 brut
    if (/^[A-Za-z0-9+/]+={0,2}$/.test(img) && img.length % 4 === 0) {
      return this.toDisplayImage(`data:image/png;base64,${img}`);
    }

    return this.getImageUrl(img);
  }

  dataURLtoBlob(dataUrl: string): Blob {
    const [meta, b64] = dataUrl.split(',');
    const mime = /:(.*?);/.exec(meta)?.[1] || 'image/png';
    const bin = atob(b64 || '');
    const len = bin.length;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
    return new Blob([u8], { type: mime });
  }

  // Réutilise les helpers AnnonceService pour builder /uploads/
  getImageUrl(path: string): string {
    // même logique que mes-annonces: /api/annonces/uploads/...
    if (!path) return this.getDefaultImage();
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith('/api/annonces/uploads/')) return path;
    if (path.startsWith('/uploads/')) return '/api/annonces' + path;
    const clean = path.replace(/^\/uploads\//, '').replace(/^\/+/, '');
    return '/api/annonces/uploads/' + clean;
  }

  getDefaultImage(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIyIi8+PC9zdmc+';
  }

  back() {
    this.router.navigate(['/espace/mes-annonces']);
  }

  onImageError(ev: Event) {
    (ev.target as HTMLImageElement).src = this.getDefaultImage();
  }
}
