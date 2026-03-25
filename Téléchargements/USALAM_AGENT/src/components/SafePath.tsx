import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  User
} from 'lucide-react';

interface SafePathProps {
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

const SafePath: React.FC<SafePathProps> = ({ onNavigate }) => {
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
  const trackingInterval = useRef<NodeJS.Timeout | null>(null);

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
    }
  ];

  // Locations de recherche simulées
  const searchLocations = [
    { lat: -4.3959, lng: 15.3213, name: 'Limete', address: 'Limete, Kinshasa' },
    { lat: -4.4419, lng: 15.2663, name: 'Gombe', address: 'Gombe, Kinshasa' },
    { lat: -4.325, lng: 15.322, name: 'Matete', address: 'Matete, Kinshasa' },
    { lat: -4.425, lng: 15.285, name: 'Kalamu', address: 'Kalamu, Kinshasa' },
    { lat: -4.385, lng: 15.245, name: 'Ngiri-Ngiri', address: 'Ngiri-Ngiri, Kinshasa' }
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
          setStartPoint({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: 'Position Actuelle',
            address: 'Gombe, Kinshasa'
          });
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
        }
      );
    }
  }, []);

  const calculateSafeRoute = (start: Location, end: Location): SafeRoute => {
    // Simuler le calcul d'itinéraire sécurisé
    const distance = calculateDistance(start, end);
    const duration = Math.round(distance * 3); // 3 minutes par km
    
    // Déterminer les zones rouges sur le chemin
    const routeRedZones = redZones.filter(zone => 
      isZoneOnRoute(zone, start, end)
    );
    
    // Calculer le score de sécurité (0-100)
    const safetyScore = Math.max(0, 100 - (routeRedZones.length * 15));
    
    return {
      id: Date.now().toString(),
      startPoint: start,
      endPoint: end,
      distance,
      duration,
      safetyScore,
      redZones: routeRedZones,
      alternativeRoutes: [],
      waypoints: []
    };
  };

  const calculateDistance = (point1: Location, point2: Location): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const isZoneOnRoute = (zone: RedZone, start: Location, end: Location): boolean => {
    // Simplification : vérifier si la zone est dans un rectangle englobant l'itinéraire
    const minLat = Math.min(start.lat, end.lat);
    const maxLat = Math.max(start.lat, end.lat);
    const minLng = Math.min(start.lng, end.lng);
    const maxLng = Math.max(start.lng, end.lng);
    
    return zone.coordinates.lat >= minLat - 0.01 && 
           zone.coordinates.lat <= maxLat + 0.01 &&
           zone.coordinates.lng >= minLng - 0.01 && 
           zone.coordinates.lng <= maxLng + 0.01;
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
  };

  const startPositionTracking = () => {
    trackingInterval.current = setInterval(() => {
      // Simuler la mise à jour de position
      const batteryLevel = Math.max(20, 100 - Math.random() * 30);
      const signalStrength = Math.random() > 0.3 ? 4 : Math.floor(Math.random() * 3);
      
      // Simuler une légère déviation
      const deviation = Math.random() * 250; // 0-250m
      const isOnRoute = deviation < 200;
      
      // Déclencher l'alerte si déviation > 200m
      if (deviation > 200 && !alertTriggered) {
        triggerSilentAlert();
      }
      
      setTrackingData({
        currentPosition: {
          lat: startPoint.lat + (Math.random() - 0.5) * 0.01,
          lng: startPoint.lng + (Math.random() - 0.5) * 0.01
        },
        batteryLevel,
        signalStrength,
        eta: new Date(Date.now() + 15 * 60 * 1000), // 15 min
        isOnRoute,
        deviationDistance: deviation,
        lastUpdate: new Date()
      });
    }, 5000); // Mise à jour toutes les 5 secondes
  };

  const triggerSilentAlert = () => {
    setAlertTriggered(true);
    
    // Envoyer une notification silencieuse aux contacts
    contacts.forEach(contact => {
      console.log(`🔔 Alerte silencieuse envoyée à ${contact.name}: Déviation de l'itinéraire`);
    });
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
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
      case 'critical': return 'bg-red-500/30 border-red-500 text-red-400';
      case 'high': return 'bg-orange-500/30 border-orange-500 text-orange-400';
      case 'medium': return 'bg-yellow-500/30 border-yellow-500 text-yellow-400';
      case 'low': return 'bg-green-500/30 border-green-500 text-green-400';
      default: return 'bg-slate-500/30 border-slate-500 text-slate-400';
    }
  };

  const getBatteryIcon = (level: number) => {
    if (level > 60) return <Battery className="w-4 h-4 text-green-400" />;
    if (level > 30) return <Battery className="w-4 h-4 text-yellow-400" />;
    return <Battery className="w-4 h-4 text-red-400" />;
  };

  const getSignalIcon = (strength: number) => {
    if (strength >= 3) return <Wifi className="w-4 h-4 text-green-400" />;
    if (strength >= 2) return <Wifi className="w-4 h-4 text-yellow-400" />;
    return <WifiOff className="w-4 h-4 text-red-400" />;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      {/* Header */}
      <div className="bg-slate-800/95 backdrop-blur-lg border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold">Trajet Sous Haute Surveillance</h1>
              <p className="text-xs text-slate-400">Safe Path - Navigation Sécurisée</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setDiscreetMode(!discreetMode)}
            className={`p-2 rounded-lg transition-colors ${
              discreetMode ? 'bg-slate-700' : 'bg-blue-600/20'
            }`}
          >
            {discreetMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </motion.button>
        </div>
      </div>

      {/* Étape 1: Configuration du trajet */}
      {currentStep === 'setup' && (
        <div className="p-4 space-y-6">
          {/* Point de départ */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-4">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold">Point de départ</h3>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-white font-medium">{startPoint.name}</div>
              <div className="text-sm text-slate-400">{startPoint.address}</div>
            </div>
          </div>

          {/* Destination */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Navigation className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold">Destination</h3>
            </div>
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
              <div className="mt-3 bg-slate-700/50 rounded-lg p-3">
                <div className="text-white font-medium">{endPoint.name}</div>
                <div className="text-sm text-slate-400">{endPoint.address}</div>
              </div>
            )}
          </div>

          {/* Contacts de suivi */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold">Réseau de suivi</h3>
            </div>
            <div className="space-y-2">
              {contacts.length === 0 ? (
                <p className="text-slate-400 text-sm">Aucun contact ajouté</p>
              ) : (
                contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold">{contact.name[0]}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium">{contact.name}</div>
                        <div className="text-xs text-slate-400">{contact.phone}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {contact.isNotified && (
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setContacts(contacts.filter(c => c.id !== contact.id))}
                        className="p-1 hover:bg-slate-600 rounded"
                      >
                        <X className="w-3 h-3" />
                      </motion.button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const newContact: ContactTracker = {
                  id: Date.now().toString(),
                  name: 'Papa',
                  phone: '+243818123456',
                  isNotified: false,
                  trackingLink: '',
                  lastSeen: new Date()
                };
                setContacts([...contacts, newContact]);
              }}
              className="mt-3 w-full bg-blue-600/20 border border-blue-600/50 rounded-lg py-2 text-blue-400 hover:bg-blue-600/30 transition-colors"
            >
              + Ajouter un contact
            </motion.button>
          </div>

          {/* Bouton de lancement */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startSafePath}
            disabled={!endPoint.name}
            className={`w-full py-4 rounded-lg font-semibold transition-all ${
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
        <div className="p-4 space-y-6">
          {/* Résumé du trajet */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Itinéraire proposé</h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSafetyColor(selectedRoute.safetyScore)}`}>
                Score sécurité: {selectedRoute.safetyScore}%
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Route className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-slate-400">Distance</span>
                </div>
                <div className="text-xl font-bold">{selectedRoute.distance.toFixed(1)} km</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-slate-400">Durée</span>
                </div>
                <div className="text-xl font-bold">{selectedRoute.duration} min</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-green-400" />
                <div>
                  <div className="font-medium">{selectedRoute.startPoint.name}</div>
                  <div className="text-sm text-slate-400">{selectedRoute.startPoint.address}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Navigation className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="font-medium">{selectedRoute.endPoint.name}</div>
                  <div className="text-sm text-slate-400">{selectedRoute.endPoint.address}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Zones rouges sur le trajet */}
          {selectedRoute.redZones.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="font-semibold">Zones à risque sur le trajet</h3>
              </div>
              <div className="space-y-3">
                {selectedRoute.redZones.map((zone) => (
                  <div key={zone.id} className={`border rounded-lg p-3 ${getSeverityColor(zone.severity)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{zone.name}</div>
                      <div className="text-xs px-2 py-1 rounded-full bg-black/20">
                        {zone.type}
                      </div>
                    </div>
                    <div className="text-sm opacity-80">{zone.description}</div>
                    <div className="text-xs opacity-60 mt-1">
                      Mis à jour: {Math.floor((Date.now() - zone.lastUpdated.getTime()) / (1000 * 60))} min
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startTracking}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-4 font-semibold transition-colors"
            >
              <div className="flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Lancer le suivi sous haute surveillance
              </div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentStep('setup')}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-3 transition-colors"
            >
              Modifier l'itinéraire
            </motion.button>
          </div>
        </div>
      )}

      {/* Étape 3: Suivi en temps réel */}
      {currentStep === 'tracking' && trackingData && (
        <div className="p-4 space-y-6">
          {/* Statut du suivi */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <h3 className="font-semibold">Suivi actif</h3>
              </div>
              <div className="flex items-center gap-2">
                {discreetMode ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-blue-400" />}
                <span className="text-sm text-slate-400">
                  {discreetMode ? 'Mode discret' : 'Mode normal'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Battery className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-slate-400">Batterie</span>
                </div>
                <div className="text-xl font-bold">{trackingData.batteryLevel.toFixed(0)}%</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-slate-400">Signal</span>
                </div>
                <div className="text-xl font-bold">{trackingData.signalStrength}/4</div>
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-400">Arrivée estimée</span>
              </div>
              <div className="text-xl font-bold">
                {trackingData.eta.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {!trackingData.isOnRoute && (
              <div className="mt-4 bg-red-600/20 border border-red-600/50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 font-medium">
                    Déviation de l'itinéraire ({trackingData.deviationDistance.toFixed(0)}m)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Lien de suivi */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Lien de suivi</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowTrackingLink(!showTrackingLink)}
                className="p-1 hover:bg-slate-700 rounded"
              >
                <Share2 className="w-4 h-4" />
              </motion.button>
            </div>
            
            {showTrackingLink && (
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-sm text-slate-400 break-all">{trackingLink}</div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigator.clipboard.writeText(trackingLink)}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  Copier le lien
                </motion.button>
              </div>
            )}
          </div>

          {/* Contacts notifiés */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold">Réseau de suivi</h3>
            </div>
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-sm">{contact.name}</span>
                  </div>
                  <span className="text-xs text-slate-400">Notifié</span>
                </div>
              ))}
            </div>
          </div>

          {/* Alertes */}
          {alertTriggered && (
            <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div>
                  <div className="font-medium text-red-400">Alerte silencieuse envoyée</div>
                  <div className="text-sm text-red-300 opacity-80">
                    Déviation importante de l'itinéraire détectée
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contrôles */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={stopTracking}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-3 font-semibold transition-colors"
            >
              <div className="flex items-center justify-center gap-2">
                <Square className="w-4 h-4" />
                Arrêter le suivi
              </div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setDiscreetMode(!discreetMode)}
              className={`px-4 py-3 rounded-lg transition-colors ${
                discreetMode ? 'bg-slate-700' : 'bg-blue-600/20'
              }`}
            >
              {discreetMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>
      )}

      {/* Étape 4: Trajet terminé */}
      {currentStep === 'completed' && (
        <div className="p-4 space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-6 text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Trajet terminé en toute sécurité</h3>
            <p className="text-slate-400 mb-4">
              Votre réseau de suivi a été notifié de votre arrivée
            </p>
            
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentStep('setup')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-semibold transition-colors"
              >
                Nouveau trajet sécurisé
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate?.('enhanced-home')}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-3 transition-colors"
              >
                Retour à l'accueil
              </motion.button>
            </div>
          </div>
        </div>
      )}

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

export default SafePath;
