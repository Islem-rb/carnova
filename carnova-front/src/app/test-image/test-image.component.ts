import { Component, OnInit } from '@angular/core';
import { AnnonceService, Annonce } from '../services/annonce.service';

@Component({
  selector: 'app-test-image',
  template: `
    <div class="container mt-4">
      <h2>Test d'affichage des images</h2>
      
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Diagnostic des annonces et images</h5>
          
          <div *ngIf="loading" class="text-center">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Chargement...</span>
            </div>
          </div>
          
          <div *ngIf="!loading && annonces.length === 0" class="alert alert-info">
            Aucune annonce trouvée
          </div>
          
          <div *ngIf="!loading && annonces.length > 0">
            <h6>Annonces trouvées ({{ annonces.length }}) :</h6>
            
            <div *ngFor="let annonce of annonces; let i = index" class="mb-4 p-3 border rounded">
              <h6>Annonce {{ i + 1 }} :</h6>
              <ul class="list-unstyled">
                <li><strong>ID:</strong> {{ annonce.id }}</li>
                <li><strong>Titre:</strong> {{ annonce.titre }}</li>
                <li><strong>ImageUrl brute:</strong> <code>{{ annonce.imageUrl }}</code></li>
                <li><strong>ImageUrl construite:</strong> <code>{{ getImageUrl(annonce.imageUrl) }}</code></li>
                <li><strong>Type:</strong> {{ annonce.typeAnnonce }}</li>
                <li><strong>Statut:</strong> {{ annonce.statut }}</li>
              </ul>
              
              <div class="mt-3">
                <h6>Test d'affichage de l'image :</h6>
                <div class="row">
                  <div class="col-md-6">
                    <h6>Image avec URL brute :</h6>
                    <img 
                      [src]="annonce.imageUrl" 
                      [alt]="annonce.titre"
                      style="max-width: 200px; border: 1px solid #ccc;"
                      (error)="onImageError($event, 'brute')"
                      (load)="onImageLoad($event, 'brute')"
                    />
                    <div *ngIf="imageErrors['brute']" class="text-danger mt-1">
                      Erreur: {{ imageErrors['brute'] }}
                    </div>
                  </div>
                  
                  <div class="col-md-6">
                    <h6>Image avec URL construite :</h6>
                    <img 
                      [src]="getImageUrl(annonce.imageUrl)" 
                      [alt]="annonce.titre"
                      style="max-width: 200px; border: 1px solid #ccc;"
                      (error)="onImageError($event, 'construite')"
                      (load)="onImageLoad($event, 'construite')"
                    />
                    <div *ngIf="imageErrors['construite']" class="text-danger mt-1">
                      Erreur: {{ imageErrors['construite'] }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div *ngIf="error" class="alert alert-danger mt-3">
            {{ error }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    code {
      background: #f8f9fa;
      padding: 2px 4px;
      border-radius: 3px;
      font-size: 0.9em;
    }
  `]
})
export class TestImageComponent implements OnInit {
  annonces: Annonce[] = [];
  loading = true;
  error = '';
  imageErrors: { [key: string]: string } = {};

  constructor(private annonceService: AnnonceService) {}

  ngOnInit() {
    this.loadAnnonces();
  }

  loadAnnonces() {
    this.loading = true;
    this.error = '';
    
    console.log('=== TEST IMAGE - CHARGEMENT ANNONCES ===');
    
    this.annonceService.getMyAnnonces().subscribe({
      next: (annonces) => {
        console.log('=== ANNONCES RÉCUPÉRÉES ===');
        console.log('Nombre d\'annonces:', annonces.length);
        annonces.forEach((annonce, index) => {
          console.log(`Annonce ${index + 1}:`, {
            id: annonce.id,
            titre: annonce.titre,
            imageUrl: annonce.imageUrl,
            imageUrlConstruite: this.getImageUrl(annonce.imageUrl),
            typeAnnonce: annonce.typeAnnonce,
            statut: annonce.statut
          });
        });
        
        this.annonces = annonces;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des annonces:', err);
        this.error = 'Erreur lors du chargement des annonces: ' + err.message;
        this.loading = false;
      }
    });
  }

  getImageUrl(imageUrl: string): string {
    if (!imageUrl || imageUrl === '') {
      return 'assets/no-image.png';
    }
    if (imageUrl.startsWith('/api/')) {
      return imageUrl;
    }
    return '/api' + imageUrl;
  }

  onImageError(event: Event, type: string) {
    const img = event.target as HTMLImageElement;
    if (img && !img.dataset['errorHandled']) {
      img.src = 'assets/no-image.png';
      img.dataset['errorHandled'] = 'true';
    }
    this.imageErrors[type] = `Impossible de charger l'image: ${img.src}`;
  }

  onImageLoad(event: Event, type: string) {
    delete this.imageErrors[type];
  }
} 