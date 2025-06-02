import type {TransportMode} from '../types/routing.types';

// Profils Valhalla pour chaque mode de transport
const VALHALLA_PROFILES: Record<TransportMode, string> = {
  bike: 'bicycle', // Valhalla propose un profil spécifique pour les vélos qui peut utiliser les chemins piétons
  public: 'bus',   // Valhalla a un profil spécifique pour les bus
  vtc: 'auto',     // Profil voiture standard pour les VTC
};

// Facteurs d'ajustement de durée pour chaque mode
const DURATION_FACTORS: Record<TransportMode, number> = {
  bike: 1.0, // Les facteurs sont moins nécessaires avec Valhalla car il est déjà bien calibré pour les vélos
  public: 1.1, // Léger ajustement pour les transports en commun (arrêts)
  vtc: 1.0, // Référence de base
};

// Service d'API Valhalla gratuit avec une utilisation raisonnable
const VALHALLA_API_URL = 'https://valhalla1.openstreetmap.de/route';

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
 * Convertit le format de géométrie polyline de Valhalla en LineString GeoJSON
 */
function decodePolylineToGeoJSON(encoded: string): GeoJSON.LineString {
  const precision = 1e5;
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: [number, number][] = [];

  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    coordinates.push([lng / precision, lat / precision]);
  }

  return {
    type: 'LineString',
    coordinates
  };
}

// Ajout de la fonction haversineDistance qui pourra servir de fallback
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // rayon de la Terre en mètres
  const toRad = (deg: number) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Appelle l'API Valhalla pour calculer un itinéraire entre deux points
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
  const profile = VALHALLA_PROFILES[mode] || 'bicycle';
  const cacheKey = generateCacheKey(from, to, profile);

  // Vérification du cache (sauf si forceRefresh est true)
  if (!forceRefresh && routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  // Préparation de la requête Valhalla
  const requestBody = {
    locations: [
      { lon: from.lon, lat: from.lat },
      { lon: to.lon, lat: to.lat }
    ],
    costing: profile,
    directions_options: {
      units: 'kilometers',
      language: 'fr'
    }
  };

  try {
    console.log(`Envoi requête Valhalla: ${from.lat},${from.lon} -> ${to.lat},${to.lon} (${profile})`);

    const res = await fetch(VALHALLA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      console.error("Valhalla API error:", await res.text());
      return createFallbackRoute(from, to, mode);
    }

    const data = await res.json();

    // Si la réponse contient une erreur
    if (data.error) {
      console.error("Erreur API Valhalla:", data.error);
      return createFallbackRoute(from, to, mode);
    }

    if (!data.trip || !data.trip.legs || data.trip.legs.length === 0) {
      console.error("Format de réponse Valhalla invalide:", data);
      return createFallbackRoute(from, to, mode);
    }

    const leg = data.trip.legs[0];

    // Vérifier la présence des propriétés nécessaires
    if (!leg.shape || typeof leg.length !== 'number' || !leg.time) {
      console.error("Propriétés Valhalla manquantes:", leg);
      return createFallbackRoute(from, to, mode);
    }

    // Application du facteur d'ajustement pour la durée
    const durationFactor = DURATION_FACTORS[mode] || 1.0;

    try {
      const decodedGeometry = decodePolylineToGeoJSON(leg.shape);

      const route: OsrmRoute = {
        geometry: decodedGeometry,
        distance: leg.length * 1000, // Valhalla retourne la distance en km, on convertit en mètres
        duration: leg.time * durationFactor // Valhalla retourne le temps en secondes
      };

      // Mise en cache du résultat
      routeCache.set(cacheKey, route);

      // Limiter la taille du cache
      if (routeCache.size > 100) {
        const oldestKey = routeCache.keys().next().value;
        routeCache.delete(oldestKey);
      }

      console.log(`Route calculée: ${route.distance.toFixed(0)}m en ${route.duration.toFixed(0)}s`);
      return route;
    } catch (decodeError) {
      console.error("Erreur lors du décodage de la géométrie:", decodeError);
      return createFallbackRoute(from, to, mode);
    }
  } catch (e) {
    console.error("Erreur lors de la récupération de l'itinéraire Valhalla:", e);
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
