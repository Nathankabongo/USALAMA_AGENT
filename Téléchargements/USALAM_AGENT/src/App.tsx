import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SplashScreen from './components/SplashScreen';
import OnboardingScreen from './components/OnboardingScreen';
import HomeScreen from './components/HomeScreen';
import EnhancedHomeScreen from './components/EnhancedHomeScreen';
import ContactsScreen from './components/ContactsScreen';
import AlertsScreen from './components/AlertsScreen';
import ProfileScreen from './components/ProfileScreen';
import DigitalGuard from './components/DigitalGuard';
import EvidenceVault from './components/EvidenceVault';
import SurvivalMap from './components/SurvivalMap';
import FirstAidGuide from './components/FirstAidGuide';
import SNIGIntegration from './components/SNIGIntegration';
import EnhancedMapScreen from './components/EnhancedMapScreen';
import SOSScreen from './components/SOSScreen';
import SafePath from './components/SafePath';
import LoginScreen from './components/LoginScreen';
import AuthProvider, { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { initializeOfflineStorage } from './services/offlineStorage';
import { useSentinelSOS } from './hooks/useSentinelSOS';

type AppState = 'splash' | 'onboarding' | 'home' | 'enhanced-home' | 'contacts' | 'alerts' | 'profile' | 'guard' | 'evidence' | 'survival' | 'firstaid' | 'snig' | 'enhanced-map' | 'sos' | 'safepath';

const queryClient = new QueryClient();

const App = () => {
  const [appState, setAppState] = useState<AppState>('splash');
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<AppState>('enhanced-home');
  const { sosState, handleSOSInteraction } = useSentinelSOS();

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Initialize offline storage
        await initializeOfflineStorage();
        
        // Check if user has seen onboarding
        const onboardingComplete = localStorage.getItem('usalama_onboarding_complete');
        setHasSeenOnboarding(!!onboardingComplete);
        
        // Simulate splash screen duration
        setTimeout(() => {
          setAppState('enhanced-home'); // Démarrer directement sur l'accueil amélioré
        }, 3000);
      } catch (error) {
        console.error('App initialization failed:', error);
        setAppState('enhanced-home');
      }
    };

    initializeApp();
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('usalama_onboarding_complete', 'true');
    setAppState('enhanced-home');
    setCurrentScreen('enhanced-home');
  };

  const handleNavigation = (screen: AppState) => {
    setCurrentScreen(screen);
    setAppState(screen);
  };

  const renderCurrentScreen = () => {
    switch (appState) {
      case 'splash':
        return <SplashScreen onComplete={() => setAppState(hasSeenOnboarding ? 'enhanced-home' : 'onboarding')} />;
      case 'onboarding':
        return <OnboardingScreen onComplete={handleOnboardingComplete} />;
      case 'home':
        return <HomeScreen onNavigate={handleNavigation} />;
      case 'enhanced-home':
        return <EnhancedHomeScreen onNavigate={handleNavigation} />;
      case 'contacts':
        return <ContactsScreen onNavigate={handleNavigation} />;
      case 'alerts':
        return <AlertsScreen onNavigate={handleNavigation} />;
      case 'profile':
        return <ProfileScreen onNavigate={handleNavigation} />;
      case 'guard':
        return <DigitalGuard onNavigate={handleNavigation} />;
      case 'evidence':
        return <EvidenceVault onNavigate={handleNavigation} />;
      case 'survival':
        return <SurvivalMap onNavigate={handleNavigation} />;
      case 'firstaid':
        return <FirstAidGuide onNavigate={handleNavigation} />;
      case 'snig':
        return <SNIGIntegration onNavigate={handleNavigation} />;
      case 'enhanced-map':
        return <EnhancedMapScreen onNavigate={handleNavigation} />;
      case 'sos':
        return <SOSScreen onNavigate={handleNavigation} />;
      case 'safepath':
        return <SafePath onNavigate={handleNavigation} />;
      default:
        return <EnhancedHomeScreen onNavigate={handleNavigation} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/usalama" element={
              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={appState}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full"
                  >
                    {renderCurrentScreen()}
                  </motion.div>
                </AnimatePresence>

                {/* SOS State Indicator */}
                <AnimatePresence>
                  {sosState.isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: -50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -50 }}
                      className="fixed top-4 left-4 right-4 z-50 bg-red-600/90 backdrop-blur-lg rounded-lg p-3 flex items-center gap-3"
                    >
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">
                        {sosState.mode === 'emergency' ? 'Mode d\'urgence actif' : 'SOS activé'}
                      </span>
                      {sosState.recording && <span className="text-xs">🎙️ Enregistrement...</span>}
                      {sosState.tracking && <span className="text-xs">📍 Suivi GPS...</span>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
