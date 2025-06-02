import { useGameState } from '../../context/GameContext';
import { calculateCO2Emissions, formatCO2Emissions } from '../../utils/CO2Calculator';
import { useMemo } from 'react';

const EndGameScreen = () => {
  const { state, dispatch } = useGameState();
  const { objectives, plannedTrips, currentScore } = state;
  
  // Calculs des statistiques de jeu
  const stats = useMemo(() => {
    // Objectifs complétés
    const completedObjectives = objectives.filter(obj => obj.completed);
    const completedObjectivesCount = completedObjectives.length;
    const totalObjectivesCount = objectives.length;
    const completionPercentage = Math.round((completedObjectivesCount / totalObjectivesCount) * 100) || 0;

    // Distance totale parcourue (en km)
    const totalDistance = plannedTrips.reduce((total, trip) => total + trip.distance, 0) / 1000;

    // Temps total passé (en minutes)
    const totalTimeSpent = plannedTrips.reduce((total, trip) => total + trip.duration, 0) / 60;

    // Émissions de CO2 totales (en grammes)
    const totalCO2 = plannedTrips.reduce((total, trip) => {
      return total + calculateCO2Emissions(trip.distance, trip.transportMode);
    }, 0);

    // Calcul du score écologique (0-100)
    const ecologyScore = Math.min(100, Math.round(
      plannedTrips.reduce((total, trip) => {
        const factor = trip.transportMode === 'bike' ? 1 :
                     trip.transportMode === 'public' ? 0.7 : 0.3;
        return total + (factor * trip.distance);
      }, 0) / (plannedTrips.reduce((total, trip) => total + trip.distance, 0) || 1) * 100
    ));

    // Statistiques par mode de transport
    const transportStats = {
      bike: {
        trips: plannedTrips.filter(t => t.transportMode === 'bike').length,
        distance: plannedTrips.filter(t => t.transportMode === 'bike')
          .reduce((total, trip) => total + trip.distance, 0) / 1000,
        co2: 0 // Le vélo n'émet pas de CO2
      },
      public: {
        trips: plannedTrips.filter(t => t.transportMode === 'public').length,
        distance: plannedTrips.filter(t => t.transportMode === 'public')
          .reduce((total, trip) => total + trip.distance, 0) / 1000,
        co2: plannedTrips.filter(t => t.transportMode === 'public')
          .reduce((total, trip) => total + calculateCO2Emissions(trip.distance, 'public'), 0)
      },
      vtc: {
        trips: plannedTrips.filter(t => t.transportMode === 'vtc').length,
        distance: plannedTrips.filter(t => t.transportMode === 'vtc')
          .reduce((total, trip) => total + trip.distance, 0) / 1000,
        co2: plannedTrips.filter(t => t.transportMode === 'vtc')
          .reduce((total, trip) => total + calculateCO2Emissions(trip.distance, 'vtc'), 0)
      }
    };

    return {
      completedObjectivesCount,
      totalObjectivesCount,
      completionPercentage,
      totalDistance,
      totalTimeSpent,
      totalCO2,
      ecologyScore,
      transportStats
    };
  }, [objectives, plannedTrips]);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-3xl font-bold mb-4 text-center">Résultats de la partie</h2>

      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-green-600 mb-2">{currentScore}</div>
        <div className="text-gray-500">Score total</div>
      </div>
      
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-green-600">{stats.completedObjectivesCount}/{stats.totalObjectivesCount}</div>
          <div className="text-sm text-gray-600">Objectifs complétés</div>
          <div className="text-sm font-semibold">{stats.completionPercentage}%</div>
        </div>
        
        <div className="bg-green-100 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-green-600">{stats.ecologyScore}/100</div>
          <div className="text-sm text-gray-600">Score écologique</div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-yellow-600">{stats.totalTimeSpent.toFixed(0)}</div>
          <div className="text-sm text-gray-600">Minutes de trajet</div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-red-600">{formatCO2Emissions(stats.totalCO2)}</div>
          <div className="text-sm text-gray-600">CO₂ émis</div>
        </div>
      </div>
      
      <div className="space-y-4 mb-8">
        <h3 className="font-semibold text-lg border-b pb-2">Statistiques de transport</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-2xl mb-1">🚲</div>
            <div className="font-semibold">{stats.transportStats.bike.trips} trajets</div>
            <div className="text-sm">{stats.transportStats.bike.distance.toFixed(1)} km</div>
            <div className="text-xs text-green-600 font-medium">0g CO₂</div>
          </div>
          
          <div className="bg-yellow-50 p-3 rounded-lg text-center">
            <div className="text-2xl mb-1">🚌</div>
            <div className="font-semibold">{stats.transportStats.public.trips} trajets</div>
            <div className="text-sm">{stats.transportStats.public.distance.toFixed(1)} km</div>
            <div className="text-xs text-yellow-600 font-medium">{formatCO2Emissions(stats.transportStats.public.co2)}</div>
          </div>
          
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-2xl mb-1">🚕</div>
            <div className="font-semibold">{stats.transportStats.vtc.trips} trajets</div>
            <div className="text-sm">{stats.transportStats.vtc.distance.toFixed(1)} km</div>
            <div className="text-xs text-red-600 font-medium">{formatCO2Emissions(stats.transportStats.vtc.co2)}</div>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <h3 className="font-semibold text-lg border-b pb-2">Lieux visités ({stats.completedObjectivesCount})</h3>
        <div className="max-h-40 overflow-y-auto">
          <ul className="list-disc pl-5 space-y-1">
            {objectives.filter(obj => obj.completed).map(obj => (
              <li key={obj.id} className="text-sm">
                {obj.name}
                {obj.description && obj.description !== obj.name ? ` - ${obj.description}` : ''}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="flex space-x-4 mt-6">
        <button 
          onClick={() => window.location.reload()}
          className="flex-1 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50"
        >
          Nouvelle partie
        </button>
        <button 
          onClick={() => dispatch({ type: 'END_GAME' })}
          className="flex-1 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Retour au menu
        </button>
      </div>
    </div>
  );
};

export default EndGameScreen;
