import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class Model3dService {
  private baseUrl = 'http://localhost:8081/api/models';

  constructor(private http: HttpClient) {}

  uploadGlb(glb: File, annonceId?: number): Observable<{ model3dUrl: string }> {
    const fd = new FormData();
    fd.append('glb', glb);
    if (annonceId) fd.append('annonceId', String(annonceId));

    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.post<{ model3dUrl: string }>(`${this.baseUrl}/upload`, fd, { headers });
  }

  // Si un jour tu ajoutes la reconstruction par photos
  reconstructFromPhotos(files: File[], annonceId?: number): Observable<{ model3dUrl: string }> {
    const fd = new FormData();
    files.forEach(f => fd.append('photos', f));
    if (annonceId) fd.append('annonceId', String(annonceId));
    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.post<{ model3dUrl: string }>(`${this.baseUrl}/reconstruct`, fd, { headers });
  }
}
