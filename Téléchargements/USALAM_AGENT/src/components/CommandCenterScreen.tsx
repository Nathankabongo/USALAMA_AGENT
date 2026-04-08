import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Phone, MapPin, Navigation, AlertTriangle, Mic, MicOff,
  Radio, Activity, Clock, Users, Zap, Eye, Battery, Wifi,
  ChevronLeft, Search, RefreshCw, X, CheckCircle, Bell,
  Smartphone, Map, Lock, Camera, Volume2, VolumeX,
  Send, MessageSquare, Heart, Star, Target, Globe,
  PhoneCall, PhoneOff, UserPlus, Settings, BarChart3,
  TrendingUp, ShieldCheck, Signal, Crosshair, Navigation2
} from 'lucide-react';
import { NavigationProps } from '../types/navigation';
import { locateByPhone, normalizePhone, PhoneLocationResult } from '../services/phoneTracker';

interface TrackedPerson {
  id: string;
  phone: string;
  name?: string;
  lat: number;
  lng: number;
  address: string;
  operator: string;
  accuracy: number;
  lastSeen: string;
  city: string;
}

interface LiveAlert {
  id: string;
  type: 'sos' | 'proximity' | 'zone' | 'contact';
  message: string;
  location: string;
  time: string;
  urgent: boolean;
}

