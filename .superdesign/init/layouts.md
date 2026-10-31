# Legacy layouts

## carnova-front/src/app/app.component.ts
```ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'carnova-front';
}

```
## carnova-front/src/app/app.component.html
```html

<app-navbar></app-navbar>
<router-outlet></router-outlet>


```
## carnova-front/src/app/navbar/navbar.component.ts
```ts
import { Component, OnInit, HostListener, ElementRef } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  // Utilisateur
  userName: string | null = null;
  userEmail: string | null = null;

  // Modale Conduite 3D
  driveOpen = false;

  // Menu mobile
  mobileOpen = false;

  // Dropdowns
  guideOpen = false;
  userMenuOpen = false; // ⬅️ menu de l’avatar (W)

  constructor(private eRef: ElementRef) {}

  ngOnInit(): void {
    const user = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');
    if (user)  this.userName  = user;
    if (email) this.userEmail = email;
  }

  // --- Auth
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    window.location.reload();
  }

  // --- Modale 3D (hors routing)
  openDrive3D(event?: Event): void {
    event?.preventDefault();
    this.driveOpen = true;
  }
  closeDrive3D(): void {
    this.driveOpen = false;
  }

  // --- Menu Mobile
  toggleMobileMenu(): void {
    this.mobileOpen = !this.mobileOpen;
    if (this.mobileOpen) {
      this.closeGuide();
      this.closeUserMenu();
    }
  }
  closeMobileMenu(): void { this.mobileOpen = false; }

  // --- Dropdown "Guide Pratique"
  toggleGuide(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.guideOpen = !this.guideOpen;
    if (this.guideOpen) this.closeUserMenu();
  }
  openGuide(): void { this.guideOpen = true; }
  closeGuide(): void { this.guideOpen = false; }

  // --- Dropdown "User" (avatar)
  toggleUserMenu(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.userMenuOpen = !this.userMenuOpen;
    if (this.userMenuOpen) this.closeGuide();
  }
  openUserMenu(): void { this.userMenuOpen = true; }
  closeUserMenu(): void { this.userMenuOpen = false; }

  // --- Accessibilité: fermer sur "Escape"
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeGuide();
    this.closeUserMenu();
  }

  // --- Fermer les dropdowns si clic en dehors
  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    // si on clique en dehors du composant, fermer les menus ouverts
    if (!this.eRef.nativeElement.contains(ev.target)) {
      if (this.guideOpen) this.guideOpen = false;
      if (this.userMenuOpen) this.userMenuOpen = false;
    }
  }

  // --- Fermer menus quand on navigue
  onNavLinkClick(): void {
    if (this.mobileOpen) this.closeMobileMenu();
    this.closeGuide();
    this.closeUserMenu();
  }
}

```
## carnova-front/src/app/navbar/navbar.component.html
```html
<!-- NAVBAR -->
<div class="navbar-violet">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">

      <!-- Logo -->
      <div class="flex items-center">
        <a class="flex items-center gap-2" routerLink="/Home" aria-label="CarNova" (click)="onNavLinkClick()">
          <i class="fas fa-car text-white text-2xl" aria-hidden="true"></i>
          <span class="text-white font-bold text-xl">CarNova</span>
        </a>
      </div>

      <!-- Menu desktop (espacé du logo) -->
      <nav class="hidden md:flex md:items-center md:space-x-6 ml-8 lg:ml-12" aria-label="Primary">
        <a routerLink="/Home" routerLinkActive="active" class="nav-link" (click)="onNavLinkClick()">Home</a>

        <div class="nav-item nav-tab" [class.open]="guideOpen">
          <a class="nav-link" href="#" (click)="toggleGuide($event)" aria-haspopup="true" [attr.aria-expanded]="guideOpen">
            Guide Pratique
          </a>
          <ul class="guide-menu" role="menu" aria-label="Menu Guide Pratique">
            <li><a role="menuitem" routerLink="/guide/fcr"              class="menu-link c-fcr"      (click)="onNavLinkClick()">FCR</a></li>
            <li><a role="menuitem" routerLink="/guide/douanes"          class="menu-link c-douanes"  (click)="onNavLinkClick()">Droits de douanes</a></li>
            <li><a role="menuitem" routerLink="/guide/visite-technique" class="menu-link c-visite"   (click)="onNavLinkClick()">Visite technique</a></li>
            <li><a role="menuitem" routerLink="/guide/vignette"         class="menu-link c-vignette" (click)="onNavLinkClick()">Vignette</a></li>
          </ul>
        </div>

        <a routerLink="/actualites" routerLinkActive="active" class="nav-link" (click)="onNavLinkClick()">Actualités</a>
        <a routerLink="/espace" routerLinkActive="active" class="nav-link" (click)="onNavLinkClick()">Mon Espace</a>
        <a routerLink="/info" routerLinkActive="active" class="nav-link" (click)="onNavLinkClick()">Carnova3D</a>
        <a routerLink="/about" routerLinkActive="active" class="nav-link" (click)="onNavLinkClick()">About</a>
        <a routerLink="/contact" routerLinkActive="active" class="nav-link" (click)="onNavLinkClick()">Contact</a>
      </nav>

      <!-- Zone utilisateur PRO -->
      <div class="hidden md:flex md:items-center relative">
        <ng-container *ngIf="userName; else notConnected">
          <!-- Bouton avatar -->
          <button
            class="uicon-btn"
            type="button"
            (click)="toggleUserMenu($event)"
            aria-haspopup="menu"
            [attr.aria-expanded]="userMenuOpen">
            <span class="uicon-inner">
              {{ userName?.charAt(0) | uppercase }}
            </span>
          </button>

          <!-- Dropdown -->
          <div *ngIf="userMenuOpen" class="u-dropdown" role="menu">
            <!-- En-tête gradient -->
            <div class="u-header">
              <div class="u-avatar-lg">
                {{ userName?.charAt(0) | uppercase }}
              </div>
              <div class="u-id">
                <div class="u-name" title="{{ userName }}">{{ userName }}</div>
                <div class="u-mail" title="{{ userEmail }}">{{ userEmail }}</div>
              </div>
            </div>

            <!-- Actions -->
            <div class="u-actions">
              <a routerLink="/profile" (click)="onNavLinkClick()" class="u-action">
                <i class="fas fa-user"></i><span>Profil</span>
              </a>
              <a routerLink="/settings" (click)="onNavLinkClick()" class="u-action">
                <i class="fas fa-sliders-h"></i><span>Paramètres</span>
              </a>
              <a routerLink="/dashboard" (click)="onNavLinkClick()" class="u-action">
                <i class="fas fa-chart-line"></i><span>Tableau de bord</span>
              </a>
            </div>

            <!-- Separator -->
            <div class="u-sep"></div>

            <!-- Logout -->
            <button class="u-logout" type="button" (click)="logout()">
              <i class="fas fa-sign-out-alt"></i><span>Se déconnecter</span>
            </button>
          </div>
        </ng-container>

        <ng-template #notConnected>
          <button routerLink="/Login" class="btn-login" type="button" (click)="onNavLinkClick()">Login</button>
          <button routerLink="/Registre" class="btn-register" type="button" (click)="onNavLinkClick()">Register</button>
        </ng-template>
      </div>

      <!-- Mobile -->
      <div class="-mr-2 flex items-center md:hidden">
        <button type="button" class="btn-mobile" aria-label="Open main menu" (click)="toggleMobileMenu()">
          <span class="sr-only">Open main menu</span>
          <i class="fas fa-bars" aria-hidden="true"></i>
        </button>
      </div>
    </div>

    <!-- Menu mobile -->
    <div *ngIf="mobileOpen" class="md:hidden mobile-menu">
      <a routerLink="/Home" class="mobile-item" (click)="onNavLinkClick()">Home</a>
      <details class="mobile-disclosure">
        <summary class="mobile-item">Guide Pratique</summary>
        <div class="pl-4 py-2 space-y-2">
          <a routerLink="/guide/fcr" class="mobile-subitem" (click)="onNavLinkClick()">FCR</a>
          <a routerLink="/guide/douanes" class="mobile-subitem" (click)="onNavLinkClick()">Droits de douanes</a>
          <a routerLink="/guide/visite-technique" class="mobile-subitem" (click)="onNavLinkClick()">Visite technique</a>
          <a routerLink="/guide/vignette" class="mobile-subitem" (click)="onNavLinkClick()">Vignette</a>
        </div>
      </details>

      <a routerLink="/actualites" class="mobile-item" (click)="onNavLinkClick()">Actualités</a>
      <a routerLink="/espace" class="mobile-item" (click)="onNavLinkClick()">Mon Espace</a>
      <a routerLink="/info" class="mobile-item" (click)="onNavLinkClick()">Carnova3D</a>
      <a routerLink="/about" class="mobile-item" (click)="onNavLinkClick()">About</a>
      <a routerLink="/contact" class="mobile-item" (click)="onNavLinkClick()">Contact</a>

      <div class="mt-3 flex gap-2">
        <button routerLink="/Login" class="btn-login w-full" type="button" (click)="onNavLinkClick()">Login</button>
        <button routerLink="/Registre" class="btn-register w-full" type="button" (click)="onNavLinkClick()">Register</button>
      </div>
    </div>
  </div>
</div>

<!-- Modale 3D -->
<app-car-drive *ngIf="driveOpen" (close)="closeDrive3D()" id="drive3d-modal"></app-car-drive>

```
## carnova-front/src/app/navbar/navbar.component.css
```css
/* --- Navbar Violet --- */
.navbar-violet {
  background: linear-gradient(90deg, #000000, #9333ea);
  color: white;
  font-family: "Open Sans", sans-serif;
}

/* Liens du menu */
.navbar-violet .nav-link {
  color: #e9d5ff;
  padding: 0.5rem 0.75rem;
  font-size: 0.95rem;
  font-weight: 500;
  transition: color 0.3s ease;
    white-space: nowrap; /* 🔹 Empêche le retour à la ligne */

}
.navbar-violet .nav-link:hover {
  color: white;
}

/* Boutons Login & Register */
.btn-login {
  padding: 0.5rem 1rem;
  border: 1px solid #e9d5ff;
  color: #e9d5ff;
  border-radius: 0.375rem;
  font-size: 0.9rem;
  font-weight: 500;
  background: transparent;
  transition: all 0.3s ease;
}
.btn-login:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.btn-register {
  margin-left: 0.75rem;
  padding: 0.5rem 1rem;
  background: white;
  color: #6d28d9;
  border-radius: 0.375rem;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}
.btn-register:hover {
  background: #e9d5ff;
  color: #581c87;
}

/* Bouton Logout */
.btn-logout {
  margin-left: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #320636;
  color: white;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background 0.3s ease;
}
.btn-logout:hover {
  background: #463c3c;
}

/* Mobile menu button */
.btn-mobile {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  color: #e9d5ff;
  background: transparent;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
}
.btn-mobile:hover {
  background: rgba(255, 255, 255, 0.1);
}



/* Ajoute de l'espace entre logo et menu */
.navbar-violet nav {
  margin-left: 2rem; /* augmente si besoin (2rem ≈ 32px) */
}

/* Avatar utilisateur */
.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #9333ea, #6d28d9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(147, 51, 234, 0.5);
  border: 2px solid #fff;
  transition: transform 0.2s ease;
}
.user-avatar:hover {
  transform: scale(1.05);
}

/* Infos utilisateur */
.user-info span.name {
  font-weight: 600;
  font-size: 1rem;
  color: #fff;
}
.user-info span.email {
  font-size: 0.8rem;
  color: #d8b4fe;
  font-style: italic;
}

/* Bouton logout modernisé */
.btn-logout {
  margin-left: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 9999px; /* pill shape */
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.25);
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(6px);
}
.btn-logout i {
  color: #f87171; /* icône rouge clair */
}
.btn-logout:hover {
  background: linear-gradient(90deg, #9333ea, #6d28d9);
  border-color: transparent;
  box-shadow: 0 4px 14px rgba(109, 40, 217, 0.6);
}










/* ===== User button (avatar compact) ===== */
.uicon-btn{
  display:inline-flex; align-items:center; justify-content:center;
  width:42px; height:42px; border-radius:9999px; border:1px solid rgba(255,255,255,.25);
  background:rgba(255,255,255,.08);
  box-shadow:0 4px 14px rgba(0,0,0,.25), inset 0 0 0 2px rgba(255,255,255,.04);
  backdrop-filter: blur(6px);
  cursor:pointer; transition:transform .15s ease, background .2s ease, border-color .2s ease;
}
.uicon-btn:hover{ background:rgba(255,255,255,.12); transform: translateY(-1px); }
.uicon-inner{
  width:34px; height:34px; border-radius:9999px;
  display:flex; align-items:center; justify-content:center;
  font-weight:800; font-size:1rem; color:#fff;
  background: radial-gradient(120% 120% at 0% 0%, #9a5bff 0%, #6d28d9 60%, #4c1d95 100%);
  box-shadow: inset 0 1px 4px rgba(255,255,255,.25), 0 6px 16px rgba(109,40,217,.45);
}

/* ===== Dropdown glass card ===== */
.u-dropdown{
  position:absolute; right:.5rem; top:3.5rem; min-width:280px;
  background: rgba(255,255,255,0.9);
  border:1px solid rgba(99,102,241,.15);
  border-radius:14px; overflow:hidden; z-index:2000;
  box-shadow: 0 18px 38px rgba(0,0,0,.25);
  animation: uPop .16s ease-out;
}
@keyframes uPop { from{ transform:translateY(-6px); opacity:0 } to{ transform:translateY(0); opacity:1 } }

/* Header gradient avec avatar large */
.u-header{
  background: linear-gradient(120deg, #7c3aed, #6d28d9 55%, #4c1d95 100%);
  color:#fff; padding:14px; display:flex; gap:12px; align-items:center;
}
.u-avatar-lg{
  width:40px; height:40px; border-radius:9999px; display:flex; align-items:center; justify-content:center;
  font-weight:800; background: rgba(255,255,255,.18); border:1px solid rgba(255,255,255,.35);
  box-shadow: inset 0 1px 2px rgba(255,255,255,.3);
}
.u-id .u-name{ font-weight:700; line-height:1.1 }
.u-id .u-mail{ font-size:.85rem; opacity:.95 }

/* Actions grid */
.u-actions{
  display:grid; grid-template-columns: 1fr 1fr 1fr; gap:8px; padding:10px;
  background: rgba(255,255,255,.65);
}
.u-action{
  display:flex; flex-direction:column; align-items:center; gap:6px;
  text-decoration:none; padding:10px 8px; border-radius:10px;
  color:#1f2937; font-weight:600; font-size:.85rem;
  border:1px solid rgba(0,0,0,.05); background: rgba(255,255,255,.8);
  transition: transform .12s ease, box-shadow .12s ease, background .15s ease;
}
.u-action i{ font-size:1rem; opacity:.9 }
.u-action:hover{
  transform: translateY(-2px);
  box-shadow:0 8px 18px rgba(109,40,217,.18);
  background:#fff;
}

/* Séparateur */
.u-sep{ height:1px; background:linear-gradient(90deg, transparent, rgba(0,0,0,.08), transparent); }

/* Logout primary */
.u-logout{
  width: calc(100% - 20px); margin:10px; padding:10px 12px;
  display:flex; align-items:center; justify-content:center; gap:8px;
  border-radius:10px; border:0; cursor:pointer;
  background: linear-gradient(90deg, #ef4444, #dc2626);
  color:#fff; font-weight:700; letter-spacing:.1px;
  box-shadow: 0 10px 22px rgba(220,38,38,.35);
  transition: transform .12s ease, box-shadow .12s ease, filter .15s ease;
}
.u-logout:hover{ transform: translateY(-1px); filter:saturate(1.05); box-shadow:0 14px 26px rgba(220,38,38,.45); }





/* Le conteneur du bouton dans la barre */
.nav-item { list-style: none; }
.nav-tab { position: relative; }

/* Le seul bouton visible */
.tab-link{
  background: transparent; color:#fff; font-weight:600;
  padding:.5rem .75rem; border:0; cursor:pointer; border-radius:.5rem;
}

/* Sous-menu : ABSOLU + caché par défaut */
.guide-menu{
  position:absolute; top:100%; left:0;
  min-width:220px; margin-top:6px; padding:.25rem 0;
  background:#fff; border:1px solid #e5e7eb; border-radius:6px;
  box-shadow:0 12px 28px rgba(0,0,0,.18);
  display:none; z-index:1000;
}

/* Afficher le sous-menu au survol/focus du parent */
.nav-tab:hover .guide-menu,
.nav-tab:focus-within .guide-menu{ display:block; }

/* Lignes internes du menu */
.menu-link{
  --dot:#d1d5db;
  position:relative; display:block;
  padding:.5rem .75rem .5rem 2rem;
  color:#374151; text-decoration:none; font-weight:500;
  border-top:1px solid #f3f4f6; transition:background .15s,color .15s;
}
.menu-link:first-child{ border-top:0; }
.menu-link::before{
  content:""; position:absolute; left:.7rem; top:50%; transform:translateY(-50%);
  width:10px; height:10px; border-radius:2px; background:var(--dot);
}
.menu-link:hover{ background:#f7f7f7; color:#111; }

/* Couleur du petit carré par item (facultatif) */
.c-fcr{ --dot:#9ca3af; }
.c-douanes{ --dot:#9ca3af; }
.c-visite{ --dot:#9ca3af; }
.c-vignette{ --dot:#9ca3af; }

/* (Optionnel) s'assure que le menu n'est pas coupé par un overflow */
.navbar-violet, .navbar-violet nav { overflow: visible; }

```
