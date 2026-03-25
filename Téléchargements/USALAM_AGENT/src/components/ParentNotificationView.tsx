import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { PositionData } from '../types/copilot';

interface ParentNotificationViewProps {
  alertId: string;
  childName: string;
  copilotName: string;
  currentPosition: PositionData | null;
  onClose: () => void;
}

const ParentNotificationView: React.FC<ParentNotificationViewProps> = ({ 
  alertId, 
  childName, 
  copilotName, 
  currentPosition, 
  onClose 
}) => {
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollowClick = () => {
    // Simuler l'envoi de notification Firebase
    console.log(`Notification envoyée aux parents pour suivre ${childName}`);
    setIsFollowing(true);
    
    // Simuler l'ouverture de la carte de suivi
    setTimeout(() => {
      window.open(`/follow/${alertId}`, '_blank');
    }, 1000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 bg-slate-900/95 backdrop-blur-lg flex items-center justify-center z-50"
      >
        <div className="bg-slate-800 rounded-lg p-6 max-w-sm mx-4 border border-slate-700">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Alerte Copilote Activée
            </h3>
            <p className="text-slate-300 text-sm">
              {childName} a activé le mode Copilote avec {copilotName}
            </p>
          </div>

          {currentPosition && (
            <div className="bg-blue-600/20 border border-blue-600/50 rounded-lg p-3 mb-4">
              <div className="text-sm text-blue-400 font-medium mb-1">Position Actuelle</div>
              <div className="text-xs text-slate-300">
                Lat: {currentPosition.lat.toFixed(6)}<br />
                Lng: {currentPosition.lng.toFixed(6)}<br />
                Précision: ±{currentPosition.accuracy.toFixed(0)}m
              </div>
            </div>
          )}

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleFollowClick}
              disabled={isFollowing}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                isFollowing 
                  ? 'bg-green-600 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isFollowing ? '✓ Suivi en cours' : '📍 Suivre le trajet'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
            >
              Fermer
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ParentNotificationView;
