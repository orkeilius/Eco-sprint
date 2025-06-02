import { useEffect, useRef, useState } from 'react';
import { Map, Marker, NavigationControl, LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useGameState } from '../../context/GameContext';
import { 
  addRouteToMap, 
  generateRoutePath, 
  removeRouteFromMap 
} from '../../utils/RouteVisualization';
import { TransportModes } from '../routing/TransportSelector';
import { isWebGLSupported, recoverFromContextLost } from '../../utils/WebGLHelpers';
import './MapStyles.css';

const GameMap = () => {
  const { state, dispatch } = useGameState();
  const { objectives, selectedObjective, plannedTrips, isDriving } = state;
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const markers = useRef<Marker[]>([]);
  const [activeRoute, setActiveRoute] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [webGLSupported, setWebGLSupported] = useState<boolean>(true);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  
  // Default center on Montpellier
  const mapCenter: [number, number] = [3.8767337, 43.6112422];
  const zoom = 13;
  
  // Function to initialize the map
  const initializeMap = () => {
    if (map.current || !mapContainer.current || !webGLSupported) return;
    
    try {
      map.current = new Map({
        container: mapContainer.current,
        style: 'https://demotiles.maplibre.org/style.json', // Monochrome base style
        center: mapCenter,
        zoom: zoom,
      });
      
      // Add error handling
      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setMapError('Map error occurred. Please try refreshing the page.');
      });
      
      map.current.on('webglcontextlost', (e) => {
        console.error('WebGL context lost:', e);
        setMapError('WebGL context lost. Trying to recover...');
        
        // Try to recover the WebGL context
        recoverFromContextLost(mapContainer.current, () => {
          if (map.current) {
            setMapError('Recovery failed. Please refresh the page.');
          } else {
            // Reinitialize map after a short delay
            setTimeout(() => {
              setMapError(null);
              initializeMap();
            }, 1000);
          }
        });
      });
      
      map.current.on('webglcontextrestored', () => {
        console.log('WebGL context restored');
        setMapError(null);
        
        // Redraw everything once the context is restored
        if (map.current?.loaded()) {
          renderObjectiveMarkers();
          renderPlannedTrips();
        }
      });
      
      map.current.on('load', () => {
        setIsMapLoaded(true);
        setMapError(null);
        
        // Add navigation control
        map.current!.addControl(new NavigationControl(), 'top-right');
        
        // Render markers and routes once loaded
        renderObjectiveMarkers();
        
        if (plannedTrips.length > 0) {
          renderPlannedTrips();
        }
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize the map. Please check your browser settings and try again.');
    }
  };
  
  // Check WebGL support on component mount
  useEffect(() => {
    const supported = isWebGLSupported();
    setWebGLSupported(supported);
    
    if (!supported) {
      setMapError('Your browser does not support WebGL, which is required to display the map.');
    } else {
      initializeMap();
    }
    
    return () => {
      // Clean up resources on unmount
      if (activeRoute && map.current) {
        removeRouteFromMap(map.current, activeRoute);
      }
      
      markers.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, []);
  
  // Function to render objective markers
  const renderObjectiveMarkers = () => {
    if (!map.current || !map.current.loaded()) return;
    
    // Remove existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
    
    // Add markers for each objective
    objectives.forEach(objective => {
      // Create marker element
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.width = '25px';
      el.style.height = '25px';
      el.style.borderRadius = '50%';
      el.style.display = 'flex';
      el.style.justifyContent = 'center';
      el.style.alignItems = 'center';
      el.style.fontWeight = 'bold';
      el.style.cursor = 'pointer';
      
      // Style based on completion status
      if (objective.completed) {
        el.style.backgroundColor = '#9CA3AF'; // Gray for completed
        el.style.color = '#F3F4F6';
      } else {
        el.style.backgroundColor = '#3B82F6'; // Blue for active
        el.style.color = 'white';
      }
      
      // Add point value as text
      el.textContent = objective.pointValue.toString();
      
      try {
        // Create and store marker
        const marker = new Marker({ element: el })
          .setLngLat([objective.lon, objective.lat])
          .addTo(map.current!);
        
        // Add click handler
        el.addEventListener('click', () => {
          if (!objective.completed) {
            dispatch({ type: 'SELECT_OBJECTIVE', payload: objective });
          }
        });
        
        markers.current.push(marker);
      } catch (error) {
        console.error('Error adding marker:', error);
      }
    });
  };
  
  // Add objective markers to map when objectives change
  useEffect(() => {
    if (isMapLoaded && map.current) {
      renderObjectiveMarkers();
    }
  }, [objectives, isMapLoaded]);
  
  // Handle rendering planned trips
  const renderPlannedTrips = () => {
    if (!map.current || !map.current.loaded()) return;
    
    try {
      // Render all completed trips
      plannedTrips.forEach(trip => {
        const routeId = `trip-${trip.id}`;
        const path = generateRoutePath(
          trip.from.lon, 
          trip.from.lat, 
          trip.to.lon, 
          trip.to.lat
        );
        
        // Add route to map (not active)
        addRouteToMap(map.current!, routeId, path, trip.transportMode, false);
      });
    } catch (error) {
      console.error('Error rendering planned trips:', error);
    }
  };
  
  // Update routes when trips change
  useEffect(() => {
    if (!isMapLoaded || !map.current) return;
    
    try {
      // Clean up previous routes
      if (activeRoute) {
        removeRouteFromMap(map.current, activeRoute);
        setActiveRoute(null);
      }
      
      plannedTrips.forEach(trip => {
        const routeId = `trip-${trip.id}`;
        removeRouteFromMap(map.current!, routeId);
      });
      
      // Render all routes
      renderPlannedTrips();
    } catch (error) {
      console.error('Error updating routes:', error);
    }
  }, [plannedTrips, isMapLoaded, isDriving]);
  
  // Add active route when driving starts
  useEffect(() => {
    if (!isMapLoaded || !map.current || !isDriving || !selectedObjective) return;
    
    try {
      // Find current position (using first objective as mock current position)
      const currentPosition = objectives[0];
      
      // Generate and add the active route
      const routeId = `active-route-${Date.now()}`;
      const path = generateRoutePath(
        currentPosition.lon, 
        currentPosition.lat, 
        selectedObjective.lon, 
        selectedObjective.lat
      );
      
      addRouteToMap(map.current, routeId, path, TransportModes.BIKE, true);
      setActiveRoute(routeId);
      
      // Auto-focus map to show the route
      try {
        const bounds = new LngLatBounds()
          .extend([currentPosition.lon, currentPosition.lat])
          .extend([selectedObjective.lon, selectedObjective.lat]);
          
        map.current.fitBounds(bounds, {
          padding: 100,
          duration: 1000
        });
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
      
      return () => {
        // Clean up active route when driving ends
        if (map.current && routeId) {
          removeRouteFromMap(map.current, routeId);
        }
      };
    } catch (error) {
      console.error('Error setting active route:', error);
    }
  }, [isDriving, selectedObjective, isMapLoaded]);
  
  // Handle map recovery
  const handleRecoverMap = () => {
    // Clean up old map instance
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    
    // Reset states
    setMapError(null);
    setIsMapLoaded(false);
    
    // Try to initialize again
    setTimeout(initializeMap, 500);
  };
  
  return (
    <div className="h-full relative map-wrapper">
      <div ref={mapContainer} className="map-container rounded-lg shadow-lg" />
      
      {/* Map error message */}
      {mapError && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center p-4 z-20">
          <div className="text-red-600 font-bold mb-2">⚠️ Map Error</div>
          <p className="text-center text-gray-800">{mapError}</p>
          <div className="mt-4 flex gap-4">
            <button 
              onClick={handleRecoverMap}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try to Fix
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}
      
      {/* Fallback content when WebGL is not supported */}
      {!webGLSupported && !mapError && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center p-4 z-20">
          <div className="text-yellow-600 font-bold mb-2">⚠️ WebGL Not Supported</div>
          <p className="text-center text-gray-800">
            Your browser doesn't support WebGL, which is required to display the map. 
            Please try a different browser like Chrome or Firefox.
          </p>
        </div>
      )}
        
      {/* Info overlays - only show if map is working */}
      {!mapError && webGLSupported && (
        <>
          <div className="absolute top-4 left-4 bg-white p-3 rounded-md shadow-md z-10">
            <p className="font-medium text-sm text-gray-600">
              Map shows {objectives.length} objectives
            </p>
            <p className="text-xs text-gray-500">
              {objectives.filter(o => o.completed).length} completed
            </p>
          </div>
          
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded-md shadow-md z-10">
            <h3 className="font-medium text-sm mb-2">Legend</h3>
            <div className="flex items-center text-xs mb-1">
              <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-gray-800">Active Objective</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-4 h-4 rounded-full bg-gray-400 mr-2"></div>
              <span className="text-gray-800">Completed Objective</span>
            </div>
            {plannedTrips.length > 0 && (
              <div className="flex items-center text-xs mt-1">
                <div className="w-4 h-1 bg-blue-400 mr-2"></div>
                <span className="text-gray-800">Previous Routes</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GameMap;
