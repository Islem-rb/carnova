import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-espace',
  templateUrl: './espace.component.html',
  styleUrls: ['./espace.component.css']
})

export class EspaceComponent {
  isProfessional = false;

  constructor(private router: Router) {
    const rolesString = localStorage.getItem('userRoles');
    if (rolesString) {
      try {
        const roles = JSON.parse(rolesString);
        this.isProfessional = Array.isArray(roles) && roles.includes('ROLE_PROFESSIONAL');
      } catch (e) {
        this.isProfessional = false;
      }
    }
  }

  goToCreerAnnonce() {
    this.router.navigate(['/espace/creer-annonce']);
  }

  goToMesAnnonces() {
    this.router.navigate(['/espace/mes-annonces']);
  }

  goToTestAuth() {
    this.router.navigate(['/espace/test-auth']);
  }

  goToCreerShowroom() {
    this.router.navigate(['/espace/creer-showroom']);
  }
}
