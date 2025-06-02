import { useState } from 'react';
import { useGameState } from '../../context/GameContext';

const StartScreen = () => {
  const { dispatch } = useGameState();
  const [playerName, setPlayerName] = useState<string>('');
  const [seed, setSeed] = useState<string>('');
  const [useSeed, setUseSeed] = useState<boolean>(false);

  const handleStartGame = () => {
    const finalSeed = useSeed && seed ? seed : Math.random().toString(36).substring(2, 10);
    
    dispatch({ 
      type: 'START_GAME', 
      payload: { 
        seed: finalSeed,
        playerName: playerName || 'Joueur'
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
      <h1 className="text-3xl font-bold mb-6 text-green-600">Eco Sprint</h1>
      
      <div className="w-full mb-6 bg-green-50 p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Comment jouer</h2>
        <p className="text-gray-700">
          Planifiez votre parcours urbain à Montpellier en visitant des objectifs 
          tout en optimisant la rapidité, l'écologie et l'efficacité. Choisissez entre 
          vélo, transports en commun et VTC pour maximiser votre score !
        </p>
      </div>
      
      <div className="w-full space-y-4 mb-6">
        <div>
          <label htmlFor="playerName" className="block mb-1 font-medium">Nom du joueur</label>
          <input
            type="text"
            id="playerName"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Entrez votre nom"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="useSeed"
            checked={useSeed}
            onChange={() => setUseSeed(!useSeed)}
            className="mr-2"
          />
          <label htmlFor="useSeed" className="font-medium">Utiliser un code de graine personnalisé</label>
        </div>
        
        {useSeed && (
          <div>
            <label htmlFor="seed" className="block mb-1 font-medium">Graine</label>
            <input
              type="text"
              id="seed"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Entrez le code graine"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              Utiliser la même graine générera les mêmes objectifs.
            </p>
          </div>
        )}
      </div>
      
      <button
        onClick={handleStartGame}
        className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 text-lg"
      >
        Démarrer la partie
      </button>
    </div>
  );
};

export default StartScreen;

