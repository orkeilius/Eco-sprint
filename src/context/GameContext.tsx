import { createContext, useContext, useReducer, useMemo } from 'react';
import type { ReactNode } from 'react';

export interface Objective {
  id: string;
  name: string;
  lat: number;
  lon: number;
  pointValue: number;
  completed: boolean;
}

export interface Trip {
  id: string;
  from: Objective;
  to: Objective;
  transportMode: string;
  duration: number;
  distance: number;
  score: number;
}

export interface GameState {
  seed: string;
  objectives: Objective[];
  plannedTrips: Trip[];
  remainingTime: number;
  currentScore: number;
  playerName?: string;
  isPlaying: boolean;
  isDriving: boolean;
  selectedObjective?: Objective;
}

type GameAction =
  | { type: 'START_GAME'; payload: { seed: string, playerName?: string } }
  | { type: 'END_GAME' }
  | { type: 'UPDATE_TIME'; payload: number }
  | { type: 'SELECT_OBJECTIVE'; payload: Objective }
  | { type: 'DESELECT_OBJECTIVE' }
  | { type: 'COMPLETE_OBJECTIVE'; payload: Objective }
  | { type: 'UPDATE_SCORE'; payload: number };

const initialState: GameState = {
  seed: '',
  objectives: [],
  plannedTrips: [],
  remainingTime: 15 * 60,
  currentScore: 0,
  isPlaying: false,
  isDriving: false
};

function generateMockObjectives(): Objective[] {
  const base = { lat: 43.6112422, lon: 3.8767337 };
  const names = [
    'Place de la Comédie',
    'Gare Saint-Roch',
    'Polygone',
    'Jardin du Peyrou',
    'Antigone',
    'Lez',
    'Odysseum',
    'Arceaux',
    'Mosson',
    'Port Marianne'
  ];
  return names.map((name, i) => ({
    id: `obj-${i}`,
    name,
    lat: base.lat + 0.01 * Math.cos((i / names.length) * 2 * Math.PI),
    lon: base.lon + 0.015 * Math.sin((i / names.length) * 2 * Math.PI),
    pointValue: 10,
    completed: false
  }));
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
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
      return { ...state, isPlaying: false };
    case 'UPDATE_TIME':
      return { ...state, remainingTime: action.payload };
    case 'SELECT_OBJECTIVE':
      return { ...state, selectedObjective: action.payload };
    case 'DESELECT_OBJECTIVE':
      return { ...state, selectedObjective: undefined };
    case 'COMPLETE_OBJECTIVE':
      return {
        ...state,
        objectives: state.objectives.map(obj =>
          obj.id === action.payload.id ? { ...obj, completed: true } : obj
        ),
        selectedObjective: undefined
      };
    case 'UPDATE_SCORE':
      return { ...state, currentScore: action.payload };
    default:
      return state;
  }
}

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}>({
  state: initialState,
  dispatch: () => null
});

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameState() {
  return useContext(GameContext);
}
