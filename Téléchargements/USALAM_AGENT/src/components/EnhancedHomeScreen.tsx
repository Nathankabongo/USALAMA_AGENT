import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Map, 
  Phone, 
  Bell, 
  User, 
  Search, 
  Filter, 
  RefreshCw, 
  Home, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Navigation, 
  Users, 
  Activity,
  TrendingUp,
  Globe,
  Route,
  Heart,
  Share2,
  MessageCircle,
  Bookmark,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  CheckCircle,
  MessageSquare,
  Battery,
  Wifi,
  Thermometer,
  Wind,
  Cloud,
  Zap,
  ShieldCheck,
  Star,
  Award,
  Target,
  Eye,
  BarChart3,
  Calendar,
  RadioReceiver,
  Compass,
  Flashlight,
  Stethoscope,
  Ambulance,
  Hospital
} from 'lucide-react';

import { NavigationProps, navigationItems, ScreenType } from '../types/navigation';

interface EnhancedHomeScreenProps {
  onNavigate?: (screen: ScreenType) => void;
}

interface QuickAction {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
  badge?: number;
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  category: 'police' | 'government' | 'traffic' | 'weather' | 'security' | 'world' | 'drc';
  content: string;
  urgent: boolean;
  imageUrl?: string;
  location: 'world' | 'drc' | 'kinshasa';
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  likes: number;
  comments: number;
  shares: number;
  isBookmarked: boolean;
}

interface SecurityMetric {
  id: string;
  title: string;
  value: string | number;
  change: number;
  icon: any;
  color: string;
  trend: 'up' | 'down' | 'stable';
}

interface CommunityAlert {
  id: string;
  type: 'help' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  author: string;
  time: string;
  location: string;
  verified: boolean;
  responses: number;
}

interface WeatherInfo {
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  airQuality: 'good' | 'moderate' | 'poor';
}

interface EmergencyContact {
  id: string;
  name: string;
  type: 'police' | 'hospital' | 'fire' | 'ambulance';
  phone: string;
  responseTime: string;
  available: boolean;
}

interface SecurityAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  location: string;
  time: string;
  coordinates: { lat: number; lng: number };
  verified: boolean;
}

// Import des images locales
import iranImage from '../image/bitmap_1200_nocrop_1_1_20250403021422491019_GnkQuEzW4AICP9j.jpg';
import kidnapingImage from '../image/kidnaping.jpeg';
import protestImage from '../image/images.jpeg';
import accidentImage from '../image/2.jpeg';

