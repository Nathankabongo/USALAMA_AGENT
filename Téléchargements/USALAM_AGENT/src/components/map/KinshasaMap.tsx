import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix des icônes Leaflet avec Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export type MapStyle = 'google-hybrid' | 'satellite' | 'standard' | 'topo' | 'dark';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: 'search' | 'erosion' | 'inondation' | 'pente' | 'hospital' | 'police' | 'safe' | 'danger' | 'user';
  label?: string;
  sublabel?: string;
  color?: string;
  icon?: string;
  severity?: string;
  meta?: Record<string, any>;
}

export interface MapCircle {
  id: string;
  lat: number;
  lng: number;
  radius: number;
  color: string;
  fillColor: string;
  fillOpacity?: number;
  weight?: number;
  dashArray?: string;
  label?: string;
}

export interface MapPolyline {
  id: string;
  points: [number, number][];
  color: string;
  weight?: number;
  dashArray?: string;
  opacity?: number;
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
  onMarkerClick?: (marker: MapMarker) => void;
  onMouseMove?: (lat: number, lng: number) => void;
  onViewChange?: (center: [number, number], zoom: number) => void;
  className?: string;
}

// Fournisseurs de tuiles Google Earth et cartographiques réels (100% sans filigrane)
const TILE_LAYERS: Record<MapStyle, { url: string; attribution: string; subdomains?: string[] }> = {
  // Google Earth Satellite Hybride (Imagerie réelle Google Earth + Noms des rues et communes)
  'google-hybrid': {
    url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '© Google Earth / Google Maps',
    subdomains: ['0', '1', '2', '3'],
  },
  // Vue Satellite ArcGIS World Imagery
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri, Maxar, Earthstar Geographics',
  },
  // Vue Plan des Rues & Quartiers (OpenStreetMap)
  standard: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
  },
  // Relief & Topographie Géologique (Google Terrain)
  topo: {
    url: 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    attribution: '© Google Terrain',
    subdomains: ['0', '1', '2', '3'],
  },
  // Mode Sombre
  dark: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
  },
};

