import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface Vehicule {
  id?: number;
  marque: string;
  modele: string;
  annee: number | null;
  prix: number | null;
  couleur: string;

  // Champs optionnels côté front pour gérer les images par voiture
  imageUrl?: string;   // ex: "/uploads/voiture1.png" ou "http..."
  image?: string;      // ex: "data:image/png;base64,...." (affichage)
  images?: string[];   // si tu veux gérer une galerie par voiture plus tard
}

export interface Showroom {
  id?: number;
  nom: string;
  description: string;
  images: string[]; // base64/data:/uploads/http...
  voitures: Vehicule[];
}

@Injectable({ providedIn: 'root' })
export class ShowroomService {
  private apiUrl = 'http://localhost:8081/api/showrooms';

  constructor(private http: HttpClient) {}

  createShowroom(showroom: Showroom): Observable<Showroom> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.post<Showroom>(this.apiUrl, showroom, { headers }).pipe(
      tap(res => console.log('Showroom créé:', res)),
      catchError(err => {
        console.error('Erreur création showroom:', err);
        throw err;
      })
    );
  }


getShowroomById(id: number) {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
  return this.http.get<Showroom>(`${this.apiUrl}/${id}`, { headers });
}

deleteShowroom(id: number) {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
  // Le backend renvoie un String ou 204, on évite le parse JSON
  return this.http.delete(`${this.apiUrl}/${id}`, {
    headers,
    responseType: 'text' as 'json' // important: évite l'erreur [object Object]
  });
}
updateShowroom(id: number, payload: Partial<Showroom>) {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
  return this.http.put<Showroom>(`${this.apiUrl}/${id}`, payload, { headers });
}

  getMyShowrooms(): Observable<Showroom[]> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Aucun token trouvé dans le localStorage. Veuillez vous reconnecter.');
      return of([]);
    }
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get<Showroom[]>(`${this.apiUrl}/me`, { headers }).pipe(
      tap((res) => console.log('Réponse showrooms backend:', res)),
      catchError(err => {
        console.error('Erreur showrooms:', err);
        return of([]);
      })
    );
  }
}
