import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-test-connection',
  template: `
    <div class="container mt-4">
      <h2>Test de Connexion Backend</h2>
      
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Diagnostic</h5>
          
          <div class="mb-3">
            <button class="btn btn-primary me-2" (click)="testBackendConnection()">
              Test Backend
            </button>
            <button class="btn btn-secondary me-2" (click)="testSignup()">
              Test Signup
            </button>
            <button class="btn btn-info" (click)="testSignin()">
              Test Signin
            </button>
          </div>
          
          <div *ngIf="result" class="alert alert-info">
            <pre>{{ result }}</pre>
          </div>
          
          <div *ngIf="error" class="alert alert-danger">
            <pre>{{ error }}</pre>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    pre {
      background: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
      font-size: 12px;
    }
  `]
})
export class TestConnectionComponent {
  result: string = '';
  error: string = '';

  constructor(private authService: AuthService) {}

  testBackendConnection() {
    console.log('=== TEST BACKEND CONNECTION ===');
    this.result = '';
    this.error = '';
    
    this.authService.testConnection().subscribe({
      next: (response) => {
        console.log('Backend répond:', response);
        this.result = JSON.stringify(response, null, 2);
      },
      error: (err) => {
        console.error('Erreur backend:', err);
        this.error = JSON.stringify(err, null, 2);
      }
    });
  }

  testSignup() {
    console.log('=== TEST SIGNUP ===');
    this.result = '';
    this.error = '';
    
    const testData = {
      nom: 'Test',
      prenom: 'User',
      email: 'test@example.com',
      password: 'password123',
      role: 'ROLE_USER'
    };
    
    this.authService.signup(testData).subscribe({
      next: (response) => {
        console.log('Signup réussi:', response);
        this.result = JSON.stringify(response, null, 2);
      },
      error: (err) => {
        console.error('Erreur signup:', err);
        this.error = JSON.stringify(err, null, 2);
      }
    });
  }

  testSignin() {
    console.log('=== TEST SIGNIN ===');
    this.result = '';
    this.error = '';
    
    const testData = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    this.authService.signin(testData).subscribe({
      next: (response) => {
        console.log('Signin réussi:', response);
        this.result = JSON.stringify(response, null, 2);
      },
      error: (err) => {
        console.error('Erreur signin:', err);
        this.error = JSON.stringify(err, null, 2);
      }
    });
  }
} 