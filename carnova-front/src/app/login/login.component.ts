import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    // Validation des champs
    if (!this.email || !this.password) {
      this.error = 'Email et mot de passe sont obligatoires';
      return;
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.error = 'Format d\'email invalide';
      return;
    }

    console.log('=== DÉBUT CONNEXION ===');
    console.log('Email:', this.email);
    console.log('Mot de passe:', '***');

    this.authService.signin({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        console.log('Réponse login:', res); // Ajout du log
        console.log('=== SUCCÈS CONNEXION ===');
        console.log('Réponse:', res);
        
        // Stocker le token et les informations utilisateur
        localStorage.setItem('token', res.token);
        console.log('Token stocké dans localStorage:', localStorage.getItem('token'));
        localStorage.setItem('userName', res.email);
        localStorage.setItem('userEmail', res.email);
        if (res.roles) {
          localStorage.setItem('userRoles', JSON.stringify(res.roles));
        }
        
        this.error = '';
        console.log('Token stocké:', res.token ? 'Oui' : 'Non');
        console.log('Redirection vers Home...');
        
        this.router.navigate(['/Home']).then(() => {
          window.location.reload();
        });
      },
      error: (err) => {
        console.log('=== ERREUR CONNEXION ===');
        console.error('Erreur complète:', err);
        console.error('Status:', err.status);
        console.error('Message:', err.error);
        
        let errorMessage = 'Email ou mot de passe incorrect';
        
        if (err.status === 401) {
          errorMessage = 'Email ou mot de passe incorrect';
        } else if (err.status === 400) {
          errorMessage = 'Données invalides';
        } else if (err.status === 500) {
          errorMessage = 'Erreur serveur, veuillez réessayer';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.error) {
          errorMessage = err.error;
        }
        
        this.error = errorMessage;
        console.log('Message d\'erreur affiché:', errorMessage);
      }
    });
  }
}
