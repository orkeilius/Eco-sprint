import type {TransportMode} from '../types/routing.types';

// URL de l'API OSRM (plus robuste que Valhalla pour notre cas d'utilisation)
const OSRM_API_URL = 'https://routing.openstreetmap.de/routed';

// Profils pour chaque mode de transport
const TRANSPORT_PROFILES: Record<TransportMode, string> = {
  bike: 'bike',
  public: 'car', // Utilisation du profil voiture pour simuler les transports en commun
  vtc: 'car',
};

// Facteurs d'ajustement de durée pour chaque mode
const DURATION_FACTORS: Record<TransportMode, number> = {
  bike: 1.0,
  public: 1.3, // Les transports publics ont des arrêts fréquents
  vtc: 1.0,
};

// Cache pour stocker les résultats des requêtes
const routeCache: Map<string, OsrmRoute> = new Map();

export interface OsrmRoute {
  geometry: GeoJSON.LineString;
  distance: number; // en mètres
  duration: number; // en secondes
}

/**
 * Génère une clé unique pour le cache d'itinéraire
 */
function generateCacheKey(from: {lon: number; lat: number}, to: {lon: number; lat: number}, profile: string): string {
  return `${profile}_${from.lat.toFixed(5)},${from.lon.toFixed(5)}_${to.lat.toFixed(5)},${to.lon.toFixed(5)}`;
}

/**
 * Calcule la distance à vol d'oiseau entre deux points géographiques
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // rayon de la Terre en mètres
  const toRad = (deg: number) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1); // Correction: utiliser lon2 - lon1
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Appelle l'API de routage pour calculer un itinéraire entre deux points
 * @param from Point de départ
 * @param to Point d'arrivée
 * @param mode Mode de transport
 * @param forceRefresh Si true, ignore le cache et force une nouvelle requête
 */
export async function fetchOsrmRoute(
  from: { lon: number; lat: number },
  to: { lon: number; lat: number },
  mode: TransportMode = 'bike',
  forceRefresh: boolean = false
): Promise<OsrmRoute | null> {
  const profile = TRANSPORT_PROFILES[mode] || 'bike';
  const cacheKey = generateCacheKey(from, to, profile);

  // Vérification du cache (sauf si forceRefresh est true)
  if (!forceRefresh && routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  // Construction de l'URL pour l'API OSRM
  const url = `${OSRM_API_URL}-${profile}/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;

  console.log(`Envoi requête OSRM: ${url}`);

  try {
    const res = await fetch(url);

    if (!res.ok) {
      console.error("OSRM API error:", await res.text());
      return createFallbackRoute(from, to, mode);
    }

    const data = await res.json();

    if (!data.routes || !data.routes[0]) {
      console.error("Format de réponse OSRM invalide:", data);
      return createFallbackRoute(from, to, mode);
    }

    const route = data.routes[0];

    // Vérifier que la géométrie existe bien
    if (!route.geometry || !route.geometry.coordinates || route.geometry.coordinates.length < 2) {
      console.error("Géométrie OSRM manquante ou invalide");
      return createFallbackRoute(from, to, mode);
    }

    // Application du facteur d'ajustement pour la durée
    const durationFactor = DURATION_FACTORS[mode] || 1.0;

    const osrmRoute: OsrmRoute = {
      geometry: route.geometry,
      distance: route.distance, // OSRM retourne la distance en mètres
      duration: route.duration * durationFactor // OSRM retourne le temps en secondes
    };

    console.log(`Route calculée: ${osrmRoute.distance.toFixed(0)}m en ${osrmRoute.duration.toFixed(0)}s avec ${route.geometry.coordinates.length} points`);

    if (route.geometry.coordinates.length > 0) {
      console.log(`Premier point: [${route.geometry.coordinates[0][0].toFixed(6)}, ${route.geometry.coordinates[0][1].toFixed(6)}]`);
      const lastIdx = route.geometry.coordinates.length - 1;
      console.log(`Dernier point: [${route.geometry.coordinates[lastIdx][0].toFixed(6)}, ${route.geometry.coordinates[lastIdx][1].toFixed(6)}]`);
    }

    // Mise en cache du résultat
    routeCache.set(cacheKey, osrmRoute);

    // Limiter la taille du cache
    if (routeCache.size > 100) {
      const oldestKey = routeCache.keys().next().value;
      routeCache.delete(oldestKey);
    }

    return osrmRoute;
  } catch (e) {
    console.error("Erreur lors de la récupération de l'itinéraire:", e);
    return createFallbackRoute(from, to, mode);
  }
}

/**
 * Crée un itinéraire de secours en cas d'échec de l'API
 */
function createFallbackRoute(
  from: { lon: number; lat: number },
  to: { lon: number; lat: number },
  mode: TransportMode
): OsrmRoute {
  console.log("Utilisation d'un itinéraire de secours");

  // Calculer la distance à vol d'oiseau
  const distance = haversineDistance(from.lat, from.lon, to.lat, to.lon);

  // Estimer la durée selon le mode de transport
  // Vitesses moyennes approximatives: vélo 15km/h, bus 30km/h, auto 50km/h
  let speed: number;
  switch (mode) {
    case 'bike': speed = 15 * 1000 / 3600; break; // 15km/h en m/s
    case 'public': speed = 30 * 1000 / 3600; break; // 30km/h en m/s
    case 'vtc': speed = 50 * 1000 / 3600; break; // 50km/h en m/s
    default: speed = 15 * 1000 / 3600; // fallback
  }

  const duration = distance / speed;

  // Créer un itinéraire simple avec une ligne droite et les temps estimés
  return {
    geometry: {
      type: 'LineString',
      coordinates: [
        [from.lon, from.lat],
        [to.lon, to.lat]
      ]
    },
    distance: distance,
    duration: duration
  };
}
