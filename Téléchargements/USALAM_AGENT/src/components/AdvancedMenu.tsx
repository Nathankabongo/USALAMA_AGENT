import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Map, 
  Heart, 
  Lock, 
  Camera, 
  Activity,
  X,
  Home
} from 'lucide-react';

interface AdvancedMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: 'home' | 'enhanced-home' | 'contacts' | 'alerts' | 'profile' | 'guard' | 'evidence' | 'survival' | 'firstaid' | 'snig' | 'enhanced-map') => void;
}

const AdvancedMenu = ({ isOpen, onClose, onNavigate }: AdvancedMenuProps) => {
  const menuItems = [
    {
      id: 'enhanced-home',
      title: '🏠 Accueil Amélioré',
      description: 'Actualités, réseaux sociaux, alertes',
      icon: <Home className="w-6 h-6 text-purple-400" />,
      color: 'bg-purple-600/20 border-purple-800/50'
    },
    {
      id: 'guard',
      title: '🛡️ Garde Numérique',
      description: 'Mode accompagnement avec suivi de trajet',
      icon: <Shield className="w-6 h-6 text-blue-400" />,
      color: 'bg-blue-600/20 border-blue-800/50'
    },
    {
      id: 'evidence',
      title: '⚖️ Coffre-Fort de Preuves',
      description: 'Stockage sécurisé des preuves juridiques',
      icon: <Lock className="w-6 h-6 text-purple-400" />,
      color: 'bg-purple-600/20 border-purple-800/50'
    },
    {
      id: 'survival',
      title: '🗺️ Carte de Survie',
      description: 'Points sûrs et vitalité des rues',
      icon: <Map className="w-6 h-6 text-green-400" />,
      color: 'bg-green-600/20 border-green-800/50'
    },
    {
      id: 'firstaid',
      title: '🏥️ Premiers Secours',
      description: 'Guides médicaux offline',
      icon: <Heart className="w-6 h-6 text-red-400" />,
      color: 'bg-red-600/20 border-red-800/50'
    },
    {
      id: 'snig',
      title: '🏛️ Intégration SNIG',
      description: 'Liaison directe avec les autorités',
      icon: <Shield className="w-6 h-6 text-yellow-400" />,
      color: 'bg-yellow-600/20 border-yellow-800/50'
    },
    {
      id: 'enhanced-map',
      title: '🗺️ Carte Sécurité',
      description: 'Urgences, trafic, météo, hôpitaux',
      icon: <Map className="w-6 h-6 text-cyan-400" />,
      color: 'bg-cyan-600/20 border-cyan-800/50'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-700 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Fonctionnalités Avancées</h2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white text-2xl"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onNavigate(item.id as any);
                    onClose();
                  }}
                  className={`w-full ${item.color} backdrop-blur-sm rounded-lg border p-4 text-left transition-all hover:scale-[1.02]`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-300">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-400">
                USALAMA Agent - Protection communautaire intelligente
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdvancedMenu;
