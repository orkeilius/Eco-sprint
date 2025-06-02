import { useEffect, useRef } from 'react';
import { Map, NavigationControl, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapStyles.css';
import { useGameState } from '../../context/GameContext';

const GameMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const markers = useRef<Marker[]>([]);
  const { state, dispatch } = useGameState();
  const { objectives } = state;

  // Affiche les marqueurs d'objectifs
  const renderObjectiveMarkers = () => {
    if (!map.current) return;
    // Nettoie les anciens marqueurs
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
    objectives.forEach(obj => {
      const el = document.createElement('div');
      el.className = 'marker-objective';
      el.style.width = '28px';
      el.style.height = '28px';
      el.style.borderRadius = '50%';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontWeight = 'bold';
      el.style.cursor = 'pointer';
      el.style.background = obj.completed ? '#bbb' : '#2563eb';
      el.style.color = obj.completed ? '#eee' : '#fff';
      el.title = obj.name;
      // Icône SVG cible
      el.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="9" stroke="white" stroke-width="2" fill="none"/><circle cx="10" cy="10" r="5" stroke="white" stroke-width="2" fill="none"/><circle cx="10" cy="10" r="2" fill="white"/></svg>`;
      el.onclick = () => {
        if (!obj.completed) {
          dispatch({ type: 'SELECT_OBJECTIVE', payload: obj });
        }
      };
      const marker = new Marker({ element: el })
        .setLngLat([obj.lon, obj.lat])
        .addTo(map.current!);
      markers.current.push(marker);
    });
  };

  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    map.current = new Map({
      container: mapContainer.current,
      style: 'https://api.maptiler.com/maps/streets/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL',
      center: [3.8767337, 43.6112422], // Montpellier
      zoom: 15.5,
      pitch: 45,
      antialias: true,
    });
    map.current.addControl(new NavigationControl(), 'top-right');

    map.current.on('load', () => {
      // Supprime les couches de labels texte
      const layers = map.current!.getStyle().layers;
      if (layers) {
        for (const layer of layers) {
          if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
            try {
              map.current!.removeLayer(layer.id);
            } catch (e) { /* ignore */ }
          }
        }
      }
      // Ajoute la couche 3D des bâtiments
      map.current!.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15, 0,
            15.05, ['get', 'height']
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15, 0,
            15.05, ['get', 'min_height']
          ],
          'fill-extrusion-opacity': 0.6
        }
      });
      renderObjectiveMarkers();
    });

    return () => {
      markers.current.forEach(marker => marker.remove());
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Met à jour les marqueurs si les objectifs changent
  useEffect(() => {
    renderObjectiveMarkers();
  }, [objectives]);

  return (
    <div className="h-full relative map-wrapper">
      <div ref={mapContainer} className="map-container rounded-lg shadow-lg" style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default GameMap;
