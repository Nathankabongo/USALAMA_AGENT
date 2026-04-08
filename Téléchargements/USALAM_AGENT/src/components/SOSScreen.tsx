import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Map, Phone, Bell, User, AlertTriangle, Clock, MapPin,
  Navigation, Users, Activity, Mic, MicOff, Video, VideoOff, Send,
  X, CheckCircle, Zap, Heart, Share2, MessageCircle, Volume2, VolumeX,
  Eye, EyeOff, Lock, Settings, Globe, Hospital, ShieldCheck, Radio,
  Wifi, WifiOff, Battery, BatteryLow, Timer, Home, ArrowUp, ArrowDown,
  ArrowLeft, ArrowRight, Pen, Square, Circle, Compass, Signal, RadioIcon,
  Camera, CameraOff, Maximize2, Minimize2, Move, Navigation2, Plus,
  Trash2, PhoneCall, ChevronDown, ChevronUp, Copy, Check, ToggleLeft,
  ToggleRight, Siren, Waves, FileText, ClipboardList, Megaphone,
  AlarmClock, Smartphone, Radio2, BroadcastTower, Route, Navigation3,
  BarChart3, TrendingUp, ThermometerSun, ZapOff, Flashlight,
  Volume, Mic2, MessageSquare, RadioIcon as RadioReceiver, Wind,
  ActivityIcon, Brain, Target, ShieldAlert, LifeBuoy, Ambulance,
  Stethoscope, Pill, FileMedical, Users2, MapPin2, Compass2
} from 'lucide-react';

import { NavigationProps, navigationItems } from '../types/navigation';
import { evacuationNavigation, EvacuationRoute, SafePoint } from '../services/evacuationNavigation';
import { multiChannelCommunication } from '../services/multiChannelCommunication';
import { automationShortcuts } from '../services/automationShortcuts';
import { analyticsReports } from '../services/analyticsReports';
import { survivalMode, SurvivalTool, CompassData, FlashlightState } from '../services/survivalMode';
import { externalIntegrations, MedicalService, AmbulanceService } from '../services/externalIntegrations';

// ── Types ─────────────────────────────────────────────────────
interface EmergencyContact {
  id: string; name: string; phone: string; relation: string;
  isPrimary: boolean; batteryLevel?: number; isOnline?: boolean;
}

interface SOSLog {
  id: string; timestamp: Date; type: 'manual' | 'automatic' | 'voice' | 'discreet';
  duration: number; status: 'active' | 'completed' | 'cancelled';
}

interface SOSSettings {
  stealthEnabled: boolean; soundEnabled: boolean;
  countdownDuration: number; autoGPS: boolean; emergencyNumber: string;
}

