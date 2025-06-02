import { useEffect, useRef } from 'react';
import { Map, NavigationControl, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapStyles.css';
import { useGameState } from '../../context/GameContext';
import { fetchOsrmRoute, type OsrmRoute } from '../../utils/osrm';
import type { TransportMode } from '../../types/routing.types';

const GameMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const markers = useRef<Marker[]>([]);
  const { state, dispatch } = useGameState();
  const { objectives, playerPosition, selectedObjective, selectedTransportMode, previewTransportMode } = state;

  // Cache pour les itinéraires OSRM
  const routeCache = useRef<Record<string, OsrmRoute | null>>({});

  // Fonction pour générer une clé de cache unique
  const getCacheKey = (from: { lat: number; lon: number }, to: { lat: number; lon: number }, mode: TransportMode): string => {
    return `${from.lat},${from.lon}_${to.lat},${to.lon}_${mode}`;
  };

  // Fonction pour dessiner le chemin OSRM du joueur vers l'objectif sélectionné ou prévisualisé
  const drawPathToObjective = async () => {
    if (!map.current) return; // S'assurer que la carte est initialisée

    // Nettoyer le chemin précédent et lastOsrmRoute si aucun objectif n'est sélectionné
    if (!selectedObjective) {
      if (map.current.getSource('player-path')) {
        try { map.current.removeLayer('player-path'); } catch {}
        try { map.current.removeSource('player-path'); } catch {}
      }
      dispatch({ type: 'SET_LAST_OSRM_ROUTE', payload: undefined });
      return;
    }

    const modeToDraw: TransportMode = previewTransportMode || selectedTransportMode || 'bike';
    const cacheKey = getCacheKey(playerPosition, selectedObjective, modeToDraw);
    let route: OsrmRoute | null = null;

    if (routeCache.current.hasOwnProperty(cacheKey)) {
      route = routeCache.current[cacheKey];
    } else {
      route = await fetchOsrmRoute(
        playerPosition,
        selectedObjective,
        modeToDraw
      );
      routeCache.current[cacheKey] = route; // Mettre en cache le résultat (même si null)
    }

    // Supprimer l'ancien chemin s'il existe (redondant avec le nettoyage au début si !selectedObjective mais utile ici)
    if (map.current.getSource('player-path')) {
      try { map.current.removeLayer('player-path'); } catch {}
      try { map.current.removeSource('player-path'); } catch {}
    }

    if (route) {
      map.current.addSource('player-path', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: route.geometry,
          properties: {}
        }
      });
      map.current.addLayer({
        id: 'player-path',
        type: 'line',
        source: 'player-path',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': previewTransportMode ? '#fbbf24' : '#22c55e', // Jaune pour l'aperçu, vert sinon
          'line-width': 5,
          'line-opacity': 0.85
        }
      });

      // Mettre à jour lastOsrmRoute seulement si ce n'est pas un aperçu
      // et que le mode dessiné correspond au mode sélectionné principal (ou au mode par défaut 'bike')
      if (!previewTransportMode) {
        if ((selectedTransportMode && modeToDraw === selectedTransportMode) || (!selectedTransportMode && modeToDraw === 'bike')) {
            dispatch({ type: 'SET_LAST_OSRM_ROUTE', payload: { distance: route.distance, duration: route.duration } });
        }
      } else {
        // Si c'est un aperçu, on ne met pas à jour la route principale dans le contexte
        // mais on pourrait vouloir nettoyer si l'aperçu ne correspond plus à rien
      }
    } else {
      // Si la route est null (échec OSRM ou pas de route), s'assurer que lastOsrmRoute est nettoyé si ce n'est pas un aperçu
      if (!previewTransportMode) {
        dispatch({ type: 'SET_LAST_OSRM_ROUTE', payload: undefined });
      }
    }
  };

  const renderObjectiveMarkers = () => {
    if (!map.current || !objectives || !playerPosition) return;
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Marqueur du joueur
    const playerEl = document.createElement('div');
    playerEl.className = 'marker-objective';
    playerEl.style.zIndex = '10';
    playerEl.innerHTML = `<div class="marker-pin" style="color:#10b981;"><div class="marker-icon">🧑‍🦱</div></div>`;
    playerEl.title = playerPosition.name;
    const playerMarker = new Marker({ element: playerEl })
      .setLngLat([playerPosition.lon, playerPosition.lat])
      .addTo(map.current!);
    markers.current.push(playerMarker);

    objectives.forEach(obj => {
      // Ne pas afficher d'objectif à la position exacte du joueur
      if (obj.lat === playerPosition.lat && obj.lon === playerPosition.lon) return;

      const el = document.createElement('div');
      el.className = 'marker-objective';
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
        return '📍';
      };
      const pinElement = document.createElement('div');
      pinElement.className = 'marker-pin';
      pinElement.style.color = obj.completed ? '#9CA3AF' : (selectedObjective?.id === obj.id ? '#3b82f6' : '#6b7280');
      const iconElement = document.createElement('div');
      iconElement.className = 'marker-icon';
      iconElement.textContent = getEmoji();
      pinElement.appendChild(iconElement);
      el.appendChild(pinElement);
      el.title = obj.name;
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
    if (map.current || !mapContainer.current || !playerPosition ) return; // Attendre que playerPosition soit défini
    map.current = new Map({
      container: mapContainer.current,
      style: 'https://api.maptiler.com/maps/streets/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL',
      center: [playerPosition.lon, playerPosition.lat],
      zoom: 14,
      pitch: 45,
      antialias: true,
    });
    map.current.addControl(new NavigationControl(), 'top-right');

    map.current.on('load', () => {
      const layers = map.current!.getStyle().layers;
      if (layers) {
        for (const layer of layers) {
          if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
            try { map.current!.removeLayer(layer.id); } catch (e) { /* ignore */ }
          }
        }
      }
      map.current!.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': ['interpolate',['linear'],['zoom'],15,0,15.05,['get', 'height']],
          'fill-extrusion-base': ['interpolate',['linear'],['zoom'],15,0,15.05,['get', 'min_height']],
          'fill-extrusion-opacity': 0.6
        }
      });
      renderObjectiveMarkers();
      // Pas besoin d'appeler drawPathToObjective ici, le useEffect dédié s'en chargera
    });

    // map.current.on('mousemove', (e) => {
    //   dispatch({ type: 'SET_MOUSE_POSITION', payload: e.lngLat });
    // });

    return () => {
      markers.current.forEach(marker => marker.remove());
      map.current?.remove();
      map.current = null;
      routeCache.current = {}; // Vider le cache
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerPosition]); // Recréer la carte si la position initiale du joueur change (ne devrait pas arriver souvent après init)

  // Redessine les marqueurs si les objectifs ou la position du joueur changent
  useEffect(() => {
      renderObjectiveMarkers();

  }, [objectives, playerPosition, selectedObjective]);

  // Redessine le chemin si l'objectif sélectionné, la position du joueur, ou le mode d'aperçu/sélectionné change
  useEffect(() => {
    if (map.current?.isStyleLoaded() && playerPosition) { // S'assurer que playerPosition est disponible
      drawPathToObjective();
    }
  }, [selectedObjective, playerPosition, selectedTransportMode, previewTransportMode, dispatch]); // Ajout de dispatch aux dépendances

  return (
    <div className="h-full relative map-wrapper">
      <div ref={mapContainer} className="map-container rounded-lg shadow-lg" style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default GameMap;
