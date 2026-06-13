import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8081/api/auth';

  constructor(private http: HttpClient) {}

  signup(data: any): Observable<any> {
    console.log('=== SERVICE SIGNUP ===');
    console.log('URL complète:', `${this.apiUrl}/signup`);
    console.log('Données envoyées:', { ...data, password: '***' });

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log('Headers:', headers);

    return this.http.post(`${this.apiUrl}/signup`, data, { headers }).pipe(
      catchError(error => {
        console.error('=== ERREUR SERVICE SIGNUP ===');
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('Error:', error.error);
        console.error('URL:', error.url);
        return throwError(() => error);
      })
    );
  }

  signin(data: any): Observable<any> {
    console.log('=== SERVICE SIGNIN ===');
    console.log('URL complète:', `${this.apiUrl}/signin`);
    console.log('Données envoyées:', { ...data, password: '***' });

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log('Headers:', headers);

    return this.http.post(`${this.apiUrl}/signin`, data, { headers }).pipe(
      catchError(error => {
        console.error('=== ERREUR SERVICE SIGNIN ===');
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('Error:', error.error);
        console.error('URL:', error.url);
        return throwError(() => error);
      })
    );
  }

  // Méthode de test pour vérifier la connectivité
  testConnection(): Observable<any> {
    console.log('=== TEST CONNECTION ===');
    console.log('URL de test:', `${this.apiUrl}/test`);
    return this.http.get(`${this.apiUrl}/test`);
  }
}
