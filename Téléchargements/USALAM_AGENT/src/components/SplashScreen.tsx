import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, MapPin, Users, Award, CheckCircle, X, AlertTriangle, User } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Simulate app initialization
    const initSteps = [
      { step: 'Chargement des services de sécurité...', duration: 800 },
      { step: 'Initialisation du GPS...', duration: 600 },
      { step: 'Configuration des permissions...', duration: 500 },
      { step: 'Préparation du mode SOS...', duration: 700 },
      { step: 'USALAMA AGENT prêt!', duration: 400 }
    ];

    let currentStep = 0;
    const totalDuration = initSteps.reduce((acc, step) => acc + step.duration, 0);
    const startTime = Date.now();

    const runInitSteps = () => {
      if (currentStep < initSteps.length) {
        const step = initSteps[currentStep];
        
        // Update progress
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / totalDuration) * 100, 100);
        setLoadingProgress(progress);

        setTimeout(() => {
          currentStep++;
          if (currentStep >= initSteps.length) {
            // All steps completed
            setTimeout(() => {
              setIsLoading(false);
              setTimeout(() => {
                onComplete();
              }, 500);
            }, 300);
          } else {
            runInitSteps();
          }
        }, step.duration);
      }
    };

    runInitSteps();
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center">
        {/* Logo Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ 
            scale: [0, 1.2, 1],
            rotate: [-180, 10, 0]
          }}
          transition={{ 
            duration: 1.5,
            ease: "easeInOut",
            times: [0, 0.5, 1]
          }}
          className="mb-8"
        >
          <div className="relative">
            <div className="w-32 h-32 border-4 border-blue-500/30 rounded-full flex items-center justify-center">
              {/* Inner shield */}
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  backgroundColor: ['#1e40af', '#dc2626', '#1e40af']
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center"
              >
                <Shield className="w-12 h-12 text-white" />
              </motion.div>
            </div>
            
            {/* Orbiting dots */}
            {[0, 120, 240].map((rotation, index) => (
              <motion.div
                key={index}
                animate={{ rotate: 360 }}
                transition={{ 
                  duration: 10,
                  repeat: Infinity,
                  ease: "linear",
                  delay: index * 0.5
                }}
                className="absolute inset-0"
              >
                <div 
                  className="absolute w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                  style={{
                    top: '0',
                    left: '50%',
                    transform: `translateX(-50%) translateY(-16px) rotate(${rotation}deg) translateY(64px)`
                  }}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Logo and branding */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-8"
        >
          {/* Badge de certification SNIG */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mb-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/20 border border-blue-800/50 rounded-full">
              <Award className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-blue-400">Certifié Projet 46 / SNIG</span>
            </div>
          </motion.div>

          <div className="relative mb-6">
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="w-24 h-24 mx-auto relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-20 blur-xl"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                <Shield className="w-12 h-12 text-white" />
              </div>
            </motion.div>
            
            {/* Indicateur de connexion SNIG */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute top-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center"
            >
              <CheckCircle className="w-3 h-3 text-white" />
            </motion.div>
          </div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl font-bold text-white mb-2"
          >
            USALAMA AGENT
          </motion.h1>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex items-center justify-center gap-2 text-slate-400 mb-4"
          >
            <span className="text-sm">Liaison Police Directe</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </motion.div>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-slate-400 text-sm max-w-xs mx-auto"
          >
            Application Hybride de Sécurité Communautaire
          </motion.p>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="text-slate-400 text-sm max-w-xs mx-auto mb-8"
        >
          Protection communautaire intelligente et discrète
        </motion.p>

        {/* Loading Progress */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-xs mx-auto"
            >
              <div className="text-center mb-4">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-sm text-slate-400"
                >
                  {loadingProgress < 20 && 'Initialisation...'}
                  {loadingProgress >= 20 && loadingProgress < 40 && 'Chargement des services de sécurité...'}
                  {loadingProgress >= 40 && loadingProgress < 60 && 'Initialisation du GPS...'}
                  {loadingProgress >= 60 && loadingProgress < 80 && 'Configuration des permissions...'}
                  {loadingProgress >= 80 && 'Préparation du mode SOS...'}
                </motion.div>
              </div>
              
              <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${loadingProgress}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  transition={{ duration: 0.3 }}
                />
              </div>
              
              <div className="mt-2 text-xs text-slate-500">
                {Math.round(loadingProgress)}%
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature Icons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="flex justify-center gap-8 mt-8"
        >
          <motion.div
            whileHover={{ scale: 1.1, y: -5 }}
            className="text-center"
          >
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-2">
              <MapPin className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-xs text-slate-400">Carte</span>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.1, y: -5 }}
            className="text-center"
          >
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-xs text-slate-400">Réseau</span>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.1, y: -5 }}
            className="text-center"
          >
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
            <span className="text-xs text-slate-400">Alertes</span>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.1, y: -5 }}
            className="text-center"
          >
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-2">
              <User className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-xs text-slate-400">Profil</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom watermark */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-4 left-0 right-0 text-center"
      >
        <p className="text-slate-600 text-xs">
          Version 2.0.0 • Sécurité • Confiance • Protection
        </p>
        <div className="flex items-center justify-center gap-2 mt-1">
          <Award className="w-3 h-3 text-blue-400" />
          <span className="text-xs text-blue-400">Projet 46 / SNIG</span>
        </div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
