import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-test-auth',
  template: `
    <div class="container mt-4">
      <h3>Test d'authentification</h3>
      
      <div class="card mb-3">
        <div class="card-body">
          <h5>Token dans localStorage:</h5>
          <p><strong>Token:</strong> {{ token || 'Aucun token trouvé' }}</p>
          <p><strong>Token valide:</strong> {{ token ? 'Oui' : 'Non' }}</p>
        </div>
      </div>
      
      <div class="card mb-3">
        <div class="card-body">
          <h5>Test de l'endpoint /api/annonces/test:</h5>
          <button class="btn btn-primary" (click)="testAuth()">Tester l'authentification</button>
          <div *ngIf="authResult" class="mt-2">
            <p><strong>Résultat:</strong> {{ authResult }}</p>
          </div>
          <div *ngIf="authError" class="mt-2 text-danger">
            <p><strong>Erreur:</strong> {{ authError }}</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-body">
          <h5>Actions:</h5>
          <button class="btn btn-warning me-2" (click)="clearToken()">Effacer le token</button>
          <button class="btn btn-info" (click)="refreshToken()">Rafraîchir le token</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 800px; }
    .card { margin-bottom: 1rem; }
  `]
})
export class TestAuthComponent {
  token: string | null = null;
  authResult: string = '';
  authError: string = '';

  constructor(private http: HttpClient) {
    this.refreshToken();
  }

  refreshToken() {
    this.token = localStorage.getItem('token');
  }

  clearToken() {
    localStorage.removeItem('token');
    this.token = null;
    this.authResult = '';
    this.authError = '';
  }

  testAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.authError = 'Aucun token trouvé';
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get('/api/annonces/test', { headers, responseType: 'text' })
      .subscribe({
        next: (response) => {
          this.authResult = response;
          this.authError = '';
        },
        error: (error) => {
          this.authError = `Erreur ${error.status}: ${error.message}`;
          this.authResult = '';
        }
      });
  }
} 