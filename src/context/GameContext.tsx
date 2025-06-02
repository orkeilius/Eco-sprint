import { createContext, useContext, useReducer, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Objective } from '../components/game/ObjectiveList';
import type { Trip } from '../components/routing/DrivingMode';
import type { TransportMode } from '../components/routing/TransportSelector';

// Define game state interface
export interface GameState {
  seed: string;
  objectives: Objective[];
  plannedTrips: Trip[];
  activeTrip?: {
    from: Objective;
    to: Objective;
    transportMode: TransportMode;
    startTime: number;
  };
  remainingTime: number; // in seconds
  currentScore: number;
  playerName?: string;
  isPlaying: boolean;
  isDriving: boolean;
  selectedObjective?: Objective;
}

// Action types
type GameAction =
  | { type: 'START_GAME'; payload: { seed: string, playerName?: string } }
  | { type: 'END_GAME' }
  | { type: 'UPDATE_TIME'; payload: number }
  | { type: 'SELECT_OBJECTIVE'; payload: Objective }
  | { type: 'DESELECT_OBJECTIVE' }
  | { type: 'START_DRIVING'; payload: { from: Objective, to: Objective, transportMode: TransportMode } }
  | { type: 'END_DRIVING'; payload: Trip }
  | { type: 'COMPLETE_OBJECTIVE'; payload: Objective }
  | { type: 'UPDATE_SCORE'; payload: number };

const initialState: GameState = {
  seed: '',
  objectives: [],
  plannedTrips: [],
  remainingTime: 15 * 60, // 15 minutes in seconds
  currentScore: 0,
  isPlaying: false,
  isDriving: false
};

// Create context
const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}>({
  state: initialState,
  dispatch: () => null
});

// Reducer function
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      // In a real app, we'd generate objectives based on the seed
      return {
        ...state,
        seed: action.payload.seed,
        playerName: action.payload.playerName,
        isPlaying: true,
        objectives: generateMockObjectives(),
        currentScore: 0,
        remainingTime: 15 * 60,
        plannedTrips: []
      };
      
    case 'END_GAME':
      return {
        ...state,
        isPlaying: false
      };
      
    case 'UPDATE_TIME':
      return {
        ...state,
        remainingTime: action.payload
      };
      
    case 'SELECT_OBJECTIVE':
      return {
        ...state,
        selectedObjective: action.payload
      };
      
    case 'DESELECT_OBJECTIVE':
      return {
        ...state,
        selectedObjective: undefined
      };
      
    case 'START_DRIVING':
      return {
        ...state,
        isDriving: true,
        activeTrip: {
          from: action.payload.from,
          to: action.payload.to,
          transportMode: action.payload.transportMode,
          startTime: Date.now()
        }
      };
      
    case 'END_DRIVING':
      return {
        ...state,
        isDriving: false,
        activeTrip: undefined,
        plannedTrips: [...state.plannedTrips, action.payload],
        currentScore: state.currentScore + action.payload.score
      };
      
    case 'COMPLETE_OBJECTIVE':
      return {
        ...state,
        objectives: state.objectives.map(objective => 
          objective.id === action.payload.id 
            ? { ...objective, completed: true } 
            : objective
        )
      };
      
    case 'UPDATE_SCORE':
      return {
        ...state,
        currentScore: action.payload
      };
      
    default:
      return state;
  }
}

// Mock objective generator - in a real app this would use the seed
function generateMockObjectives(): Objective[] {
  return [
    {
      id: '1',
      name: 'Place de la Comédie',
      lat: 43.6081,
      lon: 3.8791,
      pointValue: 100,
      completed: false
    },
    {
      id: '2',
      name: 'Zoo du Lunaret',
      lat: 43.6367,
      lon: 3.8742,
      pointValue: 150,
      completed: false
    },
    {
      id: '3',
      name: 'Faculté des Sciences',
      lat: 43.6321,
      lon: 3.8620,
      pointValue: 80,
      completed: false
    },
    {
      id: '4',
      name: 'Odysseum',
      lat: 43.6036,
      lon: 3.9198,
      pointValue: 120,
      completed: false
    },
    {
      id: '5',
      name: 'Jardin des Plantes',
      lat: 43.6132,
      lon: 3.8732,
      pointValue: 90,
      completed: false
    }
  ];
}

// Provider component
export function GameProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Memoize context value to prevent unnecessary renders
  const contextValue = useMemo(() => ({ state, dispatch }), [state]);
  
  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

// Custom hook
export function useGameState() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameProvider');
  }
  return context;
}

export default GameContext;
