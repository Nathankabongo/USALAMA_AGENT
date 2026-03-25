import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MapGL, { Source, Layer, Marker, NavigationControl, GeolocateControl } from 'react-map-gl';
import { 
  Shield, 
  Map, 
  Navigation, 
  AlertTriangle, 
  Users, 
  Battery, 
  Clock, 
  Eye, 
  EyeOff,
  Phone,
  Share2,
  MapPin,
  Route,
  Zap,
  Wifi,
  WifiOff,
  X,
  ChevronRight,
  Play,
  Pause,
  Square,
  RefreshCw,
  Search,
  Filter,
  Settings,
  Layers,
  User
} from 'lucide-react';
import * as turf from '@turf/turf';
import '@turf/helpers';

interface EnhancedMapScreenSafePathProps {
  onNavigate?: (screen: 'home' | 'enhanced-home' | 'contacts' | 'alerts' | 'profile' | 'guard' | 'evidence' | 'survival' | 'firstaid' | 'snig' | 'enhanced-map' | 'sos' | 'safepath') => void;
}

interface Location {
  lat: number;
  lng: number;
  name: string;
  address: string;
}

interface RedZone {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  radius: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'incident' | 'construction' | 'insecurity' | 'traffic';
  lastUpdated: Date;
  description: string;
}

interface SafeRoute {
  id: string;
  startPoint: Location;
  endPoint: Location;
  distance: number;
  duration: number;
  safetyScore: number;
  redZones: RedZone[];
  alternativeRoutes: SafeRoute[];
  waypoints: Location[];
  coordinates?: [number, number][];
}

interface TrackingData {
  currentPosition: { lat: number; lng: number };
  batteryLevel: number;
  signalStrength: number;
  eta: Date;
  isOnRoute: boolean;
  deviationDistance: number;
  lastUpdate: Date;
}

interface ContactTracker {
  id: string;
  name: string;
  phone: string;
  isNotified: boolean;
  trackingLink: string;
  lastSeen: Date;
}

