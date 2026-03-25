import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Map, 
  Phone, 
  Bell, 
  User, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Navigation, 
  Users, 
  Activity,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Send,
  X,
  CheckCircle,
  Zap,
  Heart,
  Share2,
  MessageCircle,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Settings,
  Globe,
  Hospital,
  ShieldCheck,
  Radio,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Timer,
  Home,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Pen,
  Square,
  Circle,
  Compass,
  Signal,
  RadioIcon,
  Camera,
  CameraOff,
  Maximize2,
  Minimize2,
  Move,
  Navigation2
} from 'lucide-react';

// Import des composants modulaires
import MapCanvas from './MapCanvas';
import DirectionOverlay from './DirectionOverlay';
import VoiceController from './VoiceController';
import StatusShield from './StatusShield';
import ParentNotificationView from './ParentNotificationView';

// Import des types
import { 
  PositionData, 
  MapState, 
  MapDrawing, 
  NavigationCommand, 
  WebRTCConnection, 
  WebSocketMessage 
} from '../types/copilot';

import { NavigationProps, navigationItems } from '../types/navigation';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
  isPrimary: boolean;
  batteryLevel?: number;
}

interface SOSLog {
  id: string;
  timestamp: Date;
  type: 'manual' | 'automatic' | 'voice' | 'gesture';
  duration: number;
  location?: { lat: number; lng: number };
  status: 'active' | 'completed' | 'cancelled';
}

interface CopilotConnection {
  id: string;
  name: string;
  isConnected: boolean;
  isGuiding: boolean;
  signalStrength: number;
  batteryLevel: number;
  lastUpdate: Date;
}

