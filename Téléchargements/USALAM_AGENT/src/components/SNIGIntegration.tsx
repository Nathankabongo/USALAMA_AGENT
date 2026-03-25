import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Map, 
  Navigation, 
  Phone, 
  Clock, 
  Zap, 
  Lock, 
  Eye, 
  X, 
  Building,
  AlertTriangle,
  CheckCircle,
  Activity,
  Wifi,
  Server,
  Bell,
  User,
  MapPin,
  Award
} from 'lucide-react';

interface SNIGIntegrationProps {
  onNavigate?: (screen: 'home' | 'enhanced-home' | 'contacts' | 'alerts' | 'profile' | 'guard' | 'evidence' | 'survival' | 'firstaid' | 'snig' | 'enhanced-map' | 'sos') => void;
}

interface SNIGStatus {
  isConnected: boolean;
  lastSync: Date;
  serverStatus: 'online' | 'maintenance' | 'offline';
  responseTime: number;
  badgeLevel: 'certified' | 'verified' | 'basic';
}

interface SecurityScore {
  zoneName: string;
  score: number; // 0-100
  level: 'safe' | 'caution' | 'danger';
  alerts: string[];
  nearestStation: string;
  distance: number;
}

interface OfficialPoint {
  id: string;
  name: string;
  type: 'police' | 'health' | 'government' | 'emergency';
  coordinates: { lat: number; lng: number };
  status: 'active' | 'patrol' | 'standby';
  lastUpdate: Date;
  isCertified: boolean;
}

const SNIGIntegration = ({ onNavigate }: SNIGIntegrationProps) => {
  const [snigStatus, setSnigStatus] = useState<SNIGStatus>({
    isConnected: true,
    lastSync: new Date(),
    serverStatus: 'online',
    responseTime: 120,
    badgeLevel: 'certified'
  });

  const [securityScore, setSecurityScore] = useState<SecurityScore>({
    zoneName: 'Gombe',
    score: 85,
    level: 'safe',
    alerts: [],
    nearestStation: 'Sous-Ciat Gombe',
    distance: 0.8
  });

  const [officialPoints, setOfficialPoints] = useState<OfficialPoint[]>([
    {
      id: '1',
      name: 'Sous-Ciat Gombe',
      type: 'police',
      coordinates: { lat: -4.4419, lng: 15.2663 },
      status: 'active',
      lastUpdate: new Date(),
      isCertified: true
    },
    {
      id: '2',
      name: 'Poste de Police Limete',
      type: 'police',
      coordinates: { lat: -4.4447, lng: 15.2670 },
      status: 'patrol',
      lastUpdate: new Date(),
      isCertified: true
    },
    {
      id: '3',
      name: 'Centre de Santé Mama Yemo',
      type: 'health',
      coordinates: { lat: -4.4431, lng: 15.2685 },
      status: 'active',
      lastUpdate: new Date(),
      isCertified: true
    }
  ]);

  const [sosProgress, setSosProgress] = useState(0);
  const [isSosActive, setIsSosActive] = useState(false);
  const [discreteCallRequested, setDiscreteCallRequested] = useState(false);

  // Simuler la connexion SNIG
  useEffect(() => {
    const checkSNIGConnection = () => {
      setSnigStatus(prev => ({
        ...prev,
        isConnected: Math.random() > 0.05, // 95% uptime
        lastSync: new Date(),
        serverStatus: Math.random() > 0.1 ? 'online' : 'maintenance',
        responseTime: 100 + Math.random() * 200
      }));
    };

    const interval = setInterval(checkSNIGConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  // Mettre à jour le score de sécurité
  useEffect(() => {
    const updateSecurityScore = () => {
      const scores = [85, 70, 45, 90, 60];
      const levels: Array<'safe' | 'caution' | 'danger'> = ['safe', 'caution', 'danger'];
      const zones = ['Gombe', 'Limete', 'Kasa-Vubu', 'Matete', 'Ngiri-Ngiri'];
      
      const randomIndex = Math.floor(Math.random() * scores.length);
      setSecurityScore({
        zoneName: zones[randomIndex],
        score: scores[randomIndex],
        level: scores[randomIndex] >= 70 ? 'safe' : scores[randomIndex] >= 40 ? 'caution' : 'danger',
        alerts: scores[randomIndex] < 50 ? ['Perturbation signalée à 2km'] : [],
        nearestStation: 'Sous-Ciat Gombe',
        distance: 0.5 + Math.random() * 2
      });
    };

    updateSecurityScore();
    const interval = setInterval(updateSecurityScore, 30000);
    return () => clearInterval(interval);
  }, []);

  const triggerSOSWithSNIG = () => {
    setIsSosActive(true);
    setSosProgress(0);
    
    // Simuler les étapes du SOS
    const steps = [
      { progress: 25, message: 'SOS Lancé...' },
      { progress: 50, message: 'Position reçue par le SNIG...' },
      { progress: 75, message: 'Alerte transmise au Sous-Ciat le plus proche...' },
      { progress: 100, message: 'Patrouille déployée - ETA: 3-5 min' }
    ];
    
    steps.forEach((step, index) => {
      setTimeout(() => {
        setSosProgress(step.progress);
      }, (index + 1) * 1000);
    });
    
    setTimeout(() => {
      setIsSosActive(false);
    }, 5000);
  };

  const requestDiscreteCall = () => {
    setDiscreteCallRequested(true);
    
    // Simuler appel discret
    setTimeout(() => {
      setDiscreteCallRequested(false);
      // Notification silencieuse
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('USALAMA - Appel Discret', {
          body: 'La police vous contactera en mode silencieux dans 2 minutes',
          icon: '/shield-icon.png',
          silent: true
        });
      }
    }, 3000);
  };

  const getSecurityColor = (level: string) => {
    switch (level) {
      case 'safe': return 'text-green-400 bg-green-600/20';
      case 'caution': return 'text-yellow-400 bg-yellow-600/20';
      case 'danger': return 'text-red-400 bg-red-600/20';
      default: return 'text-slate-400 bg-slate-600/20';
    }
  };

  const getPointIcon = (type: string) => {
    switch (type) {
      case 'police': return <Shield className="w-4 h-4" />;
      case 'health': return <Activity className="w-4 h-4" />;
      case 'government': return <Building className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getPointStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'patrol': return 'bg-blue-500';
      case 'standby': return 'bg-yellow-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      {/* Header avec badge SNIG */}
      <div className="bg-slate-800/95 backdrop-blur-lg border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Shield className="w-6 h-6 text-blue-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Intégration SNIG</h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Projet 46</span>
                <span>•</span>
                <span className="text-green-400">Connecté</span>
              </div>
            </div>
          </div>
          
          {/* Badge de certification */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/20 border border-blue-800/50 rounded-full">
              <Award className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-blue-400">Certifié SNIG</span>
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
      </div>

      <div className="p-4 space-y-6">
        {/* Widget Score de Sécurité */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              Score de Sécurité
            </h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSecurityColor(securityScore.level)}`}>
              {securityScore.level === 'safe' ? 'Sûr' :
               securityScore.level === 'caution' ? 'Vigilance' : 'Danger'}
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Zone actuelle</span>
              <span className="font-medium">{securityScore.zoneName}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Niveau de sécurité</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-slate-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: `${securityScore.score}%` }}
                    className={`h-full ${
                      securityScore.level === 'safe' ? 'bg-green-500' :
                      securityScore.level === 'caution' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                  />
                </div>
                <span className="text-sm font-medium">{securityScore.score}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Station la plus proche</span>
              <span className="text-sm">{securityScore.nearestStation} ({securityScore.distance.toFixed(1)}km)</span>
            </div>
          </div>
          
          {/* Alertes de prévention */}
          {securityScore.alerts.length > 0 && (
            <div className="mt-3 p-3 bg-yellow-600/20 border border-yellow-800/50 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Alerte SNIG</span>
              </div>
              <p className="text-xs text-yellow-300 mt-1">{securityScore.alerts[0]}</p>
            </div>
          )}
        </motion.div>

        {/* Points Officiels SNIG */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-4"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-400" />
            Points Officiels SNIG
          </h3>
          
          <div className="space-y-3">
            {officialPoints.map((point, index) => (
              <motion.div
                key={point.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="bg-slate-700/50 rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="p-2 bg-blue-600/20 rounded-lg">
                        {getPointIcon(point.type)}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getPointStatusColor(point.status)} rounded-full border-2 border-slate-900`} />
                    </div>
                    
                    <div>
                      <div className="font-medium text-sm">{point.name}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{point.type === 'police' ? 'Police' : point.type === 'health' ? 'Santé' : 'Gouvernement'}</span>
                        {point.isCertified && (
                          <div className="flex items-center gap-1 text-green-400">
                            <CheckCircle className="w-3 h-3" />
                            <span>Certifié</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Statut</div>
                    <div className="text-sm font-medium">
                      {point.status === 'active' ? 'Actif' :
                       point.status === 'patrol' ? 'En patrouille' : 'En attente'}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* SOS avec Escalade SNIG */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-red-900/20 backdrop-blur-sm rounded-lg border border-red-800/50 p-4"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-400" />
            SOS - Liaison SNIG Directe
          </h3>
          
          {/* Progression SOS */}
          <AnimatePresence>
            {isSosActive && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-4"
              >
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-400">Transmission SNIG</span>
                    <span className="text-sm font-medium">{sosProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: `${sosProgress}%` }}
                      className="h-full bg-gradient-to-r from-red-500 to-red-600"
                    />
                  </div>
                  <div className="mt-2 text-xs text-red-300">
                    {sosProgress === 25 && 'SOS Lancé...'}
                    {sosProgress === 50 && 'Position reçue par le SNIG...'}
                    {sosProgress === 75 && 'Alerte transmise au Sous-Ciat le plus proche...'}
                    {sosProgress === 100 && 'Patrouille déployée - ETA: 3-5 min'}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={triggerSOSWithSNIG}
              disabled={isSosActive}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 p-4 rounded-lg transition-colors"
            >
              <Shield className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">🚨 SOS SNIG</div>
              <div className="text-xs text-red-200">Liaison police directe</div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={requestDiscreteCall}
              disabled={discreteCallRequested}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 p-4 rounded-lg transition-colors"
            >
              <Phone className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">
                {discreteCallRequested ? '⏳ En attente...' : '📞 Appel Discret'}
              </div>
              <div className="text-xs text-blue-200">Rappel silencieux police</div>
            </motion.button>
          </div>
        </motion.div>

        {/* Statistiques SNIG */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-4"
        >
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{snigStatus.responseTime}ms</div>
            <div className="text-xs text-slate-400">Temps de réponse</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{officialPoints.length}</div>
            <div className="text-xs text-slate-400">Points officiels</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{securityScore.score}%</div>
            <div className="text-xs text-slate-400">Sécurité zone</div>
          </div>
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

export default SNIGIntegration;
