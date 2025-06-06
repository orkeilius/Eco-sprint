interface ScoreDisplayProps {
  score: number;
  timeRemaining: number; // in seconds
}

const ScoreDisplay = ({ score, timeRemaining }: ScoreDisplayProps) => {
  // Format time remaining as minutes:seconds
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${Math.round(seconds).toString().padStart(2, '0')}`;

  return (
    <div className="flex justify-between items-center bg-white rounded-lg shadow-sm p-2 mb-4">
      <div className="bg-green-50 rounded-md p-2">
        <span className="text-sm text-gray-500">Score</span>
        <div className="text-2xl font-bold text-green-600">{score}</div>
      </div>
      <div className="bg-green-100 rounded-md p-2">
        <span className="text-sm text-gray-500">Temps restant</span>
        <div className="text-2xl font-bold text-green-600">{formattedTime}</div>
      </div>
    </div>
  );
};

export default ScoreDisplay;
