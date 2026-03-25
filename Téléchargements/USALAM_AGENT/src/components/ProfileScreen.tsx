import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Shield, 
  Settings, 
  Bell, 
  Phone,
  Lock, 
  Eye, 
  EyeOff, 
  Camera, 
  Mic, 
  Wifi, 
  Battery, 
  Activity,
  Map,
  X,
  Check,
  Moon,
  Sun,
  BellOff,
  ChevronRight,
  Smartphone,
  Globe,
  ShieldCheck,
  AlertTriangle,
  Users,
  Heart,
  Zap,
  Volume2,
  VolumeX,
  Clock,
  Award,
  Target,
  Star,
  TrendingUp,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Info
} from 'lucide-react';

import { NavigationProps, navigationItems } from '../types/navigation';

interface AppSettings {
  notifications: boolean;
  locationSharing: boolean;
  audioRecording: boolean;
  darkMode: boolean;
  disguisedMode: boolean;
  highContrastMode: boolean;
  hapticFeedback: boolean;
  autoRecording: boolean;
  batteryOptimization: boolean;
  dataSync: boolean;
  // Nouveaux paramètres avancés
  emergencyMode: boolean;
  stealthMode: boolean;
  autoBackup: boolean;
  biometricAuth: boolean;
  panicButton: boolean;
  voiceCommands: boolean;
  geofencing: boolean;
  smartNotifications: boolean;
  nightMode: boolean;
  batterySaver: boolean;
  dataCompression: boolean;
  secureConnection: boolean;
}

interface UserProfile {
  name: string;
  phone: string;
  email: string;
  avatar: string;
  trustScore: number;
  emergencyContacts: number;
  sharedTrips: number;
  activeSince: string;
  lastSOS: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  badges: string[];
  bloodType: string;
  normalPin: string;
  emergencyPin: string;
}

interface UsageStats {
  totalSOS: number;
  totalTrips: number;
  totalDistance: number;
  avgResponseTime: number;
  reliability: number;
  communityScore: number;
}

const ProfileScreen = ({ onNavigate }: NavigationProps) => {
  const [settings, setSettings] = useState<AppSettings>({
    notifications: true,
    locationSharing: true,
    audioRecording: true,
    darkMode: true,
    disguisedMode: false,
    highContrastMode: false,
    hapticFeedback: true,
    autoRecording: true,
    batteryOptimization: true,
    dataSync: true,
    // Nouveaux paramètres avancés
    emergencyMode: false,
    stealthMode: false,
    autoBackup: true,
    biometricAuth: true,
    panicButton: true,
    voiceCommands: false,
    geofencing: true,
    smartNotifications: true,
    nightMode: false,
    batterySaver: false,
    dataCompression: true,
    secureConnection: true
  });

  // États pour la gestion de la photo
  const [profilePhoto, setProfilePhoto] = useState<string>('/avatar.jpg');
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Données utilisateur enrichies
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Nathan Kabongo',
    phone: '+243818123456',
    email: 'nathan.kabongo@email.com',
    avatar: profilePhoto,
    trustScore: 95,
    emergencyContacts: 5,
    sharedTrips: 47,
    activeSince: 'Janvier 2024',
    lastSOS: 'Il y a 2 jours',
    level: 'gold',
    badges: ['Pionnier', 'Fiable', 'Protecteur', 'Guide'],
    bloodType: 'O+',
    normalPin: '****',
    emergencyPin: '******'
  });

  const [usageStats] = useState<UsageStats>({
    totalSOS: 3,
    totalTrips: 47,
    totalDistance: 234.5,
    avgResponseTime: 2.8,
    reliability: 98,
    communityScore: 92
  });

  // Fonctions pour la gestion de la photo
  const handlePhotoUpload = (source: 'camera' | 'gallery') => {
    setIsUploading(true);
    setShowPhotoOptions(false);
    
    // Simuler l'upload de photo
    setTimeout(() => {
      const newPhotoUrl = source === 'camera' 
        ? '/camera-photo.jpg' 
        : '/gallery-photo.jpg';
      setProfilePhoto(newPhotoUrl);
      setIsUploading(false);
    }, 2000);
  };

  const handleRemovePhoto = () => {
    setProfilePhoto('/default-avatar.jpg');
    setShowPhotoOptions(false);
  };

  const handleImageError = () => {
    setProfilePhoto('/default-avatar.jpg');
  };

  const [showPinChange, setShowPinChange] = useState(false);
  const [pinType, setPinType] = useState<'normal' | 'emergency'>('normal');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  // Fonctions pour gérer les paramètres
  const handleSettingToggle = (key: keyof AppSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));

    // Save to localStorage
    localStorage.setItem(`usalama_${key}`, String(!settings[key]));
  };

  const handlePinChange = () => {
    if (newPin === confirmPin && newPin.length >= 4) {
      setUserProfile(prev => ({
        ...prev,
        [pinType === 'normal' ? 'normalPin' : 'emergencyPin']: pinType === 'normal' ? '****' : '******'
      }));
      
      // Save PIN securely (in real app, use encrypted storage)
      localStorage.setItem(`usalama_${pinType}_pin`, newPin);
      
      setShowPinChange(false);
      setNewPin('');
      setConfirmPin('');
    }
  };

  const handleCallContact = (contact: Contact) => {
    window.location.href = `tel:${contact.phone}`;
  };

  const handleMessageContact = (contact: Contact) => {
    window.location.href = `sms:${contact.phone}`;
  };

  // Device status simulation
  const [deviceStatus, setDeviceStatus] = useState({
    battery: 85,
    signal: 'strong',
    storage: '2.1 GB',
    lastSync: 'Il y a 2 min'
  });

  useEffect(() => {
    // Simulate device status updates
    const interval = setInterval(() => {
      setDeviceStatus(prev => ({
        ...prev,
        battery: Math.max(20, prev.battery - Math.random() * 2),
        lastSync: 'Il y a ' + Math.floor(Math.random() * 10) + ' min'
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getBloodTypeOptions = () => [
    'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'
  ];

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'text-green-400';
    if (level > 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSignalStrength = (signal: string) => {
    switch (signal) {
      case 'strong': return { color: 'text-green-400', bars: 4 };
      case 'medium': return { color: 'text-yellow-400', bars: 3 };
      case 'weak': return { color: 'text-red-400', bars: 2 };
      default: return { color: 'text-gray-400', bars: 1 };
    }
  };

  const settingsSections = [
    {
      title: 'Profil Utilisateur',
      icon: <User className="w-5 h-5" />,
      items: [
        { key: 'name', label: 'Nom complet', type: 'text', value: userProfile.name },
        { key: 'phone', label: 'Téléphone', type: 'tel', value: userProfile.phone },
        { key: 'email', label: 'Email', type: 'email', value: userProfile.email },
        { key: 'bloodType', label: 'Groupe sanguin', type: 'select', value: userProfile.bloodType, options: getBloodTypeOptions() }
      ]
    },
    {
      title: 'Sécurité',
      icon: <Shield className="w-5 h-5" />,
      items: [
        { key: 'normalPin', label: 'PIN normal', type: 'pin', value: userProfile.normalPin, pinType: 'normal' },
        { key: 'emergencyPin', label: 'PIN d\'urgence', type: 'pin', value: userProfile.emergencyPin, pinType: 'emergency' },
        { key: 'disguisedMode', label: 'Mode caméléon', type: 'toggle', value: settings.disguisedMode, description: 'Transforme l\'app en météo/news' }
      ]
    },
    {
      title: 'Permissions',
      icon: <Settings className="w-5 h-5" />,
      items: [
        { key: 'notifications', label: 'Notifications', type: 'toggle', value: settings.notifications, description: 'Alertes de sécurité' },
        { key: 'locationSharing', label: 'Partage de position', type: 'toggle', value: settings.locationSharing, description: 'GPS en temps réel' },
        { key: 'audioRecording', label: 'Enregistrement audio', type: 'toggle', value: settings.audioRecording, description: 'Preuves audio SOS' }
      ]
    },
    {
      title: 'Interface',
      icon: <Smartphone className="w-5 h-5" />,
      items: [
        { key: 'darkMode', label: 'Mode sombre', type: 'toggle', value: settings.darkMode },
        { key: 'highContrastMode', label: 'Contraste élevé', type: 'toggle', value: settings.highContrastMode, description: 'Pour situations d\'urgence' },
        { key: 'hapticFeedback', label: 'Retour haptique', type: 'toggle', value: settings.hapticFeedback, description: 'Vibrations tactiles' }
      ]
    },
    {
      title: 'Performance',
      icon: <Activity className="w-5 h-5" />,
      items: [
        { key: 'autoRecording', label: 'Enregistrement auto', type: 'toggle', value: settings.autoRecording, description: 'Démarrer lors SOS' },
        { key: 'batteryOptimization', label: 'Optimisation batterie', type: 'toggle', value: settings.batteryOptimization, description: 'Mode économie d\'énergie' },
        { key: 'dataSync', label: 'Synchronisation', type: 'toggle', value: settings.dataSync, description: 'Sync automatique des données' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      {/* Header avec profil utilisateur */}
      <div className="bg-gradient-to-b from-slate-800/95 to-slate-800/50 backdrop-blur-lg border-b border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Photo de profil avec options */}
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                className="relative cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-600">
                  {isUploading ? (
                    <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <RefreshCw className="w-6 h-6 text-blue-400" />
                      </motion.div>
                    </div>
                  ) : (
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      onError={handleImageError}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-slate-800 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                {/* Icône de modification */}
                <div className="absolute inset-0 w-16 h-16 rounded-full bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </motion.div>

              {/* Options de photo */}
              <AnimatePresence>
                {showPhotoOptions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="absolute top-20 left-0 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 min-w-[200px]"
                  >
                    <div className="py-2">
                      <motion.button
                        whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePhotoUpload('camera')}
                        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-blue-600/10 transition-colors"
                      >
                        <Camera className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-white">Prendre une photo</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePhotoUpload('gallery')}
                        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-green-600/10 transition-colors"
                      >
                        <Upload className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-white">Galerie</span>
                      </motion.button>
                      <div className="border-t border-slate-700 my-2"></div>
                      <motion.button
                        whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleRemovePhoto}
                        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-red-600/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-red-400">Supprimer</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{userProfile.name}</h1>
              <p className="text-sm text-slate-400">Agent de sécurité communautaire</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  userProfile.level === 'platinum' ? 'bg-purple-600/20 text-purple-400 border border-purple-600/50' :
                  userProfile.level === 'gold' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/50' :
                  userProfile.level === 'silver' ? 'bg-slate-600/20 text-slate-400 border border-slate-600/50' :
                  'bg-orange-600/20 text-orange-400 border border-orange-600/50'
                }`}>
                  {userProfile.level === 'platinum' ? 'Platine' :
                   userProfile.level === 'gold' ? 'Or' :
                   userProfile.level === 'silver' ? 'Argent' : 'Bronze'}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs text-yellow-400">{userProfile.trustScore}%</span>
                </div>
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Statistiques d'utilisation */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-slate-700/50 rounded-lg p-3 text-center"
          >
            <div className="text-2xl font-bold text-blue-400">{usageStats.totalTrips}</div>
            <div className="text-xs text-slate-400">Trajets partagés</div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-slate-700/50 rounded-lg p-3 text-center"
          >
            <div className="text-2xl font-bold text-green-400">{usageStats.reliability}%</div>
            <div className="text-xs text-slate-400">Fiabilité</div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-slate-700/50 rounded-lg p-3 text-center"
          >
            <div className="text-2xl font-bold text-purple-400">{usageStats.communityScore}</div>
            <div className="text-xs text-slate-400">Score communautaire</div>
          </motion.div>
        </div>

        {/* Badges */}
        <div className="mt-4">
          <div className="text-xs text-slate-400 mb-2">Badges obtenus</div>
          <div className="flex gap-2 flex-wrap">
            {userProfile.badges.map((badge, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300 border border-slate-600"
              >
                {badge}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Paramètres de sécurité */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-red-400" />
          Sécurité & Protection
        </h2>
        <div className="space-y-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Mode d'urgence</div>
                  <div className="text-xs text-slate-400">Active toutes les protections</div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSettings({...settings, emergencyMode: !settings.emergencyMode})}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.emergencyMode ? 'bg-red-600' : 'bg-slate-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.emergencyMode ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <EyeOff className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Mode furtif</div>
                  <div className="text-xs text-slate-400">Masque votre présence</div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSettings({...settings, stealthMode: !settings.stealthMode})}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.stealthMode ? 'bg-purple-600' : 'bg-slate-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.stealthMode ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Authentification biométrique</div>
                  <div className="text-xs text-slate-400">Empreinte ou visage</div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSettings({...settings, biometricAuth: !settings.biometricAuth})}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.biometricAuth ? 'bg-blue-600' : 'bg-slate-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.biometricAuth ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Paramètres de performance */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Performance & Optimisation
        </h2>
        <div className="space-y-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <Battery className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Économiseur de batterie</div>
                  <div className="text-xs text-slate-400">Prolonge l'autonomie</div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSettings({...settings, batterySaver: !settings.batterySaver})}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.batterySaver ? 'bg-green-600' : 'bg-slate-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.batterySaver ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Compression de données</div>
                  <div className="text-xs text-slate-400">Réduit l'usage de données</div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSettings({...settings, dataCompression: !settings.dataCompression})}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.dataCompression ? 'bg-orange-600' : 'bg-slate-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.dataCompression ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-600/20 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Sauvegarde automatique</div>
                  <div className="text-xs text-slate-400">Backup régulier des données</div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSettings({...settings, autoBackup: !settings.autoBackup})}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.autoBackup ? 'bg-cyan-600' : 'bg-slate-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.autoBackup ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Paramètres de communication */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-green-400" />
          Communication & Notifications
        </h2>
        <div className="space-y-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Notifications intelligentes</div>
                  <div className="text-xs text-slate-400">Alertes contextuelles</div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSettings({...settings, smartNotifications: !settings.smartNotifications})}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.smartNotifications ? 'bg-blue-600' : 'bg-slate-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.smartNotifications ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <Mic className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Commandes vocales</div>
                  <div className="text-xs text-slate-400">Contrôle par la voix</div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSettings({...settings, voiceCommands: !settings.voiceCommands})}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.voiceCommands ? 'bg-purple-600' : 'bg-slate-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.voiceCommands ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-red-400" />
          Actions Rapides
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-red-600/20 border border-red-600/50 rounded-lg p-4 flex flex-col items-center gap-2"
          >
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <span className="text-sm text-red-400">Test SOS</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-600/20 border border-blue-600/50 rounded-lg p-4 flex flex-col items-center gap-2"
          >
            <Users className="w-6 h-6 text-blue-400" />
            <span className="text-sm text-blue-400">Inviter amis</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-green-600/20 border border-green-600/50 rounded-lg p-4 flex flex-col items-center gap-2"
          >
            <Download className="w-6 h-6 text-green-400" />
            <span className="text-sm text-green-400">Exporter données</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-orange-600/20 border border-orange-600/50 rounded-lg p-4 flex flex-col items-center gap-2"
          >
            <Trash2 className="w-6 h-6 text-orange-400" />
            <span className="text-sm text-orange-400">Nettoyer cache</span>
          </motion.button>
        </div>
      </div>

      {/* Gestion de la photo de profil */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-purple-400" />
          Photo de Profil
        </h2>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-600">
              <img
                src={profilePhoto}
                alt="Profile"
                onError={handleImageError}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="font-medium text-white mb-1">Photo actuelle</div>
              <div className="text-xs text-slate-400 mb-3">
                Cliquez sur votre photo pour la modifier
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs text-white transition-colors"
                >
                  Modifier
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRemovePhoto}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-xs text-white transition-colors"
                >
                  Supprimer
                </motion.button>
              </div>
            </div>
          </div>
          
          {/* Informations sur la photo */}
          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex items-center justify-between">
              <span>Format recommandé:</span>
              <span className="text-slate-300">JPEG, PNG (max 5MB)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Taille idéale:</span>
              <span className="text-slate-300">400x400px</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Visible par:</span>
              <span className="text-slate-300">Contacts de confiance uniquement</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="p-4 space-y-6">
        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700"
          >
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="text-blue-400">{section.icon}</div>
                <h2 className="text-lg font-semibold text-white">{section.title}</h2>
              </div>
            </div>
            
            <div className="divide-y divide-slate-700">
              {section.items.map((item, itemIndex) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: sectionIndex * 0.1 + itemIndex * 0.05 }}
                  className="p-4"
                >
                  {item.type === 'toggle' ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          {item.label}
                          {item.key === 'disguisedMode' && settings.disguisedMode && (
                            <EyeOff className="w-4 h-4 text-yellow-400" />
                          )}
                        </div>
                        {item.description && (
                          <div className="text-sm text-slate-400 mt-1">{item.description}</div>
                        )}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSettingToggle(item.key as keyof AppSettings)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          item.value ? 'bg-blue-600' : 'bg-slate-600'
                        }`}
                      >
                        <motion.div
                          animate={{ x: item.value ? 24 : 0 }}
                          className="w-5 h-5 bg-white rounded-full shadow-md"
                        />
                      </motion.button>
                    </div>
                  ) : item.type === 'pin' ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">{item.label}</div>
                        <div className="text-sm text-slate-400 mt-1">
                          {item.pinType === 'emergency' ? 'Code de contrainte' : 'PIN normal'}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setPinType(item.pinType as 'normal' | 'emergency');
                          setShowPinChange(true);
                        }}
                        className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Modifier</span>
                      </motion.button>
                    </div>
                  ) : item.type === 'select' ? (
                    <div>
                      <div className="font-medium text-white mb-2">{item.label}</div>
                      <select
                        value={item.value}
                        onChange={(e) => setUserProfile(prev => ({ ...prev, [item.key]: e.target.value }))}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      >
                        {item.options?.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium text-white mb-2">{item.label}</div>
                      <input
                        type={item.type}
                        value={item.value}
                        onChange={(e) => setUserProfile(prev => ({ ...prev, [item.key]: e.target.value }))}
                        disabled={!editingProfile}
                        className={`w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 ${
                          !editingProfile ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Emergency Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-red-900/20 backdrop-blur-sm rounded-lg border border-red-800/50 p-4"
        >
          <h3 className="text-lg font-semibold text-red-400 mb-3">Actions d'urgence</h3>
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const newMode = !settings.disguisedMode;
                setSettings(prev => ({ ...prev, disguisedMode: newMode }));
                localStorage.setItem('usalama_disguised_mode', String(newMode));
                
                if (newMode) {
                  // Redirect to fake interface
                  const fakeApps = ['/fake-weather', '/fake-news', '/fake-calculator'];
                  const randomApp = fakeApps[Math.floor(Math.random() * fakeApps.length)];
                  window.location.href = randomApp;
                }
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg py-3 font-medium transition-colors flex items-center justify-center gap-2"
            >
              {settings.disguisedMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              {settings.disguisedMode ? 'Désactiver le mode caméléon' : 'Activer le mode caméléon'}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-3 font-medium transition-colors"
            >
              Réinitialiser tous les paramètres
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* PIN Change Modal */}
      <AnimatePresence>
        {showPinChange && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPinChange(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  Modifier {pinType === 'emergency' ? 'le PIN d\'urgence' : 'le PIN normal'}
                </h3>
                <button
                  onClick={() => setShowPinChange(false)}
                  className="text-slate-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nouveau {pinType === 'emergency' ? 'code' : 'PIN'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-full pl-4 pr-12 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      placeholder={pinType === 'emergency' ? '6 chiffres' : '4 chiffres'}
                      maxLength={pinType === 'emergency' ? 6 : 4}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Confirmer le {pinType === 'emergency' ? 'code' : 'PIN'}
                  </label>
                  <input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    placeholder="Confirmer"
                    maxLength={pinType === 'emergency' ? 6 : 4}
                  />
                </div>

                {newPin && confirmPin && newPin !== confirmPin && (
                  <div className="text-red-400 text-sm">
                    Les codes ne correspondent pas
                  </div>
                )}

                {newPin && newPin.length < (pinType === 'emergency' ? 6 : 4) && (
                  <div className="text-yellow-400 text-sm">
                    Le {pinType === 'emergency' ? 'code' : 'PIN'} doit contenir {pinType === 'emergency' ? '6' : '4'} chiffres
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPinChange(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-3 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handlePinChange}
                  disabled={newPin.length < (pinType === 'emergency' ? 6 : 4) || newPin !== confirmPin}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg py-3 font-medium transition-colors"
                >
                  Confirmer
                </button>
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
            { id: 'contacts', label: 'Contacts', icon: <Users className="w-5 h-5" /> },
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
                } else if (item.id === 'contacts') {
                  onNavigate?.('contacts');
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

export default ProfileScreen;
