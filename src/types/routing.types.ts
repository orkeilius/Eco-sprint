export const TransportModes = {
  BIKE: 'bike',
  PUBLIC: 'public',
  VTC: 'vtc'
} as const;

// Type for TypeScript type checking
export type TransportMode = typeof TransportModes[keyof typeof TransportModes];

