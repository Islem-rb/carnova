export interface Seller {
  id: number;
  name: string;
}
export interface Listing {
  id: number;
  titre: string;
  description: string;
  typeAnnonce: string;
  statut: string;
  imageUrl: string | null;
  model3dUrl: string | null;
  user: Seller;
  marque: string | null;
  modele: string | null;
  annee: number | null;
  prix: number | null;
  kilometrage: number | null;
  carburant: string | null;
  boiteVitesse: string | null;
  couleur: string | null;
  ville: string | null;
  typeVehicule: string | null;
  telephone: string | null;
  createdAt: string | null;
  images: string[];
}
export interface ListingPage {
  items: Listing[];
  total: number;
  page: number;
  pages: number;
}
export interface Vehicle {
  marque: string;
  modele: string;
  annee: number;
  prix: number;
  couleur: string;
}
export interface Showroom {
  id: number;
  nom: string;
  description: string;
  ville: string;
  telephone: string;
  user: Seller;
  images: string[];
  voitures: Vehicle[];
}
export interface News {
  id: string;
  title: string;
  summary: string;
  imageUrl: string | null;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
}
export interface Session {
  token: string;
  type: string;
  id: number;
  email: string;
  name: string;
  roles: string[];
  expiresIn: number;
  expiresAt: number;
}
export interface Profile {
  id: number;
  email: string;
  name: string;
  roles: string[];
  prenom: string;
  nom: string;
  emailVerified: boolean;
}
export interface ChatResponse {
  answer: string;
  provider: string;
  followUps: { text: string }[];
}
export interface BillingConfig {
  mode: 'mock' | 'test';
  amount: number;
  currency: string;
  publishableKey: string;
}
export interface PaymentIntent {
  paymentIntentId: string;
  clientSecret: string;
  mode: 'mock' | 'test';
  amount: number;
}
export interface Overview {
  users: number;
  listings: number;
  showrooms: number;
  news: number;
  months: { month: string; count: number }[];
  recentListings: Listing[];
  messages: { id: number; name: string; email: string; message: string; createdAt: string }[];
}
export const brands = [
  'Audi',
  'BMW',
  'Land Rover',
  'Mercedes-Benz',
  'Maserati',
  'Porsche',
  'Tesla',
  'Toyota',
  'Volkswagen',
  'Peugeot',
  'Renault',
];
export const cities = [
  'Tunis',
  'La Marsa',
  'Sousse',
  'Sfax',
  'Hammamet',
  'Nabeul',
  'Bizerte',
  'Monastir',
];
export function label(value: string | null): string {
  const labels: Record<string, string> = {
    ESSENCE: 'Essence',
    DIESEL: 'Diesel',
    ELECTRIQUE: 'Électrique',
    HYBRIDE: 'Hybride',
    GPL: 'GPL',
    AUTOMATIQUE: 'Automatique',
    MANUELLE: 'Manuelle',
    VENTE: 'À vendre',
    LOCATION: 'À louer',
    ACHAT: 'Recherche',
    DISPONIBLE: 'Disponible',
    RESERVE: 'Réservée',
    VENDU: 'Vendue',
    BERLINE: 'Berline',
    SUV: 'SUV',
    COUPE: 'Coupé',
    CITADINE: 'Citadine',
    PICKUP: 'Pick-up',
    CAMION: 'Camion',
    MOTO: 'Moto',
  };
  return value ? (labels[value] ?? value) : 'Non précisé';
}
export function price(value: number | null): string {
  return value == null
    ? 'Prix sur demande'
    : new Intl.NumberFormat('fr-TN', { maximumFractionDigits: 0 }).format(value) + ' TND';
}
export function imageUrl(value: string | null | undefined): string {
  return value &&
    !value.includes('..') &&
    (/^\/(?:assets|uploads)\//.test(value) || /^\/api\/annonces\/uploads\//.test(value))
    ? value
    : '/assets/placeholder.svg';
}
export function errorMessage(e: unknown): string {
  const x = e as { status?: number; error?: { message?: string } };
  return x.status === 0
    ? 'Connexion au serveur impossible. Vérifiez votre connexion puis réessayez.'
    : (x.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.');
}
