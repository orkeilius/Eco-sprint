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
      // Création du conteneur du marqueur
      const el = document.createElement('div');
      el.className = 'marker-objective';

      // Fonction pour déterminer l'emoji en fonction du type d'objectif
      const getEmoji = () => {
        if (obj.description) {
          const desc = obj.description.toLowerCase();
          if (desc.includes('museum')) return '🏛️';
          if (desc.includes('park') || desc.includes('garden')) return '🌳';
          if (desc.includes('attraction')) return '🎭';
          if (desc.includes('restaurant') || desc.includes('cafe')) return '🍽️';
          if (desc.includes('cinema') || desc.includes('theatre')) return '🎬';
          if (desc.includes('shop') || desc.includes('mall')) return '🛍️';
          if (desc.includes('swimming')) return '🏊';
          if (desc.includes('university')) return '🎓';
          if (desc.includes('monument') || desc.includes('castle')) return '🏰';
          if (desc.includes('library')) return '📚';
          if (desc.includes('sports')) return '⚽';
          if (desc.includes('artwork')) return '🎨';
        }
        return '📍'; // Emoji par défaut
      };

      // Utilisation des classes CSS pour la forme d'épingle
      const pinElement = document.createElement('div');
      pinElement.className = 'marker-pin';
      pinElement.style.color = obj.completed ? '#9CA3AF' : '#2563eb';

      // Création du conteneur pour l'emoji
      const iconElement = document.createElement('div');
      iconElement.className = 'marker-icon';
      iconElement.textContent = getEmoji();

      // Assemblage des éléments
      pinElement.appendChild(iconElement);
      el.appendChild(pinElement);

      // Configuration du titre et de l'événement au clic
      el.title = obj.name;
      el.onclick = () => {
        if (!obj.completed) {
          dispatch({ type: 'SELECT_OBJECTIVE', payload: obj });
        }
      };

      // Création et ajout du marqueur à la carte
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