const KinshasaMap = ({
  center = [-4.4071, 15.3252], // Coordonnées exactes de Kinshasa (centrées comme sur Google Earth)
  zoom = 13,
  mapStyle = 'google-hybrid',
  markers = [],
  circles = [],
  polylines = [],
  userPosition,
  userHeading = 0,
  movementTrail = [],
  onMapClick,
  onMarkerClick,
  onMouseMove,
  onViewChange,
  className = '',
}: KinshasaMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const circlesRef = useRef<Map<string, L.Circle>>(new Map());
  const polylinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);

  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  const onMouseMoveRef = useRef(onMouseMove);
  onMouseMoveRef.current = onMouseMove;

  const onViewChangeRef = useRef(onViewChange);
  onViewChangeRef.current = onViewChange;

  // Initialisation de la carte Leaflet
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: true,
      minZoom: 10,
      maxZoom: 20,
    });

    const activeTileKey = TILE_LAYERS[mapStyle] ? mapStyle : 'google-hybrid';
    const tile = TILE_LAYERS[activeTileKey];
    tileLayerRef.current = L.tileLayer(tile.url, {
      attribution: tile.attribution,
      maxZoom: 20,
      subdomains: tile.subdomains || 'abc',
    }).addTo(map);

    map.on('click', (e) => {
      onMapClickRef.current?.(e.latlng.lat, e.latlng.lng);
    });

    map.on('mousemove', (e) => {
      onMouseMoveRef.current?.(e.latlng.lat, e.latlng.lng);
    });

    map.on('moveend', () => {
      const c = map.getCenter();
      onViewChangeRef.current?.([c.lat, c.lng], map.getZoom());
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Changement de style (Google Satellite Hybride, Satellite Esri, Rues, Topo)
  useEffect(() => {
    if (!mapRef.current) return;
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    const activeTileKey = TILE_LAYERS[mapStyle] ? mapStyle : 'google-hybrid';
    const tile = TILE_LAYERS[activeTileKey];
    tileLayerRef.current = L.tileLayer(tile.url, {
      attribution: tile.attribution,
      maxZoom: 20,
      subdomains: tile.subdomains || 'abc',
    }).addTo(mapRef.current);
  }, [mapStyle]);

  // Centrage dynamique et animation fluide façon Google Earth
  useEffect(() => {
    if (!mapRef.current) return;
    const current = mapRef.current.getCenter();
    const currZoom = mapRef.current.getZoom();
    const dist = Math.hypot(current.lat - center[0], current.lng - center[1]);
    if (dist > 0.0001 || currZoom !== zoom) {
      mapRef.current.flyTo(center, zoom, { duration: 1.5, easeLinearity: 0.25 });
    }
  }, [center[0], center[1], zoom]);

  // Marqueurs géologiques, de recherche et urbains de Kinshasa
  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((marker, id) => {
      if (!markers.find(m => m.id === id)) {
        mapRef.current!.removeLayer(marker);
        markersRef.current.delete(id);
      }
    });

    markers.forEach(m => {
      const existing = markersRef.current.get(m.id);
      if (existing) {
        existing.setLatLng([m.lat, m.lng]);
        return;
      }

      let iconHtml = '';
      let iconSize: [number, number] = [38, 38];
      let iconAnchor: [number, number] = [19, 19];

      switch (m.type) {
        case 'search':
          // Marqueur spécifique pour le résultat de recherche utilisateur
          iconSize = [48, 54];
          iconAnchor = [24, 52];
          iconHtml = `
            <div class="relative flex flex-col items-center cursor-pointer">
              <div class="absolute bottom-0 w-8 h-2.5 bg-blue-500/50 rounded-full animate-ping"></div>
              <div class="w-10 h-10 rounded-full bg-blue-600 border-2 border-white shadow-2xl flex items-center justify-center text-white text-lg">
                📍
              </div>
              ${m.label ? `<div class="mt-1 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-slate-900/95 border border-blue-400 text-xs font-bold text-white shadow-xl">${m.label}</div>` : ''}
            </div>
          `;
          break;

        case 'erosion':
          // Tête d'érosion / ravinement géologique
          iconSize = [42, 42];
          iconAnchor = [21, 21];
          iconHtml = `
            <div class="relative flex items-center justify-center cursor-pointer">
              <div class="absolute inset-0 rounded-full bg-red-600/40 animate-ping"></div>
              <div class="relative w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow-lg text-white font-bold text-sm">
                ⚠️
              </div>
              ${m.label ? `<div class="absolute -bottom-4 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-900/90 border border-red-500/50 text-[10px] text-red-200 font-semibold shadow">${m.label}</div>` : ''}
            </div>
          `;
          break;

        case 'inondation':
          // Zone inondable / bassin hydrographique
          iconSize = [40, 40];
          iconAnchor = [20, 20];
          iconHtml = `
            <div class="relative flex items-center justify-center cursor-pointer">
              <div class="absolute inset-0 rounded-full bg-blue-500/30 animate-pulse"></div>
              <div class="relative w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-lg text-white font-bold text-sm">
                🌊
              </div>
              ${m.label ? `<div class="absolute -bottom-4 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-900/90 border border-blue-500/50 text-[10px] text-blue-200 font-semibold shadow">${m.label}</div>` : ''}
            </div>
          `;
          break;

        case 'pente':
          // Pente instable / colline
          iconSize = [38, 38];
          iconAnchor = [19, 19];
          iconHtml = `
            <div class="relative flex items-center justify-center cursor-pointer">
              <div class="relative w-7 h-7 rounded-full bg-amber-600 border-2 border-white flex items-center justify-center shadow-lg text-white text-xs">
                🏔️
              </div>
              ${m.label ? `<div class="absolute -bottom-4 whitespace-nowrap px-1 py-0.5 rounded bg-slate-900/90 border border-amber-500/50 text-[10px] text-amber-200 font-semibold shadow">${m.label}</div>` : ''}
            </div>
          `;
          break;

        case 'hospital':
        case 'safe':
          iconSize = [38, 38];
          iconAnchor = [19, 19];
          iconHtml = `
            <div class="relative flex items-center justify-center cursor-pointer">
              <div class="relative w-8 h-8 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center shadow-lg text-white text-xs">
                🏥
              </div>
              ${m.label ? `<div class="absolute -bottom-4 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-900/90 border border-emerald-500/50 text-[10px] text-emerald-200 font-semibold shadow">${m.label}</div>` : ''}
            </div>
          `;
          break;

        case 'police':
          iconSize = [38, 38];
          iconAnchor = [19, 19];
          iconHtml = `
            <div class="relative flex items-center justify-center cursor-pointer">
              <div class="relative w-8 h-8 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center shadow-lg text-white text-xs">
                👮
              </div>
              ${m.label ? `<div class="absolute -bottom-4 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-900/90 border border-indigo-500/50 text-[10px] text-indigo-200 font-semibold shadow">${m.label}</div>` : ''}
            </div>
          `;
          break;

        default:
          iconSize = [34, 34];
          iconAnchor = [17, 17];
          iconHtml = `
            <div class="relative flex items-center justify-center cursor-pointer">
              <div class="w-7 h-7 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-xs text-white shadow">
                ${m.icon || '📍'}
              </div>
              ${m.label ? `<div class="absolute -bottom-4 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-900/90 text-[10px] text-white font-medium">${m.label}</div>` : ''}
            </div>
          `;
      }

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'usalama-custom-marker',
        iconSize,
        iconAnchor,
      });

      const marker = L.marker([m.lat, m.lng], { icon: customIcon });

      marker.on('click', () => {
        if (onMarkerClick) {
          onMarkerClick(m);
        }
      });

      if (m.label || m.sublabel) {
        marker.bindPopup(`
          <div class="p-1 text-slate-100">
            <div class="font-bold text-sm text-blue-400">${m.label || ''}</div>
            ${m.sublabel ? `<div class="text-xs text-slate-300 mt-0.5">${m.sublabel}</div>` : ''}
            ${m.severity ? `<div class="text-[11px] font-semibold text-red-400 mt-1">Niveau de risque: ${m.severity}</div>` : ''}
          </div>
        `, { className: 'usalama-leaflet-popup' });
      }

      marker.addTo(mapRef.current!);
      markersRef.current.set(m.id, marker);
    });
  }, [markers]);

  // Cercles géologiques (zones d'érosion, périmètres inondables)
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
        fillOpacity: c.fillOpacity ?? 0.25,
        weight: c.weight ?? 2,
        dashArray: c.dashArray,
      }).addTo(mapRef.current!);
      if (c.label) circle.bindPopup(`<div class="text-xs font-semibold">${c.label}</div>`);
      circlesRef.current.set(c.id, circle);
    });
  }, [circles]);

  // Polylines (cours d'eau, fleuve, trajets)
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
        opacity: pl.opacity ?? 0.9,
      }).addTo(mapRef.current!);
      polylinesRef.current.set(pl.id, line);
    });
  }, [polylines]);

  // Position utilisateur
  useEffect(() => {
    if (!mapRef.current) return;
    if (userMarkerRef.current) {
      mapRef.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    if (!userPosition) return;

    const userIcon = L.divIcon({
      html: `
        <div class="relative w-8 h-8 flex items-center justify-center">
          <div class="absolute inset-0 rounded-full bg-blue-500/40 animate-ping"></div>
          <div class="relative w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-xl"></div>
        </div>
      `,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    userMarkerRef.current = L.marker(userPosition, { icon: userIcon, zIndexOffset: 1000 })
      .addTo(mapRef.current)
      .bindPopup('<b class="text-xs">Votre position GPS</b>');
  }, [userPosition]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      <div ref={containerRef} className={`w-full h-full ${className}`} />
    </div>
  );
};

export default KinshasaMap;
