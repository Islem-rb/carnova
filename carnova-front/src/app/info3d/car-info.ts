// Données affichées dans les bulles (pneus + intérieur + moteur, etc.)

export interface SpecLine { label: string; value: string }
export interface CarPartInfo {
  id: string;
  title: string;
  subtitle?: string;
  specs?: SpecLine[];
  bullets?: string[];
  image?: string;
  linkLabel?: string;
  linkUrl?: string;
}

export const CAR_INFO: Record<string, CarPartInfo> = {
  // ——— MOTEUR / CAPOT
  Engine: {
    id: 'Engine',
    title: 'Moteur V6/V8 haute performance',
    subtitle: 'Bi-turbo / Supercharged selon version',
    specs: [
      { label: 'Puissance', value: '≈ 450–700 ch' },
      { label: 'Couple', value: '≈ 600–880 Nm' },
      { label: '0–100 km/h', value: '≈ 3.5–5.5 s' },
    ],
    bullets: ['Refroidissement optimisé', 'Vidange chaque 10 000–15 000 km', 'Alternateur 120–220 A'],
  },
  Hood: {
    id: 'Hood',
    title: 'Capot',
    bullets: ['Ouverture ~55°', 'Prises d’air fonctionnelles', 'Amortisseurs de capot'],
  },

  // ——— PNEUS (exemples pour un pick-up type off-road)
  Tire_FL: {
    id: 'Tire_FL',
    title: 'Pneu AVG',
    specs: [
      { label: 'Dimension', value: '315/70 R17' },
      { label: 'Indice', value: '121/118 S' },
      { label: 'Pression route', value: '2.4 bar (chargé 2.7)' },
    ],
    bullets: ['All-Terrain', 'Flancs renforcés', 'TPMS intégré'],
  },
  Tire_FR: {
    id: 'Tire_FR',
    title: 'Pneu AVD',
    specs: [
      { label: 'Dimension', value: '315/70 R17' },
      { label: 'Indice', value: '121/118 S' },
      { label: 'Couple serrage écrous', value: '≈ 200 Nm' },
    ],
    bullets: ['Profil symétrique', 'Usure uniforme souhaitée'],
  },
  Tire_RL: {
    id: 'Tire_RL',
    title: 'Pneu ARG',
    specs: [
      { label: 'Dimension', value: '315/70 R17' },
      { label: 'Pression tout-terrain', value: '1.6–1.8 bar (selon terrain)' },
    ],
    bullets: ['Rotation tous les 10 000 km', 'Capteurs TPMS'],
  },
  Tire_RR: {
    id: 'Tire_RR',
    title: 'Pneu ARD',
    specs: [
      { label: 'Jante', value: '17" x 8.5"' },
      { label: 'Écart usure idéal', value: '< 2–3 mm AV/AR' },
    ],
    bullets: ['Vérifier équilibrage', 'Flèche de rotation si pneu directionnel'],
  },

  // ——— INTÉRIEUR
  Steering: {
    id: 'Steering',
    title: 'Volant',
    bullets: ['Multifonctions', 'Aides à la conduite', 'Réglage profondeur/hauteur'],
  },
  Dashboard: {
    id: 'Dashboard',
    title: 'Tableau de bord',
    specs: [
      { label: 'Affichage', value: 'Compteur numérique + écran 12"' },
      { label: 'Connectivité', value: 'CarPlay / Android Auto' },
    ],
    bullets: ['Navigation intégrée', 'Personnalisation des vues'],
  },
  Console: {
    id: 'Console',
    title: 'Console centrale',
    bullets: ['Sélecteur de boîte', 'Modes Normal/Sport/Terrain', 'Chargeur induction'],
  },
  DriverSeat: {
    id: 'DriverSeat',
    title: 'Siège conducteur',
    specs: [
      { label: 'Réglages', value: '8 voies + mémoire' },
      { label: 'Confort', value: 'Chauffant/Ventilé' },
    ],
    bullets: ['Sellerie cuir/tissu', 'Support lombaire'],
  },
  Infotainment: {
    id: 'Infotainment',
    title: 'Écran central',
    specs: [
      { label: 'Taille', value: '12"' },
      { label: 'Audio', value: '10 HP + caisson' },
    ],
    bullets: ['Bluetooth, USB-C', 'Mises à jour OTA'],
  },
};
