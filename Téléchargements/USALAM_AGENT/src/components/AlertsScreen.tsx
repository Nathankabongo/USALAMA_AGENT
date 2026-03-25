import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Map, 
  Phone, 
  Bell,
  User,
  MapPin, 
  Clock, 
  AlertTriangle, 
  Users, 
  Activity,
  TrendingUp,
  AlertCircle,
  Filter,
  Search,
  CheckCircle,
  X
} from 'lucide-react';

interface AlertsScreenProps {
  onNavigate?: (screen: 'home' | 'enhanced-home' | 'contacts' | 'alerts' | 'profile' | 'guard' | 'evidence' | 'survival' | 'firstaid' | 'snig' | 'enhanced-map' | 'sos') => void;
}

interface Alert {
  id: string;
  type: 'incident' | 'sos' | 'community' | 'system';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  location?: string;
  verified: boolean;
  read: boolean;
  source: string;
}

const AlertsScreen = ({ onNavigate }: AlertsScreenProps) => {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'sos',
      title: 'Alerte SOS Activée',
      description: 'Marie Kabila a déclenché une alerte d\'urgence près du Marché Central',
      severity: 'critical',
      timestamp: 'Il y a 2 min',
      location: 'Marché Central, Kinshasa',
      verified: true,
      read: false,
      source: 'Contact de confiance'
    },
    {
      id: '2',
      type: 'incident',
      title: 'Kuluna Signalé',
      description: 'Groupe de jeunes armés signalés à Limete',
      severity: 'high',
      timestamp: 'Il y a 15 min',
      location: 'Limete, Kinshasa',
      verified: true,
      read: false,
      source: 'Communauté'
    },
    {
      id: '3',
      type: 'community',
      title: 'Contrôle Policier',
      description: 'Contrôle routier imprévu sur l\'Avenue Kasa-Vubu',
      severity: 'medium',
      timestamp: 'Il y a 30 min',
      location: 'Avenue Kasa-Vubu',
      verified: true,
      read: true,
      source: 'Utilisateur vérifié'
    },
    {
      id: '4',
      type: 'incident',
      title: 'Panne d\'Éclairage',
      description: 'Zone sans éclairage signalée dans le quartier de Matete',
      severity: 'medium',
      timestamp: 'Il y a 1 heure',
      location: 'Matete, Kinshasa',
      verified: false,
      read: true,
      source: 'Communauté'
    },
    {
      id: '5',
      type: 'system',
      title: 'Mise à Jour du Système',
      description: 'Nouvelle fonctionnalité de test de connexion disponible',
      severity: 'low',
      timestamp: 'Il y a 2 heures',
      verified: true,
      read: true,
      source: 'USALAMA AGENT'
    }
  ]);

  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'critical' | 'verified'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' ||
                         (filterType === 'unread' && !alert.read) ||
                         (filterType === 'critical' && alert.severity === 'critical') ||
                         (filterType === 'verified' && alert.verified);
    
    return matchesSearch && matchesFilter;
  });

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
  };

  const deleteAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case 'sos': return <AlertTriangle className="w-4 h-4" />;
      case 'incident': return <AlertCircle className="w-4 h-4" />;
      case 'community': return <Users className="w-4 h-4" />;
      case 'system': return <Bell className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sos': return 'text-red-400';
      case 'incident': return 'text-orange-400';
      case 'community': return 'text-blue-400';
      case 'system': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const unreadCount = alerts.filter(alert => !alert.read).length;
  const criticalCount = alerts.filter(alert => alert.severity === 'critical').length;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800/95 backdrop-blur-lg border-b border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="w-6 h-6 text-blue-400" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{unreadCount}</span>
                </div>
              )}
            </div>
            <h1 className="text-xl font-bold">Centre d'Alertes</h1>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className="bg-slate-700 hover:bg-slate-600 p-2 rounded-lg transition-colors"
            >
              <Filter className="w-5 h-5" />
            </motion.button>
            {unreadCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={markAllAsRead}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Tout marquer comme lu
              </motion.button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{alerts.length}</div>
            <div className="text-xs text-slate-400">Total</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{unreadCount}</div>
            <div className="text-xs text-slate-400">Non lues</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-400">{criticalCount}</div>
            <div className="text-xs text-slate-400">Critiques</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">
              {alerts.filter(a => a.verified).length}
            </div>
            <div className="text-xs text-slate-400">Vérifiées</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex-1 overflow-y-auto pb-20">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher des alertes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-full mt-2 right-0 z-50"
              >
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-2">
                  <div className="space-y-1">
                    {[
                      { value: 'all', label: 'Toutes les alertes' },
                      { value: 'unread', label: 'Non lues uniquement' },
                      { value: 'critical', label: 'Alertes critiques' },
                      { value: 'verified', label: 'Alertes vérifiées' }
                    ].map(filter => (
                      <motion.button
                        key={filter.value}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setFilterType(filter.value as any);
                          setShowFilters(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          filterType === filter.value 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {filter.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Alerts List */}
      <div className="p-4">
        <div className="space-y-3">
          {filteredAlerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-slate-800/50 backdrop-blur-sm rounded-lg border ${
                !alert.read ? 'border-blue-500/30' : 'border-slate-700'
              } cursor-pointer transition-all hover:bg-slate-800/70`}
              onClick={() => {
                setSelectedAlert(alert);
                markAsRead(alert.id);
              }}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                      {getSeverityIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        {alert.title}
                        {!alert.read && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full" />
                        )}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">{alert.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.verified && (
                      <div className="bg-green-600/20 border border-green-600/30 rounded-full p-1">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                      </div>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAlert(alert.id);
                      }}
                      className="text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{alert.timestamp}</span>
                    </div>
                    {alert.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{alert.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={getTypeColor(alert.type)}>
                      {alert.source}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredAlerts.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">Aucune alerte trouvée</p>
            <p className="text-slate-500 text-sm mt-2">
              {searchQuery ? 'Essayez une autre recherche' : 'Votre centre d\'alertes est vide'}
            </p>
          </div>
        )}
      </div>

      {/* Alert Detail Modal */}
      <AnimatePresence>
        {selectedAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAlert(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${getSeverityColor(selectedAlert.severity)}`}>
                    {getSeverityIcon(selectedAlert.type)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedAlert.title}</h3>
                    <p className="text-sm text-slate-400">{selectedAlert.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-slate-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(selectedAlert.severity)}`}>
                    {selectedAlert.severity.toUpperCase()}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${getTypeColor(selectedAlert.type)}`}>
                    {selectedAlert.type.toUpperCase()}
                  </div>
                  {selectedAlert.verified && (
                    <div className="flex items-center gap-1 text-green-400">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm">Vérifiée</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{selectedAlert.timestamp}</span>
                  </div>
                  {selectedAlert.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedAlert.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Source: {selectedAlert.source}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    markAsRead(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-medium transition-colors"
                >
                  Marquer comme lu
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    deleteAlert(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-3 font-medium transition-colors"
                >
                  Supprimer
                </motion.button>
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

export default AlertsScreen;
