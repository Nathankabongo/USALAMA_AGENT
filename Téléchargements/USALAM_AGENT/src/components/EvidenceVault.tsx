import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Camera, 
  Mic, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Upload,
  Download,
  FileText,
  Image,
  Video,
  Activity,
  Wifi,
  WifiOff,
  Server,
  Eye,
  X,
  HashIcon,
  Map,
  Bell,
  User,
  Phone
} from 'lucide-react';

interface EvidenceVaultProps {
  onNavigate?: (screen: 'home' | 'enhanced-home' | 'contacts' | 'alerts' | 'profile' | 'guard' | 'evidence' | 'survival' | 'firstaid' | 'snig' | 'enhanced-map' | 'sos') => void;
}

interface Evidence {
  id: string;
  type: 'photo' | 'audio' | 'video' | 'location';
  timestamp: Date;
  hash: string;
  isLocked: boolean;
  isUploaded: boolean;
  url?: string;
  size: number;
  description: string;
}

const EvidenceVault = ({ onNavigate }: EvidenceVaultProps) => {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [networkStatus, setNetworkStatus] = useState('online');
  const [streamingActive, setStreamingActive] = useState(false);

  // Simuler des preuves existantes
  useEffect(() => {
    const mockEvidence: Evidence[] = [
      {
        id: '1',
        type: 'audio',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        hash: '0x7f8a3b9c8e4d5a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2',
        isLocked: true,
        isUploaded: true,
        size: 2048576, // 2MB
        description: 'Enregistrement audio pendant SOS'
      },
      {
        id: '2',
        type: 'photo',
        timestamp: new Date(Date.now() - 3 * 60 * 1000),
        hash: '0x9c8e7d6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1',
        isLocked: true,
        isUploaded: true,
        size: 3145728, // 3MB
        description: 'Photo de la scène d\'incident'
      }
    ];
    setEvidence(mockEvidence);
  }, []);

  // Monitoring réseau pour streaming automatique
  useEffect(() => {
    const checkNetworkStatus = () => {
      setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    };
    
    window.addEventListener('online', checkNetworkStatus);
    window.addEventListener('offline', checkNetworkStatus);
    
    return () => {
      window.removeEventListener('online', checkNetworkStatus);
      window.removeEventListener('offline', checkNetworkStatus);
    };
  }, []);

  // Streaming automatique des preuves
  const startEvidenceStreaming = () => {
    setStreamingActive(true);
    
    // Simuler streaming en temps réel
    const streamInterval = setInterval(() => {
      if (networkStatus === 'online') {
        // Envoyer les preuves au serveur
        uploadEvidenceToCloud();
      } else {
        // Stocker localement en attente de connexion
        console.log('📴 Stockage local des preuves en attente');
      }
    }, 5000);
    
    return () => clearInterval(streamInterval);
  };

  const generateHash = (data: any): string => {
    // Simuler génération de hash SHA-256
    return '0x' + Math.random().toString(16).substring(2, 66);
  };

  const capturePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // Capturer photo après 1 seconde
      setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const newEvidence: Evidence = {
              id: Date.now().toString(),
              type: 'photo',
              timestamp: new Date(),
              hash: generateHash(blob),
              isLocked: true,
              isUploaded: false,
              size: blob.size,
              description: 'Photo capturée automatiquement',
              url: URL.createObjectURL(blob)
            };
            
            setEvidence(prev => [newEvidence, ...prev]);
            
            // Streaming immédiat si disponible
            if (networkStatus === 'online') {
              uploadEvidenceToServer(newEvidence);
            }
          }
        }, 'image/jpeg', 0.9);
        
        stream.getTracks().forEach(track => track.stop());
      }, 1000);
      
    } catch (error) {
      console.error('Erreur capture photo:', error);
    }
  };

  const startAudioRecording = () => {
    setIsRecording(true);
    
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          chunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const newEvidence: Evidence = {
            id: Date.now().toString(),
            type: 'audio',
            timestamp: new Date(),
            hash: generateHash(blob),
            isLocked: true,
            isUploaded: false,
            size: blob.size,
            description: 'Enregistrement audio SOS',
            url: URL.createObjectURL(blob)
          };
          
          setEvidence(prev => [newEvidence, ...prev]);
          
          if (networkStatus === 'online') {
            uploadEvidenceToServer(newEvidence);
          }
        };
        
        // Enregistrer pendant 30 secondes max
        mediaRecorder.start();
        setTimeout(() => {
          mediaRecorder.stop();
          setIsRecording(false);
        }, 30000);
      })
      .catch(error => {
        console.error('Erreur enregistrement audio:', error);
        setIsRecording(false);
      });
  };

  const uploadEvidenceToServer = async (evidenceItem: Evidence) => {
    setUploadProgress(0);
    
    // Simuler upload avec barre de progression
    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(uploadInterval);
          
          // Marquer comme uploadé
          setEvidence(prev => prev.map(item => 
            item.id === evidenceItem.id 
              ? { ...item, isUploaded: true }
              : item
          ));
          
          return 100;
        }
        return newProgress;
      });
    }, 200);
  };

  const uploadEvidenceToCloud = () => {
    // Uploader toutes les preuves non uploadées
    const unuploadedEvidence = evidence.filter(item => !item.isUploaded);
    unuploadedEvidence.forEach(item => {
      uploadEvidenceToServer(item);
    });
  };

  const verifyEvidenceIntegrity = (evidenceItem: Evidence) => {
    // Simuler vérification du hash
    const isValid = evidenceItem.hash.startsWith('0x7f') || evidenceItem.hash.startsWith('0x9c');
    return isValid;
  };

  const downloadEvidence = (evidenceItem: Evidence) => {
    if (evidenceItem.url) {
      const a = document.createElement('a');
      a.href = evidenceItem.url;
      a.download = `evidence_${evidenceItem.id}.${evidenceItem.type}`;
      a.click();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Camera className="w-5 h-5" />;
      case 'audio': return <Mic className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      {/* Header */}
      <div className="bg-slate-800/95 backdrop-blur-lg border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-bold">Coffre-Fort de Preuves</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {networkStatus === 'online' ? (
                <>
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">Streaming actif</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-orange-400">Mode offline</span>
                </>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate?.('home')}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Actions Rapides */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={capturePhoto}
            disabled={isRecording}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 p-4 rounded-lg transition-colors"
          >
            <Camera className="w-6 h-6 mx-auto mb-2" />
            <div className="text-sm font-medium">📸 Capturer Photo</div>
            <div className="text-xs text-blue-200">Preuve immédiate</div>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startAudioRecording}
            disabled={isRecording}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 p-4 rounded-lg transition-colors"
          >
            <Mic className="w-6 h-6 mx-auto mb-2" />
            <div className="text-sm font-medium">
              {isRecording ? '🔴 Enregistrement...' : '🎙️ Enregistrer Audio'}
            </div>
            <div className="text-xs text-red-200">
              {isRecording ? '30 secondes max' : 'Preuve sonore'}
            </div>
          </motion.button>
        </motion.div>

        {/* Upload Progress */}
        <AnimatePresence>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-purple-900/20 backdrop-blur-sm rounded-lg border border-purple-800/50 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-400">Upload vers serveur sécurisé</span>
                <span className="text-sm text-purple-400">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${uploadProgress}%` }}
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Liste des Preuves */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-400" />
            Journal des Preuves Inaltérable
          </h3>
          
          <div className="space-y-3">
            {evidence.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      item.type === 'photo' ? 'bg-blue-600/20' :
                      item.type === 'audio' ? 'bg-red-600/20' :
                      'bg-slate-600/20'
                    }`}>
                      {getEvidenceIcon(item.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{item.description}</span>
                        {item.isLocked && (
                          <Lock className="w-3 h-3 text-purple-400" />
                        )}
                        {item.isUploaded && (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.timestamp.toLocaleTimeString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {formatFileSize(item.size)}
                        </div>
                        <div className="flex items-center gap-1">
                          <HashIcon className="w-3 h-3" />
                          <span className="font-mono text-xs">
                            {item.hash.substring(0, 10)}...
                          </span>
                        </div>
                      </div>
                      
                      {/* Vérification d'intégrité */}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-slate-400">Intégrité:</span>
                        {verifyEvidenceIntegrity(item) ? (
                          <div className="flex items-center gap-1 text-green-400">
                            <CheckCircle className="w-3 h-3" />
                            <span className="text-xs">Valide</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-400">
                            <AlertTriangle className="w-3 h-3" />
                            <span className="text-xs">Corrompu</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.url && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => downloadEvidence(item)}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Statistiques */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-4"
        >
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{evidence.length}</div>
            <div className="text-xs text-slate-400">Total preuves</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">
              {evidence.filter(e => e.isUploaded).length}
            </div>
            <div className="text-xs text-slate-400">Uploadées</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {evidence.filter(e => e.isLocked).length}
            </div>
            <div className="text-xs text-slate-400">Verrouillées</div>
          </div>
        </motion.div>
      </div>

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

export default EvidenceVault;