// ── Composant Principal ────────────────────────────────────────
const SOSScreen = ({ onNavigate }: NavigationProps) => {
  // SOS core
  const [sosActive, setSosActive] = useState(false);
  const [sosMode, setSosMode] = useState<'emergency' | 'discreet'>('emergency');
  const [countdown, setCountdown] = useState(0);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [stealthActive, setStealthActive] = useState(false);

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isVideoRecording, setIsVideoRecording] = useState(false);

  // Location
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);
  const [positionCopied, setPositionCopied] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  // Contacts & copilote
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [copilotId, setCopilotId] = useState<string | null>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' });

  // UI states
  const [showSettings, setShowSettings] = useState(false);
  const [showSOSLog, setShowSOSLog] = useState(false);
  const [showCopilotPanel, setShowCopilotPanel] = useState(false);
  const [showMapSection, setShowMapSection] = useState(false);
  const [showParentModal, setShowParentModal] = useState(false);
  const [currentDirection, setCurrentDirection] = useState<string | null>(null);
  const [directionSent, setDirectionSent] = useState(false);

  // 🔊 Sirène
  const [sirenActive, setSirenActive] = useState(false);
  const sirenOscillator = useRef<OscillatorNode | null>(null);
  const sirenAudioCtx = useRef<AudioContext | null>(null);

  // ⏱️ Check-in Timer
  const [checkinActive, setCheckinActive] = useState(false);
  const [checkinMinutes, setCheckinMinutes] = useState(30);
  const [checkinRemaining, setCheckinRemaining] = useState(0);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const checkinInterval = useRef<NodeJS.Timeout | null>(null);

  // 📷 Photo Silencieuse
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [photoCaptured, setPhotoCaptured] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoStream = useRef<MediaStream | null>(null);

  // 📢 Alerte diffusée
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [broadcastCount, setBroadcastCount] = useState(0);

  // 📳 Shake detection
  const [shakeEnabled, setShakeEnabled] = useState(false);
  const lastShake = useRef<number>(0);
  const shakeThreshold = 25;

  // ── Nouveaux états pour les fonctionnalités avancées ───────────────────
  
  // Navigation d'évacuation
  const [evacuationRoutes, setEvacuationRoutes] = useState<EvacuationRoute[]>([]);
  const [safePoints, setSafePoints] = useState<SafePoint[]>([]);
  const [showEvacuationPanel, setShowEvacuationPanel] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<EvacuationRoute | null>(null);

  // Communication multi-canaux
  const [availableMessages, setAvailableMessages] = useState<any[]>([]);
  const [showCommunicationPanel, setShowCommunicationPanel] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'lingala' | 'swahili' | 'english'>('fr');
  const [channelStatus, setChannelStatus] = useState<any[]>([]);
  const [messageQueueStatus, setMessageQueueStatus] = useState({ pending: 0, sent: 0, failed: 0 });

  // Automatisation et raccourcis
  const [widgets, setWidgets] = useState<any[]>([]);
  const [voiceCommands, setVoiceCommands] = useState<any[]>([]);
  const [shortcuts, setShortcuts] = useState<any[]>([]);
  const [showAutomationPanel, setShowAutomationPanel] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);

  // Analyse et rapports
  const [statistics, setStatistics] = useState<any>(null);
  const [personalMetrics, setPersonalMetrics] = useState<any>(null);
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(false);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);

  // Mode survie
  const [survivalActive, setSurvivalActive] = useState(false);
  const [survivalTools, setSurvivalTools] = useState<SurvivalTool[]>([]);
  const [compassData, setCompassData] = useState<CompassData | null>(null);
  const [flashlightState, setFlashlightState] = useState<FlashlightState | null>(null);
  const [batteryStatus, setBatteryStatus] = useState<any>(null);
  const [showSurvivalPanel, setShowSurvivalPanel] = useState(false);

  // Intégrations externes
  const [nearbyMedicalServices, setNearbyMedicalServices] = useState<MedicalService[]>([]);
  const [availableAmbulances, setAvailableAmbulances] = useState<AmbulanceService[]>([]);
  const [showExternalPanel, setShowExternalPanel] = useState(false);
  const [emergencyRequests, setEmergencyRequests] = useState<any[]>([]);

  // System
  const [batteryLevel] = useState(85);
  const [signalStrength] = useState(3);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [copiedLink, setCopiedLink] = useState(false);

  // Settings
  const [settings, setSettings] = useState<SOSSettings>({
    stealthEnabled: true, soundEnabled: true,
    countdownDuration: 30, autoGPS: true, emergencyNumber: '112'
  });

  // Contacts
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { id: '1', name: 'Papa', phone: '+243818123456', relation: 'Famille', isPrimary: true, batteryLevel: 78, isOnline: true },
    { id: '2', name: 'Maman', phone: '+243819987654', relation: 'Famille', isPrimary: false, batteryLevel: 92, isOnline: true },
    { id: '3', name: 'Dr. Mukendi', phone: '+243812345678', relation: 'Médecin', isPrimary: false, batteryLevel: 65, isOnline: false },
  ]);

  // SOS Log
  const [sosLogs, setSOSLogs] = useState<SOSLog[]>([
    { id: '1', timestamp: new Date(Date.now() - 86400000), type: 'manual', duration: 120, status: 'completed' },
    { id: '2', timestamp: new Date(Date.now() - 172800000), type: 'discreet', duration: 45, status: 'cancelled' },
  ]);

  // Copilot chat
  const [chatMessages, setChatMessages] = useState<{ from: string; text: string; time: Date }[]>([
    { from: 'system', text: 'Connectez-vous à un copilote pour commencer.', time: new Date() }
  ]);
  const [chatInput, setChatInput] = useState('');

  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const animFrame = useRef<number | null>(null);

  // ── 🔊 Sirène ─────────────────────────────────────────────
  const toggleSiren = () => {
    if (sirenActive) {
      sirenOscillator.current?.stop();
      sirenOscillator.current = null;
      sirenAudioCtx.current?.close();
      sirenAudioCtx.current = null;
      setSirenActive(false);
    } else {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      sirenAudioCtx.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      gain.gain.value = 0.8;
      // Oscillation de fréquence
      let up = true;
      let freq = 400;
      const interval = setInterval(() => {
        freq = up ? Math.min(freq + 15, 1200) : Math.max(freq - 15, 400);
        if (freq >= 1200 || freq <= 400) up = !up;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
      }, 30);
      osc.start();
      sirenOscillator.current = osc;
      setSirenActive(true);
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 100]);
    }
  };

  // ── ⏱️ Check-in Timer ──────────────────────────────────────
  const startCheckin = () => {
    const totalSeconds = checkinMinutes * 60;
    setCheckinRemaining(totalSeconds);
    setCheckinActive(true);
    setShowCheckinModal(false);
    checkinInterval.current = setInterval(() => {
      setCheckinRemaining(prev => {
        if (prev <= 1) {
          clearInterval(checkinInterval.current!);
          setCheckinActive(false);
          // Timer expiré → déclenche SOS automatique
          handleSOSActivation('emergency');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelCheckin = () => {
    if (checkinInterval.current) clearInterval(checkinInterval.current);
    setCheckinActive(false);
    setCheckinRemaining(0);
  };

  const fmtCheckin = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // ── 📷 Photo Silencieuse ───────────────────────────────────
  const openPhotoCapture = async () => {
    setShowPhotoModal(true);
    setPhotoCaptured(null);
    setPhotoTaken(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      photoStream.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      console.log('Caméra non disponible');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth || 320;
    canvasRef.current.height = videoRef.current.videoHeight || 240;
    ctx?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
    setPhotoCaptured(dataUrl);
    setPhotoTaken(true);
    // Sauvegarder dans localStorage
    const photos = JSON.parse(localStorage.getItem('usalama_evidence_photos') || '[]');
    photos.push({ data: dataUrl, timestamp: new Date().toISOString(), type: 'emergency' });
    localStorage.setItem('usalama_evidence_photos', JSON.stringify(photos.slice(-20)));
  };

  const closePhotoModal = () => {
    photoStream.current?.getTracks().forEach(t => t.stop());
    photoStream.current = null;
    setShowPhotoModal(false);
    setPhotoTaken(false);
    setPhotoCaptured(null);
  };

  // ── 📢 Alerte Diffusée ─────────────────────────────────────
  const broadcastAlert = () => {
    // Simuler envoi à tous les contacts
    setBroadcastSent(true);
    setBroadcastCount(contacts.length);
    if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
    setTimeout(() => setBroadcastSent(false), 4000);
    // Ajouter au log
    const newLog: SOSLog = {
      id: Date.now().toString(), timestamp: new Date(),
      type: 'automatic', duration: 0, status: 'active'
    };
    setSOSLogs(prev => [newLog, ...prev]);
  };

  // ── 📳 Shake-to-SOS ───────────────────────────────────────
  useEffect(() => {
    if (!shakeEnabled) return;
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const total = Math.abs(acc.x || 0) + Math.abs(acc.y || 0) + Math.abs(acc.z || 0);
      const now = Date.now();
      if (total > shakeThreshold && now - lastShake.current > 1000) {
        lastShake.current = now;
        handleSOSActivation('emergency');
      }
    };
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [shakeEnabled]);

  // Cleanup siren on unmount
  useEffect(() => {
    return () => {
      sirenOscillator.current?.stop();
      sirenAudioCtx.current?.close();
      if (checkinInterval.current) clearInterval(checkinInterval.current);
      photoStream.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ── Initialisation des nouvelles fonctionnalités ───────────────────
  
  useEffect(() => {
    // Initialiser la navigation d'évacuation
    if (currentPos) {
      evacuationNavigation.calculateSafeRoutes(currentPos.lat, currentPos.lng)
        .then(routes => setEvacuationRoutes(routes));
      
      setSafePoints(evacuationNavigation.getNearbySafePoints(currentPos.lat, currentPos.lng));
    }

    // Initialiser la communication multi-canaux
    setAvailableMessages(multiChannelCommunication.getAvailableMessages(selectedLanguage));
    setChannelStatus(multiChannelCommunication.getChannelStatus());
    setMessageQueueStatus(multiChannelCommunication.getMessageQueueStatus());

    // Initialiser l'automatisation
    setWidgets(automationShortcuts.getWidgets());
    setVoiceCommands(automationShortcuts.getVoiceCommands());
    setShortcuts(automationShortcuts.getShortcuts());

    // Initialiser l'analyse
    setStatistics(analyticsReports.getStatistics());
    setPersonalMetrics(analyticsReports.getPersonalMetrics());
    setHeatmapData(analyticsReports.getHeatmapData());

    // Initialiser le mode survie
    setSurvivalTools(survivalMode.getSurvivalTools());
    setCompassData(survivalMode.getCompassData());
    setFlashlightState(survivalMode.getFlashlightState());
    setBatteryStatus(survivalMode.getBatteryStatus());
    setSurvivalActive(survivalMode.isSurvivalModeActive());

    // Initialiser les intégrations externes
    if (currentPos) {
      setNearbyMedicalServices(externalIntegrations.getNearbyMedicalServices(currentPos.lat, currentPos.lng));
      setAvailableAmbulances(externalIntegrations.getAvailableAmbulances(currentPos.lat, currentPos.lng));
    }
    setEmergencyRequests(externalIntegrations.getEmergencyRequests());

    // Écouter les événements de raccourcis
    const handleShortcut = (event: CustomEvent) => {
      const { action } = event.detail;
      switch (action) {
        case 'sos_emergency':
          handleSOSActivation('emergency');
          break;
        case 'sos_discreet':
          handleSOSActivation('discreet');
          break;
        case 'call_emergency':
          callEmergency();
          break;
        case 'share_location':
          sharePosition();
          break;
      }
    };

    window.addEventListener('shortcutTriggered', handleShortcut as EventListener);
    return () => window.removeEventListener('shortcutTriggered', handleShortcut as EventListener);
  }, [currentPos, selectedLanguage]);

  // ── Clock ──────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── SOS Countdown ─────────────────────────────────────────
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    } else if (countdown === 0 && sosActive) {
      // Countdown finished — finalize SOS
      finalizeSOS();
    }
  }, [countdown, sosActive]);

  // ── Recording Timer ───────────────────────────────────────
  useEffect(() => {
    if (isRecording) {
      recordingTimer.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
        setAudioLevel(Math.random() * 80 + 20);
      }, 1000);
    } else {
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      setRecordingSeconds(0);
      setAudioLevel(0);
    }
    return () => { if (recordingTimer.current) clearInterval(recordingTimer.current); };
  }, [isRecording]);

  // ── GPS ──────────────────────────────────────────────────
  useEffect(() => {
    if (isLocationSharing && navigator.geolocation) {
      const watcher = navigator.geolocation.watchPosition(
        pos => {
          setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsAccuracy(Math.round(pos.coords.accuracy));
        },
        () => setCurrentPos({ lat: -4.4419, lng: 15.2663 }),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watcher);
    }
  }, [isLocationSharing]);

  // ── SOS Activation ────────────────────────────────────────
  const handleSOSActivation = (mode: 'emergency' | 'discreet') => {
    setSosMode(mode);
    setSosActive(true);
    setShowModeSelector(false);
    setCountdown(settings.countdownDuration);
    setIsRecording(true);
    if (settings.autoGPS) setIsLocationSharing(true);
    if (mode === 'discreet') setStealthActive(true);
    if (settings.soundEnabled && mode === 'emergency') {
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 200]);
    }
    const newLog: SOSLog = {
      id: Date.now().toString(), timestamp: new Date(),
      type: mode === 'discreet' ? 'discreet' : 'manual',
      duration: 0, status: 'active'
    };
    setSOSLogs(prev => [newLog, ...prev]);
  };

  const handleSOSCancel = () => {
    setSosActive(false); setCountdown(0); setIsRecording(false);
    setIsLocationSharing(false); setStealthActive(false);
    setSOSLogs(prev => prev.map((l, i) => i === 0 && l.status === 'active'
      ? { ...l, status: 'cancelled', duration: settings.countdownDuration - countdown }
      : l
    ));
  };

  const finalizeSOS = () => {
    setSosActive(false);
    setSOSLogs(prev => prev.map((l, i) => i === 0 && l.status === 'active'
      ? { ...l, status: 'completed', duration: settings.countdownDuration }
      : l
    ));
  };

  // ── Contacts ──────────────────────────────────────────────
  const callContact = (phone: string) => { window.location.href = `tel:${phone}`; };
  const callEmergency = () => { window.location.href = `tel:${settings.emergencyNumber}`; };

  const addContact = () => {
    if (!newContact.name || !newContact.phone) return;
    setContacts(prev => [...prev, {
      id: Date.now().toString(), ...newContact,
      isPrimary: false, batteryLevel: 100, isOnline: false
    }]);
    setNewContact({ name: '', phone: '', relation: '' });
    setShowAddContact(false);
  };

  const removeContact = (id: string) => setContacts(prev => prev.filter(c => c.id !== id));

  // ── Copilote ──────────────────────────────────────────────
  const connectCopilot = (contactId: string) => {
    setCopilotId(contactId);
    setShowCopilotPanel(true);
    const c = contacts.find(c => c.id === contactId);
    setChatMessages(prev => [...prev, {
      from: 'system', text: `✅ ${c?.name} connecté comme copilote`, time: new Date()
    }]);
  };

  const disconnectCopilot = () => {
    setCopilotId(null);
    setShowCopilotPanel(false);
    setCurrentDirection(null);
  };

  const sendDirection = (dir: string) => {
    setCurrentDirection(dir);
    setDirectionSent(true);
    setTimeout(() => { setCurrentDirection(null); setDirectionSent(false); }, 2000);
    const copilot = contacts.find(c => c.id === copilotId);
    setChatMessages(prev => [...prev, {
      from: copilot?.name || 'Copilote',
      text: `👉 Direction: ${dir.toUpperCase()}`,
      time: new Date()
    }]);
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { from: 'moi', text: chatInput, time: new Date() }]);
    setChatInput('');
  };

  // ── Location sharing ──────────────────────────────────────
  const sharePosition = () => {
    if (!currentPos) { setIsLocationSharing(true); return; }
    const link = `https://maps.google.com/?q=${currentPos.lat},${currentPos.lng}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000);
    }).catch(() => setCopiedLink(true));
  };

  // ── Countdown arc ─────────────────────────────────────────
  const maxCountdown = settings.countdownDuration;
  const arcRadius = 54;
  const arcCircumference = 2 * Math.PI * arcRadius;
  const arcOffset = arcCircumference - (countdown / maxCountdown) * arcCircumference;

  // ── Helpers ───────────────────────────────────────────────
  const fmt = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (d: Date) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  const fmtDuration = (s: number) => `${Math.floor(s / 60)}m${s % 60}s`;

  const statusColor: Record<string, string> = {
    active: 'text-yellow-400', completed: 'text-green-400', cancelled: 'text-slate-400'
  };
  const typeLabel: Record<string, string> = {
    manual: 'Urgence', automatic: 'Auto', voice: 'Voix', discreet: 'Discret'
  };

  const copilot = contacts.find(c => c.id === copilotId);

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">

      {/* ── Header ── */}
      <div className="bg-slate-800/95 backdrop-blur-lg border-b border-slate-700 p-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => onNavigate?.('enhanced-home' as any)}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg">
              <Home className="w-4 h-4" />
            </motion.button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <span className="text-red-400">USALAMA</span> SOS
                {stealthActive && <span className="text-xs bg-indigo-600 px-2 py-0.5 rounded-full">MODE DISCRET</span>}
              </h1>
              <p className="text-xs text-slate-400">{currentTime.toLocaleTimeString('fr-FR')} · Protection immédiate</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isRecording && (
              <div className="flex items-center gap-1 bg-red-600/20 border border-red-600/50 rounded-full px-2 py-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-red-400">{fmtDuration(recordingSeconds)}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              {batteryLevel > 60 ? <Battery className="w-4 h-4 text-green-400" /> : <BatteryLow className="w-4 h-4 text-red-400" />}
              <span className="text-xs text-slate-300">{batteryLevel}%</span>
            </div>
            <div className="flex items-center gap-1">
              {signalStrength >= 3 ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stealth Banner ── */}
      <AnimatePresence>
        {stealthActive && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-indigo-900/80 border-b border-indigo-700 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-indigo-300" />
              <span className="text-xs text-indigo-300">Mode discret actif — Alerte envoyée silencieusement</span>
            </div>
            <button onClick={() => setStealthActive(false)} className="text-indigo-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-y-auto pb-24 space-y-4 p-4">

        {/* ── 1. SOS Button ── */}
        <div className="flex flex-col items-center py-4">
          <AnimatePresence>
            {!sosActive && !showModeSelector && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center mb-4">
                <p className="text-slate-400 text-sm">Appuyez pour activer l'alerte</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mode Selector */}
          <AnimatePresence>
            {showModeSelector && !sosActive && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="flex gap-3 mb-4">
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => handleSOSActivation('emergency')}
                  className="flex flex-col items-center gap-1 bg-red-600 hover:bg-red-700 px-5 py-3 rounded-xl">
                  <Siren className="w-5 h-5" />
                  <span className="text-xs font-bold">URGENCE</span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => handleSOSActivation('discreet')}
                  className="flex flex-col items-center gap-1 bg-indigo-700 hover:bg-indigo-800 px-5 py-3 rounded-xl">
                  <EyeOff className="w-5 h-5" />
                  <span className="text-xs font-bold">DISCRET</span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => setShowModeSelector(false)}
                  className="flex flex-col items-center gap-1 bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-xl">
                  <X className="w-5 h-5" />
                  <span className="text-xs">Annuler</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Button */}
          <div className="relative flex items-center justify-center">
            {sosActive && (
              <>
                {[0, 1, 2].map(i => (
                  <motion.div key={i}
                    className={`absolute rounded-full border-2 ${sosMode === 'discreet' ? 'border-indigo-500' : 'border-red-500'}`}
                    style={{ width: 130 + i * 30, height: 130 + i * 30 }}
                    animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
                  />
                ))}
              </>
            )}

            {/* SVG Countdown Arc */}
            {sosActive && (
              <svg className="absolute" width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="70" cy="70" r={arcRadius} stroke="#1e293b" strokeWidth="6" fill="none" />
                <circle cx="70" cy="70" r={arcRadius}
                  stroke={sosMode === 'discreet' ? '#6366f1' : '#ef4444'}
                  strokeWidth="6" fill="none"
                  strokeDasharray={arcCircumference}
                  strokeDashoffset={arcOffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
            )}

            <motion.button
              whileHover={{ scale: sosActive ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => sosActive ? handleSOSCancel() : setShowModeSelector(true)}
              className={`w-28 h-28 rounded-full flex flex-col items-center justify-center font-bold shadow-2xl z-10 transition-all ${
                sosActive
                  ? sosMode === 'discreet'
                    ? 'bg-indigo-700 shadow-indigo-700/50'
                    : 'bg-red-600 shadow-red-600/50'
                  : 'bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 shadow-red-600/40'
              }`}
            >
              {sosActive ? (
                <>
                  <span className="text-2xl font-black">{countdown}s</span>
                  <span className="text-xs mt-1">APPUYER POUR<br />ANNULER</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-8 h-8 mb-1" />
                  <span className="text-sm">SOS</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Status under button */}
          {sosActive && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center space-y-1">
              <div className={`text-sm font-medium ${sosMode === 'discreet' ? 'text-indigo-400' : 'text-red-400'}`}>
                {sosMode === 'discreet' ? '🕵️ Alerte discrète envoyée' : '🚨 URGENCE EN COURS'}
              </div>
              <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
                {isRecording && <span className="flex items-center gap-1"><Mic className="w-3 h-3 text-red-400" /> Enregistrement audio</span>}
                {isLocationSharing && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-green-400" /> GPS actif</span>}
              </div>
            </motion.div>
          )}
        </div>

        {/* ── 2. Actions Rapides ── */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Actions Rapides</h2>
          <div className="grid grid-cols-2 gap-3">
            <motion.button whileTap={{ scale: 0.95 }} onClick={callEmergency}
              className="bg-red-600/20 border border-red-600/50 hover:bg-red-600/30 rounded-xl p-3 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-red-400" />
              <div className="text-left">
                <div className="text-sm font-medium">Police / {settings.emergencyNumber}</div>
                <div className="text-xs text-slate-400">Appel d'urgence</div>
              </div>
            </motion.button>

            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowParentModal(true)}
              className="bg-blue-600/20 border border-blue-600/50 hover:bg-blue-600/30 rounded-xl p-3 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-blue-400" />
              <div className="text-left">
                <div className="text-sm font-medium">Notifier Parents</div>
                <div className="text-xs text-slate-400">Message + localisation</div>
              </div>
            </motion.button>

            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onNavigate?.('firstaid' as any)}
              className="bg-green-600/20 border border-green-600/50 hover:bg-green-600/30 rounded-xl p-3 flex items-center gap-2">
              <Heart className="w-5 h-5 text-green-400" />
              <div className="text-left">
                <div className="text-sm font-medium">Premiers Secours</div>
                <div className="text-xs text-slate-400">Guide médical</div>
              </div>
            </motion.button>

            <motion.button whileTap={{ scale: 0.95 }} onClick={sharePosition}
              className="bg-yellow-600/20 border border-yellow-600/50 hover:bg-yellow-600/30 rounded-xl p-3 flex items-center gap-2">
              {copiedLink ? <Check className="w-5 h-5 text-yellow-400" /> : <MapPin className="w-5 h-5 text-yellow-400" />}
              <div className="text-left">
                <div className="text-sm font-medium">{copiedLink ? 'Lien copié!' : 'Ma Position'}</div>
                <div className="text-xs text-slate-400">
                  {currentPos ? `${currentPos.lat.toFixed(4)}, ${currentPos.lng.toFixed(4)}` : 'Appuyer pour activer'}
                </div>
              </div>
            </motion.button>
          </div>
        </div>

        {/* ── 3. Enregistrement ── */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Mic className="w-4 h-4" /> Enregistrement d'urgence
          </h2>
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => setIsRecording(!isRecording)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'
              }`}>
              {isRecording ? <><MicOff className="w-4 h-4" /> Arrêter</> : <><Mic className="w-4 h-4" /> Audio</>}
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => setIsVideoRecording(!isVideoRecording)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isVideoRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'
              }`}>
              {isVideoRecording ? <><VideoOff className="w-4 h-4" /> Stop</> : <><Video className="w-4 h-4" /> Vidéo</>}
            </motion.button>
            {isRecording && (
              <div className="flex-1 flex items-center gap-1 h-8">
                {[...Array(12)].map((_, i) => (
                  <motion.div key={i} className="flex-1 bg-red-500 rounded-full"
                    animate={{ height: `${20 + Math.random() * 80}%` }}
                    transition={{ duration: 0.3, repeat: Infinity, repeatType: 'mirror', delay: i * 0.05 }}
                    style={{ minHeight: 4 }}
                  />
                ))}
              </div>
            )}
            {isRecording && <span className="text-xs text-red-400 font-mono">{fmtDuration(recordingSeconds)}</span>}
          </div>
        </div>

        {/* ── 4. Localisation GPS ── */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Localisation GPS
            </h2>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => { setIsLocationSharing(!isLocationSharing); setShowMapSection(!showMapSection); }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                isLocationSharing ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'
              }`}>
              {isLocationSharing ? '● Actif' : 'Activer'}
            </motion.button>
          </div>

          {currentPos && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Coordonnées :</span>
                <span className="text-green-400 font-mono">{currentPos.lat.toFixed(5)}, {currentPos.lng.toFixed(5)}</span>
              </div>
              {gpsAccuracy && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Précision :</span>
                  <span className={gpsAccuracy < 20 ? 'text-green-400' : 'text-yellow-400'}>±{gpsAccuracy}m</span>
                </div>
              )}
              <motion.button whileTap={{ scale: 0.95 }} onClick={sharePosition}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs">
                {copiedLink ? <><Check className="w-3 h-3 text-green-400" /> Lien copié !</> : <><Copy className="w-3 h-3" /> Copier le lien de position</>}
              </motion.button>
            </div>
          )}

          {!currentPos && isLocationSharing && (
            <div className="flex items-center gap-2 text-xs text-yellow-400">
              <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              Acquisition du signal GPS...
            </div>
          )}
        </div>

        {/* ── 5. Contacts d'Urgence ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4" /> Contacts d'Urgence
            </h2>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddContact(!showAddContact)}
              className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg">
              <Plus className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Add Contact Form */}
          <AnimatePresence>
            {showAddContact && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="bg-slate-800 border border-slate-600 rounded-xl p-3 mb-3 space-y-2">
                <input className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-500 outline-none"
                  placeholder="Nom" value={newContact.name} onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))} />
                <input className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-500 outline-none"
                  placeholder="Téléphone (+243...)" value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} />
                <input className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-500 outline-none"
                  placeholder="Relation (Famille, Ami...)" value={newContact.relation} onChange={e => setNewContact(p => ({ ...p, relation: e.target.value }))} />
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={addContact}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg text-sm font-medium">Ajouter</motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddContact(false)}
                    className="px-4 bg-slate-700 hover:bg-slate-600 py-2 rounded-lg text-sm">Annuler</motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            {contacts.map(contact => (
              <motion.div key={contact.id} layout
                className={`bg-slate-800/60 border rounded-xl p-3 transition-all ${
                  copilotId === contact.id ? 'border-indigo-500 bg-indigo-950/30' : 'border-slate-700'
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold text-sm">
                        {contact.name[0]}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-800 ${
                        contact.isOnline ? 'bg-green-400' : 'bg-slate-500'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{contact.name}</span>
                        {contact.isPrimary && <ShieldCheck className="w-3 h-3 text-blue-400" />}
                      </div>
                      <div className="text-xs text-slate-400">{contact.relation}</div>
                      {contact.batteryLevel !== undefined && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <Battery className="w-3 h-3" /> {contact.batteryLevel}%
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Copilote button */}
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={() => copilotId === contact.id ? disconnectCopilot() : connectCopilot(contact.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        copilotId === contact.id ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                      title="Activer comme copilote">
                      <RadioIcon className="w-4 h-4" />
                    </motion.button>
                    {/* Call button */}
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={() => callContact(contact.phone)}
                      className="p-2 bg-green-700 hover:bg-green-600 rounded-lg transition-colors">
                      <Phone className="w-4 h-4" />
                    </motion.button>
                    {/* Delete */}
                    {!contact.isPrimary && (
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={() => removeContact(contact.id)}
                        className="p-2 bg-slate-700 hover:bg-red-700 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4 text-slate-400" />
                      </motion.button>
                    )}
                  </div>
                </div>
                {/* Copilote actif badge */}
                {copilotId === contact.id && (
                  <div className="mt-2 pt-2 border-t border-indigo-700/50 flex items-center gap-2 text-xs text-indigo-300">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                    Copilote actif — Panneau ouvert
                    <button onClick={() => setShowCopilotPanel(!showCopilotPanel)} className="ml-auto text-indigo-400 underline">
                      {showCopilotPanel ? 'Réduire' : 'Ouvrir'}
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── 6. Panneau Copilote ── */}
        <AnimatePresence>
          {showCopilotPanel && copilot && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-indigo-950/60 border border-indigo-700/50 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-indigo-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                  <span className="font-medium text-sm">Copilote: {copilot.name}</span>
                </div>
                <button onClick={() => setShowCopilotPanel(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>

              {/* Direction pad */}
              <div className="p-3 border-b border-indigo-700/50">
                <p className="text-xs text-slate-400 mb-2 text-center">Donner une direction</p>
                <div className="grid grid-cols-3 gap-2 max-w-[160px] mx-auto">
                  <div />
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => sendDirection('nord')}
                    className="bg-indigo-700 hover:bg-indigo-600 rounded-lg p-2 flex items-center justify-center">
                    <ArrowUp className="w-4 h-4" />
                  </motion.button>
                  <div />
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => sendDirection('ouest')}
                    className="bg-indigo-700 hover:bg-indigo-600 rounded-lg p-2 flex items-center justify-center">
                    <ArrowLeft className="w-4 h-4" />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => sendDirection('stop')}
                    className="bg-red-700 hover:bg-red-600 rounded-lg p-2 flex items-center justify-center">
                    <Square className="w-3 h-3" />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => sendDirection('est')}
                    className="bg-indigo-700 hover:bg-indigo-600 rounded-lg p-2 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                  <div />
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => sendDirection('sud')}
                    className="bg-indigo-700 hover:bg-indigo-600 rounded-lg p-2 flex items-center justify-center">
                    <ArrowDown className="w-4 h-4" />
                  </motion.button>
                  <div />
                </div>
                {directionSent && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-center text-xs text-indigo-300 mt-2">
                    ✓ Direction &quot;{currentDirection}&quot; envoyée
                  </motion.p>
                )}
              </div>

              {/* Chat */}
              <div className="p-3">
                <p className="text-xs text-slate-400 mb-2">Chat rapide</p>
                <div className="bg-slate-900 rounded-lg p-2 max-h-32 overflow-y-auto space-y-1 mb-2">
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`text-xs rounded px-2 py-1 ${
                      m.from === 'moi' ? 'bg-indigo-700 ml-4 text-right' :
                      m.from === 'system' ? 'text-slate-500 text-center' :
                      'bg-slate-700 mr-4'
                    }`}>
                      {m.from !== 'system' && m.from !== 'moi' && <span className="font-medium text-indigo-300">{m.from}: </span>}
                      {m.text}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className="flex-1 bg-slate-700 rounded-lg px-3 py-1.5 text-xs placeholder-slate-500 outline-none"
                    placeholder="Message..." value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChatMessage()} />
                  <motion.button whileTap={{ scale: 0.9 }} onClick={sendChatMessage}
                    className="px-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg">
                    <Send className="w-3 h-3" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 7. Journal SOS ── */}
        <div>
          <button className="w-full flex items-center justify-between text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3"
            onClick={() => setShowSOSLog(!showSOSLog)}>
            <span className="flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Journal des alertes</span>
            {showSOSLog ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <AnimatePresence>
            {showSOSLog && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                {sosLogs.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm py-4">Aucune alerte enregistrée</div>
                ) : (
                  <div className="space-y-2">
                    {sosLogs.map(log => (
                      <div key={log.id} className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{typeLabel[log.type]} SOS</div>
                          <div className="text-xs text-slate-400">{fmtDate(log.timestamp)} à {fmt(log.timestamp)}</div>
                          {log.duration > 0 && (
                            <div className="text-xs text-slate-500">Durée : {fmtDuration(log.duration)}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${statusColor[log.status]}`}>
                            {log.status === 'active' ? '⚡ Actif' : log.status === 'completed' ? '✓ Terminé' : '✗ Annulé'}
                          </span>
                          <button onClick={() => setSOSLogs(p => p.filter(l => l.id !== log.id))}
                            className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 9. Navigation d'Évacuation Intelligente ── */}
        <div>
          <button className="w-full flex items-center justify-between text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3"
            onClick={() => setShowEvacuationPanel(!showEvacuationPanel)}>
            <span className="flex items-center gap-2"><Route className="w-4 h-4" /> Évacuation Intelligente</span>
            {showEvacuationPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <AnimatePresence>
            {showEvacuationPanel && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="space-y-3">
                
                {/* Routes d'évacuation */}
                {evacuationRoutes.length > 0 && (
                  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-green-400 mb-2">Routes Sûres Disponibles</h3>
                    <div className="space-y-2">
                      {evacuationRoutes.slice(0, 3).map(route => (
                        <motion.div key={route.id} whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedRoute(route)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedRoute?.id === route.id 
                              ? 'border-green-500 bg-green-950/30' 
                              : 'border-slate-600 hover:border-green-400'
                          }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">{route.name}</div>
                              <div className="text-xs text-slate-400">
                                {Math.round(route.distance)}m • {Math.round(route.estimatedTime / 60)}min
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-medium text-green-400">
                                {route.safetyScore}% sûr
                              </div>
                              {route.avoidZones.length > 0 && (
                                <div className="text-xs text-yellow-400">
                                  {route.avoidZones.length} zone(s) à éviter
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Points de sécurité */}
                {safePoints.length > 0 && (
                  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-blue-400 mb-2">Points de Sécurité</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {safePoints.slice(0, 3).map(point => (
                        <motion.div key={point.id} whileTap={{ scale: 0.98 }}
                          className="p-2 bg-slate-700/50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">{point.name}</div>
                              <div className="text-xs text-slate-400">
                                {point.type} • {Math.round(point.distance)}m
                              </div>
                            </div>
                            <div className="text-xs text-blue-400">
                              {point.currentOccupancy}/{point.capacity}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 10. Communication Multi-canaux ── */}
        <div>
          <button className="w-full flex items-center justify-between text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3"
            onClick={() => setShowCommunicationPanel(!showCommunicationPanel)}>
            <span className="flex items-center gap-2"><RadioReceiver className="w-4 h-4" /> Communication Multi-canaux</span>
            {showCommunicationPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <AnimatePresence>
            {showCommunicationPanel && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-4">

                {/* Sélection de langue */}
                <div>
                  <div className="text-sm font-medium mb-2">Langue des messages</div>
                  <div className="flex gap-2">
                    {[
                      { code: 'fr', label: 'Français' },
                      { code: 'lingala', label: 'Lingala' },
                      { code: 'swahili', label: 'Swahili' },
                      { code: 'english', label: 'English' }
                    ].map(lang => (
                      <button key={lang.code}
                        onClick={() => {
                          setSelectedLanguage(lang.code as any);
                          setAvailableMessages(multiChannelCommunication.getAvailableMessages(lang.code as any));
                        }}
                        className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                          selectedLanguage === lang.code 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Messages pré-enregistrés */}
                <div>
                  <div className="text-sm font-medium mb-2">Messages d'urgence</div>
                  <div className="space-y-2">
                    {availableMessages.slice(0, 3).map(message => (
                      <motion.button key={message.id} whileTap={{ scale: 0.98 }}
                        onClick={() => multiChannelCommunication.sendPreRecordedMessage(
                          message.id, 
                          contacts.map(c => c.phone)
                        )}
                        className="w-full text-left p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                        <div className="text-sm">{message.text}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {message.category} • {message.duration}s
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Codes visuels */}
                <div>
                  <div className="text-sm font-medium mb-2">Codes visuels d'urgence</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'sos', label: 'SOS', color: 'red' },
                      { id: 'help', label: 'Aide', color: 'yellow' },
                      { id: 'danger', label: 'Danger', color: 'orange' },
                      { id: 'safe', label: 'Sécurité', color: 'green' }
                    ].map(code => (
                      <motion.button key={code.id} whileTap={{ scale: 0.98 }}
                        onClick={() => multiChannelCommunication.triggerEmergencyVisualCode(code.id as any)}
                        className={`p-2 rounded-lg text-xs font-medium bg-${code.color}-600/20 border border-${code.color}-600/50 hover:bg-${code.color}-600/30`}>
                        {code.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Statut des canaux */}
                <div>
                  <div className="text-sm font-medium mb-2">État des canaux</div>
                  <div className="space-y-1">
                    {channelStatus.map(channel => (
                      <div key={channel.type} className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{channel.type}</span>
                        <span className={`${
                          channel.quality === 'excellent' ? 'text-green-400' :
                          channel.quality === 'good' ? 'text-blue-400' :
                          channel.quality === 'poor' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {channel.available ? '✓' : '✗'} {channel.quality}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 11. Mode Survie Étendu ── */}
        <div>
          <button className="w-full flex items-center justify-between text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3"
            onClick={() => setShowSurvivalPanel(!showSurvivalPanel)}>
            <span className="flex items-center gap-2"><LifeBuoy className="w-4 h-4" /> Mode Survie</span>
            {showSurvivalPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <AnimatePresence>
            {showSurvivalPanel && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-4">

                {/* Activation mode survie */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Mode survie</div>
                    <div className="text-xs text-slate-400">
                      {survivalActive ? 'Actif' : 'Inactif'} • 
                      {batteryStatus ? ` ${batteryStatus.level}% batterie` : ''}
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (survivalActive) {
                        survivalMode.deactivateSurvivalMode();
                        setSurvivalActive(false);
                      } else {
                        survivalMode.activateSurvivalMode();
                        setSurvivalActive(true);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      survivalActive 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}>
                    {survivalActive ? 'Désactiver' : 'Activer'}
                  </motion.button>
                </div>

                {/* Outils de survie */}
                <div>
                  <div className="text-sm font-medium mb-2">Outils de survie</div>
                  <div className="grid grid-cols-3 gap-2">
                    {survivalTools.slice(0, 6).map(tool => (
                      <motion.button key={tool.id} whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          switch (tool.type) {
                            case 'flashlight':
                              survivalMode.toggleFlashlight();
                              break;
                            case 'compass':
                              // La boussole est déjà affichée
                              break;
                            case 'whistle':
                              survivalMode.playEmergencyWhistle();
                              break;
                          }
                        }}
                        disabled={!tool.available}
                        className={`p-2 rounded-lg text-xs flex flex-col items-center gap-1 ${
                          tool.available 
                            ? 'bg-slate-700 hover:bg-slate-600' 
                            : 'bg-slate-800 opacity-50 cursor-not-allowed'
                        }`}>
                        <span className="text-lg">{tool.icon}</span>
                        <span>{tool.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Boussole */}
                {compassData && (
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-sm font-medium mb-2">Boussole</div>
                    <div className="flex items-center justify-center">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-2 border-blue-500 rounded-full"></div>
                        <div className="absolute inset-2 border border-blue-400 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-blue-400">
                            {compassData.heading}°
                          </span>
                        </div>
                        {/* Aiguille */}
                        <div 
                          className="absolute top-1/2 left-1/2 w-1 h-6 bg-red-500 origin-bottom"
                          style={{ 
                            transform: `translate(-50%, -100%) rotate(${compassData.heading}deg)` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 text-center mt-2">
                      {compassData.heading >= 337.5 || compassData.heading < 22.5 ? 'N' :
                       compassData.heading >= 22.5 && compassData.heading < 67.5 ? 'NE' :
                       compassData.heading >= 67.5 && compassData.heading < 112.5 ? 'E' :
                       compassData.heading >= 112.5 && compassData.heading < 157.5 ? 'SE' :
                       compassData.heading >= 157.5 && compassData.heading < 202.5 ? 'S' :
                       compassData.heading >= 202.5 && compassData.heading < 247.5 ? 'SO' :
                       compassData.heading >= 247.5 && compassData.heading < 292.5 ? 'O' : 'NO'}
                    </div>
                  </div>
                )}

                {/* Lampe torche */}
                {flashlightState && (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Lampe torche</div>
                      <div className="text-xs text-slate-400">
                        {flashlightState.active ? 'Allumée' : 'Éteinte'} • 
                        Mode: {flashlightState.mode}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {['steady', 'sos', 'strobe'].map(mode => (
                        <button key={mode}
                          onClick={() => survivalMode.setFlashlightMode(mode as any)}
                          className={`px-2 py-1 rounded text-xs ${
                            flashlightState.mode === mode 
                              ? 'bg-yellow-600 text-white' 
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                          {mode === 'steady' ? 'Fixe' : mode === 'sos' ? 'SOS' : 'Strobe'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 12. Intégrations Externes ── */}
        <div>
          <button className="w-full flex items-center justify-between text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3"
            onClick={() => setShowExternalPanel(!showExternalPanel)}>
            <span className="flex items-center gap-2"><Ambulance className="w-4 h-4" /> Services Externes</span>
            {showExternalPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <AnimatePresence>
            {showExternalPanel && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="space-y-3">

                {/* Services médicaux */}
                {nearbyMedicalServices.length > 0 && (
                  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-red-400 mb-2">Services Médicaux</h3>
                    <div className="space-y-2">
                      {nearbyMedicalServices.slice(0, 3).map(service => (
                        <motion.div key={service.id} whileTap={{ scale: 0.98 }}
                          className="p-3 bg-slate-700/50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">{service.name}</div>
                              <div className="text-xs text-slate-400">
                                {service.type} • {service.responseTime}min
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <motion.button whileTap={{ scale: 0.9 }}
                                onClick={() => window.location.href = `tel:${service.contact.phone}`}
                                className="p-1 bg-green-700 hover:bg-green-600 rounded">
                                <Phone className="w-3 h-3" />
                              </motion.button>
                              <motion.button whileTap={{ scale: 0.9 }}
                                onClick={() => externalIntegrations.requestMedicalConsultation(
                                  service.id,
                                  currentPos || { lat: -4.4419, lng: 15.2663 },
                                  'medium',
                                  'Demande via USALAMA'
                                )}
                                className="p-1 bg-blue-700 hover:bg-blue-600 rounded">
                                <Send className="w-3 h-3" />
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ambulances */}
                {availableAmbulances.length > 0 && (
                  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-orange-400 mb-2">Ambulances Disponibles</h3>
                    <div className="space-y-2">
                      {availableAmbulances.slice(0, 2).map(ambulance => (
                        <motion.div key={ambulance.id} whileTap={{ scale: 0.98 }}
                          className="p-3 bg-slate-700/50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">{ambulance.name}</div>
                              <div className="text-xs text-slate-400">
                                {ambulance.fleet.available}/{ambulance.fleet.total} disponibles • 
                                {ambulance.responseTime.average}min moyen
                              </div>
                            </div>
                            <motion.button whileTap={{ scale: 0.9 }}
                              onClick={() => externalIntegrations.requestAmbulance(
                                ambulance.id,
                                currentPos || { lat: -4.4419, lng: 15.2663 },
                                'high',
                                'Urgence via USALAMA'
                              )}
                              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-xs font-medium">
                              Appeler
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Demandes en cours */}
                {emergencyRequests.length > 0 && (
                  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-blue-400 mb-2">Demandes en cours</h3>
                    <div className="space-y-2">
                      {emergencyRequests.slice(0, 3).map(request => (
                        <div key={request.id} className="p-2 bg-slate-700/50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-medium capitalize">{request.type}</div>
                              <div className="text-xs text-slate-400">
                                {request.status} • {request.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                            <div className={`text-xs px-2 py-1 rounded ${
                              request.status === 'completed' ? 'bg-green-600' :
                              request.status === 'in_progress' ? 'bg-blue-600' :
                              request.status === 'pending' ? 'bg-yellow-600' : 'bg-red-600'
                            }`}>
                              {request.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 13. Paramètres ── */}
        <div>
          <button className="w-full flex items-center justify-between text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3"
            onClick={() => setShowSettings(!showSettings)}>
            <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> Paramètres SOS</span>
            {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <AnimatePresence>
            {showSettings && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-4">

                {[
                  { key: 'stealthEnabled', label: 'Mode discret', desc: 'Active le SOS silencieux' },
                  { key: 'soundEnabled', label: 'Son d\'urgence', desc: 'Joue une alarme sonore' },
                  { key: 'autoGPS', label: 'GPS automatique', desc: 'Active le GPS lors du SOS' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-slate-400">{desc}</div>
                    </div>
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={() => setSettings(p => ({ ...p, [key]: !p[key as keyof SOSSettings] }))}
                      className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${
                        settings[key as keyof SOSSettings] ? 'bg-blue-600 justify-end' : 'bg-slate-600 justify-start'
                      }`}>
                      <motion.div layout className="w-4 h-4 bg-white rounded-full shadow" />
                    </motion.button>
                  </div>
                ))}

                <div>
                  <div className="text-sm font-medium mb-1">Durée du compte à rebours</div>
                  <div className="flex gap-2">
                    {[10, 30, 60].map(v => (
                      <button key={v} onClick={() => setSettings(p => ({ ...p, countdownDuration: v }))}
                        className={`flex-1 py-1.5 rounded-lg text-sm transition-colors ${
                          settings.countdownDuration === v ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                        }`}>{v}s</button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Numéro d'urgence</div>
                  <input className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm outline-none"
                    value={settings.emergencyNumber}
                    onChange={e => setSettings(p => ({ ...p, emergencyNumber: e.target.value }))}
                    placeholder="112" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Modal Notifier Parents ── */}
      <AnimatePresence>
        {showParentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-4"
            onClick={() => setShowParentModal(false)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Notifier les parents</h3>
                <button onClick={() => setShowParentModal(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="bg-slate-700/60 rounded-xl p-3 text-sm text-slate-300">
                <p className="font-medium text-white mb-1">Message automatique :</p>
                <p>🚨 ALERTE USALAMA — J'ai besoin d'aide ! Ma position actuelle :{' '}
                  {currentPos
                    ? `https://maps.google.com/?q=${currentPos.lat},${currentPos.lng}`
                    : 'GPS non disponible'}
                </p>
              </div>
              <div className="space-y-2">
                {contacts.filter(c => c.isPrimary || c.relation === 'Famille').map(c => (
                  <motion.button key={c.id} whileTap={{ scale: 0.97 }}
                    onClick={() => { callContact(c.phone); setShowParentModal(false); }}
                    className="w-full flex items-center justify-between bg-slate-700 hover:bg-slate-600 rounded-xl px-4 py-3 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center font-bold text-sm">{c.name[0]}</div>
                      <div className="text-left">
                        <div className="text-sm font-medium">{c.name}</div>
                        <div className="text-xs text-slate-400">{c.phone}</div>
                      </div>
                    </div>
                    <PhoneCall className="w-4 h-4 text-green-400" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom Navigation ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-lg border-t border-slate-700 z-40">
        <div className="flex items-center justify-around py-2">
          {[
            { id: 'enhanced-home', icon: <Home className="w-5 h-5" />, label: 'Accueil' },
            { id: 'enhanced-map', icon: <Map className="w-5 h-5" />, label: 'Carte' },
            { id: 'sos', icon: <AlertTriangle className="w-5 h-5" />, label: 'SOS', isActive: true },
            { id: 'contacts', icon: <Users className="w-5 h-5" />, label: 'Contacts' },
            { id: 'profile', icon: <User className="w-5 h-5" />, label: 'Profil' },
          ].map(item => (
            <motion.button key={item.id} whileTap={{ scale: 0.9 }}
              onClick={() => onNavigate?.(item.id as any)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                item.isActive ? 'text-red-400' : 'text-slate-400 hover:text-white'
              }`}>
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SOSScreen;
