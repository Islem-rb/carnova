import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  nom = '';
  prenom = '';
  email = '';
  password = '';
  role = '';
  message = '';
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSignup() {
    // Validation des champs
    if (!this.nom || !this.prenom || !this.email || !this.password || !this.role) {
      this.error = 'Tous les champs sont obligatoires';
      this.message = '';
      return;
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.error = 'Format d\'email invalide';
      this.message = '';
      return;
    }

    // Validation du mot de passe
    if (this.password.length < 8) {
      this.error = 'Le mot de passe doit contenir au moins 8 caractères';
      this.message = '';
      return;
    }

    console.log('=== DÉBUT INSCRIPTION ===');
    console.log('Données envoyées:', {
      nom: this.nom,
      prenom: this.prenom,
      email: this.email,
      password: '***',
      role: this.role
    });

    this.authService.signup({
      nom: this.nom,
      prenom: this.prenom,
      email: this.email,
      password: this.password,
      role: this.role
    }).subscribe({
      next: (res) => {
        console.log('=== SUCCÈS INSCRIPTION ===');
        console.log('Réponse:', res);
        this.message = 'Inscription réussie ! Redirection vers la page de connexion...';
        this.error = '';
        setTimeout(() => {
          this.router.navigate(['/Login']);
        }, 2000);
      },
      error: (err) => {
        console.log('=== ERREUR INSCRIPTION ===');
        console.error('Erreur complète:', err);
        console.error('Status:', err.status);
        console.error('Message:', err.error);

        let errorMessage = 'Erreur lors de l\'inscription';

        if (err.status === 400) {
          errorMessage = err.error?.message || 'Données invalides';
        } else if (err.status === 409) {
          errorMessage = 'Cet email est déjà utilisé';
        } else if (err.status === 500) {
          errorMessage = 'Erreur serveur, veuillez réessayer';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.error) {
          errorMessage = err.error;
        }

        this.error = errorMessage;
        this.message = '';
        console.log('Message d\'erreur affiché:', errorMessage);
      }
    });
  }
}
