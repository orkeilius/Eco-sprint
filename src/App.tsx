import GameMap from './components/GameMap';
import PlanTrip from './components/PlanTrip';
import type { Objective, Trip } from './components/PlanTrip';
import { useState } from 'react';
import './App.css';


function App() {

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">
        Montpellier Mobility Game
      </h1>
    </div>
  );
}

export default App;
