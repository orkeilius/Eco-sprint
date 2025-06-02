import { useGameState } from '../../context/GameContext';

const EndGameScreen = () => {
  const { state, dispatch } = useGameState();
  const { objectives, plannedTrips, currentScore } = state;
  
  const completedObjectivesCount = objectives.filter(obj => obj.completed).length;
  const totalObjectivesCount = objectives.length;
  const completionPercentage = Math.round((completedObjectivesCount / totalObjectivesCount) * 100);
  
  // Get total time spent (in minutes)
  const totalTimeSpent = plannedTrips.reduce((total, trip) => total + trip.estimatedDuration, 0);
  
  // Calculate ecology score (0-100)
  const ecologyScore = Math.min(100, Math.round(
    plannedTrips.reduce((total, trip) => {
      const factor = trip.transportMode === 'bike' ? 1 : 
                    trip.transportMode === 'public' ? 0.7 : 0.3;
      return total + (factor * trip.estimatedDuration);
    }, 0) / (totalTimeSpent || 1) * 100
  ));
  
  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-3xl font-bold mb-4 text-center">Game Results</h2>
      
      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-blue-600 mb-2">{currentScore}</div>
        <div className="text-gray-500">Total Score</div>
      </div>
      
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-blue-600">{completedObjectivesCount}/{totalObjectivesCount}</div>
          <div className="text-sm text-gray-600">Objectives Completed</div>
          <div className="text-sm font-semibold">{completionPercentage}%</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-green-600">{ecologyScore}/100</div>
          <div className="text-sm text-gray-600">Ecology Score</div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-yellow-600">{totalTimeSpent}</div>
          <div className="text-sm text-gray-600">Minutes Spent</div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-purple-600">{plannedTrips.length}</div>
          <div className="text-sm text-gray-600">Trips Completed</div>
        </div>
      </div>
      
      <div className="space-y-4 mb-8">
        <h3 className="font-semibold text-lg border-b pb-2">Transport Usage</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-1">🚲</div>
            <div className="font-semibold">
              {plannedTrips.filter(t => t.transportMode === 'bike').length} trips
            </div>
            <div className="text-xs text-gray-500">Bicycle</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl mb-1">🚌</div>
            <div className="font-semibold">
              {plannedTrips.filter(t => t.transportMode === 'public').length} trips
            </div>
            <div className="text-xs text-gray-500">Public Transport</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl mb-1">🚕</div>
            <div className="font-semibold">
              {plannedTrips.filter(t => t.transportMode === 'vtc').length} trips
            </div>
            <div className="text-xs text-gray-500">VTC</div>
          </div>
        </div>
      </div>
      
      <div className="flex space-x-4 mt-6">
        <button 
          onClick={() => window.location.reload()}
          className="flex-1 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
        >
          New Game
        </button>
        <button 
          onClick={() => dispatch({ type: 'END_GAME' })}
          className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          View Leaderboard
        </button>
      </div>
    </div>
  );
};

export default EndGameScreen;
