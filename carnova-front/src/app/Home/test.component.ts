import { Component, OnInit, ViewChild } from '@angular/core';
import { AnnonceService, Annonce } from '../services/annonce.service';
import { AssistantBubbleComponent } from '../espace/assistant-bubble/assistant-bubble.component';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit {
  annonces: Annonce[] = [];
  filteredAnnonces: Annonce[] = [];
  loading = true;
  error = '';

  // Propriétés de recherche
  selectedBrand = '';
  searchModel = '';
  selectedPrice = '';

  // Référence vers le widget assistant (flottant)
  @ViewChild('assistant') assistant?: AssistantBubbleComponent;
  activeAnnonce: Annonce | null = null;
  activeContext: any = {};

  constructor(private annonceService: AnnonceService) {}

  ngOnInit() {
    this.loadAllAnnonces();
  }

  // Ouvre l'assistant avec le contexte de l'annonce cliquée
  openAssistantFor(annonce: Annonce, ev?: Event) {
    ev?.preventDefault();
    ev?.stopPropagation();

    this.activeAnnonce = annonce;
    this.activeContext = {
      titre: annonce?.titre,
      description: annonce?.description,
      typeAnnonce: annonce?.typeAnnonce,
      statut: annonce?.statut,
      'vendeur.email': annonce?.user?.email || '',
      createdAt: annonce?.createdAt || ''
      // Ajoute d'autres infos si disponibles (prix, km, localisation, etc.)
      // prix: annonce?.prix,
      // km: annonce?.km,
      // localisation: annonce?.localisation
    };

    this.assistant?.toggle();
  }

  loadAllAnnonces() {
    this.loading = true;
    this.error = '';

    this.annonceService.getAllAnnonces().subscribe({
      next: (annonces: Annonce[]) => {
        this.annonces = annonces;
        this.filteredAnnonces = annonces;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Erreur lors du chargement des annonces: ' + (err.error?.message || err.message || 'Erreur inconnue');
        this.loading = false;
      }
    });
  }

  onSearch(event: Event) {
    event.preventDefault();
    this.filterAnnonces();
  }

  filterAnnonces() {
    this.filteredAnnonces = this.annonces.filter(annonce => {
      let matchesBrand = true;
      let matchesModel = true;
      let matchesPrice = true;

      if (this.selectedBrand && this.selectedBrand !== 'All Brands') {
        const b = this.selectedBrand.toLowerCase();
        matchesBrand = (annonce.titre || '').toLowerCase().includes(b) ||
                       (annonce.description || '').toLowerCase().includes(b);
      }

      if (this.searchModel.trim()) {
        const m = this.searchModel.toLowerCase();
        matchesModel = (annonce.titre || '').toLowerCase().includes(m) ||
                       (annonce.description || '').toLowerCase().includes(m);
      }

      if (this.selectedPrice && this.selectedPrice !== 'Price Range') {
        matchesPrice = true; // placeholder
      }

      return matchesBrand && matchesModel && matchesPrice;
    });
  }

  resetFilters() {
    this.selectedBrand = '';
    this.searchModel = '';
    this.selectedPrice = '';
    this.filteredAnnonces = this.annonces;
  }

  getImageUrl(imageUrl: string): string {
    if (!imageUrl || imageUrl.trim() === '') {
      return this.getDefaultImage();
    }
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    if (imageUrl.startsWith('/uploads/')) {
      return 'http://localhost:8081/api/annonces' + imageUrl;
    }
    return 'http://localhost:8081/api/annonces/uploads/' + imageUrl.replace(/^\/+/, '');
  }

  getDefaultImage(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iI2NjYyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2Ugbm9uIGRpc3BvbmlibGU8L3RleHQ+PC9zdmc+';
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img && !img.dataset['errorHandled']) {
      img.src = this.getDefaultImage();
      img.dataset['errorHandled'] = 'true';
      img.style.border = '2px solid #ff6b6b';
      img.style.backgroundColor = '#f8f9fa';
    }
  }

  getTypeAnnonceClass(type: string): string {
    switch (type) {
      case 'VENTE': return 'bg-green-500';
      case 'LOCATION': return 'bg-blue-500';
      case 'ACHAT': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'DISPONIBLE': return 'bg-green-500';
      case 'RESERVE': return 'bg-yellow-500';
      case 'VENDU': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }
}
