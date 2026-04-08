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
  Plus, 
  X, 
  Users, 
  MessageSquare, 
  CheckCircle,
  Battery,
  BatteryLow,
  Wifi,
  WifiOff,
  QrCode,
  TestTube,
  Lock,
  Unlock,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  Heart,
  AlertTriangle,
  UserCheck,
  UserX,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  FileText,
  Camera,
  Settings
} from 'lucide-react';
import { NavigationProps, ScreenType, navigationItems } from '../types/navigation';

interface Contact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isEmergency: boolean;
  isVerified: boolean;
  trustLevel: number;
  lastSeen?: string;
  isOnline: boolean;
  // Nouvelles propriétés pour la segmentation
  interventionLevel: 'ultra-priority' | 'vigilant-neighbor' | 'legal-medical' | 'copilot';
  availabilityStatus: 'online' | 'battery-low' | 'offline' | 'out-of-zone';
  batteryLevel: number;
  distance: number; // en km
  isDefaultCopilot: boolean;
  hasAccessToSafeVault: boolean;
  sharedTripsCount: number;
  lastSignalTest?: Date;
}

interface SafeVaultDocument {
  id: string;
  name: string;
  type: 'id-card' | 'passport' | 'medical-record' | 'other';
  isEncrypted: boolean;
  sharedWith: string[]; // contact IDs
  uploadDate: Date;
}

