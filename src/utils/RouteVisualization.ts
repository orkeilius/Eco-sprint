// Route visualization utilities for MapLibre GL
import { Map } from 'maplibre-gl';
import TransportModes from "../components/routing/TransportSelector"
// Route visualization colors by transport mode
const routeColors = {
  [TransportModes.BIKE]: '#22C55E', // green
  [TransportModes.PUBLIC]: '#3B82F6', // blue
  [TransportModes.VTC]: '#F97316', // orange
};

/**
 * Generate a mock route path between two points with some randomness
 * In a real app, this would be replaced with actual routing API data
 */
export const generateRoutePath = (
  fromLon: number,
  fromLat: number,
  toLon: number,
  toLat: number,
  controlPointOffset = 0.005
): [number, number][] => {
  // Create midpoints with some random variation to simulate real routes
  const midLon1 = fromLon + (toLon - fromLon) * 0.33 + (Math.random() - 0.5) * controlPointOffset;
  const midLat1 = fromLat + (toLat - fromLat) * 0.33 + (Math.random() - 0.5) * controlPointOffset;
  
  const midLon2 = fromLon + (toLon - fromLon) * 0.66 + (Math.random() - 0.5) * controlPointOffset;
  const midLat2 = fromLat + (toLat - fromLat) * 0.66 + (Math.random() - 0.5) * controlPointOffset;
  
  // Create more points for a smoother route
  return [
    [fromLon, fromLat],
    [fromLon + (midLon1 - fromLon) * 0.5, fromLat + (midLat1 - fromLat) * 0.5],
    [midLon1, midLat1],
    [midLon1 + (midLon2 - midLon1) * 0.5, midLat1 + (midLat2 - midLat1) * 0.5],
    [midLon2, midLat2],
    [midLon2 + (toLon - midLon2) * 0.5, midLat2 + (toLat - midLat2) * 0.5],
    [toLon, toLat],
  ];
};

/**
 * Add a route to the map
 */
export const addRouteToMap = (
  map: Map,
  id: string,
  coordinates: [number, number][],
  transportMode: TransportMode,
  isActive: boolean = true
) => {
  // Add the route source if it doesn't exist
  if (!map.getSource(id)) {
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates
        }
      }
    });
  } else {
    // Update existing source
    const source = map.getSource(id) as maplibregl.GeoJSONSource;
    source.setData({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates
      }
    });
  }

  // Route line style
  const routeColor = routeColors[transportMode];
  const opacity = isActive ? 1 : 0.5;
  
  // Add the route layer if it doesn't exist
  const routeLayerId = `${id}-layer`;
  if (!map.getLayer(routeLayerId)) {
    map.addLayer({
      id: routeLayerId,
      type: 'line',
      source: id,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': routeColor,
        'line-width': 4,
        'line-opacity': opacity
      }
    });
  } else {
    // Update existing layer
    map.setPaintProperty(routeLayerId, 'line-color', routeColor);
    map.setPaintProperty(routeLayerId, 'line-opacity', opacity);
  }
  
  // Add animation pulse effect
  if (isActive) {
    const pulseLayerId = `${id}-pulse-layer`;
    if (!map.getLayer(pulseLayerId)) {
      map.addLayer({
        id: pulseLayerId,
        type: 'line',
        source: id,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': routeColor,
          'line-width': 6,
          'line-opacity': ['interpolate', ['linear'], ['get', 'offset'], 
            0, 0,
            0.5, 0.5,
            1, 0
          ],
          'line-opacity-transition': { duration: 0 }
        }
      });
    }
  }
  
  return { routeLayerId, pulseLayerId: `${id}-pulse-layer` };
};

/**
 * Remove a route from the map
 */
export const removeRouteFromMap = (map: Map, id: string) => {
  const routeLayerId = `${id}-layer`;
  const pulseLayerId = `${id}-pulse-layer`;
  
  if (map.getLayer(pulseLayerId)) {
    map.removeLayer(pulseLayerId);
  }
  
  if (map.getLayer(routeLayerId)) {
    map.removeLayer(routeLayerId);
  }
  
  if (map.getSource(id)) {
    map.removeSource(id);
  }
};

/**
 * Calculate route distance and duration based on transport mode
 * In a real app, this would use actual API data
 */
export const calculateRouteMetrics = (
  coordinates: [number, number][],
  transportMode: TransportMode
) => {
  // Calculate approximate distance (very rough approximation)
  let distance = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lon1, lat1] = coordinates[i];
    const [lon2, lat2] = coordinates[i + 1];
    distance += calculateDistance(lat1, lon1, lat2, lon2);
  }
  
  // Apply transport mode factors for duration calculation
  let speedFactor = 1.0;
  switch (transportMode) {
    case 'bike': speedFactor = 0.7; break; 
    case 'public': speedFactor = 0.8; break;
    case 'vtc': speedFactor = 1.0; break;
  }
  
  // Convert to minutes with some randomness
  const duration = Math.round((distance / 1000) / speedFactor * 3) + Math.floor(Math.random() * 5);
  
  return { 
    distance: Math.round(distance), // in meters
    duration: Math.max(1, duration) // in minutes, minimum 1
  };
};

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
