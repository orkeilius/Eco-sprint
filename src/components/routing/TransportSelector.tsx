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
    <div className="bg-white rounded-lg shadow-lg p-3">
      <h2 className="text-lg font-semibold mb-3 text-gray-800">Choix du transport</h2>
      <div className="flex flex-col gap-3">
        {transportOptions.map((option) => (
          <button
            key={option.mode}
            className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            onClick={() => onTransportSelect(option.mode)}
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">{option.icon}</div>
              <div className="flex-1">
                <div className="font-medium">{option.name}</div>
                <div className="grid grid-cols-3 text-xs mt-1">
                  <div className={`text-${option.ecologyFactor > 0.5 ? 'green' : 'yellow'}-600`}>
                    🌱 {Math.round(option.ecologyFactor * 100)}%
                  </div>
                  <div className="text-blue-600">
                    ⏱️ {Math.round(option.speedFactor * 100)}%
                  </div>
                  <div className="text-purple-600">
                    💰 {Math.round(option.costFactor * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TransportSelector;
