const NavBar = () => {
  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold">🚲</span>
          <h1 className="text-xl font-semibold">Montpellier Mobility Game</h1>
        </div>
        <div className="space-x-4">
          <button className="px-3 py-1 bg-white text-blue-600 rounded hover:bg-blue-50">
            How to Play
          </button>
          <button className="px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-800">
            Leaderboard
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
