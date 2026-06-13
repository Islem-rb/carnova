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
