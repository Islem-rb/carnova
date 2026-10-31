import { Component, HostListener } from '@angular/core';

interface Block {
  id: string;
  title: string;
  content: string; // tu peux remplacer par du HTML si tu veux (avec [innerHTML])
}

@Component({
  selector: 'app-visite-technique',
  templateUrl: './visite-technique.component.html',
  styleUrls: ['./visite-technique.component.css']
})
export class VisiteTechniqueComponent {
  blocks: Block[] = [
{
  id: 'rdv',
  title: "PRENDRE UN RENDEZ-VOUS",
  content: `
    <p>
      Afin de limiter l'attente dans les centres de visite technique,
      l'ATTT a mis en place un <strong>système de prise de rendez-vous en ligne</strong>.
    </p>
    <p>
      Vous pouvez y accéder via le lien suivant :
      <a href="https://www.attt.com.tn/DEV_WEB/prendreunrendezvous.php?code_menu=73"
         target="_blank" rel="noopener" class="rdv-link">
         Rendez-vous visite technique <i class="fas fa-external-link-alt"></i>
      </a>
    </p>
  `
},




{
  id: 'pourquoi',
  title: "POURQUOI ?",
  content: `
    <div class="why-intro">
      <h3>Pourquoi la visite technique ? <span class="badge badge-violet">Obligatoire</span></h3>
      <p>
        La visite technique est <strong>obligatoire</strong> pour tous les véhicules et
        doit s’effectuer dans un des centres de l’ATTT. La <strong>fréquence</strong>
        dépend de la catégorie et de l’âge du véhicule.
      </p>
    </div>

    <div class="why-grid">
      <!-- Sécurité routière -->
      <article class="why-card">
        <h4><i class="fas fa-shield-alt"></i> Sécurité routière</h4>
        <p>
          Un véhicule mal entretenu est souvent impliqué dans les accidents.
          La visite technique <strong>responsabilise</strong> les conducteurs et
          réduit les risques (freinage, direction, pneus, éclairage…).
        </p>
        <div class="tagline"><span class="dot dot-green"></span> Prévention & contrôle</div>
      </article>

      <!-- Environnement -->
      <article class="why-card">
        <h4><i class="fas fa-leaf"></i> Protection de l’environnement</h4>
        <p>
          Les contrôles <strong>anti‑pollution</strong> limitent les émissions
          et contribuent à préserver la qualité de l’air.
        </p>
        <div class="tagline"><span class="dot dot-teal"></span> Moins d’émissions</div>
      </article>

      <!-- Parc automobile -->
      <article class="why-card">
        <h4><i class="fas fa-tools"></i> Amélioration du parc</h4>
        <p>
          En imposant un <strong>suivi régulier</strong>, la visite technique maintient
          le parc en bon état de fonctionnement et prolonge la durée de vie des véhicules.
        </p>
        <div class="tagline"><span class="dot dot-violet"></span> Entretien régulier</div>
      </article>
    </div>

    <div class="callout callout-violet">
      <i class="fas fa-info-circle"></i>
      <div>
        <strong>Quand l’effectuer ?</strong> La périodicité varie selon la catégorie
        et l’ancienneté du véhicule. Consultez la rubrique
        <strong>“Quand l’effectuer”</strong> dans ce guide.
      </div>
    </div>

    <div class="why-links">
      <a routerLink="/guide/visite-technique" class="chip chip-outline">
        <i class="fas fa-list-check"></i>&nbsp;Connaître les points de contrôle
      </a>
      <a href="http://www.attt.com.tn/page.php?code_menu=44" target="_blank" rel="noopener" class="chip chip-red ext-link">
        <i class="fas fa-external-link-alt"></i>&nbsp;Trouver le centre le plus proche
      </a>
    </div>
  `
},


















{
  id: 'mode',
  title: "MODE D'EMPLOI",
  content: `
    <div class="mode-steps">
      <!-- Étape 1 -->
      <div class="mode-step">
        <div class="mode-step-n">1</div>
        <div class="mode-step-body">
          <h3>La visite technique <span class="badge badge-violet">Sans RDV</span></h3>
          <p>Elle a lieu <strong>sans prise de rendez-vous préalable</strong>, dans le centre de votre choix.
          Le propriétaire peut se faire représenter par une tierce personne munie de la carte grise.</p>
        </div>
      </div>

      <!-- Étape 2 -->
      <div class="mode-step">
        <div class="mode-step-n">2</div>
        <div class="mode-step-body">
          <h3>Paiement des droits <span class="badge badge-red">Accueil</span></h3>
          <p>À l’arrivée, vous procédez au <strong>paiement</strong> avec la carte grise. On vous remet :</p>
          <ul class="tick">
            <li>la <strong>fiche de suivi</strong>,</li>
            <li>le <strong>numéro de chaîne</strong>,</li>
            <li>le <strong>reçu de paiement</strong>.</li>
          </ul>
        </div>
      </div>

      <!-- Étape 3 -->
      <div class="mode-step">
        <div class="mode-step-n">3</div>
        <div class="mode-step-body">
          <h3>Orientation vers la chaîne <span class="badge badge-green">File</span></h3>
          <p>Placez votre véhicule dans la <strong>file attribuée</strong>.
          Chaînes dédiées : <em>légers</em> / <em>poids lourds</em> (parfois chaîne mixte).</p>
        </div>
      </div>

      <!-- Étape 4 -->
      <div class="mode-step">
        <div class="mode-step-n">4</div>
        <div class="mode-step-body">
          <h3>Contrôle du véhicule <span class="badge badge-blue">Contrôle</span></h3>
          <p>Le technicien effectue une vérification <strong>visuelle & automatique</strong> des points réglementaires,
          <em>sans démontage</em>.</p>
        </div>
      </div>

      <!-- Étape 5 -->
      <div class="mode-step">
        <div class="mode-step-n">5</div>
        <div class="mode-step-body">
          <h3>Bilan <span class="badge badge-orange">Traitement</span></h3>
          <p>La fiche de suivi est remise au guichet pour <strong>traitement automatisé</strong> —
          aucune interprétation personnelle.</p>
          <div class="callout callout-violet">
            <i class="fas fa-info-circle"></i>
            Le <strong>décompte global</strong> détermine la délivrance du certificat.
          </div>
        </div>
      </div>
    </div>

    <h3 class="mode-section">Résultats possibles</h3>
    <div class="results">
      <div class="result-card ok">
        <h4><i class="fas fa-check-circle"></i> Aucun défaut</h4>
        <p>Certificat de visite technique délivré (validité selon catégorie).</p>
      </div>

      <div class="result-card minor">
        <h4><span class="dot dot-green"></span> Défaut mineur (cat. 3)</h4>
        <p>Circulation autorisée <strong>15 jours</strong>. Réparez puis repassez la 2ᵉ visite.</p>
      </div>

      <div class="result-card medium">
        <h4><span class="dot dot-orange"></span> Défaut moyen (cat. 2)</h4>
        <p>Circulation <strong>restreinte 15 jours</strong> (trajets vers garage). 2ᵉ visite obligatoire.</p>
      </div>

      <div class="result-card major">
        <h4><span class="dot dot-red"></span> Défaut grave (cat. 1)</h4>
        <p>Retrait de la carte grise. Rapport valable <strong>15 jours</strong>.</p>
      </div>
    </div>

    <h3 class="mode-section">Frais</h3>
    <ul class="fees">
      <li><span class="badge badge-gray">VL & deux‑roues</span> 19,800 DT (12 DT + 7,800 DT taxes)</li>
      <li><span class="badge badge-gray">Autres véhicules</span> 25,800 DT (18 DT + 7,800 DT taxes)</li>
    </ul>
  `
},














{
  id: 'quand',
  title: "QUAND L’EFFECTUER",
  content: `
    <div class="when-intro">
      <h3>Fréquence des visites <span class="badge badge-violet">Selon catégorie</span></h3>
      <p>
        La périodicité de la visite technique dépend de la <strong>catégorie</strong> et de l’<strong>ancienneté</strong> du véhicule.
      </p>
    </div>

    <div class="when-grid">
      <!-- Particuliers -->
      <article class="when-card">
        <h4><i class="fas fa-car"></i> Voitures particulières</h4>
        <table class="when-table">
          <thead><tr><th>Année</th><th>1</th><th>2</th><th>3</th><th>4-10</th><th>+11</th></tr></thead>
          <tbody>
            <tr><td>Fréquence</td><td>-</td><td>-</td><td>-</td><td><span class="dot dot-green"></span>24 mois</td><td><span class="dot dot-orange"></span>12 mois</td></tr>
          </tbody>
        </table>
      </article>

      <!-- Deux-roues -->
      <article class="when-card">
        <h4><i class="fas fa-motorcycle"></i> Deux-roues / Tricycles / Quads</h4>
        <table class="when-table">
          <thead><tr><th>Année</th><th>1</th><th>2</th><th>3</th><th>4-10</th><th>+11</th></tr></thead>
          <tbody>
            <tr><td>Fréquence</td><td>-</td><td>-</td><td>-</td><td><span class="dot dot-orange"></span>12 mois</td><td><span class="dot dot-orange"></span>12 mois</td></tr>
          </tbody>
        </table>
      </article>

      <!-- Utilitaires -->
      <article class="when-card">
        <h4><i class="fas fa-truck"></i> Véhicules utilitaires</h4>
        <table class="when-table">
          <thead><tr><th>Année</th><th>1</th><th>2</th><th>3</th><th>4-10</th><th>+11</th></tr></thead>
          <tbody>
            <tr><td>Fréquence</td><td>-</td><td>-</td><td><span class="dot dot-green"></span>12 mois</td><td><span class="dot dot-orange"></span>12 mois</td><td><span class="dot dot-red"></span>6 mois</td></tr>
          </tbody>
        </table>
      </article>

      <!-- Tracteurs -->
      <article class="when-card">
        <h4><i class="fas fa-tractor"></i> Tracteurs</h4>
        <table class="when-table">
          <thead><tr><th>Année</th><th>1</th><th>2</th><th>3</th><th>4-10</th><th>+11</th></tr></thead>
          <tbody>
            <tr><td>Routiers</td><td>-</td><td>-</td><td><span class="dot dot-orange"></span>12 mois</td><td><span class="dot dot-orange"></span>12 mois</td><td><span class="dot dot-red"></span>6 mois</td></tr>
            <tr><td>Agricoles</td><td>-</td><td>-</td><td>-</td><td><span class="dot dot-green"></span>24 mois</td><td><span class="dot dot-orange"></span>12 mois</td></tr>
          </tbody>
        </table>
      </article>

      <!-- Transport en commun -->
      <article class="when-card">
        <h4><i class="fas fa-bus"></i> Transport en commun</h4>
        <table class="when-table">
          <thead><tr><th>Année</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>+10</th></tr></thead>
          <tbody>
            <tr><td>Taxis / Louages</td><td colspan="6"><span class="dot dot-orange"></span>12 mois</td><td><span class="dot dot-red"></span>3 mois</td></tr>
            <tr><td>Autobus / Autocars</td><td colspan="3"><span class="dot dot-orange"></span>12 mois</td><td colspan="3"><span class="dot dot-red"></span>6 mois</td><td><span class="dot dot-red"></span>6 mois</td></tr>
          </tbody>
        </table>
      </article>
    </div>

    <div class="callout callout-violet">
      <i class="fas fa-info-circle"></i>
      Les centres de visites techniques sont répartis par catégorie : <strong>légers</strong> / <strong>utilitaires</strong>.
    </div>

    <div class="fees">
      <p><span class="badge badge-gray">Frais</span></p>
      <ul>
        <li>Véhicules légers : 19,800 DT (12 DT + 7,800 DT taxes)</li>
        <li>Utilitaires, tracteurs routiers, agricoles : 25,800 DT (18 DT + 7,800 DT taxes)</li>
      </ul>
    </div>
  `
},










{
  id: 'points',
  title: "POINTS DE CONTRÔLE",
  content: `
    <div style="text-align:center; margin-bottom:1rem;">
      <img src="assets/control.png" alt="Points de contrôle" style="max-width:100%; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,.15);" />
    </div>
    <p style="text-align:center; font-weight:500; color:#374151; margin-top:.75rem;">
      Les opérations de contrôle technique réglementaires<br>
      <em>Décret n°148-2000 du 24 janvier 2000</em>
    </p>
  `
},












    {
  id: 'preparer',
  title: "PRÉPARER SA VISITE",
  content: `
    <p class="prep-intro">
      En contrôlant vous-même certains points, vous pouvez éviter des obligations de réparation.
      N’oubliez pas qu’un entretien régulier protège votre sécurité et celle des autres usagers.
    </p>

    <h3 class="prep-title">Contrôler vos lumières</h3>
    <ul class="prep-list">
      <li><i class="fas fa-check-circle"></i> Remplacer les ampoules défectueuses</li>
      <li><i class="fas fa-check-circle"></i> Remplacer un phare non étanche</li>
      <li><i class="fas fa-check-circle"></i> Remplacer les caches brisés</li>
      <li><i class="fas fa-check-circle"></i> Vérifier le réglage de vos éclairages</li>
      <li><i class="fas fa-check-circle"></i> Contrôle des feux de stop, clignotants et feux de détresse</li>
    </ul>

    <h3 class="prep-title">Contrôler votre vitrage</h3>
    <ul class="prep-list">
      <li><i class="fas fa-check-circle"></i> Remplacer un pare-brise fêlé sur 30 cm</li>
      <li><i class="fas fa-check-circle"></i> Contrôler les essuie-glaces</li>
      <li><i class="fas fa-check-circle"></i> Vérifier le bon fonctionnement du lave-glace</li>
      <li><i class="fas fa-check-circle"></i> Vérifier les rétroviseurs</li>
    </ul>

    <h3 class="prep-title">Contrôler votre pot d’échappement</h3>
    <ul class="prep-list">
      <li><i class="fas fa-check-circle"></i> Contrôler le bruit</li>
      <li><i class="fas fa-check-circle"></i> Contrôler l’étanchéité au niveau des marmites</li>
    </ul>

    <h3 class="prep-title">Contrôler votre moteur</h3>
    <ul class="prep-list">
      <li><i class="fas fa-check-circle"></i> Effectuer périodiquement un diagnostic du moteur</li>
    </ul>

    <h3 class="prep-title">Contrôler votre freinage</h3>
    <ul class="prep-list">
      <li><i class="fas fa-check-circle"></i> Contrôler les disques de freins</li>
      <li><i class="fas fa-check-circle"></i> Vérifier le niveau de liquide de freins</li>
      <li><i class="fas fa-check-circle"></i> Contrôler les plaquettes de freins</li>
    </ul>

    <h3 class="prep-title">Suspension & pneus</h3>
    <ul class="prep-list">
      <li><i class="fas fa-check-circle"></i> Contrôler vos amortisseurs</li>
      <li><i class="fas fa-check-circle"></i> Contrôler l'état des pneus et la roue de secours</li>
      <li><i class="fas fa-check-circle"></i> Vérifier l’équilibrage des roues</li>
      <li><i class="fas fa-check-circle"></i> Régler le parallélisme de l’essieu avant</li>
    </ul>
  `
},























{
  id: 'conseils',
  title: "CONSEILS D'ENTRETIEN",
  content: `
    <div class="tips-grid">
      <!-- Filtre à air -->
      <article class="tip-card">
        <h4><i class="fas fa-wind"></i> Filtre à air</h4>
        <ul>
          <li>Un filtre bouché provoque une <strong>surconsommation</strong> et une <strong>pollution excessive</strong>.</li>
          <li>Un filtre encrassé encrasse aussi les bougies et augmente la consommation.</li>
          <li>Sans filtre → <strong>usure rapide</strong> du moteur.</li>
        </ul>
        <div class="tagline"><span class="dot dot-green"></span> Économie & performance</div>
      </article>

      <!-- Batterie -->
      <article class="tip-card">
        <h4><i class="fas fa-car-battery"></i> Batterie</h4>
        <ul>
          <li>Lubrifier légèrement les cosses avec de la vaseline pour éviter les pertes.</li>
          <li>Maintenir le niveau d’électrolyte avec de l’eau déminéralisée.</li>
        </ul>
        <div class="tagline"><span class="dot dot-blue"></span> Fiabilité électrique</div>
      </article>

      <!-- Circuit d’allumage -->
      <article class="tip-card">
        <h4><i class="fas fa-bolt"></i> Circuit d’allumage</h4>
        <p>
          Tout défaut entraîne un <strong>manque de puissance</strong>, une <strong>surconsommation</strong>
          et une pollution excessive à l’échappement.
        </p>
        <div class="tagline"><span class="dot dot-orange"></span> Performance moteur</div>
      </article>

      <!-- Carburateur -->
      <article class="tip-card">
        <h4><i class="fas fa-cogs"></i> Carburateur</h4>
        <p>Un carburateur mal réglé → <strong>surconsommation</strong> et <strong>pollution</strong>.</p>
        <div class="tagline"><span class="dot dot-red"></span> Réglage précis</div>
      </article>

      <!-- Circuit de refroidissement -->
      <article class="tip-card">
        <h4><i class="fas fa-tint"></i> Circuit de refroidissement</h4>
        <ul>
          <li>L’eau du robinet → entartrage, corrosion et surchauffe.</li>
          <li>Contrôler périodiquement le niveau de liquide à froid.</li>
        </ul>
        <div class="tagline"><span class="dot dot-teal"></span> Longévité moteur</div>
      </article>

      <!-- Freins -->
      <article class="tip-card">
        <h4><i class="fas fa-hand-paper"></i> Freins</h4>
        <p>
          Freinez <strong>progressivement</strong>, utilisez le frein moteur → moins de carburant,
          moins d’usure prématurée.
        </p>
        <div class="tagline"><span class="dot dot-gray"></span> Sécurité & économie</div>
      </article>

      <!-- Pneus -->
      <article class="tip-card">
        <h4><i class="fas fa-circle"></i> Pneus</h4>
        <ul>
          <li>Mauvais parallélisme → usure et surconsommation.</li>
          <li>Pression adaptée = sécurité + durée de vie + économie.</li>
          <li>Ne pas braquer les roues à l’arrêt.</li>
        </ul>
        <div class="tagline"><span class="dot dot-violet"></span> Stabilité & sécurité</div>
      </article>
    </div>
  `
},
















{
  id: 'centres',
  title: "CENTRES DE VISITE TECHNIQUE",
  content: `
    <h3>Annuaire des centres de visite technique de l'ATTT</h3>
    <p>
      L'annuaire vous permet de rechercher l'adresse d'un centre de visite technique ou d'un centre d'identification dans votre gouvernorat.
    </p>
    <p><strong>Pour rechercher un centre :</strong></p>
    <ol>
      <li>Sélectionnez votre gouvernorat.</li>
      <li>Cochez (séparément ou ensemble) la catégorie de votre véhicule (léger ou poids lourd).</li>
    </ol>

    <p>Suivez le lien ci-dessous :</p>
    <p>
      <a href="http://www.attt.com.tn/page.php?code_menu=44"
         target="_blank" rel="noopener"
         class="centres-link">
        Centres de visite technique <i class="fas fa-external-link-alt"></i>
      </a>
    </p>
  `
},
  ];

  isModalOpen = false;
  active?: Block;

  open(b: Block) {
    this.active = b;
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden'; // éviter le scroll arrière-plan
  }

  close() {
    this.isModalOpen = false;
    this.active = undefined;
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEsc() { if (this.isModalOpen) this.close(); }
}