const ContactsScreen = ({ onNavigate }: NavigationProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showSafeVault, setShowSafeVault] = useState(false);
  const [positionSharingEnabled, setPositionSharingEnabled] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: '',
    isEmergency: false,
    interventionLevel: 'copilot' as const
  });

  // Contacts enrichis avec toutes les nouvelles fonctionnalités
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: '1',
      name: 'Papa',
      phone: '+243818123456',
      relationship: 'Famille',
      isEmergency: true,
      isVerified: true,
      trustLevel: 100,
      isOnline: true,
      interventionLevel: 'ultra-priority',
      availabilityStatus: 'online',
      batteryLevel: 85,
      distance: 0.5,
      isDefaultCopilot: false,
      hasAccessToSafeVault: true,
      sharedTripsCount: 12,
      lastSignalTest: new Date(Date.now() - 1000 * 60 * 30)
    },
    {
      id: '2',
      name: 'Maman',
      phone: '+243819987654',
      relationship: 'Famille',
      isEmergency: true,
      isVerified: true,
      trustLevel: 100,
      isOnline: true,
      interventionLevel: 'ultra-priority',
      availabilityStatus: 'online',
      batteryLevel: 92,
      distance: 0.5,
      isDefaultCopilot: false,
      hasAccessToSafeVault: true,
      sharedTripsCount: 8,
      lastSignalTest: new Date(Date.now() - 1000 * 60 * 60)
    },
    {
      id: '3',
      name: 'Dr. Mukendi',
      phone: '+243812345678',
      relationship: 'Médecin',
      isEmergency: false,
      isVerified: true,
      trustLevel: 95,
      isOnline: false,
      interventionLevel: 'legal-medical',
      availabilityStatus: 'offline',
      batteryLevel: 45,
      distance: 2.3,
      isDefaultCopilot: false,
      hasAccessToSafeVault: true,
      sharedTripsCount: 0,
      lastSignalTest: new Date(Date.now() - 1000 * 60 * 60 * 24)
    },
    {
      id: '4',
      name: 'Yaya (Voisin)',
      phone: '+243815555555',
      relationship: 'Voisin',
      isEmergency: false,
      isVerified: true,
      trustLevel: 80,
      isOnline: true,
      interventionLevel: 'vigilant-neighbor',
      availabilityStatus: 'online',
      batteryLevel: 67,
      distance: 0.2,
      isDefaultCopilot: true,
      hasAccessToSafeVault: false,
      sharedTripsCount: 25,
      lastSignalTest: new Date(Date.now() - 1000 * 60 * 15)
    },
    {
      id: '5',
      name: 'Maître Lutumba',
      phone: '+243818888888',
      relationship: 'Avocat',
      isEmergency: false,
      isVerified: true,
      trustLevel: 90,
      isOnline: false,
      interventionLevel: 'legal-medical',
      availabilityStatus: 'battery-low',
      batteryLevel: 15,
      distance: 5.8,
      isDefaultCopilot: false,
      hasAccessToSafeVault: true,
      sharedTripsCount: 0,
      lastSignalTest: new Date(Date.now() - 1000 * 60 * 60 * 48)
    }
  ]);

  // Documents du Safe Vault
  const [safeVaultDocuments] = useState<SafeVaultDocument[]>([
    {
      id: '1',
      name: 'Carte d\'électeur',
      type: 'id-card',
      isEncrypted: true,
      sharedWith: ['1', '2'],
      uploadDate: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Passeport',
      type: 'passport',
      isEncrypted: true,
      sharedWith: ['1', '2'],
      uploadDate: new Date('2024-01-15')
    },
    {
      id: '3',
      name: 'Groupe sanguin + Allergies',
      type: 'medical-record',
      isEncrypted: true,
      sharedWith: ['1', '2', '3'],
      uploadDate: new Date('2024-02-01')
    }
  ]);

  // Fonctions pour les nouvelles fonctionnalités
  const handleSignalTest = (contactId: string) => {
    console.log(`Test de signal envoyé au contact ${contactId}`);
    // Simuler l'envoi d'un bip de test
  };

  const handleQRScan = () => {
    setShowQRScanner(true);
    // Simuler le scan QR
    setTimeout(() => {
      setShowQRScanner(false);
      setShowAddContact(true);
    }, 2000);
  };

  const handleTogglePositionSharing = () => {
    setPositionSharingEnabled(!positionSharingEnabled);
  };

  const handleSetDefaultCopilot = (contactId: string) => {
    console.log(`Contact ${contactId} défini comme copilote par défaut`);
  };

  const getAvailabilityIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <UserCheck className="w-4 h-4 text-green-400" />;
      case 'battery-low':
        return <BatteryLow className="w-4 h-4 text-orange-400" />;
      case 'offline':
        return <UserX className="w-4 h-4 text-slate-400" />;
      case 'out-of-zone':
        return <MapPin className="w-4 h-4 text-red-400" />;
      default:
        return <User className="w-4 h-4 text-slate-400" />;
    }
  };

  const getInterventionLevelColor = (level: string) => {
    switch (level) {
      case 'ultra-priority':
        return 'border-red-500 bg-red-500/10';
      case 'vigilant-neighbor':
        return 'border-blue-500 bg-blue-500/10';
      case 'legal-medical':
        return 'border-purple-500 bg-purple-500/10';
      case 'copilot':
        return 'border-green-500 bg-green-500/10';
      default:
        return 'border-slate-600 bg-slate-600/10';
    }
  };

  const getInterventionLevelLabel = (level: string) => {
    switch (level) {
      case 'ultra-priority':
        return 'Ultra-Prioritaire';
      case 'vigilant-neighbor':
        return 'Voisin Vigilant';
      case 'legal-medical':
        return 'Juridique/Médical';
      case 'copilot':
        return 'Copilote';
      default:
        return 'Standard';
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.relationship.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedLevel === 'all') return matchesSearch;
    return matchesSearch && contact.interventionLevel === selectedLevel;
  });

  const handleAddContact = () => {
    if (newContact.name && newContact.phone) {
      const contact: Contact = {
        id: Date.now().toString(),
        name: newContact.name,
        phone: newContact.phone,
        relationship: newContact.relationship,
        isEmergency: newContact.isEmergency,
        isVerified: false,
        trustLevel: 50,
        isOnline: false,
        interventionLevel: newContact.interventionLevel,
        availabilityStatus: 'online',
        batteryLevel: 100,
        distance: 0,
        isDefaultCopilot: false,
        hasAccessToSafeVault: false,
        sharedTripsCount: 0
      };
      
      setContacts([...contacts, contact]);
      setNewContact({ name: '', phone: '', relationship: '', isEmergency: false, interventionLevel: 'copilot' });
      setShowAddContact(false);
    }
  };

  const handleCallContact = (contact: Contact) => {
    window.location.href = `tel:${contact.phone}`;
  };

  const handleMessageContact = (contact: Contact) => {
    window.location.href = `sms:${contact.phone}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      {/* Header avec recherche et QR */}
      <div className="bg-slate-800/95 backdrop-blur-lg border-b border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Unité de Commandement</h1>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleQRScan}
              className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <QrCode className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddContact(true)}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filtres par niveau d'intervention */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'ultra-priority', 'vigilant-neighbor', 'legal-medical', 'copilot'].map((level) => (
            <motion.button
              key={level}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedLevel(level)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedLevel === level
                  ? level === 'all' 
                    ? 'bg-slate-600 text-white'
                    : getInterventionLevelColor(level)
                  : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {level === 'all' ? 'Tous' : getInterventionLevelLabel(level)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Paramètres de visibilité rapide */}
      <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {positionSharingEnabled ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
            <span className="text-sm">Partage de position</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleTogglePositionSharing}
            className={`w-12 h-6 rounded-full transition-colors ${
              positionSharingEnabled ? 'bg-green-600' : 'bg-slate-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              positionSharingEnabled ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </motion.button>
        </div>
      </div>

      {/* Cercle SOS - Ultra Prioritaire */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-400" />
          Cercle SOS (Ultra-Prioritaire)
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {filteredContacts
            .filter(c => c.interventionLevel === 'ultra-priority')
            .map((contact) => (
              <motion.div
                key={contact.id}
                whileHover={{ scale: 1.02 }}
                className={`border rounded-lg p-4 ${getInterventionLevelColor(contact.interventionLevel)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">{contact.name}</div>
                      <div className="text-xs text-slate-400">{contact.relationship}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getAvailabilityIcon(contact.availabilityStatus)}
                    <div className="flex items-center gap-1">
                      {contact.batteryLevel > 30 ? <Battery className="w-4 h-4 text-green-400" /> : <BatteryLow className="w-4 h-4 text-orange-400" />}
                      <span className="text-xs text-slate-400">{contact.batteryLevel}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {contact.distance < 1 ? `${(contact.distance * 1000).toFixed(0)}m` : `${contact.distance.toFixed(1)}km`}
                  </span>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSignalTest(contact.id)}
                      className="p-1 bg-orange-600 hover:bg-orange-700 rounded transition-colors"
                    >
                      <TestTube className="w-3 h-3 text-white" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCallContact(contact)}
                      className="p-1 bg-green-600 hover:bg-green-700 rounded transition-colors"
                    >
                      <Phone className="w-3 h-3 text-white" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Copilotes Favoris */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          Copilotes Favoris
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {filteredContacts
            .filter(c => c.interventionLevel === 'copilot' || c.isDefaultCopilot)
            .map((contact) => (
              <motion.div
                key={contact.id}
                whileHover={{ scale: 1.02 }}
                className={`border rounded-lg p-4 ${getInterventionLevelColor(contact.interventionLevel)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        {contact.name}
                        {contact.isDefaultCopilot && <Star className="w-3 h-3 text-yellow-400" />}
                      </div>
                      <div className="text-xs text-slate-400">{contact.relationship}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getAvailabilityIcon(contact.availabilityStatus)}
                    <div className="text-xs text-green-400">
                      {contact.sharedTripsCount} trajets
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {contact.distance < 1 ? `${(contact.distance * 1000).toFixed(0)}m` : `${contact.distance.toFixed(1)}km`}
                  </span>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSetDefaultCopilot(contact.id)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                    >
                      Par défaut
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSignalTest(contact.id)}
                      className="p-1 bg-orange-600 hover:bg-orange-700 rounded transition-colors"
                    >
                      <TestTube className="w-3 h-3 text-white" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Autres contacts */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          Autres Contacts
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {filteredContacts
            .filter(c => c.interventionLevel !== 'ultra-priority' && c.interventionLevel !== 'copilot')
            .map((contact) => (
              <motion.div
                key={contact.id}
                whileHover={{ scale: 1.02 }}
                className={`border rounded-lg p-4 ${getInterventionLevelColor(contact.interventionLevel)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">{contact.name}</div>
                      <div className="text-xs text-slate-400">{contact.relationship}</div>
                      <div className="text-xs text-blue-400">{getInterventionLevelLabel(contact.interventionLevel)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getAvailabilityIcon(contact.availabilityStatus)}
                    {contact.hasAccessToSafeVault && <Lock className="w-3 h-3 text-green-400" />}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {contact.distance < 1 ? `${(contact.distance * 1000).toFixed(0)}m` : `${contact.distance.toFixed(1)}km`}
                  </span>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSignalTest(contact.id)}
                      className="p-1 bg-orange-600 hover:bg-orange-700 rounded transition-colors"
                    >
                      <TestTube className="w-3 h-3 text-white" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCallContact(contact)}
                      className="p-1 bg-green-600 hover:bg-green-700 rounded transition-colors"
                    >
                      <Phone className="w-3 h-3 text-white" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Safe Vault - Documents */}
      <div className="p-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowSafeVault(!showSafeVault)}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-purple-400" />
            <div className="text-left">
              <div className="font-medium text-white">Safe Vault</div>
              <div className="text-xs text-slate-400">{safeVaultDocuments.length} documents sécurisés</div>
            </div>
          </div>
          {showSafeVault ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
        </motion.button>

        <AnimatePresence>
          {showSafeVault && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2"
            >
              {safeVaultDocuments.map((doc) => (
                <motion.div
                  key={doc.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {doc.type === 'id-card' && <FileText className="w-4 h-4 text-blue-400" />}
                      {doc.type === 'passport' && <FileText className="w-4 h-4 text-purple-400" />}
                      {doc.type === 'medical-record' && <Heart className="w-4 h-4 text-red-400" />}
                      <div>
                        <div className="text-sm font-medium text-white">{doc.name}</div>
                        <div className="text-xs text-slate-400">Partagé avec {doc.sharedWith.length} contacts</div>
                      </div>
                    </div>
                    <Lock className="w-3 h-3 text-green-400" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showAddContact && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Nouveau Contact</h2>
              <button
                onClick={() => setShowAddContact(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  placeholder="Nom du contact"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  placeholder="+243XXXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Relation
                </label>
                <input
                  type="text"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  placeholder="Famille, Ami, Médecin, etc."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="emergency"
                  checked={newContact.isEmergency}
                  onChange={(e) => setNewContact({ ...newContact, isEmergency: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="emergency" className="text-sm text-slate-300">
                  Contact d'urgence
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddContact(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-3 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddContact}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-medium transition-colors"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

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
                {icons[item.icon]}
                <span className="text-xs text-slate-400">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ContactsScreen;
