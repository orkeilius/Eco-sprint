import type {TransportMode} from '../types/routing.types';

const OSRM_PROFILES: Record<TransportMode, string> = {
  bike: 'bike',
  public: 'foot', // fallback to foot for public transport (OSRM ne gère pas le public)
  vtc: 'car',
};

export interface OsrmRoute {
  geometry: GeoJSON.LineString;
  distance: number; // en mètres
  duration: number; // en secondes
}

/**
 * Appelle l'API OSRM pour calculer un itinéraire entre deux points
 */
export async function fetchOsrmRoute(
  from: { lon: number; lat: number },
  to: { lon: number; lat: number },
  mode: TransportMode = 'bike'
): Promise<OsrmRoute | null> {
  const profile = OSRM_PROFILES[mode] || 'bike';
  const url = `https://router.project-osrm.org/route/v1/${profile}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.routes || !data.routes[0]) return null;
    return {
      geometry: data.routes[0].geometry,
      distance: data.routes[0].distance,
      duration: data.routes[0].duration,
    };
  } catch (e) {
    return null;
  }
}