const EnhancedHomeScreen = ({ onNavigate }: NavigationProps) => {
  const [selectedLocation, setSelectedLocation] = useState<'world' | 'drc' | 'kinshasa'>('kinshasa');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Actualités avec réseaux sociaux et images locales
  const [newsItems] = useState<NewsItem[]>([
    {
      id: '1',
      title: 'Tensions accrues au Moyen-Orient : Iran lance de nouveaux missiles',
      source: 'Reuters International',
      time: 'Il y a 30 min',
      category: 'world',
      content: 'L\'Iran a procédé à de nouveaux tirs de missiles balistiques en réponse aux sanctions internationales, créant une escalade des tensions dans la région du Golfe',
      urgent: true,
      imageUrl: iranImage,
      location: 'world',
      socialMedia: {
        twitter: '#IranMissiles #MiddleEast #Tensions',
        facebook: '/reuters-international/posts/iran-missiles-789',
        instagram: '@reuters',
        youtube: '/watch?v=iran-missiles-crisis'
      },
      likes: 3420,
      comments: 567,
      shares: 1234,
      isBookmarked: false
    },
    {
      id: '2',
      title: 'Crise sécuritaire à l\'Est de la RDC : État d\'urgence déclaré',
      source: 'Radio Okapi',
      time: 'Il y a 1h',
      category: 'security',
      content: 'Le gouvernement congolais déclare l\'état d\'urgence dans les provinces du Nord-Kivu et Ituri face à la recrudescence des attaques rebelles',
      urgent: true,
      imageUrl: kidnapingImage,
      location: 'drc',
      socialMedia: {
        twitter: '#RDCEast #SecuriteRDC #Urgence',
        facebook: '/radio-okapi/posts/crisis-kivu-456',
        instagram: '@radiookapi'
      },
      likes: 2156,
      comments: 389,
      shares: 892,
      isBookmarked: true
    },
    {
      id: '3',
      title: 'Manifestations à Kinshasa : Population réclame la baisse des prix',
      source: 'Digital Congo',
      time: 'Il y a 2h',
      category: 'government',
      content: 'Des milliers de manifestants défilent dans les rues de Kinshasa pour exiger des mesures urgentes contre l\'inflation galopante',
      urgent: false,
      imageUrl: protestImage,
      location: 'kinshasa',
      socialMedia: {
        twitter: '#KinshasaProtests #CongoEconomy',
        facebook: '/digital-congo/posts/manifestations-kinshasa-234',
        instagram: '@digitalcongo'
      },
      likes: 1876,
      comments: 234,
      shares: 567,
      isBookmarked: false
    },
    {
      id: '4',
      title: 'Accident grave sur le Boulevard Lumumba : Circulation paralysée',
      source: 'RTGA Kinshasa',
      time: 'Il y a 3h',
      category: 'traffic',
      content: 'Un accident impliquant plusieurs véhicules a provoqué l\'arrêt total de la circulation sur l\'axe principal de la ville',
      urgent: false,
      imageUrl: accidentImage,
      location: 'kinshasa',
      socialMedia: {
        twitter: '#KinshasaTraffic #LumumbaAccident',
        facebook: '/rtga-kinshasa/posts/accident-lumumba-123'
      },
      likes: 543,
      comments: 89,
      shares: 234,
      isBookmarked: false
    },
    {
      id: '5',
      title: 'Tempête tropicale approche : Alerte météo pour la côte atlantique',
      source: 'Météo Congo',
      time: 'Il y a 4h',
      category: 'weather',
      content: 'Une tempête tropicale de catégorie 2 se dirige vers la côte atlantique, les autorités recommandent la plus grande prudence',
      urgent: false,
      imageUrl: iranImage,
      location: 'drc',
      socialMedia: {
        twitter: '#CongoWeather #TropicalStorm',
        facebook: '/meteo-congo/posts/tempete-atlantique-789'
      },
      likes: 1234,
      comments: 156,
      shares: 445,
      isBookmarked: false
    },
    {
      id: '6',
      title: 'Nouvelle opération de police contre le banditisme à Gombe',
      source: 'Police Nationale RDC',
      time: 'Il y a 5h',
      category: 'police',
      content: 'Les forces de l\'ordre ont mené une opération réussie contre un réseau de criminels dans le quartier huppé de Gombe',
      urgent: false,
      imageUrl: kidnapingImage,
      location: 'kinshasa',
      socialMedia: {
        twitter: '#PoliceKins #GombeSecurity',
        facebook: '/police-nationale-rdc/posts/operation-gombe-456',
        instagram: '@police_rdc'
      },
      likes: 876,
      comments: 98,
      shares: 321,
      isBookmarked: false
    }
  ]);

  const [securityAlerts] = useState<SecurityAlert[]>([
    {
      id: '1',
      type: 'critical',
      title: 'Attaque armée signalée',
      description: 'Zone à éviter temporairement',
      location: 'Quartier Matete',
      time: 'Il y a 10 min',
      coordinates: { lat: -4.4419, lng: 15.2663 },
      verified: true
    },
    {
      id: '2',
      type: 'warning',
      title: 'Circulation perturbée',
      description: 'Manifestation sur le Boulevard',
      location: 'Boulevard du 30 Juin',
      time: 'Il y a 25 min',
      coordinates: { lat: -4.4419, lng: 15.2663 },
      verified: true
    }
  ]);

  // Nouvelles données pour les statistiques et métriques
  const [securityMetrics] = useState<SecurityMetric[]>([
    {
      id: '1',
      title: 'Incidents aujourd\'hui',
      value: 12,
      change: -15,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-orange-400',
      trend: 'down'
    },
    {
      id: '2',
      title: 'Temps de réponse moyen',
      value: '8 min',
      change: -20,
      icon: <Clock className="w-5 h-5" />,
      color: 'text-green-400',
      trend: 'down'
    },
    {
      id: '3',
      title: 'Utilisateurs actifs',
      value: '2.4K',
      change: 12,
      icon: <Users className="w-5 h-5" />,
      color: 'text-blue-400',
      trend: 'up'
    },
    {
      id: '4',
      title: 'Taux de satisfaction',
      value: '94%',
      change: 3,
      icon: <Star className="w-5 h-5" />,
      color: 'text-yellow-400',
      trend: 'up'
    }
  ]);

  const [communityAlerts] = useState<CommunityAlert[]>([
    {
      id: '1',
      type: 'help',
      title: 'Recherche de témoin - Vol de véhicule',
      description: 'Vol de voiture blanche Toyota Corolla vers 18h, plaque immatriculation CD-123-AB',
      author: 'Jean Mukendi',
      time: 'Il y a 15 min',
      location: 'Quartier Kalamu',
      verified: true,
      responses: 8
    },
    {
      id: '2',
      type: 'warning',
      title: 'Zone dangereuse - Éviter Limete ce soir',
      description: 'Manifestation prévue ce soir, circulation perturbée',
      author: 'Police Locale',
      time: 'Il y a 1h',
      location: 'Avenue Limete',
      verified: true,
      responses: 23
    },
    {
      id: '3',
      type: 'info',
      title: 'Centre médical temporaire ouvert',
      description: 'Soins gratuits disponibles près du marché',
      author: 'Croix-Rouge RDC',
      time: 'Il y a 2h',
      location: 'Marché Central',
      verified: true,
      responses: 15
    }
  ]);

  const [weatherInfo] = useState<WeatherInfo>({
    temperature: 28,
    condition: 'cloudy',
    humidity: 75,
    windSpeed: 12,
    uvIndex: 6,
    airQuality: 'moderate'
  });

  const [emergencyContacts] = useState<EmergencyContact[]>([
    {
      id: '1',
      name: 'Police Nationale',
      type: 'police',
      phone: '112',
      responseTime: '8 min',
      available: true
    },
    {
      id: '2',
      name: 'Hôpital Général',
      type: 'hospital',
      phone: '123456789',
      responseTime: '12 min',
      available: true
    },
    {
      id: '3',
      name: 'Services Ambulance',
      type: 'ambulance',
      phone: '999',
      responseTime: '15 min',
      available: true
    },
    {
      id: '4',
      name: 'Pompiers',
      type: 'fire',
      phone: '118',
      responseTime: '10 min',
      available: false
    }
  ]);

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Appel d\'Urgence',
      icon: <Phone className="w-5 h-5" />,
      color: 'bg-red-600 hover:bg-red-700',
      action: () => onNavigate?.('sos')
    },
    {
      id: '2',
      title: 'Localiser Numéro',
      icon: <Navigation className="w-5 h-5" />,
      color: 'bg-rose-600 hover:bg-rose-700',
      action: () => onNavigate?.('phone-tracker')
    },
    {
      id: '3',
      title: 'Hôpitaux Proches',
      icon: <MapPin className="w-5 h-5" />,
      color: 'bg-green-600 hover:bg-green-700',
      action: () => onNavigate?.('enhanced-map'),
      badge: 3
    },
    {
      id: '4',
      title: 'Carte Sécurité',
      icon: <Map className="w-5 h-5" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => onNavigate?.('enhanced-map')
    },
    {
      id: '5',
      title: 'Trajet Sécurisé',
      icon: <Route className="w-5 h-5" />,
      color: 'bg-purple-600 hover:bg-purple-700',
      action: () => onNavigate?.('safepath')
    },
    {
      id: '6',
      title: 'Signaler Incident',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'bg-orange-600 hover:bg-orange-700',
      action: () => onNavigate?.('incident-report')
    },
    {
      id: '7',
      title: 'Chat Communauté',
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      action: () => onNavigate?.('community-chat'),
      badge: 12
    },
    {
      id: '8',
      title: 'Centre Commande',
      icon: <Target className="w-5 h-5" />,
      color: 'bg-cyan-600 hover:bg-cyan-700',
      action: () => onNavigate?.('command-center')
    }
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const getNewsColor = (category: string) => {
    switch (category) {
      case 'police': return 'text-blue-400 bg-blue-600/20';
      case 'government': return 'text-purple-400 bg-purple-600/20';
      case 'traffic': return 'text-yellow-400 bg-yellow-600/20';
      case 'weather': return 'text-cyan-400 bg-cyan-600/20';
      case 'security': return 'text-red-400 bg-red-600/20';
      case 'world': return 'text-orange-400 bg-orange-600/20';
      case 'drc': return 'text-green-400 bg-green-600/20';
      default: return 'text-slate-400 bg-slate-600/20';
    }
  };

  const filteredNews = newsItems.filter(news => {
    const matchesLocation = selectedLocation === 'world' || news.location === selectedLocation || selectedLocation === 'kinshasa';
    const matchesCategory = selectedCategory === 'all' || news.category === selectedCategory;
    const matchesSearch = news.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        news.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLocation && matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-slate-800/95 backdrop-blur-lg border-b border-slate-700 p-3 sm:p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold">USALAMA</h1>
              <p className="text-xs text-slate-400 hidden sm:block">Sécurité Communautaire</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3 sm:mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher des actualités..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm sm:text-base"
          />
        </div>

        {/* Location Filter */}
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {[
            { id: 'world', label: 'Monde', icon: <Globe className="w-4 h-4" /> },
            { id: 'drc', label: 'RDC', icon: <MapPin className="w-4 h-4" /> },
            { id: 'kinshasa', label: 'Kinshasa', icon: <Home className="w-4 h-4" /> }
          ].map((location) => (
            <motion.button
              key={location.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedLocation(location.id as 'world' | 'drc' | 'kinshasa')}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                selectedLocation === location.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {location.icon}
              <span className="hidden xs:inline">{location.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Tout' },
            { id: 'police', label: 'Police' },
            { id: 'government', label: 'Gouvernement' },
            { id: 'traffic', label: 'Trafic' },
            { id: 'weather', label: 'Météo' },
            { id: 'security', label: 'Sécurité' }
          ].map((category) => (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === category.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {category.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Weather & Status Bar */}
        <div className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Weather Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-lg p-3 border border-blue-600/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Cloud className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">Météo</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{weatherInfo.temperature}°C</div>
                  <div className="text-xs text-slate-300">
                    Humidité: {weatherInfo.humidity}% • Vent: {weatherInfo.windSpeed}km/h
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    weatherInfo.airQuality === 'good' ? 'bg-green-600/20 text-green-400' :
                    weatherInfo.airQuality === 'moderate' ? 'bg-yellow-600/20 text-yellow-400' :
                    'bg-red-600/20 text-red-400'
                  }`}>
                    Qualité: {weatherInfo.airQuality === 'good' ? 'Bonne' : weatherInfo.airQuality === 'moderate' ? 'Modérée' : 'Mauvaise'}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* System Status Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-lg p-3 border border-green-600/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-white">Système</span>
                  </div>
                  <div className="text-lg font-bold text-white">Opérationnel</div>
                  <div className="text-xs text-slate-300">
                    Batterie: 85% • Signal: 4G
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">Actif</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Security Metrics */}
        <div className="px-3 sm:px-4 mb-4">
          <h2 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            <span className="text-sm sm:text-base">Statistiques de Sécurité</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {securityMetrics.map((metric, index) => (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/50 rounded-lg p-3 border border-slate-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={metric.color}>{metric.icon}</div>
                  <div className={`flex items-center gap-1 text-xs ${
                    metric.trend === 'up' ? 'text-green-400' : 
                    metric.trend === 'down' ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                    <span>{Math.abs(metric.change)}%</span>
                  </div>
                </div>
                <div className="text-lg font-bold text-white">{metric.value}</div>
                <div className="text-xs text-slate-400">{metric.title}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="px-3 sm:px-4 mb-4">
          <h2 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3 flex items-center gap-2">
            <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            <span className="text-sm sm:text-base">Contacts d'Urgence</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {emergencyContacts.map((contact) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`bg-slate-800/50 rounded-lg p-3 border border-slate-700 ${
                  !contact.available ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      contact.type === 'police' ? 'bg-blue-600/20' :
                      contact.type === 'hospital' ? 'bg-red-600/20' :
                      contact.type === 'ambulance' ? 'bg-green-600/20' :
                      'bg-orange-600/20'
                    }`}>
                      {contact.type === 'police' ? <Shield className="w-4 h-4 text-blue-400" /> :
                       contact.type === 'hospital' ? <Hospital className="w-4 h-4 text-red-400" /> :
                       contact.type === 'ambulance' ? <Ambulance className="w-4 h-4 text-green-400" /> :
                       <Zap className="w-4 h-4 text-orange-400" />}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{contact.name}</div>
                      <div className="text-xs text-slate-400">{contact.responseTime}</div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = `tel:${contact.phone}`}
                    disabled={!contact.available}
                    className={`p-2 rounded-lg ${
                      contact.available 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <Phone className="w-3 h-3 text-white" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Community Alerts */}
        <div className="px-3 sm:px-4 mb-4">
          <h2 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
            <span className="text-sm sm:text-base">Alertes Communautaires</span>
          </h2>
          <div className="space-y-2">
            {communityAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-lg border ${
                  alert.type === 'help' ? 'bg-red-600/20 border-red-600/50' :
                  alert.type === 'warning' ? 'bg-orange-600/20 border-orange-600/50' :
                  alert.type === 'info' ? 'bg-blue-600/20 border-blue-600/50' :
                  'bg-green-600/20 border-green-600/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white text-sm">{alert.title}</h3>
                      {alert.verified && (
                        <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mb-2">{alert.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <User className="w-3 h-3" />
                        <span>{alert.author}</span>
                        <MapPin className="w-3 h-3" />
                        <span>{alert.location}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <MessageCircle className="w-3 h-3" />
                        <span>{alert.responses}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-3 sm:p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {quickActions.map((action) => (
              <motion.button
                key={action.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={action.action}
                className={`${action.color} p-3 sm:p-4 rounded-xl flex flex-col items-center gap-1 sm:gap-2 relative`}
              >
                {action.badge && (
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                    {action.badge}
                  </div>
                )}
                <div className="w-4 h-4 sm:w-5 sm:h-5">{action.icon}</div>
                <span className="text-xs sm:text-sm font-medium">{action.title}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ══════ PHONE TRACKER CARD ══════ */}
        <div className="px-3 sm:px-4 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            onClick={() => onNavigate?.('phone-tracker')}
            className="cursor-pointer relative overflow-hidden bg-gradient-to-br from-red-900/60 via-rose-900/40 to-slate-900 border border-red-500/40 rounded-2xl p-4"
          >
            {/* Animated background dots */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-red-400/30 rounded-full"
                  style={{ top: `${15 + i * 14}%`, left: `${60 + i * 5}%` }}
                  animate={{ scale: [1, 2, 1], opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
                />
              ))}
            </div>

            <div className="relative flex items-center gap-4">
              {/* Icon animé */}
              <div className="relative flex-shrink-0">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/50"
                >
                  <Phone className="w-7 h-7 text-white" />
                </motion.div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full animate-pulse border-2 border-slate-900" />
              </div>

              {/* Texte */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-bold text-base">Localiser par Numéro</h3>
                  <div className="px-2 py-0.5 bg-red-600/30 border border-red-500/40 rounded-full">
                    <span className="text-red-300 text-[10px] font-bold uppercase tracking-wider">Actif</span>
                  </div>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Entrez un numéro de téléphone et localisez la personne sur la carte en temps réel
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 text-[10px] font-medium">GPS Actif</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                    <span className="text-blue-400 text-[10px] font-medium">Réseau cellulaire</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                    <span className="text-purple-400 text-[10px] font-medium">WiFi</span>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                  <Navigation className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            {/* Barre de progress simulée */}
            <div className="relative mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-full"
                animate={{ width: ['0%', '70%', '45%', '85%', '60%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <p className="text-slate-500 text-[10px] mt-1">Triangulation du signal en cours...</p>
          </motion.div>
        </div>

        {/* Security Alerts */}
        <div className="px-3 sm:px-4 mb-4">
          <h2 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
            <span className="text-sm sm:text-base">Alertes Sécurité</span>
          </h2>
          <div className="space-y-2">
            {securityAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 sm:p-4 rounded-lg border ${
                  alert.type === 'critical' 
                    ? 'bg-red-600/20 border-red-600/50' 
                    : 'bg-orange-600/20 border-orange-600/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white text-sm sm:text-base">{alert.title}</h3>
                      {alert.verified && (
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 mb-1">{alert.description}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <MapPin className="w-3 h-3" />
                      <span>{alert.location}</span>
                      <Clock className="w-3 h-3" />
                      <span>{alert.time}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Actualités Filtrées */}
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <span className="text-sm sm:text-base">
                Actualités {selectedLocation === 'world' ? 'Mondiales' : selectedLocation === 'drc' ? 'RDC' : 'Kinshasa'}
              </span>
            </h2>
            <span className="text-xs sm:text-sm text-slate-400">{filteredNews.length} articles</span>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            {filteredNews.map((news, index) => (
              <motion.div
                key={news.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700"
              >
                {/* Image */}
                {news.imageUrl && (
                  <div className="relative h-32 sm:h-48 md:h-56 overflow-hidden">
                    <img 
                      src={news.imageUrl} 
                      alt={news.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-2 left-2 flex gap-2">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getNewsColor(news.category)}`}>
                        {news.category === 'police' ? 'Police' :
                         news.category === 'government' ? 'Gouvernement' :
                         news.category === 'traffic' ? 'Trafic' :
                         news.category === 'weather' ? 'Météo' :
                         news.category === 'security' ? 'Sécurité' :
                         news.category === 'world' ? 'International' :
                         news.category === 'drc' ? 'RDC' : 'Kinshasa'}
                      </div>
                      {news.urgent && (
                        <div className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs font-medium">
                          Urgent
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">{news.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-300 mb-2 sm:mb-3 line-clamp-2">{news.content}</p>
                    </div>
                    <span className="text-xs text-slate-400 ml-2">{news.time}</span>
                  </div>
                  
                  {/* Source et Réseaux Sociaux */}
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Source: {news.source}</span>
                    </div>
                    {news.socialMedia && (
                      <div className="flex items-center gap-2">
                        {news.socialMedia.twitter && (
                          <a href="#" className="text-blue-400 hover:text-blue-300">
                            <Twitter className="w-3 h-3 sm:w-4 sm:h-4" />
                          </a>
                        )}
                        {news.socialMedia.facebook && (
                          <a href="#" className="text-blue-600 hover:text-blue-500">
                            <Facebook className="w-3 h-3 sm:w-4 sm:h-4" />
                          </a>
                        )}
                        {news.socialMedia.instagram && (
                          <a href="#" className="text-pink-600 hover:text-pink-500">
                            <Instagram className="w-3 h-3 sm:w-4 sm:h-4" />
                          </a>
                        )}
                        {news.socialMedia.youtube && (
                          <a href="#" className="text-red-600 hover:text-red-500">
                            <Youtube className="w-3 h-3 sm:w-4 sm:h-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-slate-700">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <button className="flex items-center gap-1 hover:text-red-400 transition-colors">
                        <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs">{news.likes}</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                        <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs">{news.comments}</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-green-400 transition-colors">
                        <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs">{news.shares}</span>
                      </button>
                    </div>
                    <button className="hover:text-yellow-400 transition-colors">
                      <Bookmark className={`w-3 h-3 sm:w-4 sm:h-4 ${news.isBookmarked ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
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
                onClick={() => onNavigate?.(item.id)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors hover:bg-slate-700"
              >
                <div className="w-4 h-4 sm:w-5 sm:h-5">{icons[item.icon]}</div>
                <span className="text-xs text-slate-400">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EnhancedHomeScreen;
