import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map, 
  MapPin, 
  Navigation, 
  Shield, 
  Users, 
  Heart, 
  Phone, 
  Wifi,
  Zap,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  X,
  Star,
  Activity,
  Bell,
  User
} from 'lucide-react';

interface SurvivalMapProps {
  onNavigate?: (screen: 'home' | 'enhanced-home' | 'contacts' | 'alerts' | 'profile' | 'guard' | 'evidence' | 'survival' | 'firstaid' | 'snig' | 'enhanced-map' | 'sos') => void;
}

interface SafePoint {
  id: string;
  name: string;
  type: 'hospital' | 'police' | 'church' | 'supermarket' | 'community';
  coordinates: { lat: number; lng: number };
  distance: number;
  isOpen24h: boolean;
  hasSecurity: boolean;
  rating: number;
  lastVerified: Date;
}

interface StreetVitality {
  id: string;
  name: string;
  vitalityScore: number; // 0-100
  status: 'active' | 'quiet' | 'deserted';
  lastUpdate: Date;
  userCount: number;
  lightLevel: number;
}

const SurvivalMap = ({ onNavigate }: SurvivalMapProps) => {
  const [safePoints, setSafePoints] = useState<SafePoint[]>([]);
  const [streetVitality, setStreetVitality] = useState<StreetVitality[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<SafePoint | null>(null);
  const [userLocation, setUserLocation] = useState({ lat: -4.4419, lng: 15.2663 });
  const [mapZoom, setMapZoom] = useState(14);
  const [showVitality, setShowVitality] = useState(true);
  const [voiceCommandActive, setVoiceCommandActive] = useState(false);

  // Points sûrs pour Kinshasa
  useEffect(() => {
    const mockSafePoints: SafePoint[] = [
      {
        id: '1',
        name: 'Hôpital Général de Kinshasa',
        type: 'hospital',
        coordinates: { lat: -4.4419, lng: 15.2663 },
        distance: 0.5,
        isOpen24h: true,
        hasSecurity: true,
        rating: 4.5,
        lastVerified: new Date()
      },
      {
        id: '2',
        name: 'Commissariat de Limete',
        type: 'police',
        coordinates: { lat: -4.4447, lng: 15.2670 },
        distance: 1.2,
        isOpen24h: true,
        hasSecurity: true,
        rating: 4.2,
        lastVerified: new Date()
      },
      {
        id: '3',
        name: 'Église Sainte Anne',
        type: 'church',
        coordinates: { lat: -4.4431, lng: 15.2685 },
        distance: 0.8,
        isOpen24h: true,
        hasSecurity: false,
        rating: 4.0,
        lastVerified: new Date()
      },
      {
        id: '4',
        name: 'Supermarché Kin Mart',
        type: 'supermarket',
        coordinates: { lat: -4.4450, lng: 15.2690 },
        distance: 1.5,
        isOpen24h: false,
        hasSecurity: true,
        rating: 3.8,
        lastVerified: new Date()
      },
      {
        id: '5',
        name: 'Centre Communautaire USALAMA',
        type: 'community',
        coordinates: { lat: -4.4425, lng: 15.2675 },
        distance: 0.3,
        isOpen24h: true,
        hasSecurity: true,
        rating: 5.0,
        lastVerified: new Date()
      }
    ];
    setSafePoints(mockSafePoints);
  }, []);

  // Vitalité des rues
  useEffect(() => {
    const mockStreetVitality: StreetVitality[] = [
      {
        id: '1',
        name: 'Avenue Kasa-Vubu',
        vitalityScore: 85,
        status: 'active',
        lastUpdate: new Date(),
        userCount: 150,
        lightLevel: 80
      },
      {
        id: '2',
        name: 'Boulevard du 30 Juin',
        vitalityScore: 92,
        status: 'active',
        lastUpdate: new Date(),
        userCount: 280,
        lightLevel: 95
      },
      {
        id: '3',
        name: 'Rue de la Justice',
        vitalityScore: 35,
        status: 'quiet',
        lastUpdate: new Date(),
        userCount: 20,
        lightLevel: 40
      },
      {
        id: '4',
        name: 'Avenue des Aviateurs',
        vitalityScore: 15,
        status: 'deserted',
        lastUpdate: new Date(),
        userCount: 5,
        lightLevel: 20
      }
    ];
    setStreetVitality(mockStreetVitality);
  }, []);

  // Commande vocale
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'fr-FR';
      
      recognition.onresult = (event: any) => {
        const command = event.results[0][0].transcript.toLowerCase();
        
        // Mots-clés de détresse
        const distressKeywords = ['usalama aide', 'sos kinshasa', 'urgence aidez-moi', 'secours'];
        
        if (distressKeywords.some(keyword => command.includes(keyword))) {
          triggerVoiceSOS();
        }
        
        // Commandes de navigation
        if (command.includes('montre les points sûrs')) {
          setShowVitality(false);
        }
        if (command.includes('montre la vitalité')) {
          setShowVitality(true);
        }
      };
      
      if (voiceCommandActive) {
        recognition.start();
      }
      
      return () => {
        recognition.stop();
      };
    }
  }, [voiceCommandActive]);

  const triggerVoiceSOS = () => {
    console.log('🎙️ SOS DÉCLENCHÉ PAR COMMANDE VOCALE');
    // Déclencher le SOS
    sendEmergencyAlert({
      type: 'voice_command',
      location: userLocation,
      timestamp: new Date().toISOString(),
      trigger: 'voice_command'
    });
  };

  const sendEmergencyAlert = (alertData: any) => {
    fetch('/api/emergency/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData)
    });
  };

  const getSafePointIcon = (type: string) => {
    switch (type) {
      case 'hospital': return <Heart className="w-5 h-5 text-red-400" />;
      case 'police': return <Shield className="w-5 h-5 text-blue-400" />;
      case 'church': return <Users className="w-5 h-5 text-purple-400" />;
      case 'supermarket': return <MapPin className="w-5 h-5 text-green-400" />;
      case 'community': return <Star className="w-5 h-5 text-yellow-400" />;
      default: return <MapPin className="w-5 h-5 text-slate-400" />;
    }
  };

  const getVitalityColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getVitalityStatus = (status: string) => {
    switch (status) {
      case 'active': return { text: 'Animée', color: 'text-green-400', bg: 'bg-green-600/20' };
      case 'quiet': return { text: 'Calme', color: 'text-yellow-400', bg: 'bg-yellow-600/20' };
      case 'deserted': return { text: 'Déserte', color: 'text-red-400', bg: 'bg-red-600/20' };
      default: return { text: 'Inconnue', color: 'text-slate-400', bg: 'bg-slate-600/20' };
    }
  };

  const calculateDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const callSafePoint = (point: SafePoint) => {
    // Simuler appel téléphonique
    if (point.type === 'hospital') {
      window.location.href = 'tel:123'; // Numéro d'urgence hôpital
    } else if (point.type === 'police') {
      window.location.href = 'tel:117'; // Police
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      {/* Header */}
      <div className="bg-slate-800/95 backdrop-blur-lg border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Map className="w-6 h-6 text-green-400" />
            <h1 className="text-xl font-bold">Cartographie de Survie</h1>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowVitality(!showVitality)}
              className={`p-2 rounded-lg transition-colors ${
                showVitality ? 'bg-green-600' : 'bg-slate-700'
              }`}
            >
              <Activity className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setVoiceCommandActive(!voiceCommandActive)}
              className={`p-2 rounded-lg transition-colors ${
                voiceCommandActive ? 'bg-red-600' : 'bg-slate-700'
              }`}
            >
              {voiceCommandActive ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate?.('home')}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="flex h-screen pt-16">
        {/* Carte principale */}
        <div className="flex-1 relative">
          {/* Placeholder de carte */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900"
               style={{
                 backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>')`,
                 backgroundSize: '50px 50px'
               }}>
            
            {/* Points sûrs sur la carte */}
            {safePoints.map((point, index) => (
              <motion.div
                key={point.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="absolute cursor-pointer"
                style={{
                  left: `${((point.coordinates.lng - userLocation.lng) * 10000 + 50)}%`,
                  top: `${((userLocation.lat - point.coordinates.lat) * 10000 + 50)}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => setSelectedPoint(point)}
              >
                <div className={`p-2 rounded-full ${
                  point.type === 'hospital' ? 'bg-red-600' :
                  point.type === 'police' ? 'bg-blue-600' :
                  point.type === 'church' ? 'bg-purple-600' :
                  point.type === 'supermarket' ? 'bg-green-600' :
                  'bg-yellow-600'
                }`}>
                  {getSafePointIcon(point.type)}
                </div>
                
                {/* Indicateur de distance */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-white bg-slate-800 px-2 py-1 rounded">
                  {point.distance}km
                </div>
              </motion.div>
            ))}

            {/* Indicateur de vitalité des rues */}
            {showVitality && streetVitality.map((street, index) => (
              <motion.div
                key={street.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: index * 0.2 }}
                className="absolute"
                style={{
                  left: `${20 + index * 15}%`,
                  top: `${30 + index * 10}%`,
                  width: '60px',
                  height: '4px'
                }}
              >
                <div className={`w-full h-full rounded ${getVitalityStatus(street.status).bg}`} />
              </motion.div>
            ))}

            {/* Position utilisateur */}
            <div className="absolute" style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}>
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg">
                <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping" />
              </div>
            </div>
          </div>
        </div>

        {/* Panneau latéral */}
        <div className="w-80 bg-slate-800/95 backdrop-blur-lg border-l border-slate-700 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Commande vocale */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-900/20 backdrop-blur-sm rounded-lg border border-red-800/50 p-4"
            >
              <h3 className="text-sm font-semibold text-red-400 mb-2">🎙️ Commande Vocale</h3>
              <div className="text-xs text-slate-300 space-y-1">
                <div>Dites "USALAMA aide" pour déclencher SOS</div>
                <div>Dits "Montre les points sûrs" pour filtrer</div>
                <div className={`mt-2 p-2 rounded ${voiceCommandActive ? 'bg-red-600/20' : 'bg-slate-700'}`}>
                  {voiceCommandActive ? '🎙️ Écoute active...' : '🔇 Micro inactif'}
                </div>
              </div>
            </motion.div>

            {/* Points sûrs */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Points Sûrs
              </h3>
              
              <div className="space-y-3">
                {safePoints.map((point, index) => (
                  <motion.div
                    key={point.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="bg-slate-700/50 rounded-lg p-3 cursor-pointer hover:bg-slate-700 transition-colors"
                    onClick={() => setSelectedPoint(point)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSafePointIcon(point.type)}
                        <span className="font-medium text-sm">{point.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {point.isOpen24h && (
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                        )}
                        {point.hasSecurity && (
                          <Shield className="w-3 h-3 text-blue-400" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{point.distance}km</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400" />
                        <span>{point.rating}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Vitalité des rues */}
            {showVitality && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Indice de Vivacité
                </h3>
                
                <div className="space-y-3">
                  {streetVitality.map((street, index) => (
                    <motion.div
                      key={street.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className="bg-slate-700/50 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{street.name}</span>
                        <div className={`px-2 py-1 rounded text-xs ${getVitalityStatus(street.status).bg} ${getVitalityStatus(street.status).color}`}>
                          {getVitalityStatus(street.status).text}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{street.userCount} personnes</span>
                        <span className={getVitalityColor(street.vitalityScore)}>
                          {street.vitalityScore}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-slate-600 rounded-full h-1 mt-2">
                        <div 
                          className={`h-full rounded-full ${
                            street.vitalityScore >= 70 ? 'bg-green-500' :
                            street.vitalityScore >= 40 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${street.vitalityScore}%` }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Modal détails du point */}
      <AnimatePresence>
        {selectedPoint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPoint(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getSafePointIcon(selectedPoint.type)}
                  <h3 className="text-xl font-bold text-white">{selectedPoint.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedPoint(null)}
                  className="text-slate-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Distance</span>
                  <span className="font-medium">{selectedPoint.distance}km</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Ouverture</span>
                  <span className={selectedPoint.isOpen24h ? 'text-green-400' : 'text-yellow-400'}>
                    {selectedPoint.isOpen24h ? '24h/24' : 'Horaires limités'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Sécurité</span>
                  <span className={selectedPoint.hasSecurity ? 'text-green-400' : 'text-red-400'}>
                    {selectedPoint.hasSecurity ? 'Présente' : 'Aucune'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Note</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="font-medium">{selectedPoint.rating}/5</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => callSafePoint(selectedPoint)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg py-3 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Appeler
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Simuler navigation vers le point
                    console.log(`Navigation vers ${selectedPoint.name}`);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  S'y rendre
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
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
                  onNavigate?.('sos');
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
    </div>
  );
};

export default SurvivalMap;
