import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Shield, MapPin, Users, AlertTriangle, Eye, Check } from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [permissions, setPermissions] = useState({
    location: false,
    notifications: false,
    camera: false,
    microphone: false
  });

  const onboardingScreens = [
    {
      id: 1,
      title: 'Bienvenue dans USALAMA AGENT',
      subtitle: 'Votre système de sécurité communautaire',
      description: 'USALAMA AGENT transforme votre téléphone en un dispositif de protection intelligent et discret pour toute la communauté.',
      icon: <Shield className="w-16 h-16 text-blue-400" />,
      color: 'from-blue-600 to-blue-800'
    },
    {
      id: 2,
      title: 'SOS Intelligent',
      subtitle: 'Protection en un geste',
      description: 'Appui simple pour signaler, appui long de 3 secondes pour déclencher une alerte d\'urgence silencieuse. Le système enregistre automatiquement les preuves audio.',
      icon: <AlertTriangle className="w-16 h-16 text-red-400" />,
      color: 'from-red-600 to-red-800'
    },
    {
      id: 3,
      title: 'Suivi GPS Temps Réel',
      subtitle: 'Localisation continue en cas d\'urgence',
      description: 'En mode SOS, votre position est partagée en temps réel avec vos contacts de confiance et les services de secours.',
      icon: <MapPin className="w-16 h-16 text-green-400" />,
      color: 'from-green-600 to-green-800'
    },
    {
      id: 4,
      title: 'Réseau Communautaire',
      subtitle: 'La force du collectif',
      description: 'Rejoignez un réseau de citoyens vigilants. Chaque signalement renforce la sécurité de votre quartier.',
      icon: <Users className="w-16 h-16 text-purple-400" />,
      color: 'from-purple-600 to-purple-800'
    },
    {
      id: 5,
      title: 'Permissions Requises',
      subtitle: 'Accès essentiels à votre sécurité',
      description: 'Pour fonctionner efficacement, USALAMA AGENT a besoin de certaines permissions. Votre sécurité est notre priorité.',
      icon: <Eye className="w-16 h-16 text-yellow-400" />,
      color: 'from-yellow-600 to-yellow-800',
      isPermissionScreen: true
    }
  ];

  const currentScreenData = onboardingScreens[currentScreen];

  const handleNext = () => {
    if (currentScreen < onboardingScreens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      // Check if all permissions are granted
      const allPermissionsGranted = Object.values(permissions).every(p => p);
      if (allPermissionsGranted) {
        onComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  const handlePermissionToggle = (permission: keyof typeof permissions) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const requestPermissions = async () => {
    // Request actual permissions
    try {
      // Location
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => setPermissions(prev => ({ ...prev, location: true })),
          () => console.log('Location permission denied')
        );
      }

      // Notifications
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setPermissions(prev => ({ ...prev, notifications: permission === 'granted' }));
      }

      // Camera and Microphone (for emergency recording)
      if (navigator.mediaDevices) {
        try {
          await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setPermissions(prev => ({ ...prev, camera: true, microphone: true }));
        } catch (error) {
          console.log('Camera/microphone permission denied');
        }
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const allPermissionsGranted = Object.values(permissions).every(p => p);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0">
        <div className={`absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br ${currentScreenData.color} opacity-10 rounded-full blur-3xl animate-pulse`}></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mb-8 flex justify-center"
            >
              <div className={`w-24 h-24 bg-gradient-to-br ${currentScreenData.color} rounded-full flex items-center justify-center shadow-2xl`}>
                {currentScreenData.icon}
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-white mb-2"
            >
              {currentScreenData.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-blue-300 mb-6"
            >
              {currentScreenData.subtitle}
            </motion.p>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-slate-300 text-sm leading-relaxed mb-8"
            >
              {currentScreenData.description}
            </motion.p>

            {/* Permission Screen Specific Content */}
            {currentScreenData.isPermissionScreen && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-4 mb-8"
              >
                {[
                  { key: 'location' as const, label: 'Localisation GPS', desc: 'Partager votre position en cas d\'urgence' },
                  { key: 'notifications' as const, label: 'Notifications', desc: 'Recevoir les alertes de sécurité' },
                  { key: 'camera' as const, label: 'Caméra', desc: 'Capturer des preuves visuelles' },
                  { key: 'microphone' as const, label: 'Microphone', desc: 'Enregistrer des preuves audio' }
                ].map(({ key, label, desc }) => (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-left">
                        <h3 className="text-white font-medium flex items-center gap-2">
                          {permissions[key] && <Check className="w-4 h-4 text-green-400" />}
                          {label}
                        </h3>
                        <p className="text-slate-400 text-xs mt-1">{desc}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handlePermissionToggle(key)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          permissions[key] 
                            ? 'bg-green-600' 
                            : 'bg-slate-600'
                        }`}
                      >
                        <motion.div
                          animate={{ x: permissions[key] ? 24 : 0 }}
                          className="w-5 h-5 bg-white rounded-full shadow-md"
                        />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={requestPermissions}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-medium transition-colors"
                >
                  Demander toutes les permissions
                </motion.button>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex items-center justify-between gap-4"
            >
              {currentScreen > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrevious}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Précédent
                </motion.button>
              )}

              <div className="flex-1" />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                disabled={currentScreenData.isPermissionScreen && !allPermissionsGranted}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  currentScreenData.isPermissionScreen && !allPermissionsGranted
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {currentScreen === onboardingScreens.length - 1 ? 'Commencer' : 'Suivant'}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Progress Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-2 mt-8"
        >
          {onboardingScreens.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 rounded-full transition-colors ${
                index === currentScreen ? 'w-8 bg-blue-400' : 'w-2 bg-slate-600'
              }`}
              whileHover={{ scale: 1.2 }}
              onClick={() => setCurrentScreen(index)}
            />
          ))}
        </motion.div>

        {/* Skip Button */}
        {currentScreen < onboardingScreens.length - 1 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            whileHover={{ opacity: 1 }}
            onClick={onComplete}
            className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm transition-colors"
          >
            Passer
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default OnboardingScreen;
