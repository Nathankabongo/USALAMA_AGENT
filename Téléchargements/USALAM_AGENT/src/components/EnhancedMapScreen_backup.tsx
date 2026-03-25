import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map, 
  MapPin, 
  Navigation, 
  Phone, 
  Heart, 
  Shield, 
  AlertTriangle,
  Clock,
  Users,
  Building,
  Cloud,
  Wind,
  Eye,
  Volume2,
  VolumeX,
  Activity,
  Zap,
  Thermometer,
  Car,
  TrafficCone,
  Ambulance,
  Hospital,
  X,
  ChevronDown,
  Info,
  ExternalLink,
  Bell,
  User,
  Search,
  Navigation2,
  Route,
  Home,
  ShieldCheck,
  Radio,
  Wifi,
  Battery,
  Compass,
  MapIcon,
  Locate,
  Crosshair,
  Target,
  ArrowRight,
  Clock3,
  Calendar,
  Layers,
  Satellite
} from 'lucide-react';

interface EnhancedMapScreenProps {
  onNavigate?: (screen: 'home' | 'enhanced-home' | 'contacts' | 'alerts' | 'profile' | 'guard' | 'evidence' | 'survival' | 'firstaid' | 'snig' | 'enhanced-map' | 'sos') => void;
}

interface LocationPoint {
  id: string;
  name: string;
  type: 'hospital' | 'police' | 'fire' | 'pharmacy' | 'school' | 'bank' | 'market' | 'gas_station';
  address: string;
  commune: string;
  avenue: string;
  coordinates: { lat: number; lng: number };
  distance?: number;
  phone?: string;
  hours?: string;
  rating?: number;
  verified?: boolean;
}

interface RouteInfo {
  distance: string;
  duration: string;
  steps: {
    instruction: string;
    distance: string;
    direction: 'straight' | 'left' | 'right' | 'slight_left' | 'slight_right';
  }[];
}

interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: Date;
}

