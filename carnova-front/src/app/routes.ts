import { Routes } from '@angular/router';
import { Home } from './pages/home';
import { authGuard, adminGuard } from './core/auth';
export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'CarNova — Le plaisir de trouver.',
  },
  {
    path: 'annonces',
    loadComponent: () => import('./pages/listings').then((m) => m.Listings),
    title: 'Trouver votre voiture · CarNova',
  },
  {
    path: 'annonces/:id',
    loadComponent: () => import('./pages/detail').then((m) => m.Detail),
    title: 'Le détail qui fait la différence · CarNova',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth-page').then((m) => m.AuthPage),
    title: 'Connexion · CarNova',
  },
  {
    path: 'inscription',
    loadComponent: () => import('./pages/auth-page').then((m) => m.AuthPage),
    data: { signup: true },
    title: 'Créer un compte · CarNova',
  },
  {
    path: 'espace',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/account').then((m) => m.Account),
    title: 'Mon espace · CarNova',
  },
  {
    path: 'espace/mes-annonces',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/account').then((m) => m.Account),
    title: 'Mes annonces · CarNova',
  },
  {
    path: 'espace/creer-annonce',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/create-listing').then((m) => m.CreateListing),
    title: 'Publier une annonce · CarNova',
  },
  {
    path: 'espace/modifier-annonce/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/create-listing').then((m) => m.CreateListing),
    title: 'Modifier une annonce · CarNova',
  },
  {
    path: 'showrooms',
    loadComponent: () => import('./pages/showrooms').then((m) => m.Showrooms),
    title: 'Les showrooms · CarNova',
  },
  {
    path: 'showrooms/:id',
    loadComponent: () => import('./pages/showroom-detail').then((m) => m.ShowroomDetail),
    title: 'La collection · CarNova',
  },
  {
    path: 'espace/creer-showroom',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/create-showroom').then((m) => m.CreateShowroom),
    title: 'Créer un showroom · CarNova',
  },
  {
    path: 'espace/modifier-showroom/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/create-showroom').then((m) => m.CreateShowroom),
    title: 'Modifier un showroom · CarNova',
  },
  {
    path: 'studio',
    loadComponent: () => import('./pages/studio').then((m) => m.Studio),
    title: 'Studio 3D · CarNova',
  },
  {
    path: 'car-drive',
    loadComponent: () => import('./pages/studio').then((m) => m.Studio),
    data: { drive: true },
    title: 'Conduite libre · CarNova',
  },
  {
    path: 'actualites',
    loadComponent: () => import('./pages/news').then((m) => m.NewsPage),
    title: 'Le Journal · CarNova',
  },
  {
    path: 'guide',
    loadComponent: () => import('./pages/guide').then((m) => m.Guide),
    title: 'Le guide automobile · CarNova',
  },
  {
    path: 'guide/:topic',
    loadComponent: () => import('./pages/guide').then((m) => m.Guide),
    title: 'Vos démarches · CarNova',
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about').then((m) => m.About),
    title: 'Notre histoire · CarNova',
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact').then((m) => m.Contact),
    title: 'Parlons automobile · CarNova',
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin').then((m) => m.Admin),
    title: 'Administration · CarNova',
  },
  { path: 'Home', redirectTo: '', pathMatch: 'full' },
  { path: 'Login', redirectTo: 'login' },
  { path: 'Registre', redirectTo: 'inscription' },
  { path: 'info', redirectTo: 'studio' },
  { path: 'espace/car3d', redirectTo: 'studio' },
  { path: 'espace/showroom/:id', redirectTo: 'showrooms/:id' },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found').then((m) => m.NotFound),
    title: 'Page introuvable · CarNova',
  },
];
