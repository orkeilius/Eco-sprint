import type {ReactNode} from 'react';
import { useGameState } from '../../context/GameContext';
import PlanTrip from '../routing/PlanTrip';
import {type TransportMode, TransportModes} from '../routing/TransportSelector';
import { getAllTravelTimes } from '../../utils/TravelTimeCalculator';

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // rayon de la Terre en mètres
  const toRad = (deg: number) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lat2 - lon1); // Correction: utilisez lon1 et non lat1 ici
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

interface SidePanelProps {
  title: string;
  children: ReactNode;
  onTransportSelect?: (mode: TransportMode) => void;
}

const SidePanel = ({ title, children, onTransportSelect }: SidePanelProps) => {
  const { state, dispatch } = useGameState();
  const selected = state.selectedObjective;
  const osrmRoute = state.lastOsrmRoute;
  // Centre de Montpellier
  const base = { lat: 43.6112422, lon: 3.8767337 };
  let distance = null;
  let travelTimes = null;

  if (selected) {
    distance = haversineDistance(base.lat, base.lon, selected.lat, selected.lon);
    // Calcul des temps de trajet pour tous les modes de transport
    travelTimes = getAllTravelTimes(distance);
  }

  // Détermine l'emoji selon le type d'objectif
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

      {/* Affichage de l'objectif sélectionné avec détails enrichis */}
      {selected && (
        <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{getEmoji()}</span>
            <h3 className="font-bold text-blue-800">{selected.name}</h3>
          </div>

          {selected.description && selected.description !== selected.name && (
            <p className="text-blue-700 text-sm mb-2">{selected.description}</p>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div className="bg-blue-100 rounded p-2">
              <span className="block text-blue-500 font-medium">Distance</span>
              <span className="font-bold">
                {osrmRoute ? (osrmRoute.distance / 1000).toFixed(2) + ' km' : distance ? (distance/1000).toFixed(2) + ' km' : '--'}
              </span>
            </div>
            <div className="bg-blue-100 rounded p-2">
              <span className="block text-blue-500 font-medium">Durée</span>
              <span className="font-bold">
                {osrmRoute ? Math.round(osrmRoute.duration / 60) + ' min' : '--'}
              </span>
            </div>
          </div>

          {/* Affichage des temps de trajet pour chaque mode de transport */}
          {travelTimes && (
            <div className="mb-3">
              <h4 className="font-medium text-blue-700 mb-2">Temps de trajet estimé :</h4>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 p-2 bg-blue-100 rounded">
                  <span className="text-lg">🚲</span>
                  <span className="flex-1">Vélo</span>
                  <span className="font-bold">{travelTimes[TransportModes.BIKE].formatted}</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-blue-100 rounded">
                  <span className="text-lg">🚌</span>
                  <span className="flex-1">Transport public</span>
                  <span className="font-bold">{travelTimes[TransportModes.PUBLIC].formatted}</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-blue-100 rounded">
                  <span className="text-lg">🚕</span>
                  <span className="flex-1">VTC</span>
                  <span className="font-bold">{travelTimes[TransportModes.VTC].formatted}</span>
                </div>
              </div>
            </div>
          )}

          {/* Interface de planification intégrée au panneau latéral */}
          {onTransportSelect && (
            <div className="mt-4 border-t border-blue-200 pt-3">
              <PlanTrip
                onClose={() => dispatch({ type: 'DESELECT_OBJECTIVE' })}
                onTransportSelect={onTransportSelect}
              />
            </div>
          )}

          {/* Bouton pour désélectionner */}
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

      {/* Contenu du panneau (liste des objectifs) */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default SidePanel;
