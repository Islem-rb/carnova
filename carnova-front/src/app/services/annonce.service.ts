import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Annonce {
  id: number;
  titre: string;
  description: string;
  typeAnnonce: string;
  statut: string;
  imageUrl: string;
  user: any;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnnonceService {
  private apiUrl = 'http://localhost:8081/api/annonces';

  constructor(private http: HttpClient) {}

  // Normalise un chemin potentiellement cassé/partiel
  normalizeImagePath(imagePath: string): string {
    if (!imagePath) return '';
    return imagePath
      .replace('/api/annonces/uploads/', '/uploads/')
      .replace(/^\/+/, '')
      .replace(/\/+/g, '/');
  }

  // Construit une URL affichable via le contrôleur d'images des annonces
// services/annonce.service.ts
private baseUrl = 'http://localhost:8081'; // déjà présent chez toi, on l'utilise

buildImageUrl(imagePath: string): string {
  if (!imagePath || imagePath.trim() === '') {
    return this.getDefaultImageUrl();
  }

  // Laisse passer les data:/blob:/http(s) tels quels
  if (/^(blob:|data:image\/)/i.test(imagePath)) return imagePath;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  // Normalise tous les cas: on extrait uniquement le filename (ou sous-chemin) attendu par le contrôleur
  // Supprime d’abord un éventuel host + /api/annonces/uploads/
  let p = imagePath
    .replace(/^https?:\/\/[^/]+\/api\/annonces\/uploads\//i, '')
    .replace(/^\/?api\/annonces\/uploads\//i, '') // ex: /api/annonces/uploads/xxx -> xxx
    .replace(/^\/?uploads\//i, '')                // ex: /uploads/xxx ou uploads/xxx -> xxx
    .replace(/^\/+/, '');                         // supprime les slashes de tête

  // Assemble une URL absolue vers le back (évite le 4200/.../uploads)
  return `${this.baseUrl}/api/annonces/uploads/${p}`;
}
currentYear(): number {
  return new Date().getFullYear();
}
  getDefaultImageUrl(): string {
    // Simple placeholder (non-base64 côté stockage, mais ok pour un placeholder)
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iI2NjYyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2Ugbm9uIGRpc3BvbmlibGU8L3RleHQ+PC9zdmc+';
  }

  createAnnonce(formData: FormData): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    return this.http.post(this.apiUrl, formData, { headers }).pipe(
      catchError(error => {
        console.error('Erreur création annonce:', error);
        return throwError(() => error);
      })
    );
  }

  getMyAnnonces(): Observable<Annonce[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    return this.http.get<Annonce[]>(`${this.apiUrl}/my-annonces`, { headers }).pipe(
      catchError(error => {
        console.error('Erreur récupération annonces:', error);
        return throwError(() => error);
      })
    );
  }

  getAllAnnonces(): Observable<Annonce[]> {
    return this.http.get<Annonce[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Erreur récupération toutes les annonces:', error);
        return throwError(() => error);
      })
    );
  }

  deleteAnnonce(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    return this.http.delete(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(error => {
        console.error('Erreur suppression annonce:', error);
        return throwError(() => error);
      })
    );
  }
}
