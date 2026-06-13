import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AssistantResponse {
  answer: string;
  followUps: { text: string }[];
}

@Injectable({ providedIn: 'root' })
export class AutoAssistantService {
  private baseUrl = 'http://localhost:8081/api/assistant';

  constructor(private http: HttpClient) {}

  chat(message: string, context?: any, annonceId?: number): Observable<AssistantResponse> {
    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const body = {
      message,
      context: context || {},
      annonceId: annonceId ?? null,
      locale: navigator?.language || 'fr-FR'
    };
    return this.http.post<AssistantResponse>(`${this.baseUrl}/chat`, body, { headers });
  }
}
