import { useEffect, useRef } from 'react';
import { Map, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapViewProps {
  center: [number, number];
  zoom: number;
}

const MapView = ({ center, zoom }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);

  useEffect(() => {
    if (map.current) return;
    
    if (mapContainer.current) {
      map.current = new Map({
        container: mapContainer.current,
        style: 'https://demotiles.maplibre.org/style.json', // Base monochrome style
        center: center,
        zoom: zoom
      });
      
      map.current.addControl(new NavigationControl(), 'top-right');
    }
    
    return () => {
      map.current?.remove();
    };
  }, [center, zoom]);

  return (
    <div ref={mapContainer} className="h-full w-full rounded-lg shadow-lg" />
  );
};

export default MapView;
