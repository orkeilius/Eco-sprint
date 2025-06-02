// Using const for runtime availability
export const TransportModes = {
  BIKE: 'bike',
  PUBLIC: 'public',
  VTC: 'vtc'
} as const;

// Type for TypeScript type checking
export type TransportMode = typeof TransportModes[keyof typeof TransportModes];

interface TransportOption {
  mode: TransportMode;
  icon: string;
  name: string;
  ecologyFactor: number;
  speedFactor: number;
  costFactor: number;
}

interface TransportSelectorProps {
  onTransportSelect: (mode: TransportMode) => void;
}

const TransportSelector = ({ onTransportSelect }: TransportSelectorProps) => {
  const transportOptions: TransportOption[] = [
    {
      mode: TransportModes.BIKE,
      icon: '🚲',
      name: 'Bicycle',
      ecologyFactor: 0.9,
      speedFactor: 0.7,
      costFactor: 0.2
    },
    {
      mode: TransportModes.PUBLIC,
      icon: '🚌',
      name: 'Public Transport',
      ecologyFactor: 0.7,
      speedFactor: 0.8,
      costFactor: 0.5
    },
    {
      mode: TransportModes.VTC,
      icon: '🚕',
      name: 'VTC',
      ecologyFactor: 0.4,
      speedFactor: 1.0,
      costFactor: 0.9
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-semibold mb-4 text-center text-gray-800">Choose Transport Mode</h2>
      <div className="grid grid-cols-3 gap-4">
        {transportOptions.map((option) => (
          <button
            key={option.mode}
            className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center"
            onClick={() => onTransportSelect(option.mode)}
          >
            <span className="text-3xl mb-2">{option.icon}</span>
            <span className="font-medium">{option.name}</span>
            <div className="mt-2 w-full space-y-1">
              <div className="flex justify-between text-xs">
                <span>Speed:</span>
                <span className="font-medium">{option.speedFactor * 100}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Ecology:</span>
                <span className="font-medium text-green-600">{option.ecologyFactor * 100}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Cost:</span>
                <span className="font-medium text-red-600">{option.costFactor * 100}%</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TransportSelector;
