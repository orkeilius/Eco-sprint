import { createContext, useContext, useReducer, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getGameObjectives } from '../utils/PoiGenerator';

export interface Objective {
  id: string;
  name: string;
  description?: string;
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
  selectedTransportMode?: 'bike' | 'public' | 'vtc';
  previewTransportMode?: 'bike' | 'public' | 'vtc'; // Pour l'aperçu de l'itinéraire au survol
  loading: boolean;
  error?: string;
  playerPosition: { lat: number; lon: number; name: string };
  lastOsrmRoute?: { distance: number; duration: number };
}

type GameAction =
  | { type: 'START_GAME'; payload: { seed: string, playerName?: string } }
  | { type: 'END_GAME' }
  | { type: 'UPDATE_TIME'; payload: number }
  | { type: 'SELECT_OBJECTIVE'; payload: Objective }
  | { type: 'DESELECT_OBJECTIVE' }
  | { type: 'COMPLETE_OBJECTIVE'; payload: Objective }
  | { type: 'UPDATE_SCORE'; payload: number }
  | { type: 'SET_OBJECTIVES'; payload: Objective[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_LAST_OSRM_ROUTE'; payload: { distance: number; duration: number } }
  | { type: 'SET_TRANSPORT_MODE'; payload: 'bike' | 'public' | 'vtc' }
  | { type: 'SET_PREVIEW_TRANSPORT_MODE'; payload?: 'bike' | 'public' | 'vtc' };

const initialState: GameState = {
  seed: '',
  objectives: [],
  plannedTrips: [],
  remainingTime: 15 * 60,
  currentScore: 0,
  isPlaying: false,
  isDriving: false,
  loading: false,
  selectedTransportMode: 'bike',
  playerPosition: { lat: 43.610769, lon: 3.876716, name: 'Place de la Comédie' }
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...state,
        seed: action.payload.seed,
        playerName: action.payload.playerName,
        isPlaying: true,
        currentScore: 0,
        remainingTime: 15 * 60,
        plannedTrips: [],
        loading: true,
        error: undefined
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
        selectedObjective: undefined,
        // Déplace le joueur à la position de l'objectif atteint
        playerPosition: {
          lat: action.payload.lat,
          lon: action.payload.lon,
          name: action.payload.name
        }
      };
    case 'UPDATE_SCORE':
      return { ...state, currentScore: action.payload };
    case 'SET_OBJECTIVES':
      return { ...state, objectives: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_LAST_OSRM_ROUTE':
      return { ...state, lastOsrmRoute: action.payload };
    case 'SET_TRANSPORT_MODE':
      return { ...state, selectedTransportMode: action.payload };
    case 'SET_PREVIEW_TRANSPORT_MODE':
      return { ...state, previewTransportMode: action.payload };
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

  // Chargement des objectifs lorsque le jeu démarre
  useEffect(() => {
    async function loadObjectives() {
      if (state.isPlaying && state.loading) {
        try {
          // Utiliser la seed comme facteur aléatoire si nécessaire
          const objectives = await getGameObjectives(20, false);
          dispatch({ type: 'SET_OBJECTIVES', payload: objectives });
        } catch (error) {
          console.error('Erreur lors du chargement des objectifs:', error);
          dispatch({ type: 'SET_ERROR', payload: 'Impossible de charger les objectifs' });
        }
      }
    }

    loadObjectives();
  }, [state.isPlaying, state.loading, state.seed]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameState() {
  return useContext(GameContext);
}
