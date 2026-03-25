import React from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { WebRTCConnection } from '../types/copilot';

interface VoiceControllerProps {
  webrtcConnection: WebRTCConnection;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
}

const VoiceController: React.FC<VoiceControllerProps> = ({ 
  webrtcConnection, 
  onToggleAudio, 
  onToggleVideo, 
  connectionStatus 
}) => {
  return (
    <div className="bg-slate-800/50 rounded-lg p-3">
      <div className="text-xs font-medium text-slate-400 mb-3">Contrôle Audio</div>
      
      {/* Statut de connexion */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-300">Connexion:</span>
        <div className={`flex items-center gap-1 ${
          connectionStatus === 'connected' ? 'text-green-400' :
          connectionStatus === 'connecting' ? 'text-yellow-400' :
          'text-red-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-400' :
            connectionStatus === 'connecting' ? 'bg-yellow-400' :
            'bg-red-400'
          } ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`} />
          <span className="text-xs">
            {connectionStatus === 'connected' ? 'Connecté' :
             connectionStatus === 'connecting' ? 'Connexion...' :
             'Déconnecté'}
          </span>
        </div>
      </div>

      {/* Contrôles audio/vidéo */}
      <div className="grid grid-cols-2 gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleAudio}
          disabled={connectionStatus !== 'connected'}
          className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-colors ${
            webrtcConnection.isAudioEnabled 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-slate-700 hover:bg-slate-600'
          } ${connectionStatus !== 'connected' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {webrtcConnection.isAudioEnabled ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-slate-400" />}
          <span className="text-xs">Micro</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleVideo}
          disabled={connectionStatus !== 'connected'}
          className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-colors ${
            webrtcConnection.isVideoEnabled 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-slate-700 hover:bg-slate-600'
          } ${connectionStatus !== 'connected' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {webrtcConnection.isVideoEnabled ? <Video className="w-4 h-4 text-white" /> : <VideoOff className="w-4 h-4 text-slate-400" />}
          <span className="text-xs">Vidéo</span>
        </motion.button>
      </div>

      {/* Volume */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400">Volume</span>
          <span className="text-xs text-slate-400">80%</span>
        </div>
        <div className="w-full h-2 bg-slate-700 rounded-full">
          <div className="w-4/5 h-2 bg-blue-500 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default VoiceController;
