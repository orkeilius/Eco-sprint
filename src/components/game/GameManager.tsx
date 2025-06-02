import { useEffect } from 'react';
import { useGameState } from '../../context/GameContext';
import SidePanel from '../ui/SidePanel';
import ObjectiveList from './ObjectiveList';
import ScoreDisplay from '../ui/ScoreDisplay';
import PlanTrip from '../routing/PlanTrip';
import DrivingMode from '../routing/DrivingMode';
import GameMap from '../map/GameMap';
import StartScreen from './StartScreen';
import EndGameScreen from './EndGameScreen';
import type { TransportMode } from '../routing/TransportSelector';
import type { Trip } from '../routing/DrivingMode';

const GameManager = () => {
  const { state, dispatch } = useGameState();
  const { objectives, currentScore, remainingTime, selectedObjective, isDriving, activeTrip } = state;


  // Handle objective selection
  const handleObjectiveSelect = (objective: typeof objectives[0]) => {
    dispatch({ type: 'SELECT_OBJECTIVE', payload: objective });
  };
  
  // Handler for transport mode selection
  const handleTransportSelect = (transportMode: TransportMode) => {
    // Start driving with selected transport mode
    if (selectedObjective) {
      // In a real app, we'd get the current position rather than using the first objective
      dispatch({
        type: 'START_DRIVING',
        payload: {
          from: objectives[0],
          to: selectedObjective,
          transportMode
        }
      });
    }
  };
  
  // Check if the game is over (time ran out)
  const isGameOver = state.isPlaying && remainingTime <= 0;
  
  return (
    <div className="h-full flex flex-col">
      {!state.isPlaying && !isGameOver ? (
        <StartScreen />
      ) : isGameOver ? (
        <EndGameScreen />
      ) : (
        <div className="flex-1 flex flex-col">
          <ScoreDisplay score={currentScore} timeRemaining={remainingTime} />
          
          <div className="flex-1 flex flex-col md:flex-row gap-4">
            {/* Side panel avec planification intégrée */}
            <div className="md:w-1/4 w-full">
              <SidePanel
                title="Objectives"
                onTransportSelect={selectedObjective && !isDriving ? handleTransportSelect : undefined}
              >
                <ObjectiveList
                  objectives={objectives} 
                  onObjectiveSelect={handleObjectiveSelect} 
                />
              </SidePanel>
            </div>
            
            {/* Main game area */}
            <div className="md:w-3/4 w-full flex-1 relative">
              {/* Map component */}
              <div className="h-full">
                <GameMap />
              </div>
              
              {/* Driving mode overlay */}
              {isDriving && selectedObjective && activeTrip && (
                <DrivingMode 
                  from={activeTrip.from}
                  to={activeTrip.to}
                  transportMode={activeTrip.transportMode}
                  onComplete={(trip: Trip) => {
                    // When completed, mark the objective as done
                    dispatch({ type: 'COMPLETE_OBJECTIVE', payload: selectedObjective });
                    
                    // End driving mode with the completed trip
                    dispatch({ type: 'END_DRIVING', payload: trip });
                  }}
                  onCancel={() => {
                    // Just end driving mode without completing the objective
                    dispatch({ 
                      type: 'END_DRIVING', 
                      payload: {
                        id: `cancelled-${Date.now()}`,
                        from: activeTrip.from,
                        to: activeTrip.to,
                        transportMode: activeTrip.transportMode,
                        estimatedDuration: 0,
                        distance: 0,
                        score: 0
                      } 
                    });
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameManager;
