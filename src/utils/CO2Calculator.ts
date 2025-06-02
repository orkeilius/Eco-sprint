/**
 * Utilitaire pour calculer les émissions de CO2 en fonction du mode de transport
 */
import { TransportModes, type TransportMode } from "../types/routing.types";

// Émissions de CO2 en grammes par km pour chaque mode de transport
const CO2_EMISSIONS_PER_KM = {
  [TransportModes.BIKE]: 0,      // 0g CO2/km pour le vélo (propulsion humaine)
  [TransportModes.PUBLIC]: 30,   // 30g CO2/km pour les transports en commun (moyenne bus/tram/métro)
  [TransportModes.VTC]: 170      // 170g CO2/km pour les VTC/taxis (voiture thermique moyenne)
};

/**
 * Calcule les émissions de CO2 en fonction de la distance et du mode de transport
 *
 * @param distanceInMeters Distance en mètres
 * @param transportMode Mode de transport utilisé
 * @returns Émissions de CO2 en grammes (nombre entier)
 */
export function calculateCO2Emissions(distanceInMeters: number, transportMode: TransportMode): number {
  // Conversion en kilomètres
  const distanceInKm = distanceInMeters / 1000;

  // Émissions par km pour le mode de transport
  const emissionsPerKm = CO2_EMISSIONS_PER_KM[transportMode];

  // Calcul des émissions totales
  const totalEmissions = distanceInKm * emissionsPerKm;

  // Retourne un nombre entier arrondi
  return Math.round(totalEmissions);
}

/**
 * Formate les émissions de CO2 en texte lisible
 *
 * @param co2InGrams Émissions en grammes
 * @returns Chaîne formatée (ex: "170g" ou "1.2kg")
 */
export function formatCO2Emissions(co2InGrams: number): string {
  if (co2InGrams === 0) {
    return "0g CO₂";
  }

  if (co2InGrams < 1000) {
    return `${co2InGrams}g CO₂`;
  } else {
    const co2InKg = co2InGrams / 1000;
    return `${co2InKg.toFixed(1)}kg CO₂`;
  }
}
