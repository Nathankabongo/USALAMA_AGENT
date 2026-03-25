import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Clock, 
  Navigation, 
  Users, 
  Phone, 
  MapPin, 
  Link, 
  Share2,
  AlertTriangle,
  CheckCircle,
  X,
  Timer,
  Bluetooth,
  Wifi,
  WifiOff,
  MessageSquare,
  Activity,
  Map,
  Bell,
  User,
  Lock,
  Heart
} from 'lucide-react';

interface DigitalGuardProps {
  onNavigate?: (screen: 'home' | 'enhanced-home' | 'contacts' | 'alerts' | 'profile' | 'guard' | 'evidence' | 'survival' | 'firstaid' | 'snig' | 'enhanced-map' | 'sos') => void;
}

interface TripData {
  id: string;
  startTime: Date;
  endTime: Date;
  startLocation: string;
  endLocation: string;
  trackingLink: string;
  isActive: boolean;
}

const DigitalGuard = ({ onNavigate }: DigitalGuardProps) => {
  const [isGuardMode, setIsGuardMode] = useState(false);
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [bluetoothAgents, setBluetoothAgents] = useState([]);
  const [networkStatus, setNetworkStatus] = useState('online');
  const [medicalICE, setMedicalICE] = useState({
    bloodType: 'O+',
    allergies: ['Pénicilline'],
    emergencyContacts: ['+243812345678', '+243819876543'],
    medications: []
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mode Accompagnement
  const startGuardMode = () => {
    const endTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes par défaut
    const tripId = Date.now().toString();
    const trackingLink = `https://usalama.cd/track/${tripId}`;
    
    const newTrip: TripData = {
      id: tripId,
      startTime: new Date(),
      endTime,
      startLocation: 'Position actuelle',
      endLocation: 'Destination',
      trackingLink,
      isActive: true
    };
    
    setTripData(newTrip);
    setIsGuardMode(true);
    
    // Générer le lien de partage
    if (navigator.share) {
      navigator.share({
        title: '🛡️ USALAMA - Suivi de trajet',
        text: `Suivez mon trajet en temps réel : ${trackingLink}`,
        url: trackingLink
      });
    }
    
    // Démarrer le compte à rebours
    startCountdown(endTime);
  };

  const startCountdown = (endTime: Date) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        // Temps écoulé - déclencher SOS automatique
        triggerAutoSOS();
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        setCountdown(Math.floor(diff / 1000));
      }
    }, 1000);
  };

  const triggerAutoSOS = () => {
    console.log('🚨 AUTO-SOS DÉCLENCHÉ - Temps imparti écoulé');
    // Envoyer alerte SOS automatique
    sendEmergencyAlert({
      type: 'auto_guard_timeout',
      location: 'Position GPS actuelle',
      timestamp: new Date().toISOString(),
      tripId: tripData?.id
    });
  };

  const stopGuardMode = () => {
    setIsGuardMode(false);
    setTripData(null);
    setCountdown(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  // Détection Bluetooth
  useEffect(() => {
    if ('bluetooth' in navigator) {
      // Simuler détection d'autres agents USALAMA
      const simulateBluetoothDetection = () => {
        const nearbyAgents = [
          { id: '1', name: 'Agent Kabila', distance: 35, status: 'active' },
          { id: '2', name: 'Agent Moko', distance: 48, status: 'active' }
        ];
        setBluetoothAgents(nearbyAgents);
      };
      
      if (isGuardMode) {
        simulateBluetoothDetection();
        const bluetoothInterval = setInterval(simulateBluetoothDetection, 10000);
        return () => clearInterval(bluetoothInterval);
      }
    }
  }, [isGuardMode]);

  // Monitoring réseau
  useEffect(() => {
    const checkNetworkStatus = () => {
      setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    };
    
    window.addEventListener('online', checkNetworkStatus);
    window.addEventListener('offline', checkNetworkStatus);
    
    return () => {
      window.removeEventListener('online', checkNetworkStatus);
      window.removeEventListener('offline', checkNetworkStatus);
    };
  }, []);

  // Gateway SMS si réseau hors ligne
  const sendSMSEmergency = async () => {
    const coordinates = 'GPS:-4.4419,15.2663'; // Coordonnées actuelles
    const message = `USALAMA-SOS:${coordinates}:${Date.now()}`;
    
    try {
      // Utiliser Web Share API pour SMS
      await navigator.share({
        title: 'USALAMA SOS',
        text: message
      });
    } catch (error) {
      console.log('Envoi SMS manuel requis');
    }
  };

  const sendEmergencyAlert = (alertData: any) => {
    if (networkStatus === 'online') {
      // Envoyer via API normale
      fetch('/api/emergency/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData)
      });
    } else {
      // Envoyer via SMS gateway
      sendSMSEmergency();
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      {/* Header */}
      <div className="bg-slate-800/95 backdrop-blur-lg border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold">Garde Numérique</h1>
          </div>
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

      <div className="p-4 space-y-6">
        {/* Status Réseau */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {networkStatus === 'online' ? (
                <>
                  <Wifi className="w-5 h-5 text-green-400" />
                  <span>Connecté</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-400" />
                  <span>Hors ligne - Mode SMS actif</span>
                </>
              )}
            </h3>
            <button
              onClick={sendSMSEmergency}
              className="bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Test SMS
            </button>
          </div>
          
          <div className="text-sm text-slate-400">
            {networkStatus === 'online' 
              ? 'Transmission 4G/Wifi disponible' 
              : 'Gateway SMS automatique activé'}
          </div>
        </motion.div>

        {/* Mode Accompagnement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-900/20 backdrop-blur-sm rounded-lg border border-blue-800/50 p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Mode Accompagnement
            </h3>
            {!isGuardMode ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGuardMode}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                Raccompagne-moi
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopGuardMode}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Arrêter
              </motion.button>
            )}
          </div>

          <AnimatePresence>
            {isGuardMode && tripData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Temps restant</span>
                    <div className="text-2xl font-bold text-blue-400">
                      {formatCountdown(countdown)}
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: '100%' }}
                      animate={{ width: `${(countdown / (30 * 60)) * 100}%` }}
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                    />
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Link className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium">Lien de suivi</span>
                  </div>
                  <div className="bg-slate-900 rounded p-2 font-mono text-xs text-green-400 break-all">
                    {tripData.trackingLink}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(tripData.trackingLink)}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                  >
                    📋 Copier le lien
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Agents à proximité */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-green-900/20 backdrop-blur-sm rounded-lg border border-green-800/50 p-4"
        >
          <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2 mb-4">
            <Bluetooth className="w-5 h-5" />
            Agents USALAMA à proximité
          </h3>
          
          <div className="space-y-2">
            {bluetoothAgents.length > 0 ? (
              bluetoothAgents.map((agent) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-xs text-slate-400">{agent.distance}m</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-green-400">Actif</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center text-slate-400 py-4">
                <Bluetooth className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucun agent détecté à proximité</p>
                <p className="text-xs mt-1">Portée : 50m max</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ICE Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-red-900/20 backdrop-blur-sm rounded-lg border border-red-800/50 p-4"
        >
          <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5" />
            Fiche Médicale d'Urgence (ICE)
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">Groupe Sanguin</div>
              <div className="text-lg font-bold text-red-400">{medicalICE.bloodType}</div>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">Allergies</div>
              <div className="text-sm text-red-400">{medicalICE.allergies.join(', ')}</div>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-3 col-span-2">
              <div className="text-xs text-slate-400 mb-1">Contacts d'urgence</div>
              <div className="space-y-1">
                {medicalICE.emergencyContacts.map((contact, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-red-400" />
                    <span className="text-sm">{contact}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <button className="w-full mt-4 bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            Afficher sur écran de verrouillage
          </button>
        </motion.div>
      </div>

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

export default DigitalGuard;
