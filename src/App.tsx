import { GameProvider } from './context/GameContext';
import GameManager from './components/game/GameManager';
import NavBar from './components/ui/NavBar';
import './App.css';

function App() {
  return (
    <GameProvider>
      <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
        <NavBar />
        <main className="flex-1 w-full overflow-hidden">
          <GameManager />
        </main>
        <footer className="bg-gray-200 text-center p-2 text-gray-600 text-sm">
         Eco Sprint - Montpellier
        </footer>
      </div>
    </GameProvider>
  );
}

export default App;