const SOSScreen = ({ onNavigate }: NavigationProps) => {
  // États SOS de base
  const [sosActive, setSosActive] = useState(false);
  const [sosMode, setSosMode] = useState<'emergency' | 'discreet'>('emergency');
  const [countdown, setCountdown] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [signalStrength, setSignalStrength] = useState(3);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // États pour le système de copilote
  const [copilotMode, setCopilotMode] = useState<'user' | 'copilot'>('user');
  const [copilotConnection, setCopilotConnection] = useState<CopilotConnection | null>(null);
  const [navigationCommands, setNavigationCommands] = useState<NavigationCommand[]>([]);
  const [currentDirection, setCurrentDirection] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mapDrawings, setMapDrawings] = useState<MapDrawing[]>([]);
  const [isVideoStream, setIsVideoStream] = useState(false);
  const [mapView, setMapView] = useState<'split' | 'full' | 'copilot'>('split');
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [isSignalActive, setIsSignalActive] = useState(false);
  
  // États pour les flux de données
  const [webrtcConnection, setWebrtcConnection] = useState<WebRTCConnection>({
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    isAudioEnabled: false,
    isVideoEnabled: false
  });
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [currentPosition, setCurrentPosition] = useState<PositionData | null>(null);
  const [mapState, setMapState] = useState<MapState>({
    center: { lat: -4.4419, lng: 15.2663 },
    zoom: 14,
    bearing: 0,
    pitch: 0
  });
  const [isSharingPosition, setIsSharingPosition] = useState(false);
  const [positionHistory, setPositionHistory] = useState<PositionData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const [showParentNotification, setShowParentNotification] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingPath = useRef<{ x: number; y: number }[]>([]);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const positionInterval = useRef<NodeJS.Timeout | null>(null);

  const emergencyContacts: EmergencyContact[] = [
    {
      id: '1',
      name: 'Papa',
      phone: '+243818123456',
      relation: 'Famille',
      isPrimary: true,
      batteryLevel: 78
    },
    {
      id: '2',
      name: 'Maman',
      phone: '+243819987654',
      relation: 'Famille',
      isPrimary: false,
      batteryLevel: 92
    },
    {
      id: '3',
      name: 'Dr. Mukendi',
      phone: '+243812345678',
      relation: 'Médecin',
      isPrimary: false,
      batteryLevel: 65
    }
  ];

  // Fonctions principales
  const handleSOSActivation = (mode: 'emergency' | 'discreet') => {
    setSosMode(mode);
    setSosActive(true);
    setCountdown(30);
    setIsRecording(true);
    setIsLocationSharing(true);
    
    // Envoyer alertes immédiates
    sendEmergencyAlert(mode);
  };

  const handleSOSCancel = () => {
    setSosActive(false);
    setCountdown(0);
    setIsRecording(false);
    setIsVideoRecording(false);
    setIsLocationSharing(false);
    setSelectedContact(null);
  };

  const sendEmergencyAlert = (mode: 'emergency' | 'discreet') => {
    console.log(`Alerte ${mode} envoyée aux contacts d'urgence`);
    
    // Notifications push
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('USALAMA - Alerte d\'urgence', {
        body: mode === 'emergency' ? 'URGENCE ACTIVÉE' : 'Alerte discrète activée',
        icon: '/favicon.ico'
      });
    }
  };

  // Fonctions pour le système de copilote
  const connectCopilot = (contactId: string) => {
    const contact = emergencyContacts.find(c => c.id === contactId);
    if (!contact) return;

    setCopilotConnection({
      id: contact.id,
      name: contact.name,
      isConnected: true,
      isGuiding: false,
      signalStrength: 4,
      batteryLevel: contact.batteryLevel || 80,
      lastUpdate: new Date()
    });

    // Simuler la connexion WebRTC
    setIsMicrophoneActive(true);
    setIsSignalActive(true);
    
    console.log(`Copilote connecté: ${contact.name}`);
  };

  const disconnectCopilot = () => {
    setCopilotConnection(null);
    setIsMicrophoneActive(false);
    setIsSignalActive(false);
    setCurrentDirection(null);
    setCopilotMode('user');
  };

  const sendDirectionCommand = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!copilotConnection || copilotMode !== 'copilot') return;

    const command: NavigationCommand = {
      id: Date.now().toString(),
      type: 'direction',
      data: { direction, intensity: 'strong' },
      timestamp: new Date(),
      from: 'copilot'
    };

    setNavigationCommands(prev => [...prev, command]);
    setCurrentDirection(direction);

    // Simuler l'envoi via Socket.io
    console.log('Direction envoyée:', direction);

    // Effacer la direction après 3 secondes
    setTimeout(() => {
      setCurrentDirection(null);
    }, 3000);
  };

  const markDangerZone = () => {
    if (!copilotConnection || copilotMode !== 'copilot') return;

    const command: NavigationCommand = {
      id: Date.now().toString(),
      type: 'danger',
      data: { 
        position: { x: Math.random() * 100, y: Math.random() * 100 },
        severity: 'high',
        description: 'Zone à risque détectée'
      },
      timestamp: new Date(),
      from: 'copilot'
    };

    setNavigationCommands(prev => [...prev, command]);
    console.log('Zone de danger marquée');
  };

  const toggleAudio = useCallback(() => {
    if (webrtcConnection.localStream) {
      const audioTracks = webrtcConnection.localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      
      setWebrtcConnection(prev => ({
        ...prev,
        isAudioEnabled: !prev.isAudioEnabled
      }));
    }
  }, [webrtcConnection]);

  const toggleVideo = useCallback(() => {
    if (webrtcConnection.localStream) {
      const videoTracks = webrtcConnection.localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      
      setWebrtcConnection(prev => ({
        ...prev,
        isVideoEnabled: !prev.isVideoEnabled
      }));
    }
  }, [webrtcConnection]);

  // Effets
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && sosActive) {
      handleSOSCancel();
    }
  }, [countdown, sosActive]);

  // Simuler la position GPS
  useEffect(() => {
    if (isSharingPosition) {
      const interval = setInterval(() => {
        const newPosition: PositionData = {
          lat: -4.4419 + (Math.random() - 0.5) * 0.01,
          lng: 15.2663 + (Math.random() - 0.5) * 0.01,
          accuracy: 5 + Math.random() * 10,
          timestamp: new Date()
        };
        setCurrentPosition(newPosition);
        setPositionHistory(prev => [...prev.slice(-100), newPosition]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isSharingPosition]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-slate-800/95 backdrop-blur-lg border-b border-slate-700 p-3 sm:p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate?.('enhanced-home')}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
            </motion.button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold">USALAMA SOS</h1>
              <p className="text-xs text-slate-400">Protection immédiate</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {batteryLevel > 60 ? <Battery className="w-4 h-4 text-green-400" /> : <BatteryLow className="w-4 h-4 text-red-400" />}
              <span className="text-slate-300">{batteryLevel}%</span>
            </div>
            <div className="flex items-center gap-1">
              {signalStrength >= 3 ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
              <span className="text-slate-300">{signalStrength}/4</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interface Double Vue - Copilote */}
      <AnimatePresence>
        {(copilotConnection || mapView !== 'full') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`${
              mapView === 'split' ? 'h-64' : 
              mapView === 'copilot' ? 'h-96' : 'h-32'
            } bg-slate-900 border-b border-slate-800`}
          >
            {/* Barre d'état flottante */}
            <div className="absolute top-2 left-2 right-2 z-10 bg-slate-800/90 backdrop-blur rounded-lg p-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Status Shield intégré */}
                <div className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer ${
                  isSharingPosition && connectionStatus === 'connected' 
                    ? 'bg-green-600/20 border border-green-600/50' 
                    : 'bg-orange-600/20 border border-orange-600/50'
                }`}
                onClick={() => {
                  if (!isSharingPosition) {
                    setIsSharingPosition(true);
                    console.log('Position partagée activée');
                  }
                }}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    isSharingPosition && connectionStatus === 'connected' 
                      ? 'bg-green-600' 
                      : 'bg-orange-600'
                  }`}>
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                  <span className={`text-xs font-medium ${
                    isSharingPosition && connectionStatus === 'connected' 
                      ? 'text-green-400' 
                      : 'text-orange-400'
                  }`}>
                    {isSharingPosition && connectionStatus === 'connected' 
                      ? 'Position OK' 
                      : 'Position OFF'
                    }
                  </span>
                </div>

                {/* Microphone */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isMicrophoneActive ? 'bg-green-600' : 'bg-slate-600'
                }`}>
                  {isMicrophoneActive ? <Mic className="w-3 h-3 text-white" /> : <MicOff className="w-3 h-3 text-slate-400" />}
                </div>
                
                {/* Nom du copilote */}
                {copilotConnection && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{copilotConnection.name}</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Signal émis */}
                {isSignalActive && (
                  <div className="flex items-center gap-1">
                    <Signal className="w-4 h-4 text-green-400" />
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
                  </div>
                )}
                
                {/* Bouton SOS rapide */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleSOSActivation('emergency')}
                  className="w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center"
                >
                  <AlertTriangle className="w-4 h-4 text-white" />
                </motion.button>
              </div>
            </div>

            {/* Vue Double Écran */}
            <div className={`flex h-full ${
              mapView === 'split' ? '' : 
              mapView === 'copilot' ? 'flex-col' : ''
            }`}>
              {/* Côté Utilisateur Guidé */}
              {mapView !== 'copilot' && (
                <div className={`${
                  mapView === 'split' ? 'w-1/2' : 'w-full'
                } relative bg-slate-950 border-r border-slate-800`}>
                  {/* Map Canvas */}
                  <MapCanvas
                    currentPosition={currentPosition}
                    mapDrawings={mapDrawings}
                    dangerZones={navigationCommands}
                    onMapStateChange={(state) => setMapState(prev => ({ ...prev, ...state }))}
                    mapState={mapState}
                  />

                  {/* Indicateur de position partagée */}
                  {isSharingPosition && currentPosition && (
                    <div className="absolute bottom-2 left-2 bg-green-600/90 backdrop-blur rounded-lg px-3 py-2 text-xs flex items-center gap-2 z-30">
                      <Signal className="w-3 h-3" />
                      <span>Position partagée</span>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
                    </div>
                  )}

                  {/* Statut de connexion */}
                  <div className="absolute top-2 right-2 bg-slate-800/90 backdrop-blur rounded-lg px-2 py-1 text-xs flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'connected' ? 'bg-green-400' :
                      connectionStatus === 'connecting' ? 'bg-yellow-400' :
                      'bg-red-400'
                    } ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`} />
                    <span>{
                      connectionStatus === 'connected' ? 'Connecté' :
                      connectionStatus === 'connecting' ? 'Connexion...' :
                      'Déconnecté'
                    }</span>
                  </div>
                </div>
              )}

              {/* Côté Copilote */}
              {mapView !== 'full' && (
                <div className={`${
                  mapView === 'split' ? 'w-1/2' : 'w-full'
                } bg-slate-900 p-3`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-white">Panneau de Contrôle</h3>
                    <div className="flex gap-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setMapView('split')}
                        className={`p-1 rounded ${
                          mapView === 'split' ? 'bg-blue-600' : 'bg-slate-700'
                        }`}
                      >
                        <Move className="w-3 h-3 text-white" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Boutons de direction */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onMouseDown={() => sendDirectionCommand('up')}
                      className="bg-blue-600 hover:bg-blue-700 rounded-lg p-3 flex items-center justify-center"
                    >
                      <ArrowUp className="w-4 h-4 text-white" />
                    </motion.button>
                    <div />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onMouseDown={() => sendDirectionCommand('left')}
                      className="bg-blue-600 hover:bg-blue-700 rounded-lg p-3 flex items-center justify-center"
                    >
                      <ArrowLeft className="w-4 h-4 text-white" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onMouseDown={() => sendDirectionCommand('down')}
                      className="bg-blue-600 hover:bg-blue-700 rounded-lg p-3 flex items-center justify-center"
                    >
                      <ArrowDown className="w-4 h-4 text-white" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onMouseDown={() => sendDirectionCommand('right')}
                      className="bg-blue-600 hover:bg-blue-700 rounded-lg p-3 flex items-center justify-center"
                    >
                      <ArrowRight className="w-4 h-4 text-white" />
                    </motion.button>
                  </div>

                  {/* Outils */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-slate-700 hover:bg-slate-600 rounded-lg p-3 flex items-center justify-center gap-2"
                    >
                      <Pen className="w-4 h-4 text-white" />
                      <span className="text-xs text-white">Crayon</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={markDangerZone}
                      className="bg-red-600 hover:bg-red-700 rounded-lg p-3 flex items-center justify-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 text-white" />
                      <span className="text-xs text-white">Danger</span>
                    </motion.button>
                  </div>

                  {/* Voice Controller */}
                  <VoiceController
                    webrtcConnection={webrtcConnection}
                    onToggleAudio={toggleAudio}
                    onToggleVideo={toggleVideo}
                    connectionStatus={connectionStatus}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main SOS Interface */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-md mx-auto p-4 sm:p-6">
          {/* SOS Button */}
          <div className="mb-8 sm:mb-10">
            <motion.div
              animate={sosActive ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.5, repeat: sosActive ? Infinity : 0 }}
              className="relative max-w-xs mx-auto"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSOSActivation('emergency')}
                disabled={sosActive}
                className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center transition-all mx-auto ${
                  sosActive 
                    ? 'bg-red-600 shadow-red-600/50 animate-pulse' 
                    : 'bg-red-600 hover:bg-red-700 shadow-lg'
                }`}
              >
                <AlertTriangle className="w-7 h-7 sm:w-9 sm:h-9 text-white mb-1" />
                <span className="text-white font-bold text-xs sm:text-sm">
                  {sosActive ? `URGENCE ${countdown}s` : 'SOS'}
                </span>
              </motion.button>
              
              {sosActive && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSOSCancel}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </motion.button>
              )}
            </motion.div>
          </div>

          {/* Contacts d'urgence */}
          <div className="mb-8">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              Contacts d'Urgence
            </h2>
            <div className="space-y-3">
              {emergencyContacts.map((contact) => (
                <motion.div
                  key={contact.id}
                  whileHover={{ scale: 1.02 }}
                  className={`bg-slate-800/50 border rounded-lg p-4 transition-all cursor-pointer ${
                    selectedContact === contact.id 
                      ? 'border-blue-500 bg-blue-600/20' 
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                  onClick={() => setSelectedContact(contact.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{contact.name}</div>
                        <div className="text-xs text-slate-400">{contact.relation}</div>
                        {contact.isPrimary && (
                          <div className="flex items-center gap-1 text-xs text-blue-400">
                            <ShieldCheck className="w-3 h-3" />
                            Principal
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Bouton Copilote */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (copilotConnection?.id === contact.id) {
                            disconnectCopilot();
                          } else {
                            connectCopilot(contact.id);
                          }
                        }}
                        className={`p-2.5 rounded-lg transition-colors ${
                          copilotConnection?.id === contact.id
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                      >
                        {copilotConnection?.id === contact.id ? (
                          <RadioIcon className="w-4 h-4 text-white" />
                        ) : (
                          <Radio className="w-4 h-4 text-slate-400" />
                        )}
                      </motion.button>
                      
                      {/* Bouton Appel */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log(`Appel de ${contact.name}`);
                        }}
                        className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                      >
                        <Phone className="w-4 h-4 text-slate-400" />
                      </motion.button>
                    </div>
                  </div>
                  
                  {/* Statut du copilote */}
                  {copilotConnection?.id === contact.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-slate-700"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-green-400">Copilote connecté</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Battery className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-400">{copilotConnection.batteryLevel}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Wifi className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-400">{copilotConnection.signalStrength}/4</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowParentNotification(true)}
              className="bg-blue-600 hover:bg-blue-700 rounded-lg p-3 sm:p-4 flex flex-col items-center gap-2"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span className="text-white text-xs sm:text-sm">Notifier Parents</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMapView(mapView === 'split' ? 'full' : 'split')}
              className="bg-slate-700 hover:bg-slate-600 rounded-lg p-3 sm:p-4 flex flex-col items-center gap-2"
            >
              <Move className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span className="text-white text-xs sm:text-sm">Vue Carte</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSharingPosition(!isSharingPosition)}
              className={`rounded-lg p-3 sm:p-4 flex flex-col items-center gap-2 transition-colors ${
                isSharingPosition 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isSharingPosition ? (
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              ) : (
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              )}
              <span className="text-white text-xs sm:text-sm">
                {isSharingPosition ? 'Position ON' : 'Position OFF'}
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(!showSettings)}
              className="bg-slate-700 hover:bg-slate-600 rounded-lg p-3 sm:p-4 flex flex-col items-center gap-2"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span className="text-white text-xs sm:text-sm">Paramètres</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Éléments vidéo cachés pour WebRTC */}
      <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />
      <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />

      {/* Parent Notification View */}
      <AnimatePresence>
        {showParentNotification && (
          <ParentNotificationView
            alertId="alert-123"
            childName="Nathan"
            copilotName={copilotConnection?.name || "Ami"}
            currentPosition={currentPosition}
            onClose={() => setShowParentNotification(false)}
          />
        )}
      </AnimatePresence>

      {/* Barre de navigation inférieure */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-lg border-t border-slate-700 z-40">
        <div className="flex items-center justify-around py-2">
          {navigationItems.map((item) => {
            const icons: Record<string, JSX.Element> = {
              'Shield': <Home className="w-4 h-4 sm:w-5 sm:h-5" />,
              'Map': <Map className="w-4 h-4 sm:w-5 sm:h-5" />,
              'Phone': <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />,
              'Users': <Users className="w-4 h-4 sm:w-5 sm:h-5" />,
              'User': <User className="w-4 h-4 sm:w-5 sm:h-5" />
            };
            
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (item.id === 'sos') {
                    handleSOSActivation('emergency');
                  } else {
                    onNavigate?.(item.id);
                  }
                }}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors hover:bg-slate-700 ${
                  item.id === 'sos' ? 'bg-red-600/20 hover:bg-red-600/30' : ''
                }`}
              >
                <div className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  item.id === 'sos' ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {icons[item.icon]}
                </div>
                <span className={`text-xs ${
                  item.id === 'sos' ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SOSScreen;
