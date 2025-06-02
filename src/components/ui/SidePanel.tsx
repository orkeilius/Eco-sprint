import { ReactNode } from 'react';
import { useGameState } from '../../context/GameContext';

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
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

interface SidePanelProps {
  title: string;
  children: ReactNode;
}

const SidePanel = ({ title, children }: SidePanelProps) => {
  const { state } = useGameState();
  const selected = state.selectedObjective;
  // Centre de Montpellier
  const base = { lat: 43.6112422, lon: 3.8767337 };
  let distance = null;
  if (selected) {
    distance = haversineDistance(base.lat, base.lon, selected.lat, selected.lon);
  }
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-full">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">{title}</h2>
      {selected && (
        <div className="mb-4 text-blue-700 font-medium">
          Objectif sélectionné : <span className="font-bold">{selected.name}</span><br />
          Distance : <span className="font-bold">{distance ? (distance/1000).toFixed(2) : '--'} km</span>
        </div>
      )}
      <div className="overflow-y-auto h-[calc(100%-3rem)]">
        {children}
      </div>
    </div>
  );
};

export default SidePanel;
