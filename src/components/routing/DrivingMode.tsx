import { useEffect, useState } from 'react';
import type { Objective } from '../game/ObjectiveList';
import TransportModes from './TransportSelector';
import { calculateRouteMetrics } from '../../utils/RouteVisualization';
import { calculateCO2Emissions, formatCO2Emissions } from '../../utils/CO2Calculator';

export interface Trip {
  id: string;
  from: Objective;
  to: Objective;
  transportMode: TransportMode;
  estimatedDuration: number; // In minutes
  distance: number; // In meters
  score: number;
}

interface DrivingModeProps {
  from: Objective;
  to: Objective;
  transportMode: TransportMode;
  onComplete: (trip: Trip) => void;
  onCancel: () => void;
}

const DrivingMode = ({ 
  from, 
  to, 
  transportMode,
  onComplete,
  onCancel 
}: DrivingModeProps) => {  const [progress, setProgress] = useState(0);
  // Remove unused startTime
  const [tripMetrics] = useState(() => {
    // Calculate the trip metrics once on component mount
    // In a real app, this would come from a routing API
    return calculateRouteMetrics(
      [
        [from.lon, from.lat],
        [to.lon, to.lat]
      ],
      transportMode
    );
  });
  // Icon based on transport mode
  const getIcon = () => {
    switch (transportMode) {
      case TransportModes.BIKE: return '🚲';
      case TransportModes.PUBLIC: return '🚌';
      case TransportModes.VTC: return '🚕';
      default: return '🚶';
    }
  };
  
  // Simulate trip progress
  useEffect(() => {
    // We'll update progress every second
    const simulationInterval = 1000; // ms
    
    // Total simulation time in ms (convert duration from minutes to ms)
    const totalSimulationTime = tripMetrics.duration * 60 * 1000;
    
    // For a smooth animation, we'll advance progress incrementally 
    const progressIncrement = (simulationInterval / totalSimulationTime) * 100;
    
    const timer = setInterval(() => {
      setProgress(prevProgress => {
        const newProgress = Math.min(prevProgress + progressIncrement, 100);
        
        // Auto-complete when progress reaches 100%
        if (newProgress >= 100) {
          clearInterval(timer);
          
          // Create the completed trip object
          const completedTrip: Trip = {
            id: `trip-${Date.now()}`,
            from,
            to,
            transportMode,
            estimatedDuration: tripMetrics.duration,
            distance: tripMetrics.distance,
            score: calculateTripScore(tripMetrics.distance, transportMode, to.pointValue)
          };
          
          // Small delay to show 100% before completing
          setTimeout(() => onComplete(completedTrip), 500);
        }
        
        return newProgress;
      });
    }, simulationInterval);
    
    return () => clearInterval(timer);
  }, [from, to, transportMode, tripMetrics, onComplete]);
  
  // Calculate remaining time
  const getTimeRemaining = () => {
    // Calculate based on progress percentage
    const remainingMinutes = Math.ceil(tripMetrics.duration * (1 - progress / 100));
    return remainingMinutes;
  };

  // Calculate score based on transport mode and objective value
  const calculateTripScore = (distance: number, mode: TransportMode, _pointValue: number) => {
    // Calcul des émissions de CO2 en grammes
    const co2Emissions = calculateCO2Emissions(distance, mode);

    // Score fixe de 100 points par objectif, moins les émissions de CO2
    const score = Math.max(50 - co2Emissions, 0);

    return score;
  };

  // Calcul des émissions de CO2 pour affichage
  const getCO2EmissionsText = () => {
    const co2Emissions = calculateCO2Emissions(tripMetrics.distance, transportMode);
    return formatCO2Emissions(co2Emissions);
  };

  // Handle manual completion (skip button)
  const handleComplete = () => {
    const completedTrip: Trip = {
      id: `trip-${Date.now()}`,
      from,
      to,
      transportMode,
      estimatedDuration: tripMetrics.duration,
      distance: tripMetrics.distance,
      score: calculateTripScore(tripMetrics.distance, transportMode, to.pointValue) 
    };
    
    onComplete(completedTrip);
  };

  return (
    <>
      {/* This is now an overlay on the map rather than a replacement */}
      <div className="absolute top-4 left-0 right-0 mx-auto w-full max-w-lg bg-white rounded-lg shadow-lg overflow-hidden z-10">
        <div className="bg-green-600 text-white p-3 flex justify-between items-center">
          <h2 className="text-lg font-semibold">En Route: {getIcon()}</h2>
          <div className="flex items-center space-x-3">
            <span>{from.name}</span>
            <span>→</span>
            <span>{to.name}</span>
          </div>
        </div>
        
        <div className="p-3 bg-white">
          <div className="flex justify-between text-sm mb-1">
            <span>{from.name}</span>
            <span>{to.name}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-500 h-3 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center mt-2 text-sm">
            <div className="text-gray-600">
              Total: {tripMetrics.duration} min
            </div>
            <div className="font-medium">
              {getTimeRemaining()} min remaining
            </div>
          </div>

          {/* Affichage des émissions de CO2 */}
          <div className="mt-2 text-sm flex justify-between items-center">
            <div className="text-gray-600">
              Émissions CO₂:
            </div>
            <div className={`font-medium ${transportMode === TransportModes.BIKE ? 'text-green-600' : transportMode === TransportModes.PUBLIC ? 'text-yellow-600' : 'text-red-600'}`}>
              {getCO2EmissionsText()}
            </div>
          </div>

          {/* Affichage du score estimé */}
          <div className="mt-2 text-sm flex justify-between items-center">
            <div className="text-gray-600">
              Score estimé:
            </div>
            <div className="font-medium text-green-600">
              {calculateTripScore(tripMetrics.distance, transportMode, to.pointValue)} points
            </div>
          </div>
        </div>
      </div>
      
      {/* Controls at the bottom of the map */}
      <div className="absolute bottom-4 left-0 right-0 mx-auto w-full max-w-xs flex justify-center gap-4 z-10">
        <button 
          onClick={onCancel}
          className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-md"
        >
          Cancel
        </button>
        <button 
          onClick={handleComplete}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-md"
        >
          {progress >= 100 ? 'Complete' : 'Skip'}
        </button>
      </div>
      
      {/* Transport mode indicator */}
      <div className="absolute bottom-20 right-4 bg-white rounded-full p-3 shadow-lg text-2xl">
        {getIcon()}
      </div>
    </>
  );
};

export default DrivingMode;
