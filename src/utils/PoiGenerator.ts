/**
 * Utilitaire pour générer des points d'intérêt (POI) à partir d'OpenStreetMap
 */

/**
 * Utilitaire pour générer des points d'intérêt (POI) à partir d'OpenStreetMap
 */
import type {Objective} from '../context/GameContext';

// Coordonnées de Montpellier
const MONTPELLIER_CENTER = { lat: 43.6112422, lon: 3.8767337 };
const MAX_RADIUS_KM = 10; // Rayon maximum de 10km autour de Montpellier

// Catégories de POI intéressantes pour le jeu
const POI_CATEGORIES = [
  { key: 'tourism', values: ['attraction', 'museum', 'viewpoint', 'artwork'] },
  { key: 'amenity', values: ['library', 'theatre', 'cinema', 'cafe', 'restaurant', 'university'] },
  { key: 'leisure', values: ['park', 'garden', 'sports_centre', 'swimming_pool'] },
  { key: 'shop', values: ['mall', 'supermarket', 'department_store'] },
  { key: 'historic', values: ['monument', 'castle', 'ruins'] }
];

/**
 * Convertir des données OSM en objectifs pour le jeu
 */
function osmElementsToObjectives(elements: any[]): Objective[] {
  return elements
    .filter(element => element.tags && element.lat && element.lon && element.tags.name)
    .map((element, index) => {
      // Détermine le type de POI pour afficher une description plus riche
      let category = '';
      for (const cat of POI_CATEGORIES) {
        if (element.tags[cat.key] && cat.values.includes(element.tags[cat.key])) {
          category = `${element.tags[cat.key].charAt(0).toUpperCase() + element.tags[cat.key].slice(1)}`;
          break;
        }
      }

      return {
        id: `obj-${index}`,
        name: element.tags.name,
        description: category ? `${category}: ${element.tags.name}` : element.tags.name,
        lat: element.lat,
        lon: element.lon,
        pointValue: 10, // Valeur fixe pour tous les objectifs
        completed: false
      };
    });
}

/**
 * Crée une requête Overpass pour récupérer des POI autour de Montpellier
 */
function createOverpassQuery(): string {
  // Construction de la requête Overpass
  let query = '[out:json][timeout:25];(';

  // Ajouter les différentes catégories à la requête
  POI_CATEGORIES.forEach(category => {
    category.values.forEach(value => {
      query += `node["${category.key}"="${value}"](around:${MAX_RADIUS_KM * 1000},${MONTPELLIER_CENTER.lat},${MONTPELLIER_CENTER.lon});`;
    });
  });

  // Finaliser la requête
  query += ');out body 30;';
  return query;
}

/**
 * Récupère des POI depuis OpenStreetMap via l'API Overpass
 */
export async function fetchOsmObjectives(limit: number = 20): Promise<Objective[]> {
  try {
    const overpassQuery = createOverpassQuery();
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

    const response = await fetch(overpassUrl);
    if (!response.ok) {
      throw new Error(`Erreur API Overpass: ${response.status}`);
    }

    const data = await response.json();

    // Convertir et filtrer les POI
    let objectives = osmElementsToObjectives(data.elements);

    // Mélanger le tableau pour avoir une sélection aléatoire
    objectives = objectives.sort(() => Math.random() - 0.5);

    // Limiter le nombre d'objectifs
    objectives = objectives.slice(0, limit);

    return objectives;
  } catch (error) {
    console.error('Erreur lors de la récupération des POI:', error);
    return generateFallbackObjectives(limit);
  }
}

/**
 * Génère des objectifs de secours en cas d'échec de l'API
 */
function generateFallbackObjectives(limit: number): Objective[] {
  const names = [
    'Place de la Comédie', 'Gare Saint-Roch', 'Le Polygone',
    'Jardin du Peyrou', 'Antigone', 'Les Arceaux', 'Odysseum',
    'Hôpital Saint-Eloi', 'Faculté de Sciences', 'Parc Montcalm',
    'Château de Flaugergues', 'Musée Fabre', 'Aquarium Mare Nostrum',
    'Zoo de Lunaret', 'Stade de la Mosson', 'Cathédrale Saint-Pierre',
    'MOCO', 'Corum', 'Promenade du Peyrou', 'Marché du Lez'
  ];

  return names.slice(0, limit).map((name, i) => {
    // Génération de positions aléatoires autour de Montpellier
    const randomAngle = Math.random() * Math.PI * 2;
    const randomDistance = Math.sqrt(Math.random()) * MAX_RADIUS_KM * 0.8; // km

    // Conversion de la distance en degrés (approximation)
    const latOffset = randomDistance * Math.cos(randomAngle) / 111.32;
    const lonOffset = randomDistance * Math.sin(randomAngle) / (111.32 * Math.cos(MONTPELLIER_CENTER.lat * Math.PI / 180));

    return {
      id: `obj-${i}`,
      name,
      description: name,
      lat: MONTPELLIER_CENTER.lat + latOffset,
      lon: MONTPELLIER_CENTER.lon + lonOffset,
      pointValue: 10,
      completed: false
    };
  });
}

/**
 * Récupérer des POI ou générer des objectifs de secours si l'API échoue
 */
export async function getGameObjectives(limit: number = 20, useFallback: boolean = false): Promise<Objective[]> {
  if (useFallback) {
    return generateFallbackObjectives(limit);
  }

  try {
    return await fetchOsmObjectives(limit);
  } catch (error) {
    console.error('Erreur lors de la récupération des objectifs OSM:', error);
    return generateFallbackObjectives(limit);
  }
}
