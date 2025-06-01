# Projet de jeu de planification de trajets urbains

## Technologies requises

- React
- Tailwind CSS
- API OpenStreetMap
- API de transport français (transport.swagger.json)

## Concept du jeu

Développer un jeu de planification d'itinéraires urbains où les joueurs doivent optimiser leurs déplacements pour atteindre des objectifs dans un temps limité, tout en maximisant leur score.

## Règles du jeu

- Le joueur reçoit une liste d'objectifs à atteindre sur une carte
- Le joueur doit planifier des trajets dans une fenêtre de temps limitée
- Le score est calculé en fonction de :
  - Nombre d'objectifs atteints  - Moyens de transport utilisés (bonus pour transport écologique)
  - Temps total du parcours (bonus pour rapidité)
  - Comparaison avec un trajet de référence en voiture (les trajets plus rapides ou plus écologiques que la voiture rapportent des bonus)
- Options de transport disponibles : vélo, transports en commun, VTC (type Uber)
- Le score est comparé à un trajet de référence en voiture (la voiture n'est pas une option jouable mais sert de base de comparaison)

## Fonctionnalités techniques à implémenter

- Carte interactive basée sur OpenStreetMap centrée sur Montpellier
- Système de génération d'objectifs aléatoires mais reproductibles (seed)
- Calcul d'itinéraires utilisant l'API de transport français
- Interface de planification d'itinéraires avec drag & drop
- Système de score et classement (leaderboard)
- Sauvegarde des scores des joueurs
- Mode de jeu avec seed partageable pour comparer les scores sur une même carte

## Questions pour le développement

1. Comment structurer l'architecture React du projet ? (hooks, context, redux ?)
> use context with reducer should work find
2. Quelle bibliothèque utiliser pour intégrer OpenStreetMap à React ? (Leaflet, MapLibre ?)
> MapLibre because it leat use customise map and add interativiti
3. Comment implémenter la génération aléatoire mais reproductible des objectifs ?
> use a seed for objectif select things like shop workplace or touristick place
4. Comment calculer de manière réaliste les temps de trajet selon les différents modes de transport ?
> use OSRM and the provided transport api 
5. Quelle structure de données utiliser pour représenter les itinéraires planifiés ?
> a list of point with travel information
6. Comment stocker les scores et implémenter le leaderboard ?
> keep it localy we could add a database later
7. Quelle approche pour le responsive design (mobile, tablette, desktop) ?
> make it desktop first mobile is secondary
8. Comment optimiser les performances de rendu de la carte avec de nombreux marqueurs et tracés ?
> use clustering techniques and only draw what's visible in the current viewport
9. Quelle approche utiliser pour équilibrer le jeu et rendre les différents modes de transport intéressants ?
> each transport mode should have pros and cons, with tradeoffs between time, ecology and points
10. Comment implémenter un système de progression qui encourage les joueurs à revenir ?
> daily challenges with different seeds and special objectives
11. Quelles méthodes utiliser pour tester les fonctionnalités liées aux APIs externes ?
> mock the APIs for unit tests, and create a small set of realistic test data
12. Comment gérer les différents niveaux de difficulté (débutant à expert) ?
> vary the time constraints and number of objectives based on selected difficulty
13. Faut-il implémenter un système de tutoriel intégré au jeu ?
> yes, an interactive tutorial for first-time players
14. Quelles métriques collecter pour analyser et améliorer l'expérience de jeu ?
> completion rate, average score, transport mode choices, and time spent planning

## Démarrage du projet

1. Configuration initiale de React avec Tailwind CSS
2. Mise en place de la carte OpenStreetMap
3. Création des composants principaux de l'interface utilisateur
4. Intégration de l'API de transport français
5. Développement du moteur de jeu principal
6. Implémentation des mécaniques de score
7. Création du système de leaderboard

## Éléments d'interface utilisateur

- Écran d'accueil avec explications des règles
- Barre de titre et navigation en haut de l'écran
- Vue principale centrée sur la carte interactive avec:
  - Objectifs clairement indiqués par des marqueurs sur la carte
  - Possibilité pour le joueur de cliquer sur les objectifs pour les sélectionner
  - Mode "conduite" qui s'active à la sélection d'un objectif, permettant de se déplacer vers un autre objectif
  - Retour à la vue carte après chaque trajet pour planifier le segment suivant
- Panneau latéral droit contenant:
  - Score actuel du joueur
  - Liste des objectifs déjà accomplis
  - Chronomètre et temps restant
- Tableau de bord des scores
- Écran de fin de partie avec résumé et score final
- Leaderboard

## Structure de données proposée

### Objectif sur la carte
```typescript
interface Point {
  lat: number;
  lon: number;
  name: string;
  pointValue: number;  // Valeur en points de cet objectif
}
```

### Mode de transport
```typescript
type TransportMode = 'bike' | 'public' | 'vtc';

interface TransportOption {
  mode: TransportMode;
  ecologyFactor: number;  // Facteur multiplicateur écologique
  speedFactor: number;    // Facteur multiplicateur de vitesse  
  costFactor: number;     // Coût en ressources/argent virtuel
}
```

### Trajet planifié
```typescript
interface PlannedRoute {
  from: Point;
  to: Point;
  transportMode: TransportMode;
  estimatedDuration: number;  // En minutes
  distance: number;           // En mètres
  score: number;              // Score calculé pour ce segment
}
```

### État du jeu
```typescript
interface GameState {
  seed: string;               // Pour la reproduction de la carte
  points: Point[];            // Liste des objectifs
  plannedRoutes: PlannedRoute[];
  remainingTime: number;      // En minutes
  currentScore: number;
  playerName?: string;        // Pour le leaderboard
}
```

## Intégration avec l'API de transport français

1. Utiliser l'API pour obtenir des données réelles de transport en commun à Montpellier
2. Intégrer les calculs d'itinéraires pour les différents modes de transport
3. Calculer les temps de trajets basés sur des distances et vitesses réalistes
4. Prévoir des alternatives et des perturbations pour plus de réalisme

## Inspiration et références

- Mini Metro (pour la simplicité et l'aspect puzzle)
- Google Maps (pour l'interface de planification)
- Pokemon Go (pour l'aspect objectifs géolocalisés)
- Ingress (pour le système de points et territoires)

## Configuration technique

### Structure initiale du projet

```typescript
/src
  /components
    /map          # Composants liés à la carte
      MapView.tsx
      Marker.tsx
      RouteDisplay.tsx
    /routing      # Composants liés aux itinéraires
      RoutePlanner.tsx
      TransportSelector.tsx
      DrivingMode.tsx
    /ui           # Interface utilisateur générale
      NavBar.tsx
      SidePanel.tsx
      ScoreDisplay.tsx
      Timer.tsx
    /game         # Logique de jeu
      GameManager.tsx
      ObjectiveList.tsx
      ScoreCalculator.tsx
  /hooks          # Custom hooks React
    useGameState.tsx
    useMapInteractions.tsx
    useTransportApi.tsx
  /services       # Services API et utilitaires
    mapService.ts
    transportApi.ts
    scoreService.ts
  /context        # Context API et gestion d'état
    GameContext.tsx
    UserContext.tsx
  /types          # Types TypeScript
    game.types.ts
    map.types.ts
    transport.types.ts
  /assets         # Images, icônes, etc.
  /styles         # CSS/Tailwind spécifiques
```

### Composants principaux et leur fonction

1. `MapView.tsx`:
   - Composant principal affichant la carte OpenStreetMap
   - Gère les interactions carte (zoom, déplacement)
   - Affiche les marqueurs d'objectifs et les tracés d'itinéraires

2. `DrivingMode.tsx`:
   - Interface du mode "conduite"
   - Affiche la progression sur l'itinéraire actuel
   - Propose des options de transport à choisir
   - Simule le déplacement sur la carte

3. `SidePanel.tsx`:
   - Panneau latéral contenant les informations de jeu
   - Affiche le score actuel et les objectifs accomplis
   - Propose des actions contextuelles selon l'état du jeu

### Paramètres de jeu configurables

```typescript
interface GameConfig {
  // Paramètres de difficulté
  timeLimit: number;           // En minutes
  numberOfObjectives: number;  // Nombre d'objectifs sur la carte
  mapRadius: number;           // Rayon de la zone de jeu en mètres
  
  // Facteurs d'équilibrage
  transportFactors: {    [key in TransportMode]: {
      speed: number;           // Vitesse relative
      ecology: number;         // Impact écologique (plus élevé = meilleur)
      cost: number;            // Coût virtuel
    },
    car: {                     // Mode référence pour comparaison des scores
      speed: number;
      ecology: number;
      cost: number;
    }
  };
  
  // Centre de la carte (Montpellier par défaut)
  mapCenter: {
    lat: number;               // 43.6112422 pour Montpellier
    lon: number;               // 3.8767337 pour Montpellier
  };
  
  // Paramètres de scoring
  basePointValue: number;      // Points de base par objectif
  timeBonusFactor: number;     // Multiplicateur pour le temps restant
  ecologyBonusFactor: number;  // Multiplicateur pour choix écologiques
}
```

### Questions supplémentaires pour Copilot

1. Comment optimiser les appels à l'API de transport pour éviter de dépasser les limites de requêtes ?
   > there aren't rate limited afaik
2. Quelle stratégie adopter pour les cas où les données de transport sont indisponibles ou incomplètes ?
   > normaly that sould happend in this case public trnasport wont be available
3. Comment concevoir une interface intuitive pour la planification d'itinéraires multiples ?
   > the player will have an interface with there current path colored and path already done grey out (the map and the site in generable will be monocrome with accent color like green)
4. Quelles animations et feedback visuels mettre en place pour rendre l'expérience agréable ?
   > no for now
5. Comment implémenter un système efficace de sauvegarde des parties et des scores ?
   > that will be added later
6. Faut-il prévoir un mode hors ligne avec données mises en cache ?
   > no
7. Comment optimiser les performances de rendu de la carte avec de nombreux marqueurs et tracés ?
   > use clustering techniques and only draw what's visible in the current viewport
8. Quelle approche utiliser pour équilibrer le jeu et rendre les différents modes de transport intéressants ?
   > each transport mode should have pros and cons, with tradeoffs between time, ecology and points
9. Comment implémenter un système de progression qui encourage les joueurs à revenir ?
   > daily challenges with different seeds and special objectives
10. Quelles méthodes utiliser pour tester les fonctionnalités liées aux APIs externes ?
    > mock the APIs for unit tests, and create a small set of realistic test data

## Aspects techniques spécifiques

### Manipulation des APIs

1. Pour OpenStreetMap:
   - Utilisation de MapLibre GL JS pour le rendu de la carte
   - Recherche géographique via Nominatim API
   - Calcul d'itinéraires via OSRM (Open Source Routing Machine)

2. Pour l'API de transport français:
   - Utilisation des endpoints pour récupérer les horaires de transport en commun
   - Estimation des temps de trajet en fonction de l'heure du jour
   - Récupération des informations sur les stations et arrêts

### Conception visuelle

1. Interface utilisateur:
   - Design minimaliste axé sur la carte
   - Code couleur pour différencier les types de transport
   - Affichage clair des scores et du temps restant

2. Style de la carte:
   - Style monochrome de base avec éléments importants en couleur
   - Visualisation claire des routes et des points d'intérêt
   - Indicateurs visuels pour montrer les trajets optimaux

### Flux de navigation et interactions

1. Écran d'accueil:
   - Titre du jeu et présentation visuelle attrayante
   - Options pour démarrer une nouvelle partie ou consulter le leaderboard
   - Bouton d'aide/tutoriel expliquant les règles du jeu

2. Vue principale de jeu:
   - Barre de navigation en haut avec logo, score actuel et temps restant
   - Carte interactive occupant la majorité de l'écran
   - Panneau latéral droit avec informations détaillées et contrôles

3. Mode "conduite":
   - Interface qui change lorsque le joueur se déplace entre deux objectifs
   - Vue simplifiée avec animation de déplacement sur la carte
   - Options pour choisir le mode de transport (vélo, transport public, VTC)
   - Affichage des informations sur le temps estimé et l'impact écologique
   - Feedback visuel lorsqu'un objectif est atteint

4. Transitions et états du jeu:
   - Transitions fluides entre la vue carte et le mode conduite
   - Indicateurs visuels pour les objectifs accomplis et restants
   - Notification claire lorsque le temps limite approche de la fin

## Mécaniques de gameplay avancées

1. Événements aléatoires:
   - Perturbations de transport (grèves, retards)
   - Conditions météorologiques affectant certains modes de transport
   - Événements spéciaux augmentant la valeur de certains objectifs

2. Système de défis:
   - Défis quotidiens avec configurations spécifiques
   - Objectifs bonus pour débloquer des fonctionnalités
   - Classements hebdomadaires et mensuels

3. Progressions et récompenses:
   - Déverrouiller de nouvelles zones géographiques
   - Obtention de bonus pour les modes de transport écologiques
   - Système d'badges/achievements pour encourager différents styles de jeu

## Implémentation détaillée du mode "conduite"

Le mode "conduite" est un élément central du gameplay qui simule le déplacement entre les objectifs avec différents moyens de transport.

### Fonctionnement du mode conduite

1. Déclenchement:
   - Activé quand le joueur clique sur un objectif depuis la vue carte
   - Transition fluide depuis la carte principale vers l'interface de conduite

2. Interface utilisateur:
   - Vue réduite de la carte montrant l'itinéraire actuel
   - Options de transport disponibles (icônes pour voiture, vélo, etc.)
   - Informations sur le trajet (distance, durée estimée, points)
   - Barre de progression pour visualiser l'avancement

3. Interaction:
   - Le joueur choisit d'abord son mode de transport
   - Animation de déplacement le long de l'itinéraire calculé
   - Possibilité d'accélérer la simulation ou de l'annuler
   - Feedback visuel et sonore à l'arrivée à destination

4. Retour à la vue carte:
   - Après avoir atteint l'objectif, retour à la vue carte
   - L'objectif atteint est marqué comme accompli
   - Le score est mis à jour dans le panneau latéral

### Mockup des écrans principaux

```
+----------------------------------+
|  TITRE DU JEU    SCORE: 1240    |
+--------+-----------------------+ |
|        |                       | |
|        |                       | |
|        |       CARTE           | |
| PANEL  |    INTERACTIVE        | |
| LATÉRAL|   AVEC OBJECTIFS      | |
|        |                       | |
|        |                       | |
|        |                       | |
+--------+-----------------------+ |
|      BARRE D'OPTIONS / STATUT   |
+----------------------------------+

Mode conduite:
+----------------------------------+
|  TITRE DU JEU    TEMPS: 14:30   |
+--------+-----------------------+ |
|        |                       | |
|        |    ANIMATION DE       | |
|        |    DÉPLACEMENT        | |
| CHOIX  |                       | |
|  DE    |    SUR LA CARTE       | |
|TRANSPORT|                      | |
|        |                       | |
|        |                       | |
+--------+-----------------------+ |
|   [ANNULER]        [See map]  |
+----------------------------------+
```

### Transitions entre les modes de jeu

1. De la carte au mode conduite:
   - Animation de zoom sur l'itinéraire sélectionné
   - Affichage progressif des options de transport
   - L'interface générale se simplifie pour se concentrer sur le trajet

2. Du mode conduite à la carte:
   - Animation de "dézoom" pour revenir à la vue d'ensemble
   - Mise à jour visuelle des objectifs accomplis
   - Notification du score gagné pour ce trajet

3. Fin de partie:
   - Animation de récapitulation des trajets effectués
   - Affichage du score total avec détails des points gagnés
   - Transition vers l'écran de leaderboard

## Système de comparaison avec la voiture

La voiture sert de référence pour comparer les performances des différents modes de transport:

1. Calcul de référence:
   - Pour chaque trajet, le système calcule automatiquement le temps qu'aurait pris une voiture
   - Ce temps sert de référence pour évaluer la performance des autres modes de transport

2. Bonus de comparaison:
   - Si le joueur choisit un mode de transport plus rapide que la voiture (selon les conditions), il reçoit un bonus de rapidité
   - Si le joueur choisit un mode de transport plus écologique que la voiture, il reçoit un bonus environnemental
   - Les trajets plus lents mais plus écologiques peuvent rester rentables grâce au système de bonus

3. Formule de score:
   - Score = Points de base de l'objectif × (1 + Bonus écologique - Malus de temps)
   - Bonus écologique = (Facteur écologique du transport choisi - Facteur écologique de la voiture) × Coefficient environnemental
   - Malus de temps = Max(0, (Temps du transport choisi - Temps en voiture) / Temps en voiture) × Coefficient de temps