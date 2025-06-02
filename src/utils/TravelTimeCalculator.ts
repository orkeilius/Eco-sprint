/**
 * Utilitaire pour calculer les temps de trajet en fonction du mode de transport
 */
import {TransportModes } from '../components/routing/TransportSelector';

// Vitesses moyennes en km/h pour chaque mode de transport
const AVERAGE_SPEEDS = {
  [TransportModes.BIKE]: 15,     // 15 km/h pour le vélo
  [TransportModes.PUBLIC]: 20,   // 20 km/h pour les transports publics (en tenant compte des arrêts)
  [TransportModes.VTC]: 30       // 30 km/h pour les VTC en ville (trafic inclus)
};

// Temps d'attente moyen en minutes pour chaque mode de transport
const WAITING_TIMES = {
  [TransportModes.BIKE]: 0,      // Pas d'attente pour le vélo
  [TransportModes.PUBLIC]: 5,    // 5 minutes d'attente moyenne pour les transports publics
  [TransportModes.VTC]: 3        // 3 minutes d'attente pour un VTC
};

/**
 * Calcule le temps de trajet en fonction de la distance et du mode de transport
 *
 * @param distanceInMeters Distance en mètres
 * @param transportMode Mode de transport utilisé
 * @returns Temps de trajet estimé en minutes
 */
export function calculateTravelTime(distanceInMeters: number, transportMode: TransportMode): number {
  // Conversion en kilomètres
  const distanceInKm = distanceInMeters / 1000;

  // Vitesse moyenne pour le mode de transport
  const averageSpeed = AVERAGE_SPEEDS[transportMode];

  // Temps de trajet en heures = distance / vitesse
  const travelTimeHours = distanceInKm / averageSpeed;

  // Conversion en minutes
  const travelTimeMinutes = travelTimeHours * 60;

  // Ajout du temps d'attente
  const waitingTime = WAITING_TIMES[transportMode];

  // Temps total
  const totalTimeMinutes = travelTimeMinutes + waitingTime;

  // Facteur aléatoire pour simuler les variations (±10%)
  const randomFactor = 0.9 + Math.random() * 0.2;

  return Math.round(totalTimeMinutes * randomFactor);
}

/**
 * Formate le temps de trajet en texte lisible
 *
 * @param timeInMinutes Temps en minutes
 * @returns Chaîne formatée (ex: "1h 15min" ou "45min")
 */
export function formatTravelTime(timeInMinutes: number): string {
  if (timeInMinutes < 1) {
    return "moins d'une minute";
  }

  const hours = Math.floor(timeInMinutes / 60);
  const minutes = Math.round(timeInMinutes % 60);

  if (hours === 0) {
    return `${minutes} min`;
  } else if (minutes === 0) {
    return `${hours} h`;
  } else {
    return `${hours} h ${minutes} min`;
  }
}

/**
 * Calcule et renvoie les temps de trajet pour tous les modes de transport
 *
 * @param distanceInMeters Distance en mètres
 * @returns Objet avec les temps pour chaque mode de transport
 */
export function getAllTravelTimes(distanceInMeters: number): Record<TransportMode, { time: number, formatted: string }> {
  const result: Record<string, { time: number, formatted: string }> = {};

  Object.values(TransportModes).forEach((mode) => {
    const timeInMinutes = calculateTravelTime(distanceInMeters, mode as TransportMode);
    result[mode] = {
      time: timeInMinutes,
      formatted: formatTravelTime(timeInMinutes)
    };
  });

  return result as Record<TransportMode, { time: number, formatted: string }>;
}
