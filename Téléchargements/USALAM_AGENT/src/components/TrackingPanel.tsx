import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Navigation, Battery, Wifi, Clock, Users, Share2,
  Shield, AlertTriangle, Activity, Eye, EyeOff, Settings,
  Play, Pause, Square, Download, Upload, Smartphone, Lock,
  ChevronRight, Info, Zap, TrendingUp, Route, Compass,
  UserCheck, Radio, Satellite
} from 'lucide-react';
import { trackingService, TrackingSession, TrackingPoint, TrackingSettings } from '../services/trackingService';
import { voiceNavigationService } from '../services/voiceNavigationService';

interface TrackingPanelProps {
  isVisible: boolean;
  onClose: () => void;
  onPositionUpdate?: (point: TrackingPoint) => void;
}

const TrackingPanel: React.FC<TrackingPanelProps> = ({ isVisible, onClose, onPositionUpdate }) => {
  const [currentSession, setCurrentSession] = useState<TrackingSession | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [settings, setSettings] = useState<TrackingSettings>(trackingService.getSettings());
  const [sessions, setSessions] = useState<TrackingSession[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sharingEnabled, setSharingEnabled] = useState(false);
  const [realTimeStats, setRealTimeStats] = useState<any>(null);

  useEffect(() => {
    // Charger les données initiales
    loadSessions();
    loadCurrentSession();

    // Écouter les mises à jour du service
    trackingService.addListener('onPositionUpdate', handlePositionUpdate);
    trackingService.addListener('onSessionStart', handleSessionStart);
    trackingService.addListener('onSessionEnd', handleSessionEnd);
    trackingService.addListener('onEmergencyTrigger', handleEmergencyTrigger);

    return () => {
      trackingService.addListener('onPositionUpdate', () => {});
      trackingService.addListener('onSessionStart', () => {});
      trackingService.addListener('onSessionEnd', () => {});
      trackingService.addListener('onEmergencyTrigger', () => {});
    };
  }, []);

  const loadCurrentSession = () => {
    const session = trackingService.getCurrentSession();
    setCurrentSession(session);
    setIsTracking(!!session && !session.endTime);
  };

  const loadSessions = () => {
    const allSessions = trackingService.getAllSessions();
    setSessions(allSessions.slice(-10)); // Dernières 10 sessions
  };

  const handlePositionUpdate = (point: TrackingPoint) => {
    if (onPositionUpdate) {
      onPositionUpdate(point);
    }

    // Mettre à jour les statistiques en temps réel
    updateRealTimeStats(point);
  };

  const handleSessionStart = (session: TrackingSession) => {
    setCurrentSession(session);
    setIsTracking(true);
    loadSessions();
  };

  const handleSessionEnd = (session: TrackingSession) => {
    setCurrentSession(null);
    setIsTracking(false);
    loadSessions();
  };

  const handleEmergencyTrigger = (point: TrackingPoint) => {
    // Afficher une alerte d'urgence
    console.warn('URGENCE:', point);
  };

  const updateRealTimeStats = (point: TrackingPoint) => {
    setRealTimeStats({
      speed: point.speed || 0,
      accuracy: point.accuracy,
      battery: point.batteryLevel || 100,
      signal: point.signalStrength || 0,
      heading: point.heading || 0,
      timestamp: point.timestamp
    });
  };

  const startTracking = async (purpose: TrackingSession['purpose'] = 'manual') => {
    try {
      await trackingService.startTracking(purpose);
    } catch (error) {
      console.error('Erreur lors du démarrage du suivi:', error);
    }
  };

  const stopTracking = async () => {
    try {
      await trackingService.stopTracking();
    } catch (error) {
      console.error('Erreur lors de l\'arrêt du suivi:', error);
    }
  };

  const shareSession = async (sessionId: string) => {
    try {
      const success = await trackingService.shareSession(sessionId, settings.emergencyContacts);
      if (success) {
        setSharingEnabled(true);
      }
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  const updateSettings = (newSettings: Partial<TrackingSettings>) => {
    trackingService.updateSettings(newSettings);
    setSettings(trackingService.getSettings());
  };

  const getSessionStats = (session: TrackingSession) => {
    return trackingService.getSessionStats(session);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-[2000] bg-slate-900 flex flex-col"
    >
      {/* Header */}
      <div className="px-6 py-6 flex items-center gap-4 bg-slate-900/50 border-b border-white/10">
        <button 
          onClick={onClose}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-white rotate-180" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">Centre de Tracabilité</h2>
          <p className="text-blue-400 text-xs">Suivi GPS et Sécurité</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-y-auto">
        {/* Statut en temps réel */}
        <div className="p-6">
          <div className={`rounded-2xl p-6 border ${
            isTracking 
              ? 'bg-green-600/10 border-green-500/30' 
              : 'bg-slate-800/50 border-slate-700'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`} />
                <h3 className="text-white font-bold">
                  {isTracking ? 'Suivi ACTIF' : 'Suivi INACTIF'}
                </h3>
              </div>
              {isTracking ? (
                <button
                  onClick={stopTracking}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors"
                >
                  <Square className="w-4 h-4" />
                  Arrêter
                </button>
              ) : (
                <button
                  onClick={() => startTracking('manual')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Démarrer
                </button>
              )}
            </div>

            {/* Statistiques en temps réel */}
            {realTimeStats && isTracking && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/5 rounded-xl p-3">
                  <Navigation className="w-4 h-4 text-blue-400 mb-1" />
                  <div className="text-white font-bold text-sm">{(realTimeStats.speed * 3.6).toFixed(1)}</div>
                  <div className="text-slate-400 text-xs">km/h</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <Satellite className="w-4 h-4 text-green-400 mb-1" />
                  <div className="text-white font-bold text-sm">{realTimeStats.accuracy.toFixed(0)}</div>
                  <div className="text-slate-400 text-xs">mètres</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <Battery className="w-4 h-4 text-yellow-400 mb-1" />
                  <div className="text-white font-bold text-sm">{realTimeStats.battery.toFixed(0)}%</div>
                  <div className="text-slate-400 text-xs">batterie</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <Wifi className="w-4 h-4 text-purple-400 mb-1" />
                  <div className="text-white font-bold text-sm">{realTimeStats.signal}/5</div>
                  <div className="text-slate-400 text-xs">signal</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Session actuelle */}
        {currentSession && (
          <div className="px-6 pb-6">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <h4 className="text-white font-semibold mb-3">Session Actuelle</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Début:</span>
                  <span className="text-white">{new Date(currentSession.startTime).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Points:</span>
                  <span className="text-white">{currentSession.points.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Type:</span>
                  <span className="text-white capitalize">{currentSession.purpose}</span>
                </div>
              </div>
              
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => shareSession(currentSession.id)}
                  className={`flex-1 py-2 rounded-xl font-medium text-sm transition-colors ${
                    sharingEnabled 
                      ? 'bg-green-600 text-white' 
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  <Share2 className="w-4 h-4 inline mr-1" />
                  {sharingEnabled ? 'Partagé' : 'Partager'}
                </button>
                <button className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl font-medium text-sm transition-colors">
                  <Download className="w-4 h-4 inline mr-1" />
                  Exporter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modes de suivi rapide */}
        <div className="px-6 pb-6">
          <h4 className="text-white font-semibold mb-3">Modes de Suivi</h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => startTracking('emergency')}
              className="bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 p-4 rounded-xl text-center transition-colors"
            >
              <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <div className="text-white font-semibold text-sm">Urgence</div>
              <div className="text-red-300 text-xs">Suivi prioritaire</div>
            </button>
            <button
              onClick={() => startTracking('navigation')}
              className="bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 p-4 rounded-xl text-center transition-colors"
            >
              <Navigation className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <div className="text-white font-semibold text-sm">Navigation</div>
              <div className="text-blue-300 text-xs">Itinéraire actif</div>
            </button>
          </div>
        </div>

        {/* Historique des sessions */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-semibold">Sessions Récentes</h4>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-blue-400 text-sm"
            >
              {showHistory ? 'Masquer' : 'Voir tout'}
            </button>
          </div>
          
          <div className="space-y-2">
            {sessions.slice(0, showHistory ? sessions.length : 3).map(session => {
              const stats = getSessionStats(session);
              return (
                <div key={session.id} className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium text-sm">
                        {new Date(session.startTime).toLocaleDateString()} • {session.purpose}
                      </div>
                      <div className="text-slate-400 text-xs">
                        {stats ? `${Math.round(stats.totalDistance)}m • ${Math.round(stats.duration / 60000)}min` : 'En cours...'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.isShared && <Share2 className="w-4 h-4 text-blue-400" />}
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Panneau de paramètres */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900 z-[2100] p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold text-lg">Paramètres de Tracabilité</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl"
              >
                <ChevronRight className="w-5 h-5 text-white rotate-180" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-slate-400 text-sm block mb-2">Intervalle de suivi</label>
                <select
                  value={settings.interval}
                  onChange={(e) => updateSettings({ interval: parseInt(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                >
                  <option value={1}>1 seconde</option>
                  <option value={5}>5 secondes</option>
                  <option value={10}>10 secondes</option>
                  <option value={30}>30 secondes</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 text-sm block mb-2">Précision minimale</label>
                <select
                  value={settings.accuracyThreshold}
                  onChange={(e) => updateSettings({ accuracyThreshold: parseInt(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                >
                  <option value={5}>5 mètres</option>
                  <option value={10}>10 mètres</option>
                  <option value={20}>20 mètres</option>
                  <option value={50}>50 mètres</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white text-sm">Mode furtif</span>
                <button
                  onClick={() => updateSettings({ stealthMode: !settings.stealthMode })}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${
                    settings.stealthMode ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.stealthMode ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white text-sm">Partage automatique</span>
                <button
                  onClick={() => updateSettings({ autoShare: !settings.autoShare })}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${
                    settings.autoShare ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.autoShare ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TrackingPanel;
