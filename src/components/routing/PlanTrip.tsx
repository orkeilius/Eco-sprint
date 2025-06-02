import TransportSelector from './TransportSelector';
import type { TransportMode } from './TransportSelector';
import { useGameState } from '../../context/GameContext';

// Export types from other files
export type { Trip } from './DrivingMode';

interface PlanTripProps {
  onClose: () => void;
  onTransportSelect: (mode: TransportMode) => void;
}

const PlanTrip = ({ onClose, onTransportSelect }: PlanTripProps) => {
  const { state } = useGameState();
    // For the mockup, we're assuming destination is already selected
  const destination = state.selectedObjective!;
  
  // Handle transport selection
  const handleTransportSelect = (mode: TransportMode) => {
    // Propagate the selection to the parent component
    onTransportSelect(mode);
    
    // Close the planning overlay to show the map with driving mode overlay
    onClose();
  };
    
  return (
    <div className="h-full bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-600 text-white p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Choose Your Transport</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-200"
          >
            ✕
          </button>
        </div>
        <div className="text-sm mt-1">
          {destination.name} - {destination.pointValue} points
        </div>
      </div>
      
      <div className="p-4 h-[calc(100%-4rem)]">
        <TransportSelector onTransportSelect={handleTransportSelect} />
      </div>
    </div>
  );
};

export default PlanTrip;
