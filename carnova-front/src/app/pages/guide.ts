import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Ui } from '../core/ui';
import { Icon } from '../shared/icon';
interface Topic {
  key: string;
  title: string;
  intro: string;
  items: string[];
  source: string;
  sourceName: string;
}
const topics: Topic[] = [
  {
    key: 'achat',
    title: 'Avant le premier tour de clé.',
    intro:
      'Un bon achat commence par du temps, des questions précises et un dossier clair. Voici une liste de préparation pour votre prochaine visite.',
    items: [
      'Définissez votre budget total : prix du véhicule, assurance, entretien à prévoir et formalités.',
      'Demandez l’historique, les factures et les informations manquantes avant le rendez-vous.',
      'Comparez l’identité du vendeur, le véhicule présenté et ses documents.',
      'Prévoyez un essai à froid et l’avis d’un professionnel indépendant.',
      'Ne versez pas d’acompte avant d’avoir vu le véhicule et vérifié le dossier.',
    ],
    source: 'https://www.attt.com.tn/',
    sourceName: 'Agence Technique des Transports Terrestres',
  },
  {
    key: 'fcr',
    title: 'Préparer un projet FCR.',
    intro:
      'Le régime de retour définitif dépend de votre situation personnelle et des caractéristiques du véhicule. Préparez votre dossier avec la Douane avant toute commande ou importation.',
    items: [
      'Rassemblez les éléments concernant votre résidence, vos séjours et votre projet de retour.',
      'Notez la première mise en circulation et les caractéristiques exactes du véhicule envisagé.',
      'Demandez à la Douane de confirmer votre éligibilité et les options applicables à votre dossier.',
      'Faites confirmer les délais, pièces, restrictions et coûts avant tout engagement financier.',
    ],
    source: 'https://www.douane.gov.tn/retour-definitif/',
    sourceName: 'Douane tunisienne · Retour définitif',
  },
  {
    key: 'douanes',
    title: 'Importer en ayant les bons repères.',
    intro:
      'Le montant et la procédure de dédouanement varient selon le véhicule et le régime d’importation. Une estimation ne remplace pas une confirmation du service compétent.',
    items: [
      'Identifiez le véhicule : motorisation, cylindrée, date de première circulation, origine et valeur.',
      'Préparez les justificatifs de propriété et les documents de transport.',
      'Faites déterminer le régime applicable et les droits ou taxes auprès de la Douane.',
      'Vérifiez l’ensemble des coûts et les étapes d’immatriculation avant d’acheter à l’étranger.',
    ],
    source: 'https://www.douane.gov.tn/',
    sourceName: 'Douane tunisienne',
  },
  {
    key: 'visite-technique',
    title: 'Une visite bien préparée.',
    intro:
      'La visite technique est un repère administratif et technique. Vérifiez auprès de l’ATTT la procédure correspondant à votre véhicule et à sa situation.',
    items: [
      'Consultez votre échéance et les modalités de rendez-vous auprès de l’ATTT.',
      'Vérifiez la liste des documents, le centre et les frais applicables avant de vous déplacer.',
      'Contrôlez les éléments visibles : éclairage, pneus, essuie-glaces et niveaux.',
      'Conservez le rapport et faites traiter les éventuels défauts par un professionnel.',
    ],
    source: 'https://www.attt.com.tn/',
    sourceName: 'Agence Technique des Transports Terrestres',
  },
  {
    key: 'vignette',
    title: 'La vignette, sans improviser.',
    intro:
      'La taxe de circulation dépend notamment de la catégorie du véhicule et de sa puissance fiscale. Le ministère des Finances publie les informations applicables.',
    items: [
      'Relevez les informations de votre certificat d’immatriculation.',
      'Consultez le tarif et l’échéance correspondant à votre situation auprès du ministère des Finances.',
      'Vérifiez les modalités de règlement sur un service officiel avant de payer.',
      'Conservez votre justificatif avec les documents du véhicule.',
    ],
    source: 'https://www.finances.gov.tn/fr/autres-services',
    sourceName: 'Ministère des Finances · Autres services',
  },
];
@Component({ imports: [RouterLink, RouterLinkActive, Icon], templateUrl: './guide.html' })
export class Guide {
  readonly topics = topics;
  readonly current = signal(topics[0]);
  readonly ui = inject(Ui);
  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((p) =>
        this.current.set(topics.find((t) => t.key === p.get('topic')) ?? topics[0]),
      );
  }
}
