export const TransportModes = {
  BIKE: 'bike',
  PUBLIC: 'public',
  VTC: 'vtc'
} as const;

export type TransportMode = typeof TransportModes[keyof typeof TransportModes];

