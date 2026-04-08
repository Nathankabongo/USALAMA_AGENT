import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix des icônes Leaflet avec Vite/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export type MapStyle = 'dark' | 'standard' | 'satellite';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: 'user' | 'safe' | 'danger' | 'destination';
  label?: string;
  color?: string;
  icon?: string;
}

export interface MapCircle {
  id: string;
  lat: number;
  lng: number;
  radius: number;
  color: string;
  fillColor: string;
  label?: string;
}

export interface MapPolyline {
  id: string;
  points: [number, number][];
  color: string;
  weight?: number;
  dashArray?: string;
}

interface KinshasaMapProps {
  center?: [number, number];
  zoom?: number;
  mapStyle?: MapStyle;
  markers?: MapMarker[];
  circles?: MapCircle[];
  polylines?: MapPolyline[];
  userPosition?: [number, number] | null;
  userHeading?: number;
  movementTrail?: [number, number][];
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
}

const TILE_LAYERS: Record<MapStyle, { url: string; attribution: string }> = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
  },
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri, Maxar, Earthstar Geographics',
  },
};

const KinshasaMap = ({
  center = [-4.4419, 15.2663],
  zoom = 13,
  mapStyle = 'dark',
  markers = [],
  circles = [],
  polylines = [],
  userPosition,
  userHeading = 0,
  movementTrail = [],
  onMapClick,
  className = '',
}: KinshasaMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Map<string, L.Marker | L.CircleMarker>>(new Map());
  const circlesRef = useRef<Map<string, L.Circle>>(new Map());
  const polylinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);
  const trailRef = useRef<L.Polyline | null>(null);

  // Initialisation de la carte
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: true,
    });

    const tile = TILE_LAYERS[mapStyle];
    tileLayerRef.current = L.tileLayer(tile.url, {
      attribution: tile.attribution,
      maxZoom: 19,
    }).addTo(map);

    if (onMapClick) {
      map.on('click', (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Mise à jour du style de la carte
  useEffect(() => {
    if (!mapRef.current) return;
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    const tile = TILE_LAYERS[mapStyle];
    tileLayerRef.current = L.tileLayer(tile.url, {
      attribution: tile.attribution,
      maxZoom: 19,
    }).addTo(mapRef.current);
  }, [mapStyle]);

  // Mise à jour du centre et zoom
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView(center, zoom, { animate: true });
  }, [center[0], center[1], zoom]);

  // Gestion des marqueurs
  useEffect(() => {
    if (!mapRef.current) return;

    // Supprimer les anciens marqueurs qui ne sont plus présents
    markersRef.current.forEach((marker, id) => {
      if (!markers.find(m => m.id === id)) {
        mapRef.current!.removeLayer(marker);
        markersRef.current.delete(id);
      }
    });

    // Ajouter/mettre à jour les nouveaux marqueurs
    markers.forEach(m => {
      const existing = markersRef.current.get(m.id);
      if (existing) {
        (existing as L.Marker).setLatLng([m.lat, m.lng]);
        return;
      }

      let marker: L.Marker | L.CircleMarker;

      if (m.type === 'safe') {
        const icon = L.divIcon({
          html: `<div style="
            width: 32px; height: 32px; 
            background: ${m.color || '#22c55e'}; 
            border: 3px solid white; 
            border-radius: 50%; 
            display: flex; align-items: center; justify-content: center;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5);
          ">${m.icon || '🏥'}</div>`,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        marker = L.marker([m.lat, m.lng], { icon });
      } else if (m.type === 'danger') {
        const icon = L.divIcon({
          html: `<div style="
            width: 28px; height: 28px;
            background: ${m.color || '#ef4444'};
            border: 2px solid white;
            border-radius: 4px;
            display: flex; align-items: center; justify-content: center;
            font-size: 12px;
            box-shadow: 0 2px 8px rgba(239,68,68,0.6);
          ">⚠️</div>`,
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        marker = L.marker([m.lat, m.lng], { icon });
      } else {
        const icon = L.divIcon({
          html: `<div style="
            width: 30px; height: 30px;
            background: #3b82f6;
            border: 2px solid white;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 12px;
            box-shadow: 0 2px 8px rgba(59,130,246,0.6);
          ">${m.icon || '📍'}</div>`,
          className: '',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });
        marker = L.marker([m.lat, m.lng], { icon });
      }

      if (m.label) {
        (marker as L.Marker).bindPopup(`<b>${m.label}</b>`, { className: 'usalama-popup' });
      }
      marker.addTo(mapRef.current!);
      markersRef.current.set(m.id, marker);
    });
  }, [markers]);

  // Gestion des cercles
  useEffect(() => {
    if (!mapRef.current) return;
    circlesRef.current.forEach((c, id) => {
      if (!circles.find(circle => circle.id === id)) {
        mapRef.current!.removeLayer(c);
        circlesRef.current.delete(id);
      }
    });
    circles.forEach(c => {
      if (circlesRef.current.has(c.id)) return;
      const circle = L.circle([c.lat, c.lng], {
        radius: c.radius,
        color: c.color,
        fillColor: c.fillColor,
        fillOpacity: 0.25,
        weight: 2,
      }).addTo(mapRef.current!);
      if (c.label) circle.bindPopup(c.label);
      circlesRef.current.set(c.id, circle);
    });
  }, [circles]);

  // Gestion des polylines
  useEffect(() => {
    if (!mapRef.current) return;
    polylinesRef.current.forEach((p, id) => {
      if (!polylines.find(pl => pl.id === id)) {
        mapRef.current!.removeLayer(p);
        polylinesRef.current.delete(id);
      }
    });
    polylines.forEach(pl => {
      if (polylinesRef.current.has(pl.id)) {
        polylinesRef.current.get(pl.id)!.setLatLngs(pl.points);
        return;
      }
      const line = L.polyline(pl.points, {
        color: pl.color,
        weight: pl.weight || 4,
        dashArray: pl.dashArray,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(mapRef.current!);
      polylinesRef.current.set(pl.id, line);
    });
  }, [polylines]);

  // Marqueur utilisateur animé
  useEffect(() => {
    if (!mapRef.current) return;

    if (userMarkerRef.current) {
      mapRef.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (!userPosition) return;

    const userIcon = L.divIcon({
      html: `
        <div style="position:relative; width:40px; height:40px;">
          <div style="
            position:absolute; inset:0;
            background:rgba(59,130,246,0.3);
            border-radius:50%;
            animation: userPulse 2s ease-out infinite;
          "></div>
          <div style="
            position:absolute; top:50%; left:50%;
            transform: translate(-50%,-50%) rotate(${userHeading}deg);
            width:20px; height:20px;
            background:#3b82f6;
            border:3px solid white;
            border-radius:50%;
            box-shadow: 0 0 0 3px rgba(59,130,246,0.4);
          ">
            <div style="
              position:absolute; top:-8px; left:50%;
              transform:translateX(-50%);
              width:0; height:0;
              border-left:5px solid transparent;
              border-right:5px solid transparent;
              border-bottom:8px solid #3b82f6;
            "></div>
          </div>
        </div>
      `,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    userMarkerRef.current = L.marker(userPosition, { icon: userIcon, zIndexOffset: 1000 })
      .addTo(mapRef.current)
      .bindPopup('<b>📍 Votre position</b>');
  }, [userPosition, userHeading]);

  // Traîne de déplacement
  useEffect(() => {
    if (!mapRef.current) return;
    if (trailRef.current) {
      mapRef.current.removeLayer(trailRef.current);
      trailRef.current = null;
    }
    if (movementTrail.length < 2) return;
    trailRef.current = L.polyline(movementTrail, {
      color: '#60a5fa',
      weight: 3,
      opacity: 0.6,
      dashArray: '6, 4',
    }).addTo(mapRef.current);
  }, [movementTrail]);

  return (
    <>
      <style>{`
        @keyframes userPulse {
          0% { transform: scale(0.8); opacity: 0.9; }
          70% { transform: scale(2.5); opacity: 0; }
          100% { transform: scale(0.8); opacity: 0; }
        }
        .leaflet-popup-content-wrapper {
          background: #1e293b !important;
          color: white !important;
          border: 1px solid #334155 !important;
          border-radius: 12px !important;
        }
        .leaflet-popup-tip {
          background: #1e293b !important;
        }
        .leaflet-popup-close-button {
          color: #94a3b8 !important;
        }
        .leaflet-control-attribution {
          background: rgba(15,23,42,0.8) !important;
          color: #64748b !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a {
          color: #3b82f6 !important;
        }
      `}</style>
      <div ref={containerRef} className={`w-full h-full ${className}`} />
    </>
  );
};

export default KinshasaMap;
