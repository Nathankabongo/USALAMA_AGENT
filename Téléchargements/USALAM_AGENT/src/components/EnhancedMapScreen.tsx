import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Navigation, AlertTriangle, Battery, Clock,
  Phone, Share2, MapPin, Route, Wifi, WifiOff, X,
  Search, Layers, User, Bell, Activity, Volume2, VolumeX,
  Cloud, CloudRain, Sun, Wind, Thermometer, Globe,
  Navigation2, Crosshair, Compass, Map, Satellite, AlertCircle,
  MessageSquare, Ghost, Eye, EyeOff, ShieldAlert, Send,
  Zap, MoreVertical, Maximize2, Minimize2, FileText, Calculator,
  ShieldCheck, Camera, Pocket, UserPlus, ChevronLeft, Map as MapIcon,
  Circle as CircleIcon, UserCheck, Smartphone, Lock, Route as RouteIcon,
  Ambulance, Hospital, Stethoscope, LifeBuoy, Flashlight,
  BarChart3, TrendingUp, RadioReceiver, Radio, MapPin2, Compass2,
  Users2, ShieldAlert as ShieldAlertIcon, Activity as ActivityIcon,
  Plus, Expand, Star, RefreshCw
} from 'lucide-react';
import KinshasaMap, { MapStyle, MapMarker, MapCircle, MapPolyline } from './map/KinshasaMap';
import { NavigationProps } from '../types/navigation';
import { evacuationNavigation, EvacuationRoute, SafePoint } from '../services/evacuationNavigation';
import { multiChannelCommunication } from '../services/multiChannelCommunication';
import { analyticsReports } from '../services/analyticsReports';
import { survivalMode } from '../services/survivalMode';
import { externalIntegrations, MedicalService, AmbulanceService } from '../services/externalIntegrations';
import { trackingService, TrackingSession, TrackingPoint } from '../services/trackingService';
import { voiceNavigationService, NavigationInstruction, VoiceSettings } from '../services/voiceNavigationService';
import TrackingPanel from './TrackingPanel';
import { friendService, Friend } from '../services/friendService';
import FriendTrackingWizard from './FriendTrackingWizard';
import { locateByPhone, normalizePhone, PhoneLocationResult } from '../services/phoneTracker';

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

interface TrackingData {
  currentPosition: { lat: number; lng: number };
  batteryLevel: number;
  signalStrength: number;
  eta: Date;
  isOnRoute: boolean;
  deviationDistance: number;
  lastUpdate: Date;
  speed: number;
  heading: number;
}

interface WeatherData {
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  humidity: number;
  windSpeed: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskMessage: string;
}

// Zones rouges réelles de Kinshasa
const RED_ZONES: RedZone[] = [
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
    coordinates: { lat: -4.4459, lng: 15.2813 },
    radius: 250,
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
    radius: 200,
    severity: 'low',
    type: 'construction',
    lastUpdated: new Date(Date.now() - 45 * 60 * 1000),
    description: 'Travaux routiers, circulation perturbée'
  },
  {
    id: '5',
    name: 'Matete',
    coordinates: { lat: -4.425, lng: 15.322 },
    radius: 350,
    severity: 'high',
    type: 'insecurity',
    lastUpdated: new Date(Date.now() - 3 * 60 * 60 * 1000),
    description: 'Zone à surveiller la nuit'
  }
];

// Points sûrs de Kinshasa
const SAFE_POINTS = [
  { id: 's1', lat: -4.435, lng: 15.27, name: 'Hôpital Général', type: 'safe' as const, color: '#ef4444', icon: '🏥', label: 'Hôpital Général de Kinshasa' },
  { id: 's2', lat: -4.4447, lng: 15.267, name: 'Commissariat', type: 'safe' as const, color: '#3b82f6', icon: '🚔', label: 'Commissariat de Police' },
  { id: 's3', lat: -4.4431, lng: 15.2685, name: 'Église Ste Anne', type: 'safe' as const, color: '#a855f7', icon: '⛪', label: 'Église Sainte Anne' },
  { id: 's4', lat: -4.4425, lng: 15.2675, name: 'Centre USALAMA', type: 'safe' as const, color: '#f59e0b', icon: '🛡️', label: 'Centre Communautaire USALAMA' },
];

const SEARCH_LOCATIONS: Location[] = [
  { lat: -4.3959, lng: 15.3213, name: 'Limete', address: 'Limete, Kinshasa' },
  { lat: -4.4419, lng: 15.2663, name: 'Gombe', address: 'Gombe, Kinshasa' },
  { lat: -4.325, lng: 15.322, name: 'Matete', address: 'Matete, Kinshasa' },
  { lat: -4.425, lng: 15.285, name: 'Kalamu', address: 'Kalamu, Kinshasa' },
  { lat: -4.385, lng: 15.245, name: 'Ngiri-Ngiri', address: 'Ngiri-Ngiri, Kinshasa' },
  { lat: -4.405, lng: 15.295, name: 'Kasa-Vubu', address: 'Kasa-Vubu, Kinshasa' },
  { lat: -4.44, lng: 15.256, name: 'Lingwala', address: 'Lingwala, Kinshasa' },
  { lat: -4.462, lng: 15.314, name: 'Masina', address: 'Masina, Kinshasa' },
  { lat: -4.38, lng: 15.298, name: 'Ndjili', address: 'Ndjili, Kinshasa' },
];

const SEVERITY_COLORS: Record<string, { color: string; fill: string; label: string }> = {
  critical: { color: '#ef4444', fill: '#ef4444', label: 'Critique' },
  high: { color: '#f97316', fill: '#f97316', label: 'Élevé' },
  medium: { color: '#eab308', fill: '#eab308', label: 'Moyen' },
  low: { color: '#22c55e', fill: '#22c55e', label: 'Faible' },
};

interface TacticalMessage {
  id: string;
  sender: 'guide' | 'user';
  text: string;
  time: Date;
  isSignal?: boolean;
}

const INITIAL_TACTICAL_MESSAGES: TacticalMessage[] = [
  { id: '1', sender: 'guide', text: 'Bienvenue dans le canal sécurisé. Je vous guide jusqu\'à l\'hôpital.', time: new Date() },
];

const EnhancedMapScreen: React.FC<NavigationProps> = ({ onNavigate }) => {
  // Carte
  const [mapStyle, setMapStyle] = useState<MapStyle>('dark');
  const [mapCenter, setMapCenter] = useState<[number, number]>([-4.4419, 15.2663]);
  const [mapZoom, setMapZoom] = useState(13);
  const [showStylePicker, setShowStylePicker] = useState(false);

  // Navigation
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [destination, setDestination] = useState<Location | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  // Suivi
  const [isTracking, setIsTracking] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [userPosition, setUserPosition] = useState<[number, number]>([-4.4419, 15.2663]);
  const [movementTrail, setMovementTrail] = useState<[number, number][]>([]);
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);

  // Couches
  const [showRedZones, setShowRedZones] = useState(true);
  const [showSafePoints, setShowSafePoints] = useState(true);
  const [showRoute, setShowRoute] = useState(false);
  const [showLayers, setShowLayers] = useState(false);

  // Météo
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [showWeather, setShowWeather] = useState(false);

  // Guidage vocal
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(voiceNavigationService.getSettings());
  const [currentInstruction, setCurrentInstruction] = useState<NavigationInstruction | null>(null);
  
  // Tracabilité
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [showTrackingPanel, setShowTrackingPanel] = useState(false);
  const [trackingSession, setTrackingSession] = useState<TrackingSession | null>(null);
  const [trackingPoints, setTrackingPoints] = useState<[number, number][]>([]);

  // Alerte
  const [alertTriggered, setAlertTriggered] = useState(false);

  // --- INITIALISATION DES SERVICES AVANCÉS ---
  useEffect(() => {
    // Initialiser la navigation d'évacuation
    if (userPosition) {
      evacuationNavigation.calculateSafeRoutes(userPosition[0], userPosition[1])
        .then(routes => setEvacuationRoutes(routes));
      setSafePoints(evacuationNavigation.getNearbySafePoints(userPosition[0], userPosition[1]));
    }

    // Initialiser les services médicaux
    if (userPosition) {
      setMedicalServices(externalIntegrations.getNearbyMedicalServices(userPosition[0], userPosition[1]));
      setAmbulances(externalIntegrations.getAvailableAmbulances(userPosition[0], userPosition[1]));
    }

    // Initialiser l'analyse
    setStatistics(analyticsReports.getStatistics());
    setHeatmapData(analyticsReports.getHeatmapData());

    // Initialiser le mode survie
    setSurvivalTools(survivalMode.getSurvivalTools());
    setCompassData(survivalMode.getCompassData());

    // Initialiser la communication
    setChannelStatus(multiChannelCommunication.getChannelStatus());
  }, [userPosition]);

  // --- SUIVI D'AMIS ---
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showFriendWizard, setShowFriendWizard] = useState(false);

  // --- PHONE TRACKER INTÉGRÉ ---
  const [showPhoneTracker, setShowPhoneTracker] = useState(false);
  const [phoneTrackerInput, setPhoneTrackerInput] = useState('');
  const [phoneTrackerStep, setPhoneTrackerStep] = useState<'input' | 'loading' | 'result' | 'error'>('input');
  const [phoneTrackerResult, setPhoneTrackerResult] = useState<PhoneLocationResult | null>(null);
  const [phoneTrackerLoadingText, setPhoneTrackerLoadingText] = useState('Connexion aux tours cellulaires...');

  const phoneTrackerMessages = [
    'Connexion aux tours cellulaires...',
    'Triangulation du signal en cours...',
    'Analyse des données opérateur...',
    'Calcul de la position GPS...',
    'Vérification de la précision...',
    'Finalisation des coordonnées...',
  ];

  useEffect(() => {
    if (phoneTrackerStep === 'loading') {
      let idx = 0;
      const interval = setInterval(() => {
        idx = (idx + 1) % phoneTrackerMessages.length;
        setPhoneTrackerLoadingText(phoneTrackerMessages[idx]);
      }, 600);
      return () => clearInterval(interval);
    }
  }, [phoneTrackerStep]);

  const handlePhoneTrackerSearch = async () => {
    if (!phoneTrackerInput.trim() || phoneTrackerInput.length < 8) return;
    const normalized = normalizePhone(phoneTrackerInput);
    setPhoneTrackerStep('loading');
    setPhoneTrackerLoadingText(phoneTrackerMessages[0]);
    try {
      const res = await locateByPhone(normalized);
      setPhoneTrackerResult(res);
      if (res.status === 'found') {
        setPhoneTrackerStep('result');
        // Centrer la carte sur le résultat
        setMapCenter([res.lat, res.lng]);
        setMapZoom(15);
      } else {
        setPhoneTrackerStep('error');
      }
    } catch {
      setPhoneTrackerResult(null);
      setPhoneTrackerStep('error');
    }
  };

  const handlePhoneTrackerReset = () => {
    setPhoneTrackerInput('');
    setPhoneTrackerStep('input');
    setPhoneTrackerResult(null);
  };

  useEffect(() => {
    const loadFriends = async () => {
      await friendService.init();
      const allFriends = await friendService.getFriends();
      setFriends(allFriends);
    };
    loadFriends();
  }, []);

  const [activeGuide, setActiveGuide] = useState<'none' | 'hospital' | 'police' | 'contact'>('none');
  
  // --- GESTION DE LA POSITION UTILISATEUR ---
  const [showTacticalPanel, setShowTacticalPanel] = useState(false);
  const [stealthMode, setStealthMode] = useState<'off' | 'active' | 'chameleon'>('off');
  const [tacticalMessages, setTacticalMessages] = useState<TacticalMessage[]>(INITIAL_TACTICAL_MESSAGES);
  const [newTacticalMsg, setNewTacticalMsg] = useState('');
  const [isPoliceGuided, setIsPoliceGuided] = useState(false);

  // Initialisation des services de tracabilité et navigation vocale
  useEffect(() => {
    // Configurer les écouteurs du service de tracabilité
    trackingService.addListener('onPositionUpdate', handleTrackingUpdate);
    trackingService.addListener('onSessionStart', handleTrackingSessionStart);
    trackingService.addListener('onSessionEnd', handleTrackingSessionEnd);
    trackingService.addListener('onEmergencyTrigger', handleTrackingEmergency);

    // Configurer les écouteurs du service de navigation vocale
    voiceNavigationService.addListener('onInstruction', handleVoiceInstruction);
    voiceNavigationService.addListener('onRouteUpdate', handleVoiceRouteUpdate);
    voiceNavigationService.addListener('onArrival', handleVoiceArrival);
    voiceNavigationService.addListener('onDangerAlert', handleVoiceDangerAlert);

    // Charger la session de tracabilité active
    const activeSession = trackingService.getCurrentSession();
    if (activeSession) {
      setTrackingSession(activeSession);
      setTrackingEnabled(true);
      // Convertir les points en format pour la carte
      const points = activeSession.points.map(p => [p.latitude, p.longitude] as [number, number]);
      setTrackingPoints(points);
    }

    return () => {
      trackingService.addListener('onPositionUpdate', () => {});
      trackingService.addListener('onSessionStart', () => {});
      trackingService.addListener('onSessionEnd', () => {});
      trackingService.addListener('onEmergencyTrigger', () => {});
      voiceNavigationService.addListener('onInstruction', () => {});
      voiceNavigationService.addListener('onRouteUpdate', () => {});
      voiceNavigationService.addListener('onArrival', () => {});
      voiceNavigationService.addListener('onDangerAlert', () => {});
    };
  }, []);

  // --- GESTIONNAIRES D'ÉVÉNEMENTS TRACABILITÉ ---
  const handleTrackingUpdate = (point: TrackingPoint) => {
    // Mettre à jour la position de l'utilisateur sur la carte
    const newPosition: [number, number] = [point.latitude, point.longitude];
    setUserPosition(newPosition);
    
    // Ajouter le point à la trajectoire
    setTrackingPoints(prev => [...prev.slice(-100), newPosition]);
    
    // Mettre à jour la session actuelle
    const session = trackingService.getCurrentSession();
    if (session) {
      setTrackingSession(session);
    }
  };

  const handleTrackingSessionStart = (session: TrackingSession) => {
    setTrackingSession(session);
    setTrackingEnabled(true);
  };

  const handleTrackingSessionEnd = (session: TrackingSession) => {
    setTrackingSession(null);
    setTrackingEnabled(false);
  };

  const handleTrackingEmergency = (point: TrackingPoint) => {
    // Afficher une alerte d'urgence
    setAlertTriggered(true);
    setTimeout(() => setAlertTriggered(false), 5000);
  };

  // --- GESTIONNAIRES D'ÉVÉNEMENTS NAVIGATION VOCALE ---
  const handleVoiceInstruction = (instruction: NavigationInstruction) => {
    setCurrentInstruction(instruction);
  };

  const handleVoiceRouteUpdate = (route: any) => {
    // Mettre à jour l'itinéraire sur la carte
    console.log('Route mise à jour:', route);
  };

  const handleVoiceArrival = () => {
    // Gérer l'arrivée à destination
    setCurrentInstruction({
      id: 'arrival',
      type: 'arrived',
      direction: 'straight',
      distance: 0,
      text: 'Vous êtes arrivé à destination',
      voiceText: 'Vous êtes arrivé à destination',
      urgency: 'medium',
      timestamp: new Date()
    });
  };

  const handleVoiceDangerAlert = (alert: any) => {
    // Gérer les alertes de danger
    setAlertTriggered(true);
    setTimeout(() => setAlertTriggered(false), 3000);
  };

  // --- FONCTIONS DE CONTRÔLE ---
  const toggleTracking = async () => {
    if (trackingEnabled) {
      await trackingService.stopTracking();
      setTrackingEnabled(false);
    } else {
      await trackingService.startTracking('manual');
      setTrackingEnabled(true);
    }
  };

  const toggleVoiceNavigation = () => {
    const newSettings = { ...voiceSettings, enabled: !voiceSettings.enabled };
    voiceNavigationService.updateSettings(newSettings);
    setVoiceSettings(newSettings);
    setVoiceEnabled(!voiceEnabled);
  };

  const startEmergencyTracking = async () => {
    await trackingService.startTracking('emergency');
    setTrackingEnabled(true);
    // Activer le mode urgence dans la navigation vocale
    voiceNavigationService.updateSettings({ ...voiceSettings, emergencyMode: true });
  };
  
  // --- NOUVEAUX MODULES (CENTRE DE CONTRÔLE) ---
  const [activeOverlay, setActiveOverlay] = useState<'none' | 'safezones' | 'evidence' | 'guardians' | 'circle'>('none');
  
  // --- INTÉGRATION SERVICES AVANCÉS ---
  const [evacuationRoutes, setEvacuationRoutes] = useState<EvacuationRoute[]>([]);
  const [safePoints, setSafePoints] = useState<SafePoint[]>([]);
  const [showEvacuationLayer, setShowEvacuationLayer] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<EvacuationRoute | null>(null);
  
  const [medicalServices, setMedicalServices] = useState<MedicalService[]>([]);
  const [ambulances, setAmbulances] = useState<AmbulanceService[]>([]);
  const [showMedicalLayer, setShowMedicalLayer] = useState(false);
  
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [showAnalyticsLayer, setShowAnalyticsLayer] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  
  const [survivalTools, setSurvivalTools] = useState<any[]>([]);
  const [compassData, setCompassData] = useState<any>(null);
  const [showSurvivalLayer, setShowSurvivalLayer] = useState(false);
  
  const [channelStatus, setChannelStatus] = useState<any[]>([]);
  const [showCommunicationLayer, setShowCommunicationLayer] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- MOCK DATA POUR LES MODULES ---
  const [safeZones, setSafeZones] = useState([
    { id: 'z1', name: 'Maison', lat: -4.4419, lng: 15.2663, radius: 200 },
    { id: 'z2', name: 'Travail', lat: -4.4259, lng: 15.2813, radius: 150 },
  ]);

  const [nearbyGuardians] = useState([
    { id: 'g1', name: 'Papa Noël', distance: '0.4km', status: 'dispo', phone: '+2430000000', rating: 4.9, icon: '🛡️' },
    { id: 'g2', name: 'Brigade Gombe', distance: '0.9km', status: 'en patrouille', phone: '+2431111111', rating: 4.7, icon: '🚓' },
    { id: 'g3', name: 'Mama Sarah', distance: '1.2km', status: 'dispo', phone: '+2432222222', rating: 5.0, icon: '👵🏾' },
  ]);

  const [trustedCircle] = useState([
    { id: 'c1', name: 'Maman', role: 'Famille', isTracking: false },
    { id: 'c2', name: 'Frère Marc', role: 'Famille', isTracking: true },
    { id: 'c3', name: 'Capitaine Police', role: 'Officiel', isTracking: false },
  ]);

  useEffect(() => {
    if (showTacticalPanel) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [tacticalMessages, showTacticalPanel]);

  const toggleStealth = () => {
    if (stealthMode === 'off') setStealthMode('active');
    else if (stealthMode === 'active') setStealthMode('chameleon');
    else setStealthMode('off');
  };

  const sendTacticalMessage = (text: string, isSignal = false) => {
    if (!text.trim()) return;
    const msg: TacticalMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: new Date(),
      isSignal
    };
    setTacticalMessages(prev => [...prev, msg]);
    setNewTacticalMsg('');

    // Simulation de réponse du guide après 1.5s
    if (!isSignal) {
      setTimeout(() => {
        const response: TacticalMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'guide',
          text: "Bien reçu. Continuez sur 200m, puis tournez à gauche. Zone dégagée.",
          time: new Date()
        };
        setTacticalMessages(prev => [...prev, response]);
      }, 1500);
    }
  };

  const startPoliceGuidance = () => {
    setIsPoliceGuided(true);
    setActiveGuide('police');
    setShowTacticalPanel(true);
    sendTacticalMessage("👮 Signal discret envoyé à la police. Guidage activé.", true);
  };

  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Géolocalisation réelle
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const position: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserPosition(position);
          setMapCenter(position);
        },
        () => {
          // Fallback : Gombe, Kinshasa
          setUserPosition([-4.4419, 15.2663]);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    // Météo simulée
    setWeather({
      temperature: 29 + Math.random() * 5,
      condition: Math.random() > 0.6 ? 'rainy' : Math.random() > 0.3 ? 'cloudy' : 'sunny',
      humidity: 72 + Math.random() * 18,
      windSpeed: 6 + Math.random() * 12,
      riskLevel: 'medium',
      riskMessage: 'Conditions acceptables',
    });
  }, []);

  // Recherche de destination
  useEffect(() => {
    if (searchQuery.length > 1) {
      const results = SEARCH_LOCATIONS.filter(loc =>
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const selectDestination = (loc: Location) => {
    setDestination(loc);
    setSearchQuery(loc.name);
    setSearchResults([]);
    setShowSearch(false);

    // Calculer l'itinéraire simple
    const start = userPosition;
    const end: [number, number] = [loc.lat, loc.lng];
    const midpoint1: [number, number] = [
      start[0] + (end[0] - start[0]) * 0.33,
      start[1] + (end[1] - start[1]) * 0.25,
    ];
    const midpoint2: [number, number] = [
      start[0] + (end[0] - start[0]) * 0.66,
      start[1] + (end[1] - start[1]) * 0.75,
    ];
    setRoutePolyline([start, midpoint1, midpoint2, end]);
    setShowRoute(true);

    // Centrer la carte entre les deux points
    setMapCenter([
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2,
    ]);
    setMapZoom(12);
  };

  const startTracking = () => {
    if (!destination) return;
    setIsTracking(true);
    setMovementTrail([userPosition]);

    let currentPos = [...userPosition] as [number, number];
    const target: [number, number] = [destination.lat, destination.lng];

    trackingIntervalRef.current = setInterval(() => {
      // Simuler déplacement progressif vers la destination
      const speed = 0.0003 + Math.random() * 0.0002;
      const dlat = (target[0] - currentPos[0]);
      const dlng = (target[1] - currentPos[1]);
      const dist = Math.sqrt(dlat * dlat + dlng * dlng);

      if (dist < 0.001) {
        stopTracking();
        return;
      }

      const heading = Math.atan2(dlng, dlat) * 180 / Math.PI;
      const jitter = (Math.random() - 0.5) * 0.0001;

      currentPos = [
        currentPos[0] + (dlat / dist) * speed + jitter,
        currentPos[1] + (dlng / dist) * speed + jitter,
      ];

      setUserPosition([...currentPos]);
      setMapCenter([...currentPos]);
      setMovementTrail(prev => [...prev.slice(-20), [...currentPos] as [number, number]]);

      setTrackingData({
        currentPosition: { lat: currentPos[0], lng: currentPos[1] },
        batteryLevel: Math.max(40, 100 - Math.random() * 5),
        signalStrength: Math.random() > 0.2 ? 4 : 2,
        eta: new Date(Date.now() + (dist / speed) * 2000),
        isOnRoute: Math.random() > 0.1,
        deviationDistance: Math.random() * 50,
        lastUpdate: new Date(),
        speed: 8 + Math.random() * 12,
        heading,
      });
    }, 1500);
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
    }
  };

  const centerOnUser = () => {
    setMapCenter([...userPosition]);
    setMapZoom(15);
  };

  // Construire les marqueurs pour la carte
  const mapMarkers: MapMarker[] = [
    ...(showSafePoints ? SAFE_POINTS : []),
    ...(destination ? [{
      id: 'destination',
      lat: destination.lat,
      lng: destination.lng,
      type: 'destination' as const,
      icon: '🎯',
      label: destination.name,
      color: '#22c55e',
    }] : []),
    // Marqueurs d'évacuation
    ...(showEvacuationLayer ? safePoints.map(point => ({
      id: `evac-${point.id}`,
      lat: point.lat,
      lng: point.lng,
      type: 'safe' as const,
      icon: '🛡️',
      label: point.name,
      color: '#10b981',
    })) : []),
    // Services médicaux
    ...(showMedicalLayer ? medicalServices.map(service => ({
      id: `med-${service.id}`,
      lat: service.location.lat,
      lng: service.location.lng,
      type: 'safe' as const,
      icon: service.type === 'hospital' ? '🏥' : '🏥',
      label: `${service.name} (${Math.round((service as any).distance || 0)}m)`,
      color: '#ef4444',
    })) : []),
    ...(showMedicalLayer ? ambulances.map(ambulance => ({
      id: `amb-${ambulance.id}`,
      lat: -4.4419, // Position simulée
      lng: 15.2663,
      type: 'safe' as const,
      icon: '🚑',
      label: `${ambulance.name} (${ambulance.fleet.available}/${ambulance.fleet.total})`,
      color: '#f97316',
    })) : []),
    // Outils de survie
    ...(showSurvivalLayer ? survivalTools.filter(tool => tool.available).map(tool => ({
      id: `surv-${tool.id}`,
      lat: userPosition[0] + (Math.random() - 0.5) * 0.01, // Position simulée près de l'utilisateur
      lng: userPosition[1] + (Math.random() - 0.5) * 0.01,
      type: 'safe' as const,
      icon: tool.icon,
      label: tool.name,
      color: '#f59e0b',
    })) : []),
    // Amis
    ...friends.filter(f => f.isActive && f.lastLocation).map(f => ({
      id: `friend-${f.id}`,
      lat: f.lastLocation!.lat,
      lng: f.lastLocation!.lng,
      type: 'user' as const,
      icon: '👤',
      label: f.name,
      color: '#3b82f6',
      onClick: () => setSelectedFriend(f)
    })),
    // Téléphone tracké
    ...(phoneTrackerResult && phoneTrackerResult.status === 'found' ? [{
      id: 'phone-tracked',
      lat: phoneTrackerResult.lat,
      lng: phoneTrackerResult.lng,
      type: 'user' as const,
      icon: '📱',
      label: `📍 ${phoneTrackerResult.phone}`,
      color: '#ef4444',
    }] : []),
  ];

  // Construire les cercles de danger
  const mapCircles: MapCircle[] = showRedZones ? RED_ZONES.map(z => ({
    id: z.id,
    lat: z.coordinates.lat,
    lng: z.coordinates.lng,
    radius: z.radius,
    color: SEVERITY_COLORS[z.severity].color,
    fillColor: SEVERITY_COLORS[z.severity].fill,
    label: `<b>${z.name}</b><br/>${z.description}`,
  })) : [];

  // Construire les polylines
  const mapPolylines: MapPolyline[] = [];
  if (showRoute && routePolyline.length > 1) {
    mapPolylines.push({
      id: 'route',
      points: routePolyline,
      color: '#22c55e',
      weight: 5,
    });
  }
  if (movementTrail.length > 1) {
    mapPolylines.push({
      id: 'trail',
      points: movementTrail,
      color: '#60a5fa',
      weight: 3,
      dashArray: '6, 4',
    });
  }
  // Trajectoire de tracabilité
  if (trackingPoints.length > 1) {
    mapPolylines.push({
      id: 'tracking',
      points: trackingPoints,
      color: '#f59e0b',
      weight: 4,
      dashArray: '8, 2',
    });
  }
  // Routes d'évacuation
  if (showEvacuationLayer && evacuationRoutes.length > 0) {
    evacuationRoutes.forEach((route, index) => {
      if (route.waypoints.length > 1) {
        const points = route.waypoints.map(wp => [wp.lat, wp.lng] as [number, number]);
        mapPolylines.push({
          id: `evac-route-${route.id}`,
          points,
          color: selectedRoute?.id === route.id ? '#10b981' : '#6b7280',
          weight: selectedRoute?.id === route.id ? 6 : 4,
          dashArray: selectedRoute?.id === route.id ? undefined : '4, 2',
        });
      }
    });
  }

  const calculateDistance = (a: [number, number], b: [number, number]) => {
    const R = 6371;
    const dLat = (b[0] - a[0]) * Math.PI / 180;
    const dLon = (b[1] - a[1]) * Math.PI / 180;
    const aa = Math.sin(dLat / 2) ** 2 +
      Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  };

  const distanceToDestination = destination
    ? calculateDistance(userPosition, [destination.lat, destination.lng])
    : null;

  const getWeatherIcon = () => {
    if (!weather) return null;
    switch (weather.condition) {
      case 'sunny': return <Sun className="w-4 h-4 text-yellow-400" />;
      case 'cloudy': return <Cloud className="w-4 h-4 text-slate-400" />;
      case 'rainy': return <CloudRain className="w-4 h-4 text-blue-400" />;
      case 'stormy': return <CloudRain className="w-4 h-4 text-purple-400" />;
      default: return <Cloud className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden">

      {/* ═══ CARTE PRINCIPALE ═══ */}
      <div className="absolute inset-0">
        <KinshasaMap
          center={mapCenter}
          zoom={mapZoom}
          mapStyle={mapStyle}
          markers={mapMarkers}
          circles={mapCircles}
          polylines={mapPolylines}
          userPosition={userPosition}
          userHeading={trackingData?.heading ?? 0}
          movementTrail={movementTrail}
        />
      </div>

      {/* ═══ HEADER HUD ═══ */}
      <div className="absolute top-0 left-0 right-0 z-[1000]">
        <div className="bg-slate-900/85 backdrop-blur-xl border-b border-white/10 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Titre + météo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate?.('enhanced-home')}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div>
                <h1 className="text-white font-bold text-sm leading-none">Carte Sécurité</h1>
                <p className="text-blue-400 text-xs mt-0.5">Kinshasa • Temps réel</p>
              </div>
            </div>

            {/* Infos rapides */}
            <div className="flex items-center gap-2">
              {/* Météo */}
              {weather && (
                <button
                  onClick={() => setShowWeather(!showWeather)}
                  className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-colors"
                >
                  {getWeatherIcon()}
                  <span className="text-white text-xs font-medium">{weather.temperature.toFixed(0)}°C</span>
                </button>
              )}

              {/* Guidage vocal */}
              <button
                onClick={toggleVoiceNavigation}
                className={`p-2 rounded-xl transition-colors ${voiceEnabled ? 'bg-blue-600' : 'bg-white/10 hover:bg-white/20'}`}
                title="Navigation vocale"
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4 text-white" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>

              {/* Tracabilité */}
              <button
                onClick={toggleTracking}
                className={`p-2 rounded-xl transition-colors ${trackingEnabled ? 'bg-orange-600' : 'bg-white/10 hover:bg-white/20'}`}
                title="Tracabilité GPS"
              >
                <Radio className="w-4 h-4 text-white" />
              </button>

              {/* Couches */}
              <button
                onClick={() => setShowLayers(!showLayers)}
                className={`p-2 rounded-xl transition-colors ${showLayers ? 'bg-blue-600' : 'bg-white/10 hover:bg-white/20'}`}
              >
                <Layers className="w-4 h-4 text-white" />
              </button>

              {/* Mode Discret / Caméléon */}
              <button
                onClick={toggleStealth}
                className={`p-2 rounded-xl transition-colors ${stealthMode !== 'off' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'}`}
                title="Mode Discret"
              >
                {stealthMode === 'chameleon' ? <Calculator className="w-4 h-4 text-white" /> : <Ghost className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ PANNEAU MÉTÉO ═══ */}
      <AnimatePresence>
        {showWeather && weather && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-[68px] left-4 right-4 z-[900] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-semibold text-sm">Conditions météo — Kinshasa</span>
              <button onClick={() => setShowWeather(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <Thermometer className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                <div className="text-white font-bold">{weather.temperature.toFixed(0)}°C</div>
                <div className="text-slate-400 text-xs">Température</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <CloudRain className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <div className="text-white font-bold">{weather.humidity.toFixed(0)}%</div>
                <div className="text-slate-400 text-xs">Humidité</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <Wind className="w-4 h-4 text-teal-400 mx-auto mb-1" />
                <div className="text-white font-bold">{weather.windSpeed.toFixed(0)} km/h</div>
                <div className="text-slate-400 text-xs">Vent</div>
              </div>
            </div>
            <div className={`mt-3 px-3 py-2 rounded-xl text-xs font-medium text-center ${
              weather.riskLevel === 'critical' ? 'bg-red-600/30 text-red-300' :
              weather.riskLevel === 'high' ? 'bg-orange-600/30 text-orange-300' :
              weather.riskLevel === 'medium' ? 'bg-yellow-600/30 text-yellow-300' :
              'bg-green-600/30 text-green-300'
            }`}>
              {weather.riskMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ PANNEAU COUCHES ═══ */}
      <AnimatePresence>
        {showLayers && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-[68px] right-4 z-[900] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-56"
          >
            <div className="text-white font-semibold text-sm mb-3">Couches carte</div>

            {/* Style de carte */}
            <div className="mb-4">
              <div className="text-slate-400 text-xs mb-2">Style</div>
              <div className="grid grid-cols-3 gap-1">
                {([
                  { value: 'dark', label: '🌙 Nuit', id: 'style-dark' },
                  { value: 'standard', label: '🗺️ Plan', id: 'style-standard' },
                  { value: 'satellite', label: '🛰️ Sat.', id: 'style-satellite' },
                ] as { value: MapStyle; label: string; id: string }[]).map(s => (
                  <button
                    key={s.value}
                    id={s.id}
                    onClick={() => setMapStyle(s.value)}
                    className={`py-2 px-1 rounded-xl text-xs font-medium transition-colors text-center ${
                      mapStyle === s.value ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles couches */}
            <div className="space-y-2">
              <button
                onClick={() => setShowRedZones(!showRedZones)}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2 transition-colors"
              >
                <span className="text-slate-300 text-xs">⚠️ Zones de danger</span>
                <div className={`w-8 h-4 rounded-full transition-colors ${showRedZones ? 'bg-red-500' : 'bg-slate-600'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${showRedZones ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </button>

              <button
                onClick={() => setShowSafePoints(!showSafePoints)}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2 transition-colors"
              >
                <span className="text-slate-300 text-xs">🛡️ Points sûrs</span>
                <div className={`w-8 h-4 rounded-full transition-colors ${showSafePoints ? 'bg-green-500' : 'bg-slate-600'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${showSafePoints ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </button>

              {showRoute && (
                <button
                  onClick={() => setShowRoute(!showRoute)}
                  className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2 transition-colors"
                >
                  <span className="text-slate-300 text-xs">🛣️ Itinéraire</span>
                    <div className={`w-8 h-4 rounded-full transition-colors ${showRoute ? 'bg-blue-500' : 'bg-slate-600'}`}>
                    <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${showRoute ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                </button>
              )}

              {/* Nouvelles couches avancées */}
              <button
                onClick={() => setShowEvacuationLayer(!showEvacuationLayer)}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2 transition-colors"
              >
                <span className="text-slate-300 text-xs">🚸 Évacuation</span>
                <div className={`w-8 h-4 rounded-full transition-colors ${showEvacuationLayer ? 'bg-green-500' : 'bg-slate-600'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${showEvacuationLayer ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </button>

              <button
                onClick={() => setShowMedicalLayer(!showMedicalLayer)}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2 transition-colors"
              >
                <span className="text-slate-300 text-xs">🏥 Services médicaux</span>
                <div className={`w-8 h-4 rounded-full transition-colors ${showMedicalLayer ? 'bg-red-500' : 'bg-slate-600'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${showMedicalLayer ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </button>

              <button
                onClick={() => setShowAnalyticsLayer(!showAnalyticsLayer)}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2 transition-colors"
              >
                <span className="text-slate-300 text-xs">📊 Analyse</span>
                <div className={`w-8 h-4 rounded-full transition-colors ${showAnalyticsLayer ? 'bg-purple-500' : 'bg-slate-600'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${showAnalyticsLayer ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </button>

              <button
                onClick={() => setShowSurvivalLayer(!showSurvivalLayer)}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2 transition-colors"
              >
                <span className="text-slate-300 text-xs">🛡️ Survie</span>
                <div className={`w-8 h-4 rounded-full transition-colors ${showSurvivalLayer ? 'bg-orange-500' : 'bg-slate-600'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${showSurvivalLayer ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </button>

              <button
                onClick={() => setShowCommunicationLayer(!showCommunicationLayer)}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2 transition-colors"
              >
                <span className="text-slate-300 text-xs">📡 Communication</span>
                <div className={`w-8 h-4 rounded-full transition-colors ${showCommunicationLayer ? 'bg-blue-500' : 'bg-slate-600'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${showCommunicationLayer ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ PANNEAU PHONE TRACKER INTÉGRÉ ═══ */}
      <AnimatePresence>
        {showPhoneTracker && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="absolute bottom-52 left-4 right-4 z-[850] bg-slate-950/98 backdrop-blur-2xl border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-gradient-to-r from-red-900/30 to-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-700 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-none">Localiser un Numéro</p>
                  <p className="text-red-400 text-[10px] mt-0.5 font-medium">📡 Triangulation réseau</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {phoneTrackerResult && phoneTrackerStep === 'result' && (
                  <button
                    onClick={handlePhoneTrackerReset}
                    className="text-slate-400 text-xs hover:text-white transition-colors"
                  >
                    Nouveau
                  </button>
                )}
                <button
                  onClick={() => { setShowPhoneTracker(false); handlePhoneTrackerReset(); }}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-4">
              <AnimatePresence mode="wait">

                {/* SAISIE */}
                {phoneTrackerStep === 'input' && (
                  <motion.div
                    key="pt-input"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="text-base">🇨🇩</span>
                        <div className="w-px h-4 bg-white/10" />
                      </div>
                      <input
                        type="tel"
                        placeholder="+243 8xx xxx xxx"
                        value={phoneTrackerInput}
                        onChange={e => setPhoneTrackerInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handlePhoneTrackerSearch()}
                        className="w-full pl-12 pr-10 py-3 bg-white/5 border border-white/10 focus:border-red-500 rounded-xl text-white text-sm font-mono tracking-wider focus:outline-none transition-all placeholder-slate-600"
                        maxLength={20}
                        autoFocus
                      />
                      {phoneTrackerInput && (
                        <button
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                          onClick={() => setPhoneTrackerInput('')}
                        >
                          <X className="w-4 h-4 text-slate-500" />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {['+243 817 015 196', '0820 123 456'].map(ex => (
                        <button
                          key={ex}
                          onClick={() => setPhoneTrackerInput(ex)}
                          className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-slate-400 font-mono hover:bg-white/10 transition-colors"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePhoneTrackerSearch}
                      disabled={phoneTrackerInput.length < 8}
                      className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        phoneTrackerInput.length >= 8
                          ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-900/40'
                          : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <Search className="w-4 h-4" />
                      Localiser sur la carte
                    </motion.button>
                  </motion.div>
                )}

                {/* CHARGEMENT */}
                {phoneTrackerStep === 'loading' && (
                  <motion.div
                    key="pt-loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3 py-2"
                  >
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-2 border-red-500/20" />
                      <div className="absolute inset-2 rounded-full border-2 border-red-500/30" />
                      <div className="absolute inset-4 rounded-full border-2 border-red-500/50" />
                      <div className="absolute inset-6 bg-red-600/30 rounded-full flex items-center justify-center">
                        <MapPin className="w-3 h-3 text-red-400" />
                      </div>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 rounded-full border-t-2 border-r-2 border-red-500"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold text-sm">Localisation en cours...</p>
                      <p className="text-slate-500 text-[10px] font-mono">{normalizePhone(phoneTrackerInput)}</p>
                    </div>
                    <motion.p
                      key={phoneTrackerLoadingText}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-xs text-center font-medium"
                    >
                      {phoneTrackerLoadingText}
                    </motion.p>
                    <div className="flex gap-2">
                      {['Cellulaire', 'GPS', 'WiFi'].map((src, i) => (
                        <motion.div
                          key={src}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.3 }}
                          className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full"
                        >
                          <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-[9px] text-slate-400">{src}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* RÉSULTAT */}
                {phoneTrackerStep === 'result' && phoneTrackerResult && (
                  <motion.div
                    key="pt-result"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {/* Statut */}
                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <div className="flex-1">
                        <p className="text-green-300 font-bold text-sm">📍 Localisé avec succès</p>
                        <p className="text-green-500 text-[10px]">{phoneTrackerResult.operator} · ±{phoneTrackerResult.accuracy}m de précision</p>
                      </div>
                      <button
                        onClick={handlePhoneTrackerSearch}
                        className="p-1.5 bg-green-600/20 rounded-lg hover:bg-green-600/30 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3 text-green-400" />
                      </button>
                    </div>

                    {/* Infos */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span className="text-white font-mono text-xs">{phoneTrackerResult.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-red-400" />
                        <span className="text-slate-300 text-xs">{phoneTrackerResult.address}, {phoneTrackerResult.city}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                        <div className="text-center">
                          <p className="text-slate-500 text-[9px]">Latitude</p>
                          <p className="text-white font-mono text-[10px] font-bold">{phoneTrackerResult.lat.toFixed(5)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-slate-500 text-[9px]">Longitude</p>
                          <p className="text-white font-mono text-[10px] font-bold">{phoneTrackerResult.lng.toFixed(5)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => window.open(`https://maps.google.com/?q=${phoneTrackerResult.lat},${phoneTrackerResult.lng}`, '_blank')}
                        className="bg-gradient-to-r from-red-600 to-rose-600 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        Ouvrir Maps
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { setMapCenter([phoneTrackerResult.lat, phoneTrackerResult.lng]); setMapZoom(16); }}
                        className="bg-blue-600/80 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        Centrer carte
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* ERREUR */}
                {phoneTrackerStep === 'error' && (
                  <motion.div
                    key="pt-error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3 py-2 text-center"
                  >
                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center border border-white/10">
                      <AlertTriangle className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Introuvable</p>
                      <p className="text-slate-400 text-xs mt-1">Le téléphone est hors réseau ou le numéro est invalide</p>
                    </div>
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={handlePhoneTrackerSearch}
                        className="flex-1 bg-white/10 border border-white/10 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-white/15 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Réessayer
                      </button>
                      <button
                        onClick={handlePhoneTrackerReset}
                        className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <Search className="w-3.5 h-3.5" /> Nouveau
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ BOUTONS FLOTTANTS DROITE ═══ */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[500] flex flex-col gap-2">
        {/* Boutons services avancés */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowEvacuationLayer(!showEvacuationLayer)}
          className={`w-10 h-10 ${showEvacuationLayer ? 'bg-green-600' : 'bg-slate-900/90'} backdrop-blur-lg border border-white/20 rounded-xl flex items-center justify-center shadow-lg`}
          title="Navigation d'évacuation"
        >
          <RouteIcon className={`w-5 h-5 ${showEvacuationLayer ? 'text-white' : 'text-green-400'}`} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowMedicalLayer(!showMedicalLayer)}
          className={`w-10 h-10 ${showMedicalLayer ? 'bg-red-600' : 'bg-slate-900/90'} backdrop-blur-lg border border-white/20 rounded-xl flex items-center justify-center shadow-lg`}
          title="Services médicaux"
        >
          <Hospital className={`w-5 h-5 ${showMedicalLayer ? 'text-white' : 'text-red-400'}`} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSurvivalLayer(!showSurvivalLayer)}
          className={`w-10 h-10 ${showSurvivalLayer ? 'bg-orange-600' : 'bg-slate-900/90'} backdrop-blur-lg border border-white/20 rounded-xl flex items-center justify-center shadow-lg`}
          title="Mode survie"
        >
          <LifeBuoy className={`w-5 h-5 ${showSurvivalLayer ? 'text-white' : 'text-orange-400'}`} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAnalyticsLayer(!showAnalyticsLayer)}
          className={`w-10 h-10 ${showAnalyticsLayer ? 'bg-purple-600' : 'bg-slate-900/90'} backdrop-blur-lg border border-white/20 rounded-xl flex items-center justify-center shadow-lg`}
          title="Analyse et rapports"
        >
          <BarChart3 className={`w-5 h-5 ${showAnalyticsLayer ? 'text-white' : 'text-purple-400'}`} />
        </motion.button>

        {/* Bouton Tracabilité */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowTrackingPanel(!showTrackingPanel)}
          className={`w-10 h-10 ${showTrackingPanel ? 'bg-orange-600' : 'bg-slate-900/90'} backdrop-blur-lg border border-white/20 rounded-xl flex items-center justify-center shadow-lg`}
          title="Centre de tracabilité"
        >
          <Radio className={`w-5 h-5 ${showTrackingPanel ? 'text-white' : 'text-orange-400'}`} />
        </motion.button>

        {/* Bouton Mode Urgence */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={startEmergencyTracking}
          className="w-10 h-10 bg-red-600/90 backdrop-blur-lg border border-red-500/30 rounded-xl flex items-center justify-center shadow-lg animate-pulse"
          title="Mode urgence"
        >
          <AlertTriangle className="w-5 h-5 text-white" />
        </motion.button>

        {/* Ouvrir Chat Tactique */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowTacticalPanel(!showTacticalPanel)}
          className={`w-10 h-10 ${showTacticalPanel ? 'bg-teal-600' : 'bg-slate-900/90'} backdrop-blur-lg border border-white/20 rounded-xl flex items-center justify-center shadow-lg`}
          title="Échange Tactique"
        >
          <MessageSquare className={`w-5 h-5 ${showTacticalPanel ? 'text-white' : 'text-teal-400'}`} />
        </motion.button>

        {/* Centrer sur utilisateur */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={centerOnUser}
          className="w-10 h-10 bg-slate-900/90 backdrop-blur-lg border border-white/20 rounded-xl flex items-center justify-center shadow-lg"
          title="Ma position"
        >
          <Crosshair className="w-5 h-5 text-blue-400" />
        </motion.button>

        {/* Zoom + */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setMapZoom(z => Math.min(z + 1, 18))}
          className="w-10 h-10 bg-slate-900/90 backdrop-blur-lg border border-white/20 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-lg"
        >
          +
        </motion.button>

        {/* Zoom - */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setMapZoom(z => Math.max(z - 1, 8))}
          className="w-10 h-10 bg-slate-900/90 backdrop-blur-lg border border-white/20 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-lg"
        >
          −
        </motion.button>
      </div>

      {/* ═══ DOCK TACTIQUE (OUTILS CARTE) ═══ */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[750] flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 shadow-2xl">
        {[
          { id: 'safezones', icon: <ShieldCheck className="w-5 h-5" />, color: 'text-green-400', label: 'Zones' },
          { id: 'evidence', icon: <Camera className="w-5 h-5" />, color: 'text-orange-400', label: 'Preuves' },
          { id: 'guardians', icon: <Pocket className="w-5 h-5" />, color: 'text-teal-400', label: 'Guardians' },
          { id: 'add-friend', icon: <UserPlus className="w-5 h-5" />, color: 'text-blue-400', label: 'Ajout Ami' },
          { id: 'phone-tracker', icon: <Smartphone className="w-5 h-5" />, color: showPhoneTracker ? 'text-white' : 'text-red-400', label: 'Localiser' },
        ].map(tool => (
          <motion.button
            key={tool.id}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (tool.id === 'add-friend') setShowFriendWizard(true);
              else if (tool.id === 'phone-tracker') setShowPhoneTracker(!showPhoneTracker);
              else setActiveOverlay(tool.id as any);
            }}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
              tool.id === 'phone-tracker' && showPhoneTracker ? 'bg-red-600/80' : 'hover:bg-white/10'
            }`}
          >
            <div className={tool.color}>{tool.icon}</div>
            <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">{tool.label}</span>
          </motion.button>
        ))}
      </div>

      {/* ═══ BARRE DE RECHERCHE & NAVIGATION ═══ */}
      <div className="absolute bottom-24 left-4 right-4 z-[800]">

        {/* Dashboard de suivi actif */}
        <AnimatePresence>
          {isTracking && trackingData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-3 bg-slate-900/95 backdrop-blur-xl border border-green-500/40 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-400 font-semibold text-sm">Suivi en cours</span>
                </div>
                <button
                  onClick={stopTracking}
                  className="bg-red-600/80 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-lg transition-colors"
                >
                  Arrêter
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-white/5 rounded-xl p-2 text-center">
                  <Activity className="w-3 h-3 text-blue-400 mx-auto mb-1" />
                  <div className="text-white text-xs font-bold">{trackingData.speed.toFixed(0)}</div>
                  <div className="text-slate-400" style={{fontSize:'9px'}}>km/h</div>
                </div>
                <div className="bg-white/5 rounded-xl p-2 text-center">
                  <Navigation2 className="w-3 h-3 text-teal-400 mx-auto mb-1" />
                  <div className="text-white text-xs font-bold">{trackingData.heading.toFixed(0)}°</div>
                  <div className="text-slate-400" style={{fontSize:'9px'}}>Cap</div>
                </div>
                <div className="bg-white/5 rounded-xl p-2 text-center">
                  <Battery className="w-3 h-3 text-green-400 mx-auto mb-1" />
                  <div className="text-white text-xs font-bold">{trackingData.batteryLevel.toFixed(0)}%</div>
                  <div className="text-slate-400" style={{fontSize:'9px'}}>Batterie</div>
                </div>
                <div className="bg-white/5 rounded-xl p-2 text-center">
                  <Wifi className="w-3 h-3 text-yellow-400 mx-auto mb-1" />
                  <div className="text-white text-xs font-bold">{trackingData.signalStrength}/5</div>
                  <div className="text-slate-400" style={{fontSize:'9px'}}>Signal</div>
                </div>
              </div>
              {distanceToDestination !== null && (
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Distance restante</span>
                  <span className="text-white font-medium">{(distanceToDestination).toFixed(2)} km</span>
                </div>
              )}
              {!trackingData.isOnRoute && (
                <div className="mt-2 bg-red-600/20 border border-red-500/40 rounded-xl px-3 py-2 text-xs text-red-300 text-center">
                  ⚠️ Déviation détectée — Recalcul en cours...
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recherche de destination */}
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          {/* Barre de saisie */}
          <div className="flex items-center gap-3 px-4 py-3">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Rechercher une destination à Kinshasa..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
              className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); setDestination(null); setShowRoute(false); }}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>

          {/* Résultats */}
          <AnimatePresence>
            {showSearch && searchResults.length > 0 && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden border-t border-white/5"
              >
                {searchResults.map(loc => (
                  <button
                    key={`${loc.lat}-${loc.lng}`}
                    onClick={() => selectDestination(loc)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  >
                    <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="text-left">
                      <div className="text-white text-sm font-medium">{loc.name}</div>
                      <div className="text-slate-400 text-xs">{loc.address}</div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Destination sélectionnée + bouton de départ */}
          {destination && !isTracking && (
            <div className="border-t border-white/5 px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-green-400 text-xs font-medium">🎯 Destination</div>
                <div className="text-white text-sm font-semibold">{destination.name}</div>
                {distanceToDestination !== null && (
                  <div className="text-slate-400 text-xs">{distanceToDestination.toFixed(2)} km</div>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startTracking}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
              >
                <Navigation className="w-4 h-4" />
                Démarrer
              </motion.button>
            </div>
          )}
        </div>

        {/* Légende zones de danger */}
        {showRedZones && (
          <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
            {Object.entries(SEVERITY_COLORS).map(([severity, { color, label }]) => (
              <div key={severity} className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-full px-2 py-1 flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-white text-xs">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ BARRE DE NAVIGATION BAS ═══ */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-slate-900/95 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-center justify-around py-2 px-4">
          {[
            { id: 'enhanced-home', label: 'Accueil', icon: <Shield className="w-5 h-5" /> },
            { id: 'enhanced-map', label: 'Carte', icon: <Map className="w-5 h-5" />, active: true },
            { id: 'sos', label: 'SOS', icon: <Phone className="w-5 h-5" />, sos: true },
            { id: 'alerts', label: 'Alertes', icon: <Bell className="w-5 h-5" /> },
            { id: 'profile', label: 'Profil', icon: <User className="w-5 h-5" /> },
          ].map(item => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onNavigate?.(item.id as any)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors ${
                item.active
                  ? 'text-blue-400'
                  : item.sos
                  ? 'text-red-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ═══ INDICATEUR DE STATUT ═══ */}
      <div className="absolute top-[68px] left-4 z-[700]">
        <div className="flex flex-col gap-2 mt-2">
          {/* Statut connexion */}
          <div className="bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs font-medium">En ligne</span>
          </div>

          {/* Zones actives */}
          <div className="bg-red-900/60 backdrop-blur-sm border border-red-500/30 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-red-300 text-xs">{RED_ZONES.length} zones à risque</span>
          </div>
        </div>
      </div>
      {/* ═══ PANNEAU TACTIQUE (CHAT SECRET) ═══ */}
      <AnimatePresence>
        {showTacticalPanel && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute bottom-0 left-0 right-0 z-[1100] bg-slate-900/98 backdrop-blur-2xl border-t border-teal-500/30 rounded-t-3xl shadow-2xl flex flex-col h-[50vh]"
          >
            {/* Header Tactique */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                <div>
                  <h3 className="text-white font-bold text-sm">Échange Tactique</h3>
                  <p className="text-teal-400" style={{fontSize: '10px'}}>Guidage {activeGuide === 'police' ? 'Police' : 'Activé'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowTacticalPanel(false)} className="p-2 bg-white/5 rounded-xl">
                  <Minimize2 className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Zone de Chat */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {tacticalMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white/10 text-slate-200 rounded-tl-none'
                  } ${msg.isSignal ? 'italic opacity-80 border border-blue-400/30' : ''}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Signations Rapides */}
            <div className="px-6 py-2 flex gap-2 overflow-x-auto border-t border-white/5">
              {[
                { label: "Suivi", text: "⚠️ Je pense être suivi." },
                { label: "Check", text: "✅ Tout va bien pour l'instant." },
                { label: "Police", text: "🚓 Police, orientez-moi." },
                { label: "Détention", text: "🚫 Je suis bloqué." },
              ].map(sig => (
                <button
                  key={sig.label}
                  onClick={() => sendTacticalMessage(sig.text, true)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-xs text-slate-400 whitespace-nowrap transition-colors"
                >
                  {sig.label}
                </button>
              ))}
            </div>

            {/* Saisie */}
            <div className="p-4 flex gap-2">
              <input
                type="text"
                value={newTacticalMsg}
                onChange={e => setNewTacticalMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendTacticalMessage(newTacticalMsg)}
                placeholder="Message sécurisé..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50"
              />
              <button
                onClick={() => sendTacticalMessage(newTacticalMsg)}
                className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ OVERLAY CAMÉLÉON (FAUSSE APP) ═══ */}
      <AnimatePresence>
        {stealthMode === 'chameleon' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[2000] bg-slate-900 flex flex-col"
          >
            {/* Fausse barre d'état */}
            <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
              <span className="text-slate-400 text-xs font-mono">MyNotes v2.1</span>
              <button onClick={() => setStealthMode('off')} className="opacity-10 w-8 h-8" />
            </div>
            
            {/* Contenu "Notes" bidon */}
            <div className="flex-1 p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <FileText className="w-6 h-6 text-yellow-500" />
                <h2 className="text-white font-bold text-lg">Liste de courses</h2>
              </div>
              <ul className="space-y-3">
                {['Acheter du pain', 'Passer à la pharmacie', 'Récupérer le colis', 'Appeler maman'].map((note, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-400">
                    <div className="w-5 h-5 border border-white/20 rounded-md" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>

              {/* MESSAGE DE GUIDAGE CACHÉ */}
              <div className="mt-12 bg-white/5 rounded-2xl p-4 border-l-2 border-teal-500">
                <p className="text-xs text-slate-500 mb-1">Instruction reçue (cryptée)</p>
                <p className="text-white text-sm italic">
                  "{tacticalMessages[tacticalMessages.length - 1].text}"
                </p>
              </div>
            </div>

            {/* Faux clavier / Input */}
            <div className="p-4 border-t border-white/5">
              <div className="bg-slate-800 rounded-lg p-3 text-slate-500 text-sm">
                Tapez une nouvelle note...
              </div>
            </div>
            
            {/* Tap discret en bas à droite pour quitter */}
            <div 
              className="absolute bottom-4 right-4 w-12 h-12 opacity-0 cursor-pointer" 
              onClick={() => setStealthMode('off')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ PANNEAUX OVERLAYS (SAFEZONES, EVIDENCE, GUARDIANS, CIRCLE) ═══ */}
      <AnimatePresence>
        {activeOverlay !== 'none' && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-[2000] bg-slate-900 flex flex-col"
          >
            {/* Header des Overlays */}
            <div className="px-6 py-6 flex items-center gap-4 bg-slate-900/50 border-b border-white/10">
              <button 
                id="btn-back-to-map"
                onClick={() => setActiveOverlay('none')}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                  {activeOverlay === 'safezones' ? 'Bouclier SafeZones' :
                   activeOverlay === 'evidence' ? 'Cartographie Preuves' :
                   activeOverlay === 'guardians' ? 'Réseau Intervenants' : 'Cercle de Confiance'}
                </h2>
                <button onClick={() => setActiveOverlay('none')} className="text-blue-400 text-xs font-semibold">
                  RETOUR À LA CARTE
                </button>
              </div>
            </div>

            {/* Contenu de l'Overlay */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* --- MODULE SAFEZONES --- */}
              {activeOverlay === 'safezones' && (
                <div className="space-y-6">
                  <div className="bg-green-600/10 border border-green-500/30 rounded-2xl p-4 flex items-center gap-4">
                    <ShieldCheck className="w-10 h-10 text-green-400" />
                    <p className="text-xs text-green-300">Vos SafeZones sont actives. Une alerte silencieuse sera envoyée à votre cercle si vous quittez ces périmètres.</p>
                  </div>
                  <div className="space-y-3">
                    {safeZones.map(zone => (
                      <div key={zone.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-900/30 flex items-center justify-center">
                            <MapIcon className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <div className="text-white font-semibold text-sm">{zone.name}</div>
                            <div className="text-slate-400 text-xs text-mono">Rayon: {zone.radius}m</div>
                          </div>
                        </div>
                        <button className="text-slate-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-slate-400 text-sm flex items-center justify-center gap-2 hover:border-green-500/30 hover:text-green-400 transition-all">
                      <Plus className="w-4 h-4" /> Ajouter une zone
                    </button>
                  </div>
                </div>
              )}

              {/* --- MODULE EVIDENCE --- */}
              {activeOverlay === 'evidence' && (
                <div className="space-y-4">
                  <div className="text-slate-400 text-xs mb-4">Incidents validés à Kinshasa (dernières 24h)</div>
                  {[
                    { id: 1, type: 'Vol', loc: 'Victoire', time: '12 min', img: '🚨' },
                    { id: 2, type: 'Accident', loc: 'Boulevard', time: '45 min', img: '🚗' },
                    { id: 3, type: 'Bouchon', loc: 'Limete', time: '1h', img: '🛑' },
                  ].map(ev => (
                    <div key={ev.id} className="bg-white/5 rounded-2xl p-4 flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-xl bg-orange-600/20 flex items-center justify-center text-2xl">{ev.img}</div>
                      <div className="flex-1">
                        <div className="text-white text-sm font-bold">{ev.type} — {ev.loc}</div>
                        <div className="text-slate-400 text-xs italic">{ev.time} • Rapporté par Utilisateur Vérifié</div>
                      </div>
                      <button className="p-2 bg-white/5 rounded-lg text-orange-400"><Expand className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button className="w-full bg-orange-600 py-4 rounded-2xl text-white font-bold shadow-lg shadow-orange-600/20">Signaler & Géolocaliser</button>
                </div>
              )}

              {/* --- MODULE GUARDIANS --- */}
              {activeOverlay === 'guardians' && (
                <div className="space-y-6">
                  <div className="bg-teal-600/10 border border-teal-500/30 rounded-2xl p-4 items-center gap-4 flex">
                    <Pocket className="w-10 h-10 text-teal-400" />
                    <div>
                      <div className="text-teal-300 font-bold text-sm">Réseau d'intervention</div>
                      <p className="text-[10px] text-teal-400/80">Ces membres de la communauté USALAMA sont formés pour intervenir en cas de besoin immédiat.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="px-2 text-xs text-slate-500 uppercase font-bold tracking-widest">Disponibles à proximité</div>
                    {nearbyGuardians.map(g => (
                      <div key={g.id} className="bg-white/5 border border-white/5 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-2xl border-2 border-teal-500/30">{g.icon}</div>
                            <div>
                              <div className="text-white font-bold text-sm">{g.name}</div>
                              <div className="text-teal-400 text-[10px] uppercase font-bold">{g.status} • {g.distance}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-white text-xs font-bold">{g.rating}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => window.location.href = `tel:${g.phone}`}
                            className="flex-1 bg-teal-600 hover:bg-teal-500 py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2"
                          >
                            <Phone className="w-3.5 h-3.5" /> APPELER
                          </button>
                          <button className="flex-1 bg-white/10 hover:bg-white/15 py-2.5 rounded-xl text-slate-300 font-bold text-xs flex items-center justify-center gap-2">
                             MESSAGE
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="w-full py-5 bg-red-600 rounded-2xl text-white font-extrabold shadow-xl shadow-red-600/30 flex items-center justify-center gap-3 animate-pulse">
                    <ShieldAlert className="w-6 h-6" /> ALERTER LES 3 PLUS PROCHES
                  </button>
                </div>
              )}

              {/* --- MODULE CERCLE --- */}
              {activeOverlay === 'circle' && (
                <div className="space-y-6">
                  <div className="bg-blue-600/10 border border-blue-500/30 rounded-3xl p-6 text-center">
                    <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/50">
                      <Lock className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">Retraçage Sécurisé</h3>
                    <p className="text-xs text-slate-400 px-4">Activez cette option pour permettre à vos contacts sélectionnés de voir votre position en temps réel de manière cryptée.</p>
                    
                    <button 
                      onClick={() => setTrackingEnabled(!trackingEnabled)}
                      className={`mt-6 w-full py-4 rounded-2xl font-bold transition-all shadow-lg ${
                        trackingEnabled 
                          ? 'bg-blue-600 text-white shadow-blue-500/20' 
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {trackingEnabled ? '🔥 VISIBILITÉ ACTIVE' : '🕵️ ACTIVER LA VISIBILITÉ'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="px-2 text-xs text-slate-500 uppercase font-bold tracking-widest">Maîtres de confiance</div>
                    {trustedCircle.map(p => (
                      <div key={p.id} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white border border-white/5">
                            <UserCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-white font-semibold text-sm">{p.name}</div>
                            <div className="text-slate-500 text-xs">{p.role}</div>
                          </div>
                        </div>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${p.isTracking && trackingEnabled ? 'bg-blue-600' : 'bg-slate-700'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${p.isTracking && trackingEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                      </div>
                    ))}
                    <button className="w-full py-4 bg-white/10 rounded-2xl text-blue-400 text-sm font-bold flex items-center justify-center gap-2">
                       + AJOUTER UN CONTACT
                    </button>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3">
                    <div className="text-xs text-slate-400 font-medium">Partage temporaire via lien</div>
                    <div className="flex gap-2">
                       <div className="flex-1 bg-black/30 rounded-xl px-4 py-3 text-xs font-mono text-blue-300 flex items-center">usa.lama/track/8h2k...</div>
                       <button className="p-3 bg-blue-600 rounded-xl"><Smartphone className="w-4 h-4 text-white" /></button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ PANNEAU DE CONTRÔLE TRACABILITÉ ═══ */}
      <AnimatePresence>
        {showTrackingPanel && (
          <TrackingPanel
            isVisible={showTrackingPanel}
            onClose={() => setShowTrackingPanel(false)}
            onPositionUpdate={handleTrackingUpdate}
          />
        )}
      </AnimatePresence>

      {/* ═══ INDICATEUR D'INSTRUCTION VOCALE ═══ */}
      <AnimatePresence>
        {currentInstruction && voiceEnabled && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-24 left-4 right-4 z-[900] rounded-2xl p-4 backdrop-blur-xl border ${
              currentInstruction.urgency === 'critical' ? 'bg-red-600/95 border-red-500/50' :
              currentInstruction.urgency === 'high' ? 'bg-orange-600/95 border-orange-500/50' :
              currentInstruction.urgency === 'medium' ? 'bg-blue-600/95 border-blue-500/50' :
              'bg-slate-800/95 border-slate-600/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                currentInstruction.urgency === 'critical' ? 'bg-red-400 animate-pulse' :
                currentInstruction.urgency === 'high' ? 'bg-orange-400 animate-pulse' :
                currentInstruction.urgency === 'medium' ? 'bg-blue-400' :
                'bg-slate-400'
              }`} />
              <div className="flex-1">
                <div className="text-white font-semibold text-sm">{currentInstruction.text}</div>
                {currentInstruction.distance > 0 && (
                  <div className="text-white/70 text-xs">Dans {currentInstruction.distance}m</div>
                )}
              </div>
              <button
                onClick={() => setCurrentInstruction(null)}
                className="p-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ ALERTE D'URGENCE ═══ */}
      <AnimatePresence>
        {alertTriggered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[3000] bg-red-600/95 backdrop-blur-xl border-2 border-red-500 rounded-3xl p-6 text-center"
          >
            <AlertTriangle className="w-16 h-16 text-white mx-auto mb-4 animate-pulse" />
            <h2 className="text-white font-bold text-xl mb-2">ALERTE D'URGENCE</h2>
            <p className="text-red-100 text-sm mb-4">Le système a détecté une situation critique. Votre position est en cours de partage avec les services d'urgence.</p>
            <button
              onClick={() => setAlertTriggered(false)}
              className="px-6 py-3 bg-white text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors"
            >
              Compris
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {(showEvacuationLayer || showMedicalLayer || showSurvivalLayer || showAnalyticsLayer) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 left-4 right-4 z-[900] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
          >
            {/* Navigation d'évacuation */}
            {showEvacuationLayer && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <RouteIcon className="w-5 h-5 text-green-400" />
                  <h3 className="text-white font-semibold">Navigation d'Évacuation</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {evacuationRoutes.slice(0, 2).map(route => (
                    <motion.div
                      key={route.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedRoute(route)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedRoute?.id === route.id 
                          ? 'border-green-500 bg-green-950/30' 
                          : 'border-slate-600 hover:border-green-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-white">{route.name}</div>
                          <div className="text-xs text-slate-400">
                            {Math.round(route.distance)}m • {Math.round(route.estimatedTime / 60)}min
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-green-400">
                            {route.safetyScore}% sûr
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Services médicaux */}
            {showMedicalLayer && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Hospital className="w-5 h-5 text-red-400" />
                  <h3 className="text-white font-semibold">Services Médicaux</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {medicalServices.slice(0, 3).map(service => (
                    <motion.div key={service.id} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-white">{service.name}</div>
                          <div className="text-xs text-slate-400">
                            {service.type} • {service.responseTime}min • {Math.round((service as any).distance || 0)}m
                          </div>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => window.location.href = `tel:${service.contact.phone}`}
                          className="p-2 bg-green-600 hover:bg-green-700 rounded-lg"
                        >
                          <Phone className="w-3 h-3 text-white" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Mode survie */}
            {showSurvivalLayer && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <LifeBuoy className="w-5 h-5 text-orange-400" />
                  <h3 className="text-white font-semibold">Mode Survie</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {survivalTools.slice(0, 4).map(tool => (
                    <motion.button
                      key={tool.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        switch (tool.type) {
                          case 'flashlight':
                            survivalMode.toggleFlashlight();
                            break;
                          case 'whistle':
                            survivalMode.playEmergencyWhistle();
                            break;
                        }
                      }}
                      disabled={!tool.available}
                      className={`p-3 rounded-lg flex flex-col items-center gap-1 ${
                        tool.available 
                          ? 'bg-slate-700 hover:bg-slate-600' 
                          : 'bg-slate-800 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-lg">{tool.icon}</span>
                      <span className="text-xs text-white">{tool.name}</span>
                    </motion.button>
                  ))}
                </div>
                {compassData && (
                  <div className="mt-3 p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">Boussole</span>
                      <span className="text-sm font-medium text-blue-400">
                        {compassData.heading}° {compassData.heading >= 337.5 || compassData.heading < 22.5 ? 'N' :
                         compassData.heading >= 22.5 && compassData.heading < 67.5 ? 'NE' :
                         compassData.heading >= 67.5 && compassData.heading < 112.5 ? 'E' :
                         compassData.heading >= 112.5 && compassData.heading < 157.5 ? 'SE' :
                         compassData.heading >= 157.5 && compassData.heading < 202.5 ? 'S' :
                         compassData.heading >= 202.5 && compassData.heading < 247.5 ? 'SO' :
                         compassData.heading >= 247.5 && compassData.heading < 292.5 ? 'O' : 'NO'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Analyse */}
            {showAnalyticsLayer && statistics && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <h3 className="text-white font-semibold">Analyse de Sécurité</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400">{statistics.totalIncidents}</div>
                    <div className="text-xs text-slate-400">Incidents</div>
                  </div>
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{statistics.resolvedIncidents}</div>
                    <div className="text-xs text-slate-400">Résolus</div>
                  </div>
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">{Math.round(statistics.averageResponseTime / 60)}m</div>
                    <div className="text-xs text-slate-400">Temps moyen</div>
                  </div>
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-400">{statistics.userSatisfactionScore.toFixed(1)}⭐</div>
                    <div className="text-xs text-slate-400">Satisfaction</div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default EnhancedMapScreen;
