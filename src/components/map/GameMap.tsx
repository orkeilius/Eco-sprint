import { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapStyles.css';
import { useGameState } from '../../context/GameContext';
import { fetchOsrmRoute, type OsrmRoute } from '../../utils/osrm';
import type { TransportMode } from '../../types/routing.types';
import { TransportModes } from '../../types/routing.types';

// Génère un identifiant unique pour une couche ou une source
const generateId = (type: 'source' | 'layer', mode: string, isPreview: boolean = false): string => {
  return `route-${type}-${mode}${isPreview ? '-preview' : ''}`;
};

// Couleurs pour les différents modes de transport
const ROUTE_COLORS: Record<TransportMode, string> = {
  bike: '#22c55e', // vert
  public: '#3b82f6', // bleu
  vtc: '#8b5cf6', // violet
};

// Couleur pour les aperçus (preview)
const PREVIEW_COLOR = '#fbbf24'; // jaune

const GameMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const markers = useRef<Marker[]>([]);
  const { state, dispatch } = useGameState();
  const { objectives, playerPosition, selectedObjective, selectedTransportMode, previewTransportMode } = state;

  // État pour suivre les sources et couches actives
  const [activeLayers, setActiveLayers] = useState<{
    sourceId: string;
    layerId: string;
  } | null>(null);

  const [activePreviewLayer, setActivePreviewLayer] = useState<{
    sourceId: string;
    layerId: string;
  } | null>(null);

  // Fonction pour dessiner un itinéraire sur la carte
  const drawRoute = async (mode: TransportMode, isPreview: boolean = false) => {
    if (!map.current || !selectedObjective || !playerPosition) return;

    // Nettoyer les anciennes routes du même type (preview ou principal)
    clearRoutes(isPreview);

    const sourceId = generateId('source', mode, isPreview);
    const layerId = generateId('layer', mode, isPreview);

    // Récupérer l'itinéraire
    const route = await fetchOsrmRoute(
      playerPosition,
      selectedObjective,
      mode,
      true // Toujours forcer une nouvelle requête pour les aperçus
    );

    if (!route) return;

    // Supprimer la couche et la source si elles existent déjà
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }

    // Ajouter la nouvelle source et couche
    map.current.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: route.geometry,
        properties: {}
      }
    });

    map.current.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': isPreview ? PREVIEW_COLOR : ROUTE_COLORS[mode],
        'line-width': 5,
        'line-opacity': 0.85
      }
    });

    // Mettre à jour l'état pour suivre les couches actives
    if (isPreview) {
      setActivePreviewLayer({ sourceId, layerId });
    } else {
      setActiveLayers({ sourceId, layerId });

      // Mettre à jour les informations de route dans le contexte
      dispatch({
        type: 'SET_LAST_OSRM_ROUTE',
        payload: {
          distance: route.distance,
          duration: route.duration
        }
      });
    }

    return { sourceId, layerId };
  };

  // Nettoyer les couches d'itinéraire
  const clearRoutes = (isPreview: boolean = false) => {
    if (!map.current) return;

    // Fonction pour supprimer en toute sécurité une couche et une source
    const safelyRemoveLayerAndSource = (layerId: string, sourceId: string) => {
      try {
        // Supprimer d'abord la couche si elle existe
        if (map.current!.getLayer(layerId)) {
          map.current!.removeLayer(layerId);
        }

        // Ensuite supprimer la source si elle existe
        if (map.current!.getSource(sourceId)) {
          map.current!.removeSource(sourceId);
        }
      } catch (error) {
        console.error(`Erreur lors de la suppression de la couche/source ${layerId}:`, error);
      }
    };

    // Recherche et suppression de toutes les couches et sources qui contiennent 'route'
    const cleanAllRouteLayers = () => {
      try {
        const style = map.current!.getStyle();
        if (!style || !style.layers) return;

        // Trouver toutes les couches contenant 'route' dans leur id
        const routeLayers = style.layers
          .filter(layer => layer.id && layer.id.includes('route'))
          .map(layer => layer.id);

        // Supprimer toutes les couches d'itinéraire trouvées
        routeLayers.forEach(layerId => {
          try {
            if (map.current!.getLayer(layerId)) {
              map.current!.removeLayer(layerId);
            }
          } catch (e) { /* ignorer les erreurs */ }
        });

        // Trouver toutes les sources contenant 'route' dans leur id
        if (style.sources) {
          const routeSources = Object.keys(style.sources)
            .filter(sourceId => sourceId.includes('route'));

          // Supprimer toutes les sources d'itinéraire trouvées
          routeSources.forEach(sourceId => {
            try {
              if (map.current!.getSource(sourceId)) {
                map.current!.removeSource(sourceId);
              }
            } catch (e) { /* ignorer les erreurs */ }
          });
        }
      } catch (e) {
        console.error("Erreur lors du nettoyage des couches d'itinéraire:", e);
      }
    };

    // Si on nettoie l'aperçu, on supprime uniquement les couches d'aperçu
    if (isPreview) {
      if (activePreviewLayer) {
        safelyRemoveLayerAndSource(activePreviewLayer.layerId, activePreviewLayer.sourceId);
        setActivePreviewLayer(null);
      }

      // Vérifier et supprimer tous les anciens aperçus potentiels
      Object.values(TransportModes).forEach(mode => {
        const previewSourceId = generateId('source', mode, true);
        const previewLayerId = generateId('layer', mode, true);
        safelyRemoveLayerAndSource(previewLayerId, previewSourceId);
      });
    }
    // Si on nettoie l'itinéraire principal, on supprime tout
    else {
      if (activeLayers) {
        safelyRemoveLayerAndSource(activeLayers.layerId, activeLayers.sourceId);
        setActiveLayers(null);
      }

      // Supprimer également tous les aperçus
      if (activePreviewLayer) {
        safelyRemoveLayerAndSource(activePreviewLayer.layerId, activePreviewLayer.sourceId);
        setActivePreviewLayer(null);
      }

      // Et tous les anciens chemins potentiels
      Object.values(TransportModes).forEach(mode => {
        // Nettoyer les couches principales
        const sourceId = generateId('source', mode, false);
        const layerId = generateId('layer', mode, false);
        safelyRemoveLayerAndSource(layerId, sourceId);

        // Nettoyer également les couches d'aper��u
        const previewSourceId = generateId('source', mode, true);
        const previewLayerId = generateId('layer', mode, true);
        safelyRemoveLayerAndSource(previewLayerId, previewSourceId);
      });

      // Recherche et nettoyage global de toutes les couches liées aux routes
      cleanAllRouteLayers();

      // Pour être absolument certain, essayer de supprimer l'ancien chemin 'player-path' du code précédent
      try {
        if (map.current.getLayer('player-path')) {
          map.current.removeLayer('player-path');
        }
        if (map.current.getSource('player-path')) {
          map.current.removeSource('player-path');
        }
      } catch (e) {
        // Ignorer les erreurs ici
      }
    }
  };

  // Rendu des marqueurs d'objectifs
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

  // Initialisation de la carte
  useEffect(() => {
    if (map.current || !mapContainer.current || !playerPosition) return;

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
    });

    return () => {
      markers.current.forEach(marker => marker.remove());
      map.current?.remove();
      map.current = null;
    };
  }, [playerPosition]);

  // Effet pour redessiner les marqueurs quand nécessaire
  useEffect(() => {
      renderObjectiveMarkers();
  }, [objectives, playerPosition, selectedObjective]);

  // Effet pour gérer le mode de transport normal
  useEffect(() => {
    if (map.current?.isStyleLoaded() && selectedObjective && playerPosition) {
      // Nettoyer l'ancien itinéraire
      clearRoutes(false);

      // Dessiner le nouvel itinéraire pour le mode sélectionné
      const currentMode = selectedTransportMode || 'bike';
      console.log(`Affichage de l'itinéraire principal: ${currentMode}`);
      drawRoute(currentMode, false);
    }
  }, [selectedObjective, playerPosition, selectedTransportMode]);

  // Effet pour gérer le mode de transport en aperçu (preview)
  useEffect(() => {
    if (map.current?.isStyleLoaded() && selectedObjective && playerPosition) {
      // Nettoyer l'ancien aperçu
      clearRoutes(true);

      // Si un mode d'aperçu est défini, dessiner l'itinéraire correspondant
      if (previewTransportMode) {
        console.log(`Affichage de l'itinéraire en aperçu: ${previewTransportMode}`);
        drawRoute(previewTransportMode, true);
      }
    }
  }, [previewTransportMode, selectedObjective, playerPosition]);

  return (
    <div className="h-full relative map-wrapper">
      <div ref={mapContainer} className="map-container rounded-lg shadow-lg" style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default GameMap;
