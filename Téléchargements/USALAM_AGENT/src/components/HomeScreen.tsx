import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map, 
  Users, 
  AlertTriangle, 
  User, 
  Navigation,
  Shield,
  Phone,
  Camera,
  Mic,
  MapPin,
  Plus,
  Search,
  Filter,
  Wifi,
  WifiOff,
  Activity,
  Zap,
  AlertCircle,
  Lock
} from 'lucide-react';
import AdvancedMenu from './AdvancedMenu';

interface HomeScreenProps {
  onNavigate?: (screen: 'home' | 'enhanced-home' | 'contacts' | 'alerts' | 'profile' | 'guard' | 'evidence' | 'survival' | 'firstaid' | 'snig' | 'enhanced-map') => void;
  userLocation?: { lat: number; lng: number };
  incidents?: any[];
}

const HomeScreen = ({ onNavigate, userLocation, incidents = [] }: HomeScreenProps) => {
  const [mapCenter, setMapCenter] = useState({ lat: -4.4419, lng: 15.2663 }); // Kinshasa
  const [mapZoom, setMapZoom] = useState(13);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [sosState, setSosState] = useState<'idle' | 'tapping' | 'long-press' | 'emergency'>('idle');
  const [showQuickSignal, setShowQuickSignal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [connectivityStatus, setConnectivityStatus] = useState({
    gps: true,
    server: true,
    signal: 'strong'
  });
  const [proximityAlert, setProximityAlert] = useState(false);
  const [trackingPath, setTrackingPath] = useState([]);
  const [screenLocked, setScreenLocked] = useState(false);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [showAdvancedMenu, setShowAdvancedMenu] = useState(false);

  const toggleAdvancedMenu = () => {
    setShowAdvancedMenu(!showAdvancedMenu);
  };

  // Mock incidents for Kinshasa
  const mockIncidents = [
    {
      id: 1,
      type: 'Kuluna',
      severity: 'critical',
      location: { lat: -4.4419, lng: 15.2663 },
      description: 'Groupe de jeunes armés signalés',
      timestamp: 'Il y a 5 min',
      verified: true
    },
    {
      id: 2,
      type: 'Barricade',
      severity: 'high',
      location: { lat: -4.4447, lng: 15.2670 },
      description: 'Barricade sur route principale',
      timestamp: 'Il y a 15 min',
      verified: false
    },
    {
      id: 3,
      type: 'Contrôle',
      severity: 'medium',
      location: { lat: -4.4431, lng: 15.2685 },
      description: 'Contrôle policier imprévu',
      timestamp: 'Il y a 30 min',
      verified: true
    }
  ];

  const displayIncidents = incidents.length > 0 ? incidents : mockIncidents;

  // Quick signal options for Kinshasa
  const quickSignalOptions = [
    { type: 'Barricade', icon: '⚠️', color: 'orange' },
    { type: 'Contrôle', icon: '🚔', color: 'blue' },
    { type: 'Zone sans éclairage', icon: '🌑', color: 'yellow' },
    { type: 'Kuluna', icon: '🗡️', color: 'red' }
  ];

  useEffect(() => {
    // Initialize user location
    if (userLocation) {
      setMapCenter(userLocation);
    }

    // Simulate connectivity monitoring
    const connectivityInterval = setInterval(() => {
      setConnectivityStatus({
        gps: Math.random() > 0.1, // 90% uptime
        server: Math.random() > 0.05, // 95% uptime
        signal: ['strong', 'medium', 'weak'][Math.floor(Math.random() * 3)] as any
      });
    }, 5000);

    // Check proximity alerts
    const proximityInterval = setInterval(() => {
      const hasNearbyIncident = displayIncidents.some(incident => {
        const distance = calculateDistance(
          mapCenter.lat, mapCenter.lng,
          incident.location.lat, incident.location.lng
        );
        return distance < 0.5; // Within 500m
      });
      setProximityAlert(hasNearbyIncident);
    }, 2000);

    return () => {
      clearInterval(connectivityInterval);
      clearInterval(proximityInterval);
    };
  }, [userLocation, displayIncidents, mapCenter]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleSOSInteraction = (action: 'tap' | 'longPressStart' | 'longPressEnd') => {
    switch (action) {
      case 'tap':
        setSosState('tapping');
        setTimeout(() => setSosState('idle'), 200);
        setShowQuickSignal(true);
        break;
      case 'longPressStart':
        setSosState('long-press');
        startEmergencyRecording();
        break;
      case 'longPressEnd':
        if (sosState === 'long-press') {
          triggerEmergencyMode();
        }
        setSosState('emergency');
        break;
    }
  };

  const startEmergencyRecording = () => {
    console.log('🎙️ Emergency recording started');
    // Implement audio recording
  };

  const triggerEmergencyMode = () => {
    console.log('🚨 EMERGENCY MODE ACTIVATED');
    setIsTracking(true);
    setHighContrastMode(true);
    sendEmergencyAlert();
    startBreadcrumbTracking();
  };

  const startBreadcrumbTracking = () => {
    const trackingInterval = setInterval(() => {
      const newPosition = {
        lat: mapCenter.lat + (Math.random() - 0.5) * 0.001,
        lng: mapCenter.lng + (Math.random() - 0.5) * 0.001,
        timestamp: new Date().toISOString()
      };
      setTrackingPath(prev => [...prev, newPosition]);
    }, 2000);

    // Clean up after 5 minutes
    setTimeout(() => clearInterval(trackingInterval), 300000);
  };

  const sendEmergencyAlert = () => {
    const alert = {
      type: 'emergency',
      location: mapCenter,
      timestamp: new Date().toISOString(),
      user_id: 'current_user'
    };
    
    fetch('/api/emergency/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert)
    }).catch(() => {
      console.log('📴 Offline mode - Alert stored locally');
    });
  };

  const handleQuickSignal = (signalType: string) => {
    console.log(`🚨 Quick Signal: ${signalType}`);
    setShowQuickSignal(false);
    // Send quick signal
  };

  const getSOSButtonStyle = () => {
    const baseStyle = "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg";
    
    switch (sosState) {
      case 'idle':
        return `${baseStyle} bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800`;
      case 'tapping':
        return `${baseStyle} bg-gradient-to-br from-orange-500 to-orange-600 scale-95`;
      case 'long-press':
        return `${baseStyle} bg-gradient-to-br from-red-500 to-red-600 animate-pulse shadow-red-500/50 shadow-2xl`;
      case 'emergency':
        return `${baseStyle} bg-gradient-to-br from-red-600 to-red-700 animate-pulse shadow-red-600/50 shadow-2xl`;
      default:
        return baseStyle;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getConnectivityColor = () => {
    if (!connectivityStatus.gps || !connectivityStatus.server) return 'bg-red-500';
    if (connectivityStatus.signal === 'weak') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const filteredIncidents = displayIncidents.filter(incident => {
    const matchesSearch = incident.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         incident.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterSeverity === 'all' || incident.severity === filterSeverity;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={`min-h-screen ${highContrastMode ? 'bg-black' : 'bg-slate-900'} text-white relative`}>
      {/* Connectivity Status Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-20 bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 p-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getConnectivityColor()} animate-pulse`} />
              <span className="text-xs text-slate-300">
                {connectivityStatus.gps ? 'GPS' : 'GPS OFF'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {connectivityStatus.server ? (
                <Wifi className="w-3 h-3 text-green-400" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-400" />
              )}
              <span className="text-xs text-slate-300">
                {connectivityStatus.server ? 'Connecté' : 'Hors ligne'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-blue-400" />
            <span className="text-xs text-slate-300">
              Signal: {connectivityStatus.signal}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Map Container */}
      <div className="relative h-screen pt-10">
        {/* Map Placeholder (Replace with actual map component) */}
        <div 
          className={`absolute inset-0 ${highContrastMode ? 'bg-black' : 'bg-gradient-to-br from-slate-800 to-slate-900'}`}
          style={{
            backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>')`,
            backgroundSize: '50px 50px'
          }}
        >
          {/* Proximity Circle */}
          <motion.div
            animate={{
              scale: proximityAlert ? [1, 1.2, 1] : [1, 1.1, 1],
              opacity: proximityAlert ? [0.3, 0.6, 0.3] : [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: 2,
              repeat: Infinity
            }}
            className={`absolute w-96 h-96 rounded-full border-2 ${
              proximityAlert ? 'border-orange-500' : 'border-green-500'
            }`}
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${
                proximityAlert ? 'rgba(251, 146, 60, 0.1)' : 'rgba(34, 197, 94, 0.1)'
              } 0%, transparent 70%)`
            }}
          />

          {/* Breadcrumb Trail */}
          {trackingPath.length > 1 && (
            <svg className="absolute inset-0 w-full h-full">
              {trackingPath.map((point, index) => {
                if (index === 0) return null;
                const prevPoint = trackingPath[index - 1];
                return (
                  <motion.line
                    key={index}
                    x1={`${((prevPoint.lng - mapCenter.lng) * 10000 + 50)}%`}
                    y1={`${((mapCenter.lat - prevPoint.lat) * 10000 + 50)}%`}
                    x2={`${((point.lng - mapCenter.lng) * 10000 + 50)}%`}
                    y2={`${((mapCenter.lat - point.lat) * 10000 + 50)}%`}
                    stroke={highContrastMode ? '#00ff00' : '#3b82f6'}
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                );
              })}
            </svg>
          )}

          {/* Incident Markers */}
          {filteredIncidents.map((incident, index) => (
            <motion.div
              key={incident.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="absolute cursor-pointer"
              style={{
                left: `${((incident.location.lng - mapCenter.lng) * 10000 + 50)}%`,
                top: `${((mapCenter.lat - incident.location.lat) * 10000 + 50)}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => setSelectedIncident(incident)}
            >
              <div className={`w-8 h-8 ${getSeverityColor(incident.severity)} rounded-full flex items-center justify-center shadow-lg ${incident.severity === 'critical' ? 'animate-pulse' : ''}`}>
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              {incident.verified && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
              )}
            </motion.div>
          ))}

          {/* User Location Marker */}
          {userLocation && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className={`w-4 h-4 ${highContrastMode ? 'bg-green-400' : 'bg-blue-500'} rounded-full border-2 border-white shadow-lg`}>
                <div className={`absolute inset-0 ${highContrastMode ? 'bg-green-400' : 'bg-blue-400'} rounded-full animate-ping`} />
              </div>
            </motion.div>
          )}
        </div>

        {/* Search and Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 left-4 right-4 z-10"
        >
          <div className={`${highContrastMode ? 'bg-gray-900' : 'bg-slate-800/90'} backdrop-blur-sm rounded-lg p-3 border ${highContrastMode ? 'border-yellow-400' : 'border-slate-700'}`}>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher des incidents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 ${highContrastMode ? 'bg-black text-yellow-400 border-yellow-400' : 'bg-slate-700/50 border-slate-600'} rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500`}
                />
              </div>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className={`px-4 py-2 ${highContrastMode ? 'bg-black text-yellow-400 border-yellow-400' : 'bg-slate-700/50 border-slate-600'} rounded-lg text-white focus:outline-none focus:border-blue-500`}
              >
                <option value="all">Tous</option>
                <option value="critical">Critique</option>
                <option value="high">Élevé</option>
                <option value="medium">Moyen</option>
                <option value="low">Faible</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Tracking Status */}
        <AnimatePresence>
          {isTracking && (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="absolute top-28 left-4 z-10"
            >
              <div className={`${highContrastMode ? 'bg-black border-yellow-400' : 'bg-green-600/90 backdrop-blur-sm border-green-500'} rounded-lg p-3 flex items-center gap-2`}>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className={`text-sm font-medium ${highContrastMode ? 'text-yellow-400' : 'text-white'}`}>
                  Suivi GPS actif
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Screen Lock Widget */}
        <AnimatePresence>
          {isTracking && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute top-28 right-4 z-10"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setScreenLocked(!screenLocked)}
                className={`${highContrastMode ? 'bg-black border-yellow-400' : 'bg-slate-800/90 backdrop-blur-sm border-slate-700'} rounded-lg p-3`}
              >
                <Lock className={`w-5 h-5 ${screenLocked ? 'text-red-400' : 'text-slate-400'}`} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SOS Button */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20"
        >
          <button
            className={getSOSButtonStyle()}
            onMouseDown={() => handleSOSInteraction('longPressStart')}
            onMouseUp={() => handleSOSInteraction('longPressEnd')}
            onTouchStart={() => handleSOSInteraction('longPressStart')}
            onTouchEnd={() => handleSOSInteraction('longPressEnd')}
            onClick={() => handleSOSInteraction('tap')}
          >
            <Navigation className="w-8 h-8 text-white" />
          </button>
          
          {/* SOS Instructions */}
          <div className={`absolute bottom-32 left-1/2 transform -translate-x-1/2 ${highContrastMode ? 'bg-black border-yellow-400' : 'bg-slate-800'} rounded-lg p-3 text-xs text-slate-300 max-w-xs text-center`}>
            <div className="space-y-1">
              <div>👆 Tap : Signalement rapide</div>
              <div>🤚 Appui long (3s) : SOS d'urgence</div>
            </div>
          </div>
        </motion.div>

        {/* Quick Signal Bubbles */}
        <AnimatePresence>
          {showQuickSignal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-40 left-1/2 transform -translate-x-1/2 z-30"
            >
              <div className={`${highContrastMode ? 'bg-black border-yellow-400' : 'bg-slate-800/95 backdrop-blur-sm'} rounded-2xl p-4 border ${highContrastMode ? 'border-yellow-400' : 'border-slate-700'}`}>
                <div className="grid grid-cols-2 gap-3">
                  {quickSignalOptions.map((option, index) => (
                    <motion.button
                      key={option.type}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQuickSignal(option.type)}
                      className={`${highContrastMode ? 'bg-gray-900 hover:bg-gray-800 border-yellow-400' : 'bg-slate-700 hover:bg-slate-600'} rounded-lg p-4 text-center transition-colors`}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <div className={`text-xs ${highContrastMode ? 'text-yellow-400' : 'text-white'}`}>{option.type}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Advanced Menu Modal */}
        <AnimatePresence>
          {showAdvancedMenu && (
            <AdvancedMenu
              isOpen={showAdvancedMenu}
              onClose={() => setShowAdvancedMenu(false)}
              onNavigate={onNavigate || (() => {})}
            />
          )}
        </AnimatePresence>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-lg border-t border-slate-700 z-40">
          <div className="flex items-center justify-around py-2">
            {[
              { id: 'enhanced-home', label: 'Accueil', icon: <Shield className="w-5 h-5" /> },
              { id: 'map', label: 'Carte', icon: <Map className="w-5 h-5" /> },
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
                  } else if (item.id === 'map') {
                    onNavigate?.('enhanced-map');
                  } else if (item.id === 'sos') {
                    onNavigate?.('enhanced-map');
                  } else if (item.id === 'alerts') {
                    onNavigate?.('alerts');
                  } else if (item.id === 'profile') {
                    onNavigate?.('profile');
                  }
                }}
                className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors hover:bg-slate-700"
              >
                {item.icon}
                <span className="text-xs text-slate-400">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Incident Detail Modal */}
        <AnimatePresence>
          {selectedIncident && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center p-4"
              onClick={() => setSelectedIncident(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`${highContrastMode ? 'bg-black border-yellow-400' : 'bg-slate-900'} rounded-2xl p-6 max-w-md w-full border ${highContrastMode ? 'border-yellow-400' : 'border-slate-700'}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xl font-bold ${highContrastMode ? 'text-yellow-400' : 'text-white'}`}>{selectedIncident.type}</h3>
                  <button
                    onClick={() => setSelectedIncident(null)}
                    className="text-slate-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getSeverityColor(selectedIncident.severity)}`}>
                    <AlertTriangle className="w-4 h-4" />
                    {selectedIncident.severity}
                  </div>
                  
                  <p className={highContrastMode ? 'text-yellow-400' : 'text-slate-300'}>{selectedIncident.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedIncident.timestamp}
                    </span>
                    {selectedIncident.verified && (
                      <span className="flex items-center gap-1 text-green-400">
                        <Shield className="w-4 h-4" />
                        Vérifié
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HomeScreen;