const EnhancedMapScreenSafePath: React.FC<EnhancedMapScreenSafePathProps> = ({ onNavigate }) => {
  const [viewState, setViewState] = useState({
    longitude: 15.2663,
    latitude: -4.4419,
    zoom: 12
  });
  
  const [currentStep, setCurrentStep] = useState<'setup' | 'route' | 'tracking' | 'completed'>('setup');
  const [startPoint, setStartPoint] = useState<Location>({ lat: -4.4419, lng: 15.2663, name: 'Position Actuelle', address: 'Gombe, Kinshasa' });
  const [endPoint, setEndPoint] = useState<Location>({ lat: -4.4419, lng: 15.2663, name: '', address: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<SafeRoute | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [contacts, setContacts] = useState<ContactTracker[]>([]);
  const [showTrackingLink, setShowTrackingLink] = useState(false);
  const [trackingLink, setTrackingLink] = useState('');
  const [discreetMode, setDiscreetMode] = useState(false);
  const [alertTriggered, setAlertTriggered] = useState(false);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/dark-v11');
  const [showLayers, setShowLayers] = useState(false);
  const [showSafePath, setShowSafePath] = useState(false);
  const [userPosition, setUserPosition] = useState<{ lng: number; lat: number } | null>(null);
  
  const mapRef = useRef<any>(null);
  const trackingInterval = useRef<NodeJS.Timeout | null>(null);
  const deviationCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Token Mapbox (remplacer par votre token réel)
  const MAPBOX_TOKEN = 'pk.eyJ1IjoidXNhbGFtYSIsImEiOiJjbGZ2Z2p6b3owM3NlM2RwN2JqZmZ2b2xvIn0.0YxJqLx0XQz0YQoJ9QJ7Q';

  // Données simulées des zones rouges à Kinshasa
  const redZones: RedZone[] = [
    {
      id: '1',
      name: 'Avenue Kasa-Vubu',
      coordinates: { lat: -4.4419, lng: 15.2663 },
      radius: 300,
      severity: 'high',
      type: 'insecurity',
      lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
      description: 'Signalements fréquents d\'agressions nocturnes'
    },
    {
      id: '2',
      name: 'Marché Central',
      coordinates: { lat: -4.4439, lng: 15.2713 },
      radius: 200,
      severity: 'medium',
      type: 'traffic',
      lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000),
      description: 'Embouteillages fréquents, pickpockets signalés'
    },
    {
      id: '3',
      name: 'Quartier Limete',
      coordinates: { lat: -4.3959, lng: 15.3213 },
      radius: 400,
      severity: 'critical',
      type: 'incident',
      lastUpdated: new Date(Date.now() - 30 * 60 * 1000),
      description: 'Émeutes signalées, éviter la zone'
    },
    {
      id: '4',
      name: 'Boulevard du 30 Juin',
      coordinates: { lat: -4.4259, lng: 15.2813 },
      radius: 250,
      severity: 'low',
      type: 'traffic',
      lastUpdated: new Date(Date.now() - 45 * 60 * 1000),
      description: 'Travaux routiers, circulation perturbée'
    }
  ];

  // Locations de recherche simulées
  const searchLocations = [
    { lat: -4.3959, lng: 15.3213, name: 'Limete', address: 'Limete, Kinshasa' },
    { lat: -4.4419, lng: 15.2663, name: 'Gombe', address: 'Gombe, Kinshasa' },
    { lat: -4.325, lng: 15.322, name: 'Matete', address: 'Matete, Kinshasa' },
    { lat: -4.425, lng: 15.285, name: 'Kalamu', address: 'Kalamu, Kinshasa' },
    { lat: -4.385, lng: 15.245, name: 'Ngiri-Ngiri', address: 'Ngiri-Ngiri, Kinshasa' },
    { lat: -4.405, lng: 15.295, name: 'Kasa-Vubu', address: 'Kasa-Vubu, Kinshasa' }
  ];

  useEffect(() => {
    if (searchQuery.length > 2) {
      const results = searchLocations.filter(loc => 
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    // Obtenir la position actuelle
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setStartPoint({
            ...pos,
            name: 'Position Actuelle',
            address: 'Gombe, Kinshasa'
          });
          setUserPosition({ lng: pos.lng, lat: pos.lat });
          setViewState({
            longitude: pos.lng,
            latitude: pos.lat,
            zoom: 14
          });
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
        }
      );
    }
  }, []);

  const calculateSafeRoute = useCallback((start: Location, end: Location): SafeRoute => {
    const distance = calculateDistance(start, end);
    const duration = Math.round(distance * 3);
    
    // Déterminer les zones rouges sur le chemin
    const routeRedZones = redZones.filter(zone => 
      isZoneOnRoute(zone, start, end)
    );
    
    // Calculer le score de sécurité (0-100)
    const safetyScore = Math.max(0, 100 - (routeRedZones.length * 15));
    
    // Générer des coordonnées simulées pour l'itinéraire
    const coordinates: [number, number][] = [
      [start.lng, start.lat],
      [start.lng + (end.lng - start.lng) * 0.3, start.lat + (end.lat - start.lat) * 0.3],
      [start.lng + (end.lng - start.lng) * 0.6, start.lat + (end.lat - start.lat) * 0.6],
      [start.lng + (end.lng - start.lng) * 0.8, start.lat + (end.lat - start.lat) * 0.8],
      [end.lng, end.lat]
    ];
    
    return {
      id: Date.now().toString(),
      startPoint: start,
      endPoint: end,
      distance,
      duration,
      safetyScore,
      redZones: routeRedZones,
      alternativeRoutes: [],
      waypoints: [],
      coordinates
    };
  }, []);

  const calculateDistance = (point1: Location, point2: Location): number => {
    const R = 6371;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const isZoneOnRoute = (zone: RedZone, start: Location, end: Location): boolean => {
    const minLat = Math.min(start.lat, end.lat);
    const maxLat = Math.max(start.lat, end.lat);
    const minLng = Math.min(start.lng, end.lng);
    const maxLng = Math.max(start.lng, end.lng);
    
    return zone.coordinates.lat >= minLat - 0.01 && 
           zone.coordinates.lat <= maxLat + 0.01 &&
           zone.coordinates.lng >= minLng - 0.01 && 
           zone.coordinates.lng <= maxLng + 0.01;
  };

  const checkDeviation = useCallback(() => {
    if (!selectedRoute || !selectedRoute.coordinates || !trackingData) return;
    
    try {
      // Créer une ligne Turf pour l'itinéraire
      const routeLine = turf.lineString(selectedRoute.coordinates);
      
      // Créer un point Turf pour la position actuelle
      const currentPoint = turf.point([trackingData.currentPosition.lng, trackingData.currentPosition.lat]);
      
      // Calculer la distance du point à la ligne
      const distance = turf.pointToLineDistance(currentPoint, routeLine, { units: 'kilometers' });
      
      // Mettre à jour les données de suivi
      const isOnRoute = distance <= 0.2; // 200m de tolérance
      
      setTrackingData(prev => prev ? {
        ...prev,
        isOnRoute,
        deviationDistance: distance * 1000 // Convertir en mètres
      } : null);
      
      // Déclencher l'alerte si déviation > 200m
      if (distance > 0.2 && !alertTriggered) {
        triggerSilentAlert();
      }
      
    } catch (error) {
      console.error('Erreur lors du calcul de déviation:', error);
    }
  }, [selectedRoute, trackingData, alertTriggered]);

  const triggerSilentAlert = () => {
    setAlertTriggered(true);
    
    // Envoyer une notification silencieuse aux contacts
    contacts.forEach(contact => {
      console.log(`🔔 Alerte silencieuse envoyée à ${contact.name}: Déviation de l'itinéraire`);
    });
  };

  const handleLocationSelect = (location: Location) => {
    setEndPoint(location);
    setSearchQuery('');
    setSearchResults([]);
  };

  const startSafePath = () => {
    if (!endPoint.name) return;
    
    const route = calculateSafeRoute(startPoint, endPoint);
    setSelectedRoute(route);
    setCurrentStep('route');
    
    // Centrer la carte sur l'itinéraire
    if (route.coordinates && route.coordinates.length > 0) {
      const bounds = new (window as any).mapboxgl.LngLatBounds();
      route.coordinates.forEach(coord => bounds.extend(coord));
      
      if (mapRef.current) {
        mapRef.current.fitBounds(bounds, { padding: 50 });
      }
    }
  };

  const startTracking = () => {
    setIsTracking(true);
    setCurrentStep('tracking');
    
    // Générer le lien de suivi
    const link = `https://usalama.app/track/${Date.now()}`;
    setTrackingLink(link);
    
    // Notifier les contacts
    const updatedContacts = contacts.map(contact => ({
      ...contact,
      isNotified: true,
      trackingLink: link,
      lastSeen: new Date()
    }));
    setContacts(updatedContacts);
    
    // Démarrer le suivi de position
    startPositionTracking();
    
    // Démarrer la vérification de déviation
    deviationCheckInterval.current = setInterval(checkDeviation, 3000); // Vérifier toutes les 3 secondes
  };

  const startPositionTracking = () => {
    trackingInterval.current = setInterval(() => {
      // Simuler la mise à jour de position
      const batteryLevel = Math.max(20, 100 - Math.random() * 30);
      const signalStrength = Math.random() > 0.3 ? 4 : Math.floor(Math.random() * 3);
      
      // Simuler une légère déviation
      const deviation = Math.random() * 250; // 0-250m
      const isOnRoute = deviation < 200;
      
      // Générer une nouvelle position simulée
      const newPosition = {
        lat: startPoint.lat + (Math.random() - 0.5) * 0.01,
        lng: startPoint.lng + (Math.random() - 0.5) * 0.01
      };
      
      setTrackingData({
        currentPosition: newPosition,
        batteryLevel,
        signalStrength,
        eta: new Date(Date.now() + 15 * 60 * 1000),
        isOnRoute,
        deviationDistance: deviation,
        lastUpdate: new Date()
      });
      
      // Mettre à jour la position sur la carte
      if (userPosition) {
        setUserPosition({ lng: newPosition.lng, lat: newPosition.lat });
      }
    }, 5000);
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
    }
    if (deviationCheckInterval.current) {
      clearInterval(deviationCheckInterval.current);
    }
    setCurrentStep('completed');
  };

  const getSafetyColor = (score: number) => {
    if (score >= 80) return 'text-green-400 bg-green-600/20';
    if (score >= 60) return 'text-yellow-400 bg-yellow-600/20';
    if (score >= 40) return 'text-orange-400 bg-orange-600/20';
    return 'text-red-400 bg-red-600/20';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'rgba(239, 68, 68, 0.3)'; // red-500/30
      case 'high': return 'rgba(251, 146, 60, 0.3)'; // orange-500/30
      case 'medium': return 'rgba(250, 204, 21, 0.3)'; // yellow-500/30
      case 'low': return 'rgba(34, 197, 94, 0.3)'; // green-500/30
      default: return 'rgba(148, 163, 184, 0.3)'; // slate-500/30
    }
  };

  // Couche pour les zones rouges
  const redZoneLayer = {
    id: 'red-zones',
    type: 'fill' as const,
    paint: {
      'fill-color': [
        'match',
        ['get', 'severity'],
        'critical', 'rgba(239, 68, 68, 0.4)',
        'high', 'rgba(251, 146, 60, 0.4)',
        'medium', 'rgba(250, 204, 21, 0.4)',
        'low', 'rgba(34, 197, 94, 0.4)',
        'rgba(148, 163, 184, 0.3)'
      ],
      'fill-outline-color': [
        'match',
        ['get', 'severity'],
        'critical', 'rgba(239, 68, 68, 0.8)',
        'high', 'rgba(251, 146, 60, 0.8)',
        'medium', 'rgba(250, 204, 21, 0.8)',
        'low', 'rgba(34, 197, 94, 0.8)',
        'rgba(148, 163, 184, 0.8)'
      ]
    }
  };

  // Couche pour l'itinéraire
  const routeLayer = {
    id: 'route',
    type: 'line' as const,
    paint: {
      'line-color': '#3B82F6', // blue-500
      'line-width': 4,
      'line-opacity': 0.8
    }
  };

  // Générer les features pour les zones rouges
  const redZoneFeatures = redZones.map(zone => ({
    type: 'Feature' as const,
    properties: {
      id: zone.id,
      name: zone.name,
      severity: zone.severity,
      type: zone.type,
      description: zone.description
    },
    geometry: {
      type: 'Point' as const,
      coordinates: [zone.coordinates.lng, zone.coordinates.lat]
    }
  }));

  // Générer les features pour les cercles de zones rouges
  const redZoneCircleFeatures = redZones.map(zone => {
    const center = [zone.coordinates.lng, zone.coordinates.lat];
    const options = { steps: 64, units: 'meters' as const };
    const circle = turf.circle(center, zone.radius, options);
    
    return {
      ...circle,
      properties: {
        id: zone.id,
        name: zone.name,
        severity: zone.severity,
        type: zone.type,
        description: zone.description
      }
    };
  });

  // Feature pour l'itinéraire
  const routeFeature = selectedRoute?.coordinates ? {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: selectedRoute.coordinates
    }
  } : null;

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      {/* Header */}
      <div className="bg-slate-800/95 backdrop-blur-lg border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold">Carte de Sécurité</h1>
              <p className="text-xs text-slate-400">Safe Path - Navigation Intelligente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSafePath(!showSafePath)}
              className={`p-2 rounded-lg transition-colors ${
                showSafePath ? 'bg-blue-600' : 'bg-slate-700'
              }`}
            >
              <Route className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLayers(!showLayers)}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <Layers className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Safe Path Interface */}
      <AnimatePresence>
        {showSafePath && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-800/95 backdrop-blur-lg border-b border-slate-700"
          >
            {/* Étape 1: Configuration du trajet */}
            {currentStep === 'setup' && (
              <div className="p-4 space-y-4">
                {/* Destination */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher une destination..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  
                  {/* Résultats de recherche */}
                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full mt-2 w-full bg-slate-800 rounded-lg border border-slate-700 z-50 max-h-60 overflow-y-auto"
                      >
                        {searchResults.map((location) => (
                          <motion.button
                            key={`${location.lat}-${location.lng}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleLocationSelect(location)}
                            className="w-full text-left p-3 hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0"
                          >
                            <div className="font-medium text-white">{location.name}</div>
                            <div className="text-sm text-slate-400">{location.address}</div>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {endPoint.name && (
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-white font-medium">{endPoint.name}</div>
                    <div className="text-sm text-slate-400">{endPoint.address}</div>
                  </div>
                )}

                {/* Bouton de lancement */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startSafePath}
                  disabled={!endPoint.name}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    endPoint.name 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Route className="w-5 h-5" />
                    Calculer l'itinéraire sécurisé
                  </div>
                </motion.button>
              </div>
            )}

            {/* Étape 2: Affichage de l'itinéraire */}
            {currentStep === 'route' && selectedRoute && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Itinéraire proposé</div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSafetyColor(selectedRoute.safetyScore)}`}>
                      Score sécurité: {selectedRoute.safetyScore}%
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="text-center">
                      <div className="text-xl font-bold">{selectedRoute.distance.toFixed(1)} km</div>
                      <div className="text-xs text-slate-400">Distance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold">{selectedRoute.duration} min</div>
                      <div className="text-xs text-slate-400">Durée</div>
                    </div>
                  </div>
                </div>

                {selectedRoute.redZones.length > 0 && (
                  <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 font-medium">
                        {selectedRoute.redZones.length} zone(s) à risque sur le trajet
                      </span>
                    </div>
                    <div className="text-sm text-red-300 opacity-80">
                      Elles sont affichées en rouge sur la carte
                    </div>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startTracking}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-semibold transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Play className="w-5 h-5" />
                    Lancer le suivi sous haute surveillance
                  </div>
                </motion.button>
              </div>
            )}

            {/* Étape 3: Suivi en temps réel */}
            {currentStep === 'tracking' && trackingData && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                    <span className="font-medium">Suivi actif</span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Battery className="w-4 h-4 text-green-400" />
                      <span>{trackingData.batteryLevel.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Wifi className="w-4 h-4 text-green-400" />
                      <span>{trackingData.signalStrength}/4</span>
                    </div>
                  </div>
                </div>

                {!trackingData.isOnRoute && (
                  <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 font-medium">
                        Déviation: {trackingData.deviationDistance.toFixed(0)}m
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={stopTracking}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 font-semibold transition-colors"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Square className="w-4 h-4" />
                      Arrêter
                    </div>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDiscreetMode(!discreetMode)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      discreetMode ? 'bg-slate-700' : 'bg-blue-600/20'
                    }`}
                  >
                    {discreetMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Carte */}
      <div className="relative h-96 sm:h-[500px]">
        <MapGL
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={mapStyle}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Contrôles de navigation */}
          <NavigationControl position="top-right" />
          <GeolocateControl
            position="top-left"
            onGeolocate={(position) => {
              setUserPosition({ lng: position.coords.longitude, lat: position.coords.latitude });
            }}
          />

          {/* Zones rouges */}
          <Source
            id="red-zones-source"
            type="geojson"
            data={{
              type: 'FeatureCollection',
              features: redZoneCircleFeatures
            }}
          >
            <Layer {...redZoneLayer} />
          </Source>

          {/* Marqueurs des zones rouges */}
          {redZones.map((zone) => (
            <Marker
              key={zone.id}
              longitude={zone.coordinates.lng}
              latitude={zone.coordinates.lat}
              anchor="center"
            >
              <div className="relative">
                <div className={`w-8 h-8 rounded-full border-2 ${
                  zone.severity === 'critical' ? 'bg-red-500 border-red-600' :
                  zone.severity === 'high' ? 'bg-orange-500 border-orange-600' :
                  zone.severity === 'medium' ? 'bg-yellow-500 border-yellow-600' :
                  'bg-green-500 border-green-600'
                } animate-pulse`} />
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 rounded px-2 py-1 text-xs whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                  {zone.name}
                </div>
              </div>
            </Marker>
          ))}

          {/* Itinéraire */}
          {routeFeature && (
            <Source
              id="route-source"
              type="geojson"
              data={routeFeature}
            >
              <Layer {...routeLayer} />
            </Source>
          )}

          {/* Position utilisateur */}
          {userPosition && (
            <Marker
              longitude={userPosition.lng}
              latitude={userPosition.lat}
              anchor="center"
            >
              <div className="relative">
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
                {isTracking && (
                  <div className="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full animate-ping" />
                )}
              </div>
            </Marker>
          )}

          {/* Point de départ */}
          <Marker
            longitude={startPoint.lng}
            latitude={startPoint.lat}
            anchor="center"
          >
            <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          </Marker>

          {/* Destination */}
          {endPoint.name && (
            <Marker
              longitude={endPoint.lng}
              latitude={endPoint.lat}
              anchor="center"
            >
              <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <Navigation className="w-3 h-3 text-white" />
              </div>
            </Marker>
          )}
        </MapGL>

        {/* Légende des couches */}
        <AnimatePresence>
          {showLayers && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute top-4 left-4 bg-slate-800/95 backdrop-blur-lg rounded-lg border border-slate-700 p-3 z-10"
            >
              <h4 className="font-semibold mb-2">Légende</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span>Position actuelle</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span>Destination</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500/50 rounded-full" />
                  <span>Zone critique</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500/50 rounded-full" />
                  <span>Zone à risque</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500/50 rounded-full" />
                  <span>Zone modérée</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500" style={{ height: '2px' }} />
                  <span>Itinéraire</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions Rapides */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate?.('sos')}
            className="bg-red-600 hover:bg-red-700 text-white rounded-lg p-3 flex flex-col items-center gap-2 transition-colors"
          >
            <Phone className="w-5 h-5" />
            <span className="text-xs">SOS</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSafePath(!showSafePath)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 flex flex-col items-center gap-2 transition-colors"
          >
            <Route className="w-5 h-5" />
            <span className="text-xs">Safe Path</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMapStyle(mapStyle === 'mapbox://styles/mapbox/dark-v11' ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11')}
            className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg p-3 flex flex-col items-center gap-2 transition-colors"
          >
            <Map className="w-5 h-5" />
            <span className="text-xs">Style</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLayers(!showLayers)}
            className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg p-3 flex flex-col items-center gap-2 transition-colors"
          >
            <Layers className="w-5 h-5" />
            <span className="text-xs">Couches</span>
          </motion.button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-lg border-t border-slate-700 z-40">
        <div className="flex items-center justify-around py-2">
          {[
            { id: 'enhanced-home', label: 'Accueil', icon: <Shield className="w-5 h-5" /> },
            { id: 'enhanced-map', label: 'Carte', icon: <Map className="w-5 h-5" /> },
            { id: 'sos', label: 'SOS', icon: <Phone className="w-5 h-5" /> },
            { id: 'alerts', label: 'Alertes', icon: <Bell className="w-5 h-5" /> },
            { id: 'profile', label: 'Profil', icon: <User className="w-5 h-5" /> }
          ].map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (item.id === 'enhanced-home') {
                  onNavigate?.('enhanced-home');
                } else if (item.id === 'enhanced-map') {
                  onNavigate?.('enhanced-map');
                } else if (item.id === 'sos') {
                  onNavigate?.('sos');
                } else if (item.id === 'alerts') {
                  onNavigate?.('alerts');
                } else if (item.id === 'profile') {
                  onNavigate?.('profile');
                }
              }}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnhancedMapScreenSafePath;
