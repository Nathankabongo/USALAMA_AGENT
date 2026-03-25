import { useState, useEffect, useRef, useCallback } from 'react';
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
  Search,
  Filter,
  Settings,
  Layers,
  User,
  Bell,
  Activity,
  Volume2,
  VolumeX,
  Headphones,
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Thermometer,
  AlertCircle,
  Wifi as WifiIcon,
  Globe,
  Navigation2,
  MapPin as MapPinIcon,
  Crosshair,
  Compass
} from 'lucide-react';

import { NavigationProps, navigationItems } from '../types/navigation';

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

interface WeatherData {
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  humidity: number;
  windSpeed: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskMessage: string;
  floodRisk: 'none' | 'low' | 'moderate' | 'high';
  visibility: number;
}

interface ConnectionStatus {
  isConnected: boolean;
  lastUpdate: Date;
  serverReachable: boolean;
  signalStrength: number;
}

interface KinshasaLocation {
  id: string;
  name: string;
  type: 'avenue' | 'commune' | 'quartier' | 'lieu' | 'hopital' | 'police' | 'ecole';
  coordinates: { lat: number; lng: number };
  description: string;
  distance?: number;
  bearing?: number;
}

interface RealTimeMovement {
  currentPosition: { lat: number; lng: number };
  speed: number; // km/h
  heading: number; // degrés
  altitude?: number;
  accuracy: number; // mètres
  timestamp: Date;
}

const EnhancedMapScreenSafePath: React.FC<NavigationProps> = ({ onNavigate }) => {
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
  const [showSafePath, setShowSafePath] = useState(false);
  const [userPosition, setUserPosition] = useState<{ lng: number; lat: number } | null>(null);
  const [mapStyle, setMapStyle] = useState<'dark' | 'light'>('dark');
  const [showLayers, setShowLayers] = useState(false);
  const [voiceGuidance, setVoiceGuidance] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentInstruction, setCurrentInstruction] = useState('');
  const [voiceVolume, setVoiceVolume] = useState(0.8);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    lastUpdate: new Date(),
    serverReachable: false,
    signalStrength: 0
  });
  const [currentTripId, setCurrentTripId] = useState<string>('');
  const [kinshasaSearchQuery, setKinshasaSearchQuery] = useState('');
  const [kinshasaSearchResults, setKinshasaSearchResults] = useState<KinshasaLocation[]>([]);
  const [selectedKinshasaLocation, setSelectedKinshasaLocation] = useState<KinshasaLocation | null>(null);
  const [realTimeMovement, setRealTimeMovement] = useState<RealTimeMovement | null>(null);
  const [isRealTimeTracking, setIsRealTimeTracking] = useState(false);
  const [showDistanceInfo, setShowDistanceInfo] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: -4.4419, lng: 15.2663 });
  const [mapZoom, setMapZoom] = useState(12);
  
  const trackingInterval = useRef<NodeJS.Timeout | null>(null);
  const deviationCheckInterval = useRef<NodeJS.Timeout | null>(null);

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

  // Données des lieux de Kinshasa
  const kinshasaLocations: KinshasaLocation[] = [
    { id: '1', name: 'Avenue Kasa-Vubu', type: 'avenue', coordinates: { lat: -4.4419, lng: 15.2663 }, description: 'Avenue principale de Gombe' },
    { id: '2', name: 'Boulevard du 30 Juin', type: 'avenue', coordinates: { lat: -4.4259, lng: 15.2813 }, description: 'Artère commerciale principale' },
    { id: '3', name: 'Commune de Gombe', type: 'commune', coordinates: { lat: -4.4419, lng: 15.2663 }, description: 'Centre administratif' },
    { id: '4', name: 'Commune de Limete', type: 'commune', coordinates: { lat: -4.3959, lng: 15.3213 }, description: 'Zone résidentielle' },
    { id: '5', name: 'Marché Central', type: 'lieu', coordinates: { lat: -4.4439, lng: 15.2713 }, description: 'Grand marché de Kinshasa' },
    { id: '6', name: 'Hôpital General', type: 'hopital', coordinates: { lat: -4.435, lng: 15.27 }, description: 'Centre hospitalier principal' }
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
      // Simulation simplifiée du calcul de déviation
      const routeCenter = {
        lat: (selectedRoute.startPoint.lat + selectedRoute.endPoint.lat) / 2,
        lng: (selectedRoute.startPoint.lng + selectedRoute.endPoint.lng) / 2
      };
      
      const distance = Math.sqrt(
        Math.pow(trackingData.currentPosition.lat - routeCenter.lat, 2) +
        Math.pow(trackingData.currentPosition.lng - routeCenter.lng, 2)
      ) * 111000; // Conversion approximative en mètres
      
      const isOnRoute = distance <= 200; // 200m de tolérance
      
      setTrackingData(prev => prev ? {
        ...prev,
        isOnRoute,
        deviationDistance: distance
      } : null);
      
      // Déclencher l'alerte si déviation > 200m
      if (distance > 200 && !alertTriggered) {
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

  // Fonctions de guidage vocal discret
  const playNotificationSound = () => {
    // Créer un son bip discret (comme une notification WhatsApp)
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Fréquence du bip
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const speakInstruction = (text: string, discreet: boolean = false) => {
    if (!('speechSynthesis' in window)) {
      console.warn('L\'API Web Speech n\'est pas supportée par ce navigateur');
      return;
    }

    // Annuler toute parole en cours
    window.speechSynthesis.cancel();
    
    if (discreet) {
      playNotificationSound(); // Bip discret avant de parler
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9; // Vitesse légèrement lente pour plus de clarté
    utterance.pitch = 1.0;
    utterance.volume = voiceVolume;
    
    // Choisir une voix féminine (plus naturelle pour le guidage)
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.lang.includes('fr') && voice.name.includes('Female') || 
      voice.name.includes('femme') || voice.name.includes('woman')
    );
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentInstruction(text);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentInstruction('');
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const startVoiceGuidance = () => {
    setVoiceGuidance(true);
    
    // Message d'accueil du guidage vocal
    setTimeout(() => {
      speakInstruction(
        `Guidage vocal activé. Destination: ${endPoint.name || 'non sélectionnée'}. ` +
        `Distance: ${selectedRoute?.distance.toFixed(1) || '0'} kilomètres. ` +
        `Durée estimée: ${selectedRoute?.duration || '0'} minutes.`,
        true
      );
    }, 1000);
  };

  const stopVoiceGuidance = () => {
    setVoiceGuidance(false);
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setCurrentInstruction('');
  };

  const announceDeviation = () => {
    if (voiceGuidance && trackingData && !trackingData.isOnRoute) {
      speakInstruction(
        `Attention. Vous avez dévié de votre itinéraire. ` +
        `Distance de déviation: ${trackingData.deviationDistance.toFixed(0)} mètres. ` +
        `Revenez sur l'itinéraire sécurisé.`,
        true
      );
    }
  };

  const announceRedZone = (zone: RedZone) => {
    if (voiceGuidance) {
      speakInstruction(
        `Zone à risque approaching. ${zone.name}. ` +
        `Type: ${zone.type}. ` +
        `Description: ${zone.description}. ` +
        `Conduisez avec prudence.`,
        true
      );
    }
  };

  const announceArrival = () => {
    if (voiceGuidance) {
      speakInstruction(
        `Vous êtes arrivé à destination. ${endPoint.name}. ` +
        `Le guidage vocal est maintenant terminé.`,
        true
      );
    }
  };

  // Fonctions Météo-Safe
  const fetchWeatherData = async (location: Location) => {
    // Simuler les données météo pour Kinshasa
    const mockWeatherData: WeatherData = {
      temperature: 28 + Math.random() * 8, // 28-36°C typique pour Kinshasa
      condition: Math.random() > 0.7 ? 'rainy' : Math.random() > 0.4 ? 'cloudy' : 'sunny',
      humidity: 70 + Math.random() * 20, // 70-90% d'humidité
      windSpeed: 5 + Math.random() * 15, // 5-20 km/h
      riskLevel: 'medium',
      riskMessage: '',
      floodRisk: 'none',
      visibility: 8 + Math.random() * 4 // 8-12 km
    };

    // Calculer les risques en fonction des conditions
    if (mockWeatherData.condition === 'rainy' && mockWeatherData.humidity > 85) {
      mockWeatherData.riskLevel = 'high';
      mockWeatherData.floodRisk = 'moderate';
      mockWeatherData.riskMessage = 'Risque d\'inondation : ÉLEVÉ';
    } else if (mockWeatherData.condition === 'stormy') {
      mockWeatherData.riskLevel = 'critical';
      mockWeatherData.floodRisk = 'high';
      mockWeatherData.riskMessage = 'Risque d\'inondation : CRITIQUE - Évitez les zones basses';
    } else if (mockWeatherData.temperature > 35) {
      mockWeatherData.riskLevel = 'medium';
      mockWeatherData.riskMessage = 'Température élevée : Restez hydraté';
    } else {
      mockWeatherData.riskLevel = 'low';
      mockWeatherData.riskMessage = 'Conditions météo favorables';
    }

    setWeatherData(mockWeatherData);
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="w-6 h-6 text-yellow-400" />;
      case 'cloudy': return <Cloud className="w-6 h-6 text-slate-400" />;
      case 'rainy': return <CloudRain className="w-6 h-6 text-blue-400" />;
      case 'stormy': return <CloudRain className="w-6 h-6 text-purple-400" />;
      default: return <Cloud className="w-6 h-6 text-slate-400" />;
    }
  };

  const getWeatherRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'low': return 'bg-green-600 text-white';
      default: return 'bg-slate-600 text-white';
    }
  };

  const getFloodRiskColor = (floodRisk: string) => {
    switch (floodRisk) {
      case 'high': return 'text-red-400';
      case 'moderate': return 'text-orange-400';
      case 'low': return 'text-yellow-400';
      case 'none': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  // Fonctions de gestion de connexion
  const checkConnectionStatus = () => {
    const isOnline = navigator.onLine;
    const hasStrongSignal = trackingData?.signalStrength ? trackingData.signalStrength >= 3 : false;
    
    setConnectionStatus(prev => ({
      ...prev,
      isConnected: isOnline && hasStrongSignal,
      serverReachable: isOnline,
      signalStrength: trackingData?.signalStrength || 0,
      lastUpdate: new Date()
    }));
  };

  const emitPositionUpdate = () => {
    if (!trackingData || !connectionStatus.isConnected) return;

    // Simuler l'envoi de données via Socket.io
    const positionData = {
      lat: trackingData.currentPosition.lat,
      lng: trackingData.currentPosition.lng,
      battery: trackingData.batteryLevel,
      tripId: currentTripId,
      timestamp: new Date().toISOString()
    };

    console.log('📡 Envoi position au serveur:', positionData);
    
    // Simulation de réponse du serveur
    setTimeout(() => {
      setConnectionStatus(prev => ({
        ...prev,
        serverReachable: true,
        lastUpdate: new Date()
      }));
    }, 100);
  };

  // Effet pour surveiller la connexion
  useEffect(() => {
    const interval = setInterval(() => {
      checkConnectionStatus();
      if (isTracking) {
        emitPositionUpdate();
      }
    }, 15000); // Toutes les 15 secondes

    return () => clearInterval(interval);
  }, [isTracking, trackingData, currentTripId]);

  // Effet pour récupérer la météo quand la destination change
  useEffect(() => {
    if (endPoint.name) {
      fetchWeatherData(endPoint);
    }
  }, [endPoint]);

  // Fonctions de recherche avancée pour Kinshasa
  const searchKinshasaLocations = useCallback(() => {
    if (kinshasaSearchQuery.length < 2) {
      setKinshasaSearchResults([]);
      return;
    }

    const query = kinshasaSearchQuery.toLowerCase();
    const results = kinshasaLocations.filter(location => 
      location.name.toLowerCase().includes(query) ||
      location.description.toLowerCase().includes(query) ||
      location.type.toLowerCase().includes(query)
    ).map(location => ({
      ...location,
      distance: calculateDistance(startPoint, {
        lat: location.coordinates.lat,
        lng: location.coordinates.lng,
        name: location.name,
        address: location.description
      }),
      bearing: calculateBearing(
        startPoint.lat,
        startPoint.lng,
        location.coordinates.lat,
        location.coordinates.lng
      )
    })).sort((a, b) => (a.distance || 0) - (b.distance || 0));

    setKinshasaSearchResults(results);
  }, [kinshasaSearchQuery, startPoint]);

  const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };

  const getBearingDescription = (bearing: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  };

  const selectKinshasaLocation = (location: KinshasaLocation) => {
    setSelectedKinshasaLocation(location);
    setKinshasaSearchQuery(location.name);
    setKinshasaSearchResults([]);
    setShowDistanceInfo(true);
    
    // Centrer la carte sur la location
    setMapCenter(location.coordinates);
    setMapZoom(14);
    
    // Annoncer vocalement si activé
    if (voiceGuidance) {
      speakInstruction(
        `${location.name} sélectionné. Distance: ${location.distance?.toFixed(1)} kilomètres. ` +
        `Direction: ${getBearingDescription(location.bearing || 0)}. ` +
        location.description,
        true
      );
    }
  };

  const startRealTimeTracking = () => {
    setIsRealTimeTracking(true);
    
    // Simuler le suivi en temps réel
    const trackingInterval = setInterval(() => {
      const currentPosition = {
        lat: startPoint.lat + (Math.random() - 0.5) * 0.002,
        lng: startPoint.lng + (Math.random() - 0.5) * 0.002
      };
      
      const speed = Math.random() * 15 + 5; // 5-20 km/h
      const heading = Math.random() * 360;
      
      setRealTimeMovement({
        currentPosition,
        speed,
        heading,
        accuracy: Math.random() * 10 + 5, // 5-15m
        timestamp: new Date()
      });
      
      // Mettre à jour la position sur la carte
      setUserPosition({ lng: currentPosition.lng, lat: currentPosition.lat });
      setMapCenter(currentPosition);
      
    }, 2000); // Toutes les 2 secondes
    
    // Arrêter après 30 secondes pour la démo
    setTimeout(() => {
      clearInterval(trackingInterval);
      setIsRealTimeTracking(false);
    }, 30000);
  };

  const stopRealTimeTracking = () => {
    setIsRealTimeTracking(false);
    setRealTimeMovement(null);
  };

  const getLocationTypeIcon = (type: string) => {
    switch (type) {
      case 'avenue': return <MapPinIcon className="w-4 h-4" />;
      case 'commune': return <Globe className="w-4 h-4" />;
      case 'hopital': return <AlertCircle className="w-4 h-4" />;
      case 'police': return <Shield className="w-4 h-4" />;
      case 'ecole': return <Activity className="w-4 h-4" />;
      default: return <MapPinIcon className="w-4 h-4" />;
    }
  };

  const getLocationTypeColor = (type: string) => {
    switch (type) {
      case 'avenue': return 'text-blue-400';
      case 'commune': return 'text-green-400';
      case 'hopital': return 'text-red-400';
      case 'police': return 'text-yellow-400';
      case 'ecole': return 'text-purple-400';
      default: return 'text-slate-400';
    }
  };

  // Effet pour la recherche de lieux
  useEffect(() => {
    searchKinshasaLocations();
  }, [searchKinshasaLocations]);

  const startSafePath = () => {
    if (!endPoint.name) return;
    
    const route = calculateSafeRoute(startPoint, endPoint);
    setSelectedRoute(route);
    setCurrentStep('route');
  };

  const startTracking = () => {
    setIsTracking(true);
    setCurrentStep('tracking');
    
    // Générer un ID de trajet unique
    const tripId = `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentTripId(tripId);
    
    // Générer le lien de suivi
    const link = `https://usalama.app/track/${tripId}`;
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
    deviationCheckInterval.current = setInterval(() => {
      checkDeviation();
      announceDeviation(); // Annoncer les déviations vocalement
    }, 3000);
    
    // Démarrer le guidage vocal si activé
    if (voiceGuidance) {
      startVoiceGuidance();
      
      // Annoncer les conditions météo si risques élevés
      if (weatherData && (weatherData.riskLevel === 'high' || weatherData.riskLevel === 'critical')) {
        setTimeout(() => {
          speakInstruction(
            `Attention. ${weatherData.riskMessage}. ` +
            `Température: ${weatherData.temperature.toFixed(1)} degrés. ` +
            `Conditions: ${weatherData.condition === 'rainy' ? 'pluvieuses' : weatherData.condition === 'stormy' ? 'orageuses' : 'nuageuses'}.`,
            true
          );
        }, 2000);
      }
    }
    
    // Vérifier la connexion initiale
    checkConnectionStatus();
  };

  const startPositionTracking = () => {
    trackingInterval.current = setInterval(() => {
      const batteryLevel = Math.max(20, 100 - Math.random() * 30);
      const signalStrength = Math.random() > 0.3 ? 4 : Math.floor(Math.random() * 3);
      
      const deviation = Math.random() * 250;
      const isOnRoute = deviation < 200;
      
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
    
    // Arrêter le guidage vocal et annoncer l'arrivée
    if (voiceGuidance) {
      announceArrival();
      setTimeout(stopVoiceGuidance, 3000); // Arrêter après le message d'arrivée
    }
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

  const getSeverityColorMap = (severity: string) => {
    switch (severity) {
      case 'critical': return 'rgba(239, 68, 68, 0.4)';
      case 'high': return 'rgba(251, 146, 60, 0.4)';
      case 'medium': return 'rgba(250, 204, 21, 0.4)';
      case 'low': return 'rgba(34, 197, 94, 0.4)';
      default: return 'rgba(148, 163, 184, 0.3)';
    }
  };

  // Fonction pour convertir les coordonnées GPS en pixels sur la carte simulée
  const coordToPixel = (lat: number, lng: number) => {
    const mapWidth = 400;
    const mapHeight = 400;
    
    // Conversion simple (approximation pour Kinshasa)
    const x = ((lng - 15.2) / 0.2) * mapWidth;
    const y = ((-lat - 4.3) / 0.2) * mapHeight;
    
    return { x: Math.max(0, Math.min(mapWidth, x)), y: Math.max(0, Math.min(mapHeight, y)) };
  };

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

                {/* Recherche avancée Kinshasa */}
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Compass className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium">Recherche à Kinshasa</span>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Rechercher une avenue, commune ou lieu..."
                      value={kinshasaSearchQuery}
                      onChange={(e) => setKinshasaSearchQuery(e.target.value)}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm"
                    />
                    
                    {/* Résultats de recherche Kinshasa */}
                    <AnimatePresence>
                      {kinshasaSearchResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full mt-2 w-full bg-slate-800 rounded-lg border border-slate-700 z-50 max-h-48 overflow-y-auto"
                        >
                          {kinshasaSearchResults.map((location) => (
                            <motion.button
                              key={location.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => selectKinshasaLocation(location)}
                              className="w-full text-left p-3 hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={getLocationTypeColor(location.type)}>
                                    {getLocationTypeIcon(location.type)}
                                  </div>
                                  <div>
                                    <div className="font-medium text-white text-sm">{location.name}</div>
                                    <div className="text-xs text-slate-400">{location.description}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-blue-400">
                                    {location.distance?.toFixed(1)} km
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    {getBearingDescription(location.bearing || 0)}
                                  </div>
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Informations de distance */}
                <AnimatePresence>
                  {showDistanceInfo && selectedKinshasaLocation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-blue-600/20 border border-blue-600/50 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Navigation2 className="w-4 h-4 text-blue-400" />
                          <span className="font-medium text-blue-400">
                            {selectedKinshasaLocation.name}
                          </span>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getLocationTypeColor(selectedKinshasaLocation.type)}`}>
                          {selectedKinshasaLocation.type}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-400">Distance:</span>
                          <span className="ml-2 font-medium">{selectedKinshasaLocation.distance?.toFixed(1)} km</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Direction:</span>
                          <span className="ml-2 font-medium">{getBearingDescription(selectedKinshasaLocation.bearing || 0)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={startRealTimeTracking}
                          disabled={isRealTimeTracking}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                            isRealTimeTracking 
                              ? 'bg-green-600 text-white' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {isRealTimeTracking ? 'Suivi en cours...' : 'Suivre en temps réel'}
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowDistanceInfo(false)}
                          className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          Fermer
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mouvement en temps réel */}
                <AnimatePresence>
                  {realTimeMovement && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-green-600/20 border border-green-600/50 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          <span className="font-medium text-green-400">Suivi en temps réel</span>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={stopRealTimeTracking}
                          className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                        >
                          Arrêter
                        </motion.button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-400">Vitesse:</span>
                          <span className="ml-2 font-medium">{realTimeMovement.speed.toFixed(1)} km/h</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Direction:</span>
                          <span className="ml-2 font-medium">{getBearingDescription(realTimeMovement.heading)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Précision:</span>
                          <span className="ml-2 font-medium">±{realTimeMovement.accuracy.toFixed(0)}m</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Position:</span>
                          <span className="ml-2 font-medium">
                            {realTimeMovement.currentPosition.lat.toFixed(4)}, {realTimeMovement.currentPosition.lng.toFixed(4)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-slate-400">
                        Dernière mise à jour: {realTimeMovement.timestamp.toLocaleTimeString('fr-FR')}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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

                {/* Weather Card - Météo-Safe */}
                {weatherData && (
                  <div className={`rounded-lg p-4 border ${
                    weatherData.riskLevel === 'critical' ? 'bg-red-600/20 border-red-600/50' :
                    weatherData.riskLevel === 'high' ? 'bg-orange-600/20 border-orange-600/50' :
                    weatherData.riskLevel === 'medium' ? 'bg-yellow-600/20 border-yellow-600/50' :
                    'bg-green-600/20 border-green-600/50'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getWeatherIcon(weatherData.condition)}
                        <div>
                          <div className="font-semibold">Météo à {endPoint.name}</div>
                          <div className="text-sm opacity-80">
                            {weatherData.temperature.toFixed(1)}°C • {weatherData.humidity.toFixed(0)}% humidité
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4" />
                        <Wind className="w-4 h-4" />
                      </div>
                    </div>
                    
                    <div className={`text-sm font-medium p-2 rounded ${getWeatherRiskColor(weatherData.riskLevel)}`}>
                      {weatherData.riskMessage}
                    </div>

                    {weatherData.floodRisk !== 'none' && (
                      <div className="mt-2 flex items-center gap-2">
                        <AlertCircle className={`w-4 h-4 ${getFloodRiskColor(weatherData.floodRisk)}`} />
                        <span className={`text-sm ${getFloodRiskColor(weatherData.floodRisk)}`}>
                          Risque d'inondation: {
                            weatherData.floodRisk === 'high' ? 'ÉLEVÉ' :
                            weatherData.floodRisk === 'moderate' ? 'MODÉRÉ' :
                            'FAIBLE'
                          }
                        </span>
                      </div>
                    )}

                    <div className="mt-2 text-xs opacity-70">
                      Visibilité: {weatherData.visibility.toFixed(1)} km • Vent: {weatherData.windSpeed.toFixed(1)} km/h
                    </div>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startTracking}
                  className={`w-full rounded-lg py-3 font-semibold transition-colors ${
                    weatherData && (weatherData.riskLevel === 'high' || weatherData.riskLevel === 'critical')
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Play className="w-5 h-5" />
                    {weatherData && (weatherData.riskLevel === 'high' || weatherData.riskLevel === 'critical')
                      ? 'Démarrer (Météo défavorable)'
                      : 'Lancer le suivi sous haute surveillance'
                    }
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

                {/* Indicateur de connexion */}
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        connectionStatus.isConnected ? 'bg-green-400' : 'bg-red-400'
                      } ${connectionStatus.isConnected ? 'animate-pulse' : ''}`} />
                      <span className="text-sm font-medium">État de connexion</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <WifiIcon className={`w-4 h-4 ${
                        connectionStatus.signalStrength >= 3 ? 'text-green-400' :
                        connectionStatus.signalStrength >= 2 ? 'text-yellow-400' :
                        'text-red-400'
                      }`} />
                      <span className="text-xs text-slate-400">
                        {connectionStatus.lastUpdate.toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-slate-400">
                    {connectionStatus.isConnected 
                      ? 'Position transmise au réseau' 
                      : 'Connexion instable - Position en attente'
                    }
                  </div>
                  
                  {!connectionStatus.serverReachable && (
                    <div className="mt-1 text-xs text-orange-400">
                      Serveur injoignable - Données en cache locale
                    </div>
                  )}
                </div>

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

                {/* Contrôles de guidage vocal */}
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium">Guidage Vocal Discret</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => voiceGuidance ? stopVoiceGuidance() : startVoiceGuidance()}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        voiceGuidance 
                          ? 'bg-green-600 text-white' 
                          : 'bg-slate-600 text-slate-300'
                      }`}
                    >
                      {voiceGuidance ? 'Activé' : 'Désactivé'}
                    </motion.button>
                  </div>

                  {voiceGuidance && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Volume</span>
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setVoiceVolume(Math.max(0, voiceVolume - 0.2))}
                            className="p-1 hover:bg-slate-600 rounded"
                          >
                            <VolumeX className="w-3 h-3" />
                          </motion.button>
                          <div className="w-16 h-1 bg-slate-600 rounded-full">
                            <div 
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${voiceVolume * 100}%` }}
                            />
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setVoiceVolume(Math.min(1, voiceVolume + 0.2))}
                            className="p-1 hover:bg-slate-600 rounded"
                          >
                            <Volume2 className="w-3 h-3" />
                          </motion.button>
                        </div>
                      </div>

                      {isSpeaking && (
                        <div className="bg-blue-600/20 border border-blue-600/50 rounded p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                            <span className="text-xs text-blue-400">En cours...</span>
                          </div>
                          <div className="text-xs text-slate-300 mt-1 italic">
                            "{currentInstruction}"
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-slate-400">
                        💡 Utilisez des écouteurs pour une discrétion maximale
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Carte Simulée */}
      <div className="relative h-96 sm:h-[500px] bg-slate-800 overflow-hidden">
        {/* Grille de la carte */}
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute w-full border-t border-slate-600"
              style={{ top: `${i * 10}%` }}
            />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute h-full border-l border-slate-600"
              style={{ left: `${i * 10}%` }}
            />
          ))}
        </div>

        {/* Zones rouges */}
        {redZones.map((zone) => {
          const pos = coordToPixel(zone.coordinates.lat, zone.coordinates.lng);
          const radius = zone.radius / 10; // Échelle simulée
          
          return (
            <div
              key={zone.id}
              className="absolute rounded-full animate-pulse"
              style={{
                left: `${pos.x - radius}px`,
                top: `${pos.y - radius}px`,
                width: `${radius * 2}px`,
                height: `${radius * 2}px`,
                backgroundColor: getSeverityColorMap(zone.severity),
                border: `2px solid ${zone.severity === 'critical' ? '#ef4444' : 
                                 zone.severity === 'high' ? '#fb923c' : 
                                 zone.severity === 'medium' ? '#facc15' : '#22c55e'}`
              }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-slate-800 rounded px-2 py-1 text-xs whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                {zone.name}
              </div>
            </div>
          );
        })}

        {/* Itinéraire */}
        {selectedRoute?.coordinates && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <polyline
              points={selectedRoute.coordinates.map(coord => {
                const pos = coordToPixel(coord[1], coord[0]);
                return `${pos.x},${pos.y}`;
              }).join(' ')}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="4"
              strokeOpacity="0.8"
            />
          </svg>
        )}

        {/* Position utilisateur */}
        {userPosition && (
          <div
            className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"
            style={{
              left: `${coordToPixel(userPosition.lat, userPosition.lng).x - 8}px`,
              top: `${coordToPixel(userPosition.lat, userPosition.lng).y - 8}px`
            }}
          >
            {isTracking && (
              <div className="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full animate-ping" />
            )}
          </div>
        )}

        {/* Point de départ */}
        <div
          className="absolute w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
          style={{
            left: `${coordToPixel(startPoint.lat, startPoint.lng).x - 12}px`,
            top: `${coordToPixel(startPoint.lat, startPoint.lng).y - 12}px`
          }}
        >
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>

        {/* Destination */}
        {endPoint.name && (
          <div
            className="absolute w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
            style={{
              left: `${coordToPixel(endPoint.lat, endPoint.lng).x - 12}px`,
              top: `${coordToPixel(endPoint.lat, endPoint.lng).y - 12}px`
            }}
          >
            <Navigation className="w-3 h-3 text-white" />
          </div>
        )}

        {/* Lieux de Kinshasa */}
        {kinshasaLocations.map((location) => {
          const pos = coordToPixel(location.coordinates.lat, location.coordinates.lng);
          const isSelected = selectedKinshasaLocation?.id === location.id;
          
          return (
            <div
              key={location.id}
              className="absolute cursor-pointer"
              style={{
                left: `${pos.x - 8}px`,
                top: `${pos.y - 8}px`
              }}
              onClick={() => selectKinshasaLocation(location)}
            >
              <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all ${
                isSelected ? 'bg-blue-500 scale-125' : 'bg-slate-500 hover:bg-slate-400'
              }`}>
                {isSelected && (
                  <div className="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full animate-ping" />
                )}
              </div>
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-slate-800 rounded px-2 py-1 text-xs whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                {location.name}
              </div>
            </div>
          );
        })}

        {/* Position de mouvement en temps réel */}
        {realTimeMovement && (
          <div
            className="absolute w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"
            style={{
              left: `${coordToPixel(realTimeMovement.currentPosition.lat, realTimeMovement.currentPosition.lng).x - 8}px`,
              top: `${coordToPixel(realTimeMovement.currentPosition.lat, realTimeMovement.currentPosition.lng).y - 8}px`
            }}
          >
            <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping" />
            {/* Indicateur de direction */}
            <div 
              className="absolute w-1 h-3 bg-green-600"
              style={{
                top: '-3px',
                left: '50%',
                transform: `translateX(-50%) rotate(${realTimeMovement.heading}deg)`,
                transformOrigin: 'center bottom'
              }}
            />
          </div>
        )}

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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
            onClick={() => setMapStyle(mapStyle === 'dark' ? 'light' : 'dark')}
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
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => voiceGuidance ? stopVoiceGuidance() : startVoiceGuidance()}
            className={`rounded-lg p-3 flex flex-col items-center gap-2 transition-colors ${
              voiceGuidance 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
          >
            <Headphones className="w-5 h-5" />
            <span className="text-xs">Voix</span>
          </motion.button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-lg border-t border-slate-700 z-40">
        <div className="flex items-center justify-around py-2">
          {navigationItems.map((item) => {
            const icons: Record<string, JSX.Element> = {
              'Shield': <Shield className="w-4 h-4 sm:w-5 sm:h-5" />,
              'Map': <Map className="w-4 h-4 sm:w-5 sm:h-5" />,
              'Phone': <Phone className="w-4 h-4 sm:w-5 sm:h-5" />,
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
                    onNavigate?.('sos');
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

      {/* Bouton SOS Sticky */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onNavigate?.('sos')}
        className="fixed bottom-24 right-4 w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full shadow-lg flex items-center justify-center z-50"
        style={{
          boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)'
        }}
      >
        <Phone className="w-8 h-8 text-white" />
        <div className="absolute inset-0 w-16 h-16 bg-red-600 rounded-full animate-ping opacity-20" />
      </motion.button>
    </div>
  );
};

export default EnhancedMapScreenSafePath;
