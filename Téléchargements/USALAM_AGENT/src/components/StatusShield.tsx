import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

interface StatusShieldProps {
  isSharingPosition: boolean;
  copilotName?: string;
  parentNames?: string[];
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
}

const StatusShield: React.FC<StatusShieldProps> = ({ 
  isSharingPosition, 
  copilotName, 
  parentNames = ['Papa', 'Maman'], 
  connectionStatus 
}) => {
  return (
    <div className="absolute top-4 left-4 z-40">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-slate-800/95 backdrop-blur-lg rounded-lg border px-4 py-3 flex items-center gap-3 ${
          isSharingPosition && connectionStatus === 'connected' 
            ? 'border-green-600/50' 
            : 'border-orange-600/50'
        }`}
      >
        {/* Icône de sécurité */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isSharingPosition && connectionStatus === 'connected' 
            ? 'bg-green-600' 
            : 'bg-orange-600'
        }`}>
          {isSharingPosition && connectionStatus === 'connected' ? (
            <Shield className="w-4 h-4 text-white" />
          ) : (
            <Shield className="w-4 h-4 text-white" />
          )}
        </div>

        {/* Texte de statut */}
        <div className="text-sm">
          <div className={`font-medium ${
            isSharingPosition && connectionStatus === 'connected' 
              ? 'text-green-400' 
              : 'text-orange-400'
          }`}>
            {isSharingPosition && connectionStatus === 'connected' 
              ? '🔒 Position sécurisée' 
              : '⚠️ Position non partagée'
            }
          </div>
          <div className="text-slate-400 text-xs mt-1">
            {isSharingPosition && connectionStatus === 'connected' 
              ? `Partagée avec ${parentNames.join(', ')}`
              : 'Activez le partage de position'
            }
          </div>
          {copilotName && connectionStatus === 'connected' && (
            <div className="text-green-400 text-xs mt-1">
              🎯 Guidé par {copilotName}
            </div>
          )}
        </div>

        {/* Indicateur de pulsation */}
        {isSharingPosition && connectionStatus === 'connected' && (
          <div className="w-3 h-3 bg-green-400 rounded-full animate-ping" />
        )}

        {/* Bouton d'action rapide */}
        {!isSharingPosition && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-medium"
          >
            Activer
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};

export default StatusShield;