const EnhancedMapScreen = ({ onNavigate }: EnhancedMapScreenProps) => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationPoint | null>(null);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [mapType, setMapType] = useState<'street' | 'satellite' | 'terrain'>('street');
  const [showLayers, setShowLayers] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState('all');
  const [isTracking, setIsTracking] = useState(false);
  const [compassDirection, setCompassDirection] = useState(0);
  const [mapCenter, setMapCenter] = useState({ lat: -4.4419, lng: 15.2663 }); // Kinshasa
  const [zoom, setZoom] = useState(14);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationPoint[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Points d'intérêt stratégiques à Kinshasa
  const strategicPoints: LocationPoint[] = [
    // Hôpitaux
    {
      id: '1',
      name: 'Hôpital Général de Kinshasa',
      type: 'hospital',
      address: 'Avenue de la Démocratie',
      commune: 'Lingwala',
      avenue: 'Avenue de la Démocratie',
      coordinates: { lat: -4.3876, lng: 15.3428 },
      phone: '+243 12 34 56 78',
      hours: '24h/24',
      rating: 4.5,
      verified: true
    },
    {
      id: '2',
      name: 'Clinique Ngaliema',
      type: 'hospital',
      address: 'Avenue Ngaliema',
      commune: 'Ngaliema',
      avenue: 'Avenue Ngaliema',
      coordinates: { lat: -4.3789, lng: 15.2663 },
      phone: '+243 12 45 67 89',
      hours: '07:00 - 22:00',
      rating: 4.2,
      verified: true
    },
    {
      id: '3',
      name: 'Hôpital du Cinquantenaire',
      type: 'hospital',
      address: 'Avenue de la Justice',
      commune: 'Gombe',
      avenue: 'Avenue de la Justice',
      coordinates: { lat: -4.3019, lng: 15.2683 },
      phone: '+243 12 78 90 12',
      hours: '24h/24',
      rating: 4.7,
      verified: true
    },
    // Commissariats
    {
      id: '4',
      name: 'Commissariat Central de Kinshasa',
      type: 'police',
      address: 'Avenue Colonel Ebeya',
      commune: 'Kasa-Vubu',
      avenue: 'Avenue Colonel Ebeya',
      coordinates: { lat: -4.4389, lng: 15.2763 },
      phone: '+243 12 23 45 67',
      hours: '24h/24',
      rating: 3.8,
      verified: true
    },
    {
      id: '5',
      name: 'Commissariat de Gombe',
      type: 'police',
      address: 'Avenue des Aviateurs',
      commune: 'Gombe',
      avenue: 'Avenue des Aviateurs',
      coordinates: { lat: -4.3019, lng: 15.2683 },
      phone: '+243 12 34 56 78',
      hours: '24h/24',
      rating: 4.1,
      verified: true
    },
    {
      id: '6',
      name: 'Poste de Police de Limete',
      type: 'police',
      address: 'Avenue Limete',
      commune: 'Limete',
      avenue: 'Avenue Limete',
      coordinates: { lat: -4.4019, lng: 15.2963 },
      phone: '+243 12 45 67 89',
      hours: '24h/24',
      rating: 3.9,
      verified: true
    },
    // Pharmacies
    {
      id: '7',
      name: 'Pharmacie du Peuple',
      type: 'pharmacy',
      address: 'Avenue Kasa-Vubu',
      commune: 'Kasa-Vubu',
      avenue: 'Avenue Kasa-Vubu',
      coordinates: { lat: -4.4389, lng: 15.2763 },
      phone: '+243 12 89 01 23',
      hours: '08:00 - 20:00',
      rating: 4.3,
      verified: true
    },
    {
      id: '8',
      name: 'Pharmacie La Source',
      type: 'pharmacy',
      address: 'Avenue de la Paix',
      commune: 'Gombe',
      avenue: 'Avenue de la Paix',
      coordinates: { lat: -4.3019, lng: 15.2683 },
      phone: '+243 12 34 56 78',
      hours: '07:00 - 22:00',
      rating: 4.6,
      verified: true
    },
    // Écoles
    {
      id: '9',
      name: 'Université de Kinshasa',
      type: 'school',
      address: 'Avenue de la Université',
      commune: 'Lemba',
      avenue: 'Avenue de la Université',
      coordinates: { lat: -4.4199, lng: 15.2863 },
      phone: '+243 12 23 45 67',
      hours: '07:00 - 18:00',
      rating: 4.4,
      verified: true
    },
    // Banques
    {
      id: '10',
      name: 'BCI Gombe',
      type: 'bank',
      address: 'Avenue des Aviateurs',
      commune: 'Gombe',
      avenue: 'Avenue des Aviateurs',
      coordinates: { lat: -4.3019, lng: 15.2683 },
      phone: '+243 12 34 56 78',
      hours: '08:00 - 15:00',
      rating: 3.7,
      verified: true
    }
  ];

  useEffect(() => {
    // Obtenir la position de l'utilisateur
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: UserLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date()
          };
          setUserLocation(location);
          setMapCenter({ lat: location.lat, lng: location.lng });
          calculateDistances(location);
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          // Position par défaut (Centre de Kinshasa)
          const defaultLocation: UserLocation = {
            lat: -4.4419,
            lng: 15.2663,
            accuracy: 1000,
            timestamp: new Date()
          };
          setUserLocation(defaultLocation);
        }
      );

      // Suivi de position en temps réel
      if (isTracking) {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const location: UserLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date()
            };
            setUserLocation(location);
            setMapCenter({ lat: location.lat, lng: location.lng });
            calculateDistances(location);
          },
          (error) => console.error('Erreur de suivi:', error),
          { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
      }
    }

    // Orientation de la boussole
    if ('DeviceOrientationEvent' in window) {
      const handleOrientation = (event: any) => {
        setCompassDirection(event.alpha || 0);
      };
      window.addEventListener('deviceorientation', handleOrientation);
      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }
  }, [isTracking]);

  const calculateDistances = (userLoc: UserLocation) => {
    const updatedPoints = strategicPoints.map(point => {
      const distance = calculateDistance(
        userLoc.lat, userLoc.lng,
        point.coordinates.lat, point.coordinates.lng
      );
      return { ...point, distance };
    });
    setSearchResults(updatedPoints);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      const filtered = strategicPoints.filter(point => 
        point.name.toLowerCase().includes(query.toLowerCase()) ||
        point.commune.toLowerCase().includes(query.toLowerCase()) ||
        point.avenue.toLowerCase().includes(query.toLowerCase()) ||
        point.type.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const handleLocationSelect = (location: LocationPoint) => {
    setSelectedLocation(location);
    setShowSearchResults(false);
    setSearchQuery(location.name);
    setMapCenter(location.coordinates);
    calculateRoute(location);
  };

  const calculateRoute = (destination: LocationPoint) => {
    if (!userLocation) return;

    setIsLoading(true);
    // Simuler le calcul d'itinéraire
    setTimeout(() => {
      const distance = calculateDistance(
        userLocation.lat, userLocation.lng,
        destination.coordinates.lat, destination.coordinates.lng
      );

      const routeInfo: RouteInfo = {
        distance: `${distance.toFixed(1)} km`,
        duration: `${Math.ceil(distance * 3)} min`, // Estimation: 3 min/km
        steps: [
          {
            instruction: `Partez de votre position actuelle`,
            distance: '0 m',
            direction: 'straight'
          },
          {
            instruction: `Dirigez-vous vers ${destination.avenue}`,
            distance: `${(distance * 500).toFixed(0)} m`,
            direction: 'right'
          },
          {
            instruction: `Continuez sur ${destination.avenue} jusqu'à ${destination.name}`,
            distance: `${(distance * 1000 - 500).toFixed(0)} m`,
            direction: 'straight'
          },
          {
            instruction: `Vous êtes arrivé à ${destination.name}`,
            distance: '0 m',
            direction: 'straight'
          }
        ]
      };

      setRoute(routeInfo);
      setIsLoading(false);
    }, 1500);
  };

  const centerOnUser = () => {
    if (userLocation) {
      setMapCenter({ lat: userLocation.lat, lng: userLocation.lng });
      setZoom(16);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'hospital': return <Hospital className="w-4 h-4 text-red-500" />;
      case 'police': return <Shield className="w-4 h-4 text-blue-500" />;
      case 'pharmacy': return <Heart className="w-4 h-4 text-green-500" />;
      case 'school': return <Building className="w-4 h-4 text-purple-500" />;
      case 'bank': return <Building className="w-4 h-4 text-yellow-500" />;
      case 'market': return <Building className="w-4 h-4 text-orange-500" />;
      case 'gas_station': return <Car className="w-4 h-4 text-cyan-500" />;
      default: return <MapPin className="w-4 h-4 text-slate-500" />;
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'left': return <ArrowRight className="w-4 h-4 rotate-180" />;
      case 'right': return <ArrowRight className="w-4 h-4" />;
      case 'slight_left': return <ArrowRight className="w-4 h-4 rotate-135" />;
      case 'slight_right': return <ArrowRight className="w-4 h-4 rotate-45" />;
      default: return <ArrowRight className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-slate-800/95 backdrop-blur-lg border-b border-slate-700 p-3 sm:p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Map className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold">Carte de Sécurité</h1>
              <p className="text-xs text-slate-400 hidden sm:block">Navigation et Points Stratégiques</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLayers(!showLayers)}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMapType(mapType === 'street' ? 'satellite' : mapType === 'satellite' ? 'terrain' : 'street')}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              {mapType === 'street' ? <MapIcon className="w-4 h-4 sm:w-5 sm:h-5" /> :
               mapType === 'satellite' ? <Satellite className="w-4 h-4 sm:w-5 sm:h-5" /> :
               <Map className="w-4 h-4 sm:w-5 sm:h-5" />}
            </motion.button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un lieu, une avenue, une commune..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm sm:text-base"
          />
          
          {/* Résultats de recherche */}
          <AnimatePresence>
            {showSearchResults && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50"
              >
                {searchResults.map((result) => (
                  <motion.button
                    key={result.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleLocationSelect(result)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-slate-700 transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                      {getIconForType(result.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{result.name}</div>
                      <div className="text-xs text-slate-400">
                        {result.avenue}, {result.commune}
                        {result.distance && ` • ${result.distance.toFixed(1)} km`}
                      </div>
                    </div>
                    {result.verified && (
                      <ShieldCheck className="w-4 h-4 text-green-400" />
                    )}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Zone de la carte */}
      <div className="h-64 sm:h-80 lg:h-96 relative bg-slate-800">
        {/* Simulation de carte */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900">
          {/* Grille de la carte */}
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={`h-${i}`} className="absolute w-full border-t border-slate-600" style={{ top: `${i * 5}%` }} />
            ))}
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={`v-${i}`} className="absolute h-full border-l border-slate-600" style={{ left: `${i * 5}%` }} />
            ))}
          </div>

          {/* Position de l'utilisateur */}
          {userLocation && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) rotate(${compassDirection}deg)`
              }}
            >
              <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping" />
            </motion.div>
          )}

          {/* Points d'intérêt */}
          {strategicPoints
            .filter(point => selectedLayer === 'all' || point.type === selectedLayer)
            .map((point) => (
            <motion.button
              key={point.id}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.8 }}
              onClick={() => handleLocationSelect(point)}
              className="absolute w-6 h-6 bg-white rounded-lg shadow-lg flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${50 + (point.coordinates.lng - 15.2663) * 10}%`,
                top: `${50 - (point.coordinates.lat + 4.4419) * 10}%`
              }}
            >
              {getIconForType(point.type)}
            </motion.button>
          ))}

          {/* Itinéraire */}
          {route && userLocation && selectedLocation && (
            <motion.svg
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              className="absolute inset-0 w-full h-full pointer-events-none"
            >
              <motion.path
                d={`M 50% 50% L ${50 + (selectedLocation.coordinates.lng - 15.2663) * 10}% ${50 - (selectedLocation.coordinates.lat + 4.4419) * 10}%`}
                stroke="#3B82F6"
                strokeWidth="3"
                fill="none"
                strokeDasharray="5,5"
                className="animate-pulse"
              />
            </motion.svg>
          )}
        </div>

        {/* Contrôles de la carte */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setZoom(Math.min(zoom + 1, 20))}
            className="p-2 bg-slate-800/90 backdrop-blur border border-slate-700 rounded-lg shadow-lg"
          >
            <span className="text-white font-bold">+</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setZoom(Math.max(zoom - 1, 1))}
            className="p-2 bg-slate-800/90 backdrop-blur border border-slate-700 rounded-lg shadow-lg"
          >
            <span className="text-white font-bold">-</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={centerOnUser}
            className="p-2 bg-blue-600/90 backdrop-blur border border-blue-500 rounded-lg shadow-lg"
          >
            <Locate className="w-4 h-4 text-white" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsTracking(!isTracking)}
            className={`p-2 backdrop-blur border rounded-lg shadow-lg ${
              isTracking 
                ? 'bg-green-600/90 border-green-500' 
                : 'bg-slate-800/90 border-slate-700'
            }`}
          >
            <Navigation className="w-4 h-4 text-white" />
          </motion.button>
        </div>

        {/* Informations de localisation */}
        {userLocation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur border border-slate-700 rounded-lg p-3 shadow-lg max-w-xs"
          >
            <div className="flex items-center gap-2 mb-2">
              <Compass className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">Votre Position</span>
            </div>
            <div className="text-xs text-slate-300 space-y-1">
              <div>Lat: {userLocation.lat.toFixed(6)}</div>
              <div>Lng: {userLocation.lng.toFixed(6)}</div>
              <div>Précision: ±{userLocation.accuracy.toFixed(0)}m</div>
              <div>Direction: {compassDirection.toFixed(0)}°</div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Section d'informations supplémentaires */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
        {/* Statistiques de la zone */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Statistiques de la Zone
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">12</div>
              <div className="text-xs text-slate-400">Hôpitaux</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">8</div>
              <div className="text-xs text-slate-400">Commissariats</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">15</div>
              <div className="text-xs text-slate-400">Pharmacies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">6</div>
              <div className="text-xs text-slate-400">Écoles</div>
            </div>
          </div>
        </div>

        {/* Points les plus proches */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-400" />
            Points les Plus Proches
          </h3>
          <div className="space-y-2">
            {strategicPoints
              .filter(point => selectedLayer === 'all' || point.type === selectedLayer)
              .slice(0, 5)
              .map((point) => (
              <motion.button
                key={point.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleLocationSelect(point)}
                className="w-full p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                      {getIconForType(point.type)}
                    </div>
                    <div>
                      <div className="font-medium text-white">{point.name}</div>
                      <div className="text-xs text-slate-400">
                        {point.avenue}, {point.commune}
                        {point.distance && ` • ${point.distance.toFixed(1)} km`}
                      </div>
                    </div>
                  </div>
                  {point.verified && (
                    <ShieldCheck className="w-4 h-4 text-green-400" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Informations de sécurité */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-orange-400" />
            Informations de Sécurité
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
              <span className="text-slate-300">Niveau de sécurité</span>
              <span className="text-yellow-400 font-medium">Moyen</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
              <span className="text-slate-300">Dernière alerte</span>
              <span className="text-slate-400">Il y a 2 heures</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
              <span className="text-slate-300">Zone à risque</span>
              <span className="text-red-400 font-medium">Limete</span>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            Actions Rapides
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate?.('sos')}
              className="p-3 bg-red-600 hover:bg-red-700 rounded-lg flex flex-col items-center gap-1"
            >
              <AlertTriangle className="w-5 h-5" />
              <span className="text-xs">SOS</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate?.('alerts')}
              className="p-3 bg-orange-600 hover:bg-orange-700 rounded-lg flex flex-col items-center gap-1"
            >
              <Bell className="w-5 h-5" />
              <span className="text-xs">Alertes</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => centerOnUser()}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg flex flex-col items-center gap-1"
            >
              <Locate className="w-5 h-5" />
              <span className="text-xs">Localiser</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLayers(!showLayers)}
              className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg flex flex-col items-center gap-1"
            >
              <Layers className="w-5 h-5" />
              <span className="text-xs">Couches</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Panneau d'informations */}
      <AnimatePresence>
        {selectedLocation && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute bottom-24 right-4 bg-slate-800/95 backdrop-blur border border-slate-700 rounded-lg p-4 shadow-lg max-w-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                  {getIconForType(selectedLocation.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{selectedLocation.name}</h3>
                  <p className="text-xs text-slate-400">{selectedLocation.type}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedLocation(null)}
                className="p-1 hover:bg-slate-700 rounded"
              >
                <X className="w-4 h-4 text-slate-400" />
              </motion.button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">{selectedLocation.avenue}, {selectedLocation.commune}</span>
              </div>
              
              {selectedLocation.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">{selectedLocation.phone}</span>
                </div>
              )}
              
              {selectedLocation.hours && (
                <div className="flex items-center gap-2">
                  <Clock3 className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">{selectedLocation.hours}</span>
                </div>
              )}
              
              {selectedLocation.distance && (
                <div className="flex items-center gap-2">
                  <Route className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">{selectedLocation.distance.toFixed(1)} km</span>
                </div>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => calculateRoute(selectedLocation)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Route className="w-4 h-4 inline mr-1" />
                Itinéraire
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Phone className="w-4 h-4 inline mr-1" />
                Appeler
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Itinéraire */}
      <AnimatePresence>
        {route && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute bottom-24 left-4 right-4 bg-slate-800/95 backdrop-blur border border-slate-700 rounded-lg p-4 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white">Itinéraire</h3>
                <p className="text-xs text-slate-400">{route.distance} • {route.duration}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setRoute(null)}
                className="p-1 hover:bg-slate-700 rounded"
              >
                <X className="w-4 h-4 text-slate-400" />
              </motion.button>
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto">
              {route.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-300">{step.instruction}</p>
                    <p className="text-xs text-slate-500">{step.distance}</p>
                  </div>
                  <div className="text-slate-400">
                    {getDirectionIcon(step.direction)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panneau des couches */}
      <AnimatePresence>
        {showLayers && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute top-20 left-4 bg-slate-800/95 backdrop-blur border border-slate-700 rounded-lg p-3 shadow-lg"
          >
            <h3 className="font-medium text-white mb-2 text-sm">Couches</h3>
            <div className="space-y-1">
              {[
                { id: 'all', label: 'Tout', icon: <Layers className="w-4 h-4" /> },
                { id: 'hospital', label: 'Hôpitaux', icon: <Hospital className="w-4 h-4" /> },
                { id: 'police', label: 'Commissariats', icon: <Shield className="w-4 h-4" /> },
                { id: 'pharmacy', label: 'Pharmacies', icon: <Heart className="w-4 h-4" /> },
                { id: 'school', label: 'Écoles', icon: <Building className="w-4 h-4" /> },
                { id: 'bank', label: 'Banques', icon: <Building className="w-4 h-4" /> }
              ].map((layer) => (
                <motion.button
                  key={layer.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedLayer(layer.id);
                    setShowLayers(false);
                  }}
                  className={`w-full p-2 rounded-lg flex items-center gap-2 transition-colors ${
                    selectedLayer === layer.id 
                      ? 'bg-blue-600/20 text-blue-400' 
                      : 'hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {layer.icon}
                  <span className="text-sm">{layer.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-lg border-t border-slate-700 z-40">
        <div className="flex items-center justify-around py-2">
          {[
            { id: 'enhanced-home', label: 'Accueil', icon: <Shield className="w-4 h-4 sm:w-5 sm:h-5" /> },
            { id: 'map', label: 'Carte', icon: <Map className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" /> },
            { id: 'sos', label: 'SOS', icon: <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" /> },
            { id: 'alerts', label: 'Alertes', icon: <Bell className="w-4 h-4 sm:w-5 sm:h-5" /> },
            { id: 'profile', label: 'Profil', icon: <User className="w-4 h-4 sm:w-5 sm:h-5" /> }
          ].map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (item.id === 'enhanced-home') {
                  onNavigate?.('enhanced-home');
                } else if (item.id === 'map') {
                  // Reste sur la page carte
                } else if (item.id === 'sos') {
                  onNavigate?.('sos');
                } else if (item.id === 'alerts') {
                  onNavigate?.('alerts');
                } else if (item.id === 'profile') {
                  onNavigate?.('profile');
                }
              }}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                item.id === 'map' 
                  ? 'bg-blue-600/20' 
                  : 'hover:bg-slate-700'
              }`}
            >
              <div className="w-4 h-4 sm:w-5 sm:h-5">{item.icon}</div>
              <span className="text-xs text-slate-400">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnhancedMapScreen;
