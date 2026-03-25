import { useState } from 'react';
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
  CheckCircle
} from 'lucide-react';

import { NavigationProps, navigationItems } from '../types/navigation';

interface EnhancedHomeScreenProps {
  onNavigate?: (screen: 'home' | 'enhanced-home' | 'contacts' | 'alerts' | 'profile' | 'guard' | 'evidence' | 'survival' | 'firstaid' | 'snig' | 'enhanced-map' | 'sos') => void;
}

interface QuickAction {
  id: string;
  title: string;
  icon: any;
  color: string;
  action: () => void;
  badge?: number;
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  category: 'police' | 'government' | 'traffic' | 'weather' | 'security' | 'world' | 'drc' | 'kinshasa';
  content: string;
  urgent: boolean;
  imageUrl?: string;
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  location?: 'world' | 'drc' | 'kinshasa';
  likes: number;
  comments: number;
  shares: number;
  isBookmarked: boolean;
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

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Appel d\'Urgence',
      icon: <Phone className="w-5 h-5" />,
      color: 'bg-red-600 hover:bg-red-700',
      action: () => onNavigate?.('enhanced-map')
    },
    {
      id: '2',
      title: 'Signaler Incident',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'bg-orange-600 hover:bg-orange-700',
      action: () => onNavigate?.('enhanced-map')
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
      action: () => onNavigate?.('enhanced-map')
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
              onClick={() => setSelectedLocation(location.id as any)}
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