const CommandCenterScreen: React.FC<NavigationProps> = ({ onNavigate }) => {
  // Phone tracker
  const [phoneInput, setPhoneInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchStep, setSearchStep] = useState<'idle' | 'loading' | 'result' | 'error'>('idle');
  const [searchResult, setSearchResult] = useState<PhoneLocationResult | null>(null);
  const [trackedPersons, setTrackedPersons] = useState<TrackedPerson[]>([]);
  const [loadingMsg, setLoadingMsg] = useState('');

  // Live alerts
  const [liveAlerts] = useState<LiveAlert[]>([
    { id: '1', type: 'sos', message: 'SOS activé par Jean M.', location: 'Gombe, Kinshasa', time: 'Il y a 2 min', urgent: true },
    { id: '2', type: 'proximity', message: 'Zone rouge à 300m', location: 'Limete', time: 'Il y a 5 min', urgent: true },
    { id: '3', type: 'contact', message: 'Papa vient d\'arriver', location: 'Maison', time: 'Il y a 10 min', urgent: false },
    { id: '4', type: 'zone', message: 'Zone sécurisée atteinte', location: 'Hôpital Général', time: 'Il y a 15 min', urgent: false },
  ]);

  // System stats
  const [stats] = useState({
    activeTracking: 3,
    sosAlerts: 1,
    safeContacts: 5,
    coverage: 94,
  });

  // Clap detection state
  const [clapDetectionActive, setClapDetectionActive] = useState(false);
  const [clapCount, setClapCount] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastClapRef = useRef<number>(0);

  // Quick contacts
  const quickContacts = [
    { name: 'Papa', phone: '+243818123456', status: 'online', battery: 85 },
    { name: 'Maman', phone: '+243819987654', status: 'online', battery: 92 },
    { name: 'Dr. Mukendi', phone: '+243812345678', status: 'offline', battery: 45 },
    { name: 'Yaya', phone: '+243815555555', status: 'online', battery: 67 },
  ];

  const loadingMessages = [
    'Connexion aux tours cellulaires...',
    'Triangulation du signal...',
    'Analyse opérateur...',
    'Calcul position GPS...',
    'Finalisation...',
  ];

  useEffect(() => {
    if (searchStep === 'loading') {
      let i = 0;
      const interval = setInterval(() => {
        setLoadingMsg(loadingMessages[i % loadingMessages.length]);
        i++;
      }, 600);
      return () => clearInterval(interval);
    }
  }, [searchStep]);

  // Clap detection engine
  const startClapDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const detect = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const now = Date.now();

        if (avg > 80 && now - lastClapRef.current > 300) {
          lastClapRef.current = now;
          setClapCount(c => {
            const next = c + 1;
            if (next >= 3) {
              // 3 claps = trigger SOS
              onNavigate?.('sos');
              return 0;
            }
            return next;
          });
        }
        animFrameRef.current = requestAnimationFrame(detect);
      };
      detect();
      setClapDetectionActive(true);
    } catch {
      alert('Accès au microphone refusé');
    }
  };

  const stopClapDetection = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    setClapDetectionActive(false);
    setClapCount(0);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioContextRef.current?.close();
    };
  }, []);

  const handlePhoneSearch = async () => {
    if (!phoneInput.trim() || phoneInput.length < 8) return;
    setSearchStep('loading');
    setLoadingMsg(loadingMessages[0]);
    try {
      const res = await locateByPhone(normalizePhone(phoneInput));
      setSearchResult(res);
      if (res.status === 'found') {
        setSearchStep('result');
        // Add to tracked list
        const tracked: TrackedPerson = {
          id: Date.now().toString(),
          phone: res.phone,
          lat: res.lat,
          lng: res.lng,
          address: res.address,
          operator: res.operator,
          accuracy: res.accuracy,
          lastSeen: res.lastSeen,
          city: res.city,
        };
        setTrackedPersons(prev => [tracked, ...prev.filter(p => p.phone !== res.phone).slice(0, 4)]);
      } else {
        setSearchStep('error');
      }
    } catch {
      setSearchStep('error');
    }
  };

  const handleReset = () => {
    setPhoneInput('');
    setSearchStep('idle');
    setSearchResult(null);
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'sos': return 'border-red-500/50 bg-red-500/10';
      case 'proximity': return 'border-orange-500/50 bg-orange-500/10';
      case 'contact': return 'border-green-500/50 bg-green-500/10';
      case 'zone': return 'border-blue-500/50 bg-blue-500/10';
      default: return 'border-slate-500/50 bg-slate-500/10';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'sos': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'proximity': return <Target className="w-4 h-4 text-orange-400" />;
      case 'contact': return <Users className="w-4 h-4 text-green-400" />;
      case 'zone': return <CheckCircle className="w-4 h-4 text-blue-400" />;
      default: return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'À l\'instant';
    if (mins < 60) return `Il y a ${mins} min`;
    return `Il y a ${Math.floor(mins / 60)}h`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* ── Header ── */}
      <div className="bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-4 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate?.('enhanced-home')}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-white font-bold text-lg leading-none">Centre de Commande</h1>
              <div className="flex items-center gap-1 bg-green-500/20 border border-green-500/30 px-2 py-0.5 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-[10px] font-bold">EN LIGNE</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">Surveillance & Localisation temps réel</p>
          </div>
          <button
            onClick={() => onNavigate?.('profile')}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
        
        {/* Grille principale responsive */}
        <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

        {/* ── Stats rapides (Pleine largeur sur desktop) ── */}
        <div className="grid grid-cols-4 gap-2 md:col-span-2 lg:col-span-3">
          {[
            { label: 'Traqués', value: stats.activeTracking, icon: <Crosshair className="w-4 h-4" />, color: 'text-red-400', bg: 'bg-red-500/10' },
            { label: 'Alertes', value: stats.sosAlerts, icon: <AlertTriangle className="w-4 h-4" />, color: 'text-orange-400', bg: 'bg-orange-500/10' },
            { label: 'Contacts', value: stats.safeContacts, icon: <Users className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Couverture', value: `${stats.coverage}%`, icon: <Signal className="w-4 h-4" />, color: 'text-green-400', bg: 'bg-green-500/10' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`${s.bg} border border-white/10 rounded-2xl p-3 text-center`}
            >
              <div className={`${s.color} flex justify-center mb-1`}>{s.icon}</div>
              <div className="text-white font-bold text-lg leading-none">{s.value}</div>
              <div className="text-slate-500 text-[9px] mt-1 uppercase tracking-wider">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Localisation par Numéro ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-red-900/30 to-slate-900 border border-red-500/30 rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-rose-700 rounded-xl flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Localiser par Numéro</p>
              <p className="text-red-400 text-[10px] font-medium">Triangulation GPS + réseau cellulaire</p>
            </div>
            <button
              onClick={() => onNavigate?.('phone-tracker')}
              className="text-slate-400 text-[10px] hover:text-white transition-colors underline"
            >
              Vue complète
            </button>
          </div>

          <div className="p-4">
            <AnimatePresence mode="wait">
              {searchStep === 'idle' && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span>🇨🇩</span>
                      <div className="w-px h-4 bg-white/10" />
                    </div>
                    <input
                      type="tel"
                      placeholder="+243 8xx xxx xxx"
                      value={phoneInput}
                      onChange={e => setPhoneInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handlePhoneSearch()}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 focus:border-red-500 rounded-xl text-white text-sm font-mono tracking-wider focus:outline-none transition-all placeholder-slate-600"
                    />
                  </div>
                  <div className="flex gap-2">
                    {['+243 817 015 196', '0820 456 789'].map(ex => (
                      <button key={ex} onClick={() => setPhoneInput(ex)} className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-slate-400 font-mono hover:bg-white/10 transition-colors">
                        {ex}
                      </button>
                    ))}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handlePhoneSearch}
                    disabled={phoneInput.length < 8}
                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${phoneInput.length >= 8 ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                  >
                    <Search className="w-4 h-4" />
                    Localiser maintenant
                  </motion.button>
                </motion.div>
              )}

              {searchStep === 'loading' && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-4 gap-3">
                  <div className="relative w-14 h-14">
                    <div className="absolute inset-0 rounded-full border-2 border-red-500/20" />
                    <div className="absolute inset-2 rounded-full border-2 border-red-500/40" />
                    <div className="absolute inset-4 rounded-full border-2 border-red-500/60 flex items-center justify-center">
                      <MapPin className="w-3 h-3 text-red-400" />
                    </div>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 rounded-full border-t-2 border-red-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-sm">Localisation en cours</p>
                    <p className="text-slate-500 text-[10px] font-mono">{normalizePhone(phoneInput)}</p>
                  </div>
                  <motion.p key={loadingMsg} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs">{loadingMsg}</motion.p>
                </motion.div>
              )}

              {searchStep === 'result' && searchResult && (
                <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <div className="flex-1">
                      <p className="text-green-300 font-bold text-xs">✅ Localisé!</p>
                      <p className="text-green-500 text-[9px]">{searchResult.address}, {searchResult.city} · ±{searchResult.accuracy}m</p>
                    </div>
                    <button onClick={handlePhoneSearch} className="p-1 bg-green-600/20 rounded-lg">
                      <RefreshCw className="w-3 h-3 text-green-400" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-3 space-y-1">
                      <p className="text-slate-500 text-[9px] uppercase">Opérateur</p>
                      <p className="text-white font-bold text-xs">{searchResult.operator}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 space-y-1">
                      <p className="text-slate-500 text-[9px] uppercase">Précision</p>
                      <p className="text-white font-bold text-xs">±{searchResult.accuracy}m</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => window.open(`https://maps.google.com/?q=${searchResult.lat},${searchResult.lng}`, '_blank')}
                      className="bg-gradient-to-r from-red-600 to-rose-600 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Google Maps
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleReset}
                      className="bg-white/10 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border border-white/10"
                    >
                      <Search className="w-3.5 h-3.5" /> Nouveau
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {searchStep === 'error' && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-3 gap-2">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                  <p className="text-white font-bold text-sm">Numéro introuvable</p>
                  <p className="text-slate-400 text-xs text-center">Téléphone éteint ou hors réseau</p>
                  <div className="flex gap-2 w-full">
                    <button onClick={handlePhoneSearch} className="flex-1 bg-white/10 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Réessayer
                    </button>
                    <button onClick={handleReset} className="flex-1 bg-red-600 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                      <Search className="w-3 h-3" /> Nouveau
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Historique des personnes suivies */}
          {trackedPersons.length > 0 && (
            <div className="border-t border-white/5 px-4 pb-4 pt-3">
              <p className="text-slate-500 text-[9px] uppercase font-bold tracking-wider mb-2">Dernières recherches</p>
              <div className="space-y-2">
                {trackedPersons.map(p => (
                  <motion.button
                    key={p.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setPhoneInput(p.phone);
                      setSearchResult({
                        phone: p.phone, lat: p.lat, lng: p.lng,
                        address: p.address, city: p.city, country: 'RDC',
                        operator: p.operator, accuracy: p.accuracy,
                        lastSeen: p.lastSeen, isApproximate: p.accuracy > 100,
                        status: 'found'
                      });
                      setSearchStep('result');
                    }}
                    className="w-full flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl p-2.5 hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-red-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-mono text-xs font-bold truncate">{p.phone}</p>
                      <p className="text-slate-500 text-[9px] truncate">{p.address}, {p.city}</p>
                    </div>
                    <div className="text-slate-600 text-[9px]">{formatTime(p.lastSeen)}</div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Détection par Claquement ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`border rounded-2xl p-4 transition-all ${clapDetectionActive ? 'border-purple-500/50 bg-purple-900/20' : 'border-white/10 bg-slate-900'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${clapDetectionActive ? 'bg-purple-600' : 'bg-white/10'}`}>
                {clapDetectionActive ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-slate-400" />}
              </div>
              <div>
                <p className="text-white font-bold text-sm">Détection par Claquement</p>
                <p className="text-slate-400 text-[10px]">3 claps = SOS automatique</p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={clapDetectionActive ? stopClapDetection : startClapDetection}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${clapDetectionActive ? 'bg-red-600 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
            >
              {clapDetectionActive ? 'Arrêter' : 'Activer'}
            </motion.button>
          </div>

          <AnimatePresence>
            {clapDetectionActive && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${i < clapCount ? 'border-purple-400 bg-purple-600/40 text-white' : 'border-white/10 text-slate-600'}`}
                        animate={i < clapCount ? { scale: [1, 1.2, 1] } : {}}
                      >
                        👏
                      </motion.div>
                    ))}
                  </div>
                  <div>
                    <p className="text-purple-300 text-xs font-bold">{clapCount}/3 claquements détectés</p>
                    <p className="text-purple-500 text-[9px]">Continuez à claquer pour déclencher SOS</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Alertes en direct ── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-400" />
              Alertes en Direct
              <div className="px-1.5 py-0.5 bg-red-600/80 rounded-full text-[9px] font-bold">{liveAlerts.filter(a => a.urgent).length}</div>
            </h2>
            <button onClick={() => onNavigate?.('alerts')} className="text-blue-400 text-[10px] hover:text-blue-300 underline">
              Voir tout
            </button>
          </div>
          <div className="space-y-2">
            {liveAlerts.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`border rounded-xl p-3 flex items-start gap-3 ${getAlertColor(alert.type)}`}
              >
                <div className="flex-shrink-0 mt-0.5">{getAlertIcon(alert.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold leading-tight">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-2.5 h-2.5 text-slate-500" />
                    <span className="text-slate-400 text-[9px]">{alert.location}</span>
                    <span className="text-slate-600 text-[9px]">·</span>
                    <span className="text-slate-500 text-[9px]">{alert.time}</span>
                  </div>
                </div>
                {alert.urgent && <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse flex-shrink-0 mt-1" />}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Contacts Rapides ── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold text-sm flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-green-400" />
              Contacts Rapides
            </h2>
            <button onClick={() => onNavigate?.('contacts')} className="text-blue-400 text-[10px] hover:text-blue-300 underline">
              Gérer
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickContacts.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-slate-800/60 border border-white/10 rounded-xl p-3 flex items-center gap-2.5"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center">
                    <span className="text-sm">👤</span>
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-800 ${c.status === 'online' ? 'bg-green-400' : 'bg-slate-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-bold truncate">{c.name}</p>
                  <div className="flex items-center gap-1">
                    <Battery className="w-2.5 h-2.5 text-slate-500" />
                    <span className="text-slate-500 text-[9px]">{c.battery}%</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { window.location.href = `tel:${c.phone}`; }}
                    className="w-7 h-7 bg-green-600/80 hover:bg-green-600 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Phone className="w-3 h-3 text-white" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setPhoneInput(c.phone); setSearchStep('idle'); }}
                    className="w-7 h-7 bg-red-600/60 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Crosshair className="w-3 h-3 text-white" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Actions rapides ── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            Actions Rapides
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'SOS Urgence', icon: <AlertTriangle className="w-5 h-5" />, color: 'from-red-600 to-red-800', action: () => onNavigate?.('sos') },
              { label: 'Carte Live', icon: <Map className="w-5 h-5" />, color: 'from-blue-600 to-blue-800', action: () => onNavigate?.('enhanced-map') },
              { label: 'Trajet Sûr', icon: <Navigation className="w-5 h-5" />, color: 'from-green-600 to-green-800', action: () => onNavigate?.('safepath') },
              { label: 'Communauté', icon: <MessageSquare className="w-5 h-5" />, color: 'from-indigo-600 to-indigo-800', action: () => onNavigate?.('community-chat') },
              { label: 'Premiers Sec.', icon: <Heart className="w-5 h-5" />, color: 'from-rose-600 to-rose-800', action: () => onNavigate?.('firstaid') },
              { label: 'Signaler', icon: <Bell className="w-5 h-5" />, color: 'from-orange-600 to-orange-800', action: () => onNavigate?.('incident-report') },
            ].map((btn, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={btn.action}
                className={`bg-gradient-to-br ${btn.color} rounded-xl py-4 flex flex-col items-center gap-1.5 shadow-lg`}
              >
                <div className="text-white">{btn.icon}</div>
                <span className="text-white text-[10px] font-bold text-center leading-tight">{btn.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
        
        </div> {/* Fin de la grille responsive */}
      </div>
    </div>
  );
};

export default CommandCenterScreen;
