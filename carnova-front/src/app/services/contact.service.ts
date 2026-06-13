import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContactPayload {
  name: string; email: string; subject: string; message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private baseUrl = '/api/contact'; // adapte si nécessaire

  constructor(private http: HttpClient) {}

  send(payload: ContactPayload): Observable<void> {
    return this.http.post<void>(this.baseUrl, payload);
    // Si tu veux une réponse: change le type
  }
}
