import type {ReactNode} from 'react';
import { useGameState } from '../../context/GameContext';
import PlanTrip from '../routing/PlanTrip';
// Correction de l'importation pour TransportMode et TransportModes
import {type TransportMode, TransportModes} from '../../types/routing.types';
import { calculateTravelTime, formatTravelTime as formatTravelTimeFromMinutes } from '../../utils/TravelTimeCalculator';
import { fetchOsrmRoute } from '../../utils/osrm';
import { useEffect, useState } from 'react';
import { calculateCO2Emissions } from '../../utils/CO2Calculator';

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // rayon de la Terre en mètres
  const toRad = (deg: number) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lat2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Fonction pour formater le temps en minutes/heures à partir de secondes, arrondi à la minute
function formatDurationFromSeconds(seconds: number): string {
  if (seconds < 30) {
    return "1 min"; // Minimum 1 minute pour tout trajet
  } else if (seconds < 3600) {
    return `${Math.round(seconds / 60)} min`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  }
}

interface SidePanelProps {
  title: string;
  children: ReactNode;
  onTransportSelect?: (mode: TransportMode) => void;
  mousePosition?: { lat: number; lon: number } | null;
}

const SidePanel = ({ title, children, onTransportSelect, mousePosition }: SidePanelProps) => {
  const { state, dispatch } = useGameState();
  const selected = state.selectedObjective;
  const osrmRouteForSelectedMode = state.lastOsrmRoute; // This is for the path drawn on map
  const playerPosition = state.playerPosition;

  const [detailedTravelInfo, setDetailedTravelInfo] = useState<{
    distanceForDisplay: number | null; // Primary distance display (OSRM for current mode or Haversine)
    travelTimesPerMode: Partial<Record<TransportMode, { formatted: string; distance: number; timeInSeconds: number }>>;
    destinationName: string | null;
  }>({ distanceForDisplay: null, travelTimesPerMode: {}, destinationName: null });

  useEffect(() => {
    const updateTravelInfo = async () => {
      let currentTarget: { lat: number; lon: number; name: string } | null = null;
      if (selected) {
        currentTarget = { lat: selected.lat, lon: selected.lon, name: selected.name };
      } else if (mousePosition) {
        currentTarget = { lat: mousePosition.lat, lon: mousePosition.lon, name: 'Position de la souris' };
      }

      if (currentTarget && playerPosition) {
        const newTravelTimesData: Partial<Record<TransportMode, { formatted: string; distance: number; timeInSeconds: number }>> = {};

        for (const mode of Object.values(TransportModes)) {
          const route = await fetchOsrmRoute(
            playerPosition,
            currentTarget,
            mode as TransportMode
          );
          if (route) {
            newTravelTimesData[mode as TransportMode] = {
              formatted: formatDurationFromSeconds(route.duration),
              distance: route.distance,
              timeInSeconds: route.duration
            };
          } else {
            // Fallback if OSRM fails for this mode
            const fallbackDistance = haversineDistance(playerPosition.lat, playerPosition.lon, currentTarget.lat, currentTarget.lon);
            const fallbackTimeMinutes = calculateTravelTime(fallbackDistance, mode as TransportMode);
            newTravelTimesData[mode as TransportMode] = {
              formatted: formatTravelTimeFromMinutes(fallbackTimeMinutes),
              distance: fallbackDistance,
              timeInSeconds: fallbackTimeMinutes * 60
            };
          }
        }

        // Determine the distance to display in the top section
        let primaryDistance: number | null = null;
        if (osrmRouteForSelectedMode) {
          primaryDistance = osrmRouteForSelectedMode.distance;
        } else if (currentTarget) {
            // If no specific OSRM route for selected mode (e.g. before selection or if it failed),
            // try to get OSRM distance for current selected mode, or fallback to Haversine
            const currentSelectedGameMode = state.selectedTransportMode || TransportModes.BIKE;
            if (newTravelTimesData[currentSelectedGameMode]) {
                primaryDistance = newTravelTimesData[currentSelectedGameMode]!.distance;
            } else {
                primaryDistance = haversineDistance(playerPosition.lat, playerPosition.lon, currentTarget.lat, currentTarget.lon);
            }
        }

        setDetailedTravelInfo({
          distanceForDisplay: primaryDistance,
          travelTimesPerMode: newTravelTimesData,
          destinationName: currentTarget.name,
        });
      } else {
        setDetailedTravelInfo({ distanceForDisplay: null, travelTimesPerMode: {}, destinationName: null });
      }
    };

    updateTravelInfo();
  }, [selected, mousePosition, playerPosition, osrmRouteForSelectedMode, state.selectedTransportMode]);

  const getEmoji = () => {
    if (selected?.description) {
      const desc = selected.description.toLowerCase();
      if (desc.includes('museum')) return '🏛️';
      if (desc.includes('park') || desc.includes('garden')) return '🌳';
      if (desc.includes('attraction')) return '🎭';
      if (desc.includes('restaurant') || desc.includes('cafe')) return '🍽️';
      if (desc.includes('cinema') || desc.includes('theatre')) return '🎬';
      if (desc.includes('shop') || desc.includes('mall')) return '🛍️';
      if (desc.includes('swimming')) return '🏊';
      if (desc.includes('university')) return '🎓';
      if (desc.includes('monument') || desc.includes('castle')) return '🏰';
      if (desc.includes('library')) return '📚';
      if (desc.includes('sports')) return '⚽';
      if (desc.includes('artwork')) return '🎨';
    }
    return '📍';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-full overflow-y-auto flex flex-col">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">{title}</h2>

      {selected && (
        <div className="mb-4 bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{getEmoji()}</span>
            <h3 className="font-bold text-green-800">{selected.name}</h3>
          </div>
          {selected.description && selected.description !== selected.name && (
            <p className="text-green-700 text-sm mb-2">{selected.description}</p>
          )}
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div className="bg-green-100 rounded p-2">
              <span className="block text-green-500 font-medium">Distance</span>
              <span className="font-bold">
                {detailedTravelInfo.distanceForDisplay ? (detailedTravelInfo.distanceForDisplay / 1000).toFixed(2) + ' km' : '--'}
              </span>
            </div>
            <div className="bg-green-100 rounded p-2">
              <span className="block text-green-500 font-medium">Durée (trajet actuel)</span>
              <span className="font-bold">
                {osrmRouteForSelectedMode ? formatDurationFromSeconds(osrmRouteForSelectedMode.duration) : '--'}
              </span>
            </div>
          </div>

          {onTransportSelect && (
            <div className="mt-4 border-t border-green-200 pt-3">
              <h4 className="font-medium text-green-700 mb-2">Choisir votre transport</h4>
              <div className="flex flex-col gap-2 text-sm">
                {Object.entries(detailedTravelInfo.travelTimesPerMode).map(([mode, info]) => {
                  let icon = '📍';
                  let modeName = mode.charAt(0).toUpperCase() + mode.slice(1);
                  if (mode === TransportModes.BIKE) {icon = '🚲'; modeName = 'Vélo';}
                  if (mode === TransportModes.PUBLIC) {icon = '🚌'; modeName = 'Transport public';}
                  if (mode === TransportModes.VTC) {icon = '🚕'; modeName = 'VTC';}

                  return (
                    <button
                      key={mode}
                      className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
                      onClick={() => {
                        if (selected && info) {
                          // Calcul des émissions de CO2 pour le mode de transport choisi
                          const co2Emissions = calculateCO2Emissions(info.distance, mode as TransportMode);

                          // Déplace le joueur vers l'objectif
                          dispatch({
                            type: 'COMPLETE_OBJECTIVE',
                            payload: selected,
                            // Ajout du trajet pour l'historique/statistiques
                            trip: {
                              id: `${state.playerPosition.lat},${state.playerPosition.lon}->${selected.lat},${selected.lon}-${mode}`,
                              from: {
                                ...state.playerPosition,
                                // On ne garde que les champs nécessaires pour Objective
                                id: 'player',
                                pointValue: 0,
                                completed: true
                              },
                              to: selected,
                              transportMode: mode as TransportMode,
                              duration: info.timeInSeconds,
                              distance: info.distance,
                              score: Math.max(100 - co2Emissions, 0)
                            }
                          } as any);

                          // Déduit le temps de trajet du temps restant
                          const newTime = Math.max(0, state.remainingTime - info.timeInSeconds);
                          dispatch({
                            type: 'UPDATE_TIME',
                            payload: newTime
                          });

                          // Nouveau calcul du score: 100 points par objectif moins les émissions de CO2
                          const newScore = state.currentScore + Math.max(100 - co2Emissions, 0);

                          // Mise à jour du score
                          dispatch({
                            type: 'UPDATE_SCORE',
                            payload: newScore
                          });

                          // Appel du callback onTransportSelect
                          onTransportSelect(mode as TransportMode);
                        }
                      }}
                      onMouseEnter={() => {
                        // Activer l'aperçu du trajet avec ce mode de transport
                        dispatch({ type: 'SET_PREVIEW_TRANSPORT_MODE', payload: mode as TransportMode });
                      }}
                      onMouseLeave={() => {
                        // Désactiver l'aperçu lors de la sortie du survol
                        dispatch({ type: 'SET_PREVIEW_TRANSPORT_MODE', payload: undefined });
                      }}
                    >
                      <span className="text-lg">{icon}</span>
                      <div className="flex-1">
                        <div className="font-medium">{modeName}</div>
                        <div className="text-xs text-green-600">
                          {(info.distance / 1000).toFixed(1)} km • {info.formatted}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => dispatch({ type: 'DESELECT_OBJECTIVE' })}
                className="mt-3 w-full py-1 px-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 text-sm"
              >
                Fermer
              </button>
            </div>
          )}
          {!onTransportSelect && (
            <button
              onClick={() => dispatch({ type: 'DESELECT_OBJECTIVE' })}
              className="mt-3 w-full py-1 px-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 text-sm"
            >
              Fermer
            </button>
          )}
        </div>
      )}

      {!selected && detailedTravelInfo.travelTimesPerMode && Object.keys(detailedTravelInfo.travelTimesPerMode).length > 0 && (
        <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-700 mb-2">
            Estimation du temps de trajet (OSRM)
            <span className="text-xs block text-gray-500">
              de {playerPosition.name} à {detailedTravelInfo.destinationName || 'position de la souris'}
            </span>
          </h4>
          {detailedTravelInfo.distanceForDisplay && (
             <div className="grid grid-cols-1 gap-2 text-sm mb-3">
                <div className="bg-gray-100 rounded p-2">
                <span className="block text-gray-500 font-medium">Distance (vol d'oiseau / mode actuel)</span>
                <span className="font-bold">{(detailedTravelInfo.distanceForDisplay / 1000).toFixed(2)} km</span>
                </div>
            </div>
          )}
          <div className="flex flex-col gap-2 text-sm">
            {Object.entries(detailedTravelInfo.travelTimesPerMode).map(([mode, info]) => {
                let icon = '📍';
                let modeName = mode.charAt(0).toUpperCase() + mode.slice(1);
                if (mode === TransportModes.BIKE) {icon = '🚲'; modeName = 'Vélo';}
                if (mode === TransportModes.PUBLIC) {icon = '🚌'; modeName = 'Transport public';}
                if (mode === TransportModes.VTC) {icon = '🚕'; modeName = 'VTC';}
                return (
                    <div key={mode} className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                    <span className="text-lg">{icon}</span>
                    <span className="flex-1">{modeName}</span>
                    <span className="font-bold">{info.formatted}</span>
                    </div>
                );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default SidePanel;
