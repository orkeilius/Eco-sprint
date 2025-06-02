import { useEffect, useRef } from 'react';
import { Map, LngLatBounds } from 'maplibre-gl';
import { addRouteToMap, generateRoutePath, removeRouteFromMap } from '../../utils/RouteVisualization';
import type { Objective } from '../game/ObjectiveList';
import type { TransportMode } from './TransportSelector';

interface RouteVisualizerProps {
  map: Map;
  from: Objective;
  to: Objective;
  transportMode: TransportMode;
  isActive: boolean;
  progress?: number; // 0-100
}

/**
 * Component for visualizing a route on the map
 * This is a "headless" component that doesn't render any UI but manages a route on the map
 */
const RouteVisualizer = ({ 
  map, 
  from, 
  to, 
  transportMode, 
  isActive,
  progress = 100 
}: RouteVisualizerProps) => {
  const routeId = useRef(`route-${from.id}-${to.id}-${Date.now()}`);
  
  // Add route to map on component mount, remove on unmount
  useEffect(() => {    if (!map?.loaded()) return;
    
    // Generate route path
    const path = generateRoutePath(from.lon, from.lat, to.lon, to.lat);
    
    // Add route to map
    addRouteToMap(map, routeId.current, path, transportMode, isActive);
      // Auto-fit map to show the route
    if (isActive) {
      const bounds = new LngLatBounds()
        .extend([from.lon, from.lat])
        .extend([to.lon, to.lat]);
        
      map.fitBounds(bounds, {
        padding: 100,
        duration: 1000
      });
    }
    
    return () => {
      // Clean up route when component unmounts
      removeRouteFromMap(map, routeId.current);
    };
  }, [map, from, to, transportMode, isActive]);
  
  // Update route appearance based on progress
  useEffect(() => {
    // In a more advanced implementation, we would update the route
    // to show progress along the path
    
  }, [progress]);
  
  // This component doesn't render anything
  return null;
};

export default RouteVisualizer;
