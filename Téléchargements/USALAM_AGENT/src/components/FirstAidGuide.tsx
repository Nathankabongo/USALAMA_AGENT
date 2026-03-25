import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Phone, 
  Clock, 
  AlertTriangle, 
  Play, 
  Pause, 
  ChevronRight, 
  Info,
  Map,
  Bell,
  User,
  Shield,
  Users,
  X,
  Book,
  Download,
  Volume2
} from 'lucide-react';

interface FirstAidGuideProps {
  onNavigate?: (screen: 'home' | 'enhanced-home' | 'contacts' | 'alerts' | 'profile' | 'guard' | 'evidence' | 'survival' | 'firstaid' | 'snig' | 'enhanced-map' | 'sos') => void;
}

interface FirstAidStep {
  id: string;
  title: string;
  description: string;
  image?: string;
  warnings?: string[];
  duration: number; // en secondes
  isCritical: boolean;
}

interface FirstAidGuide {
  id: string;
  title: string;
  category: 'bleeding' | 'unconscious' | 'burn' | 'fracture' | 'choking' | 'cardiac';
  icon: string;
  description: string;
  steps: FirstAidStep[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  language: 'fr' | 'lingala';
}

const FirstAidGuide = ({ onNavigate }: FirstAidGuideProps) => {
  const [selectedGuide, setSelectedGuide] = useState<FirstAidGuide | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepTimer, setStepTimer] = useState(0);
  const [language, setLanguage] = useState<'fr' | 'lingala'>('fr');

  // Guides de premiers secours adaptés au contexte de Kinshasa
  const firstAidGuides: FirstAidGuide[] = [
    {
      id: '1',
      title: 'Arrêt Cardiaque',
      category: 'cardiac',
      icon: '❤️',
      description: 'Réanimation cardio-pulmonaire (RCP)',
      urgency: 'critical',
      language: 'fr',
      steps: [
        {
          id: '1',
          title: 'Vérifier la conscience',
          description: 'Secouez doucement les épaules et demandez "Vous m\'entendez ?"',
          warnings: ['Ne bougez pas la tête si blessure suspectée'],
          duration: 10,
          isCritical: true
        },
        {
          id: '2',
          title: 'Appeler les secours',
          description: 'Composez le 1515 (SAMU) ou 117 (Police)',
          warnings: ['Donnez votre localisation précise'],
          duration: 30,
          isCritical: true
        },
        {
          id: '3',
          title: 'Positionner les mains',
          description: 'Placez le talon d\'une main au centre de la poitrine, l\'autre main par-dessus',
          warnings: ['Doigts croisés', 'Bras tendus', 'Épaules au-dessus des mains'],
          duration: 15,
          isCritical: true
        },
        {
          id: '4',
          title: 'Compression thoracique',
          description: 'Appuyez fort et vite (100-120 compressions/minute)',
          warnings: ['Profondeur: 5-6 cm', 'Relâchement complet entre compressions'],
          duration: 120,
          isCritical: true
        }
      ]
    },
    {
      id: '2',
      title: 'Hémorragie Sévère',
      category: 'bleeding',
      icon: '🩸',
      description: 'Contrôle des saignements importants',
      urgency: 'critical',
      language: 'fr',
      steps: [
        {
          id: '1',
          title: 'Protégez-vous',
          description: 'Mettez des gants si disponibles. Évitez le contact direct avec le sang.',
          warnings: ['Risque de transmission de maladies'],
          duration: 10,
          isCritical: true
        },
        {
          id: '2',
          title: 'Compression directe',
          description: 'Appuyez fermement sur la plaie avec un tissu propre',
          warnings: ['Maintenez la pression sans relâcher'],
          duration: 60,
          isCritical: true
        },
        {
          id: '3',
          title: 'Surélever le membre',
          description: 'Si possible, surélevez la zone blessée au-dessus du cœur',
          warnings: ['Ne pas surélever en cas de fracture suspectée'],
          duration: 15,
          isCritical: false
        },
        {
          id: '4',
          title: 'Garrot (dernier recours)',
          description: 'Utilisez un garrot seulement si la vie est en danger',
          warnings: ['Notez l\'heure de pose', 'Desserrez toutes les 15 minutes'],
          duration: 30,
          isCritical: true
        }
      ]
    },
    {
      id: '3',
      title: 'Personne Inconsciente',
      category: 'unconscious',
      icon: '😵',
      description: 'Position latérale de sécurité (PLS)',
      urgency: 'high',
      language: 'fr',
      steps: [
        {
          id: '1',
          title: 'Vérifier la respiration',
          description: 'Regardez si la poitrine se lève, écoutez les sons, sentez l\'air',
          warnings: ['Pendant 10 secondes maximum'],
          duration: 10,
          isCritical: true
        },
        {
          id: '2',
          title: 'Libérer les voies aériennes',
          description: 'Basculez doucement la tête en arrière, soulevez le menton',
          warnings: ['Ne pas faire si traumatisme cervical suspecté'],
          duration: 15,
          isCritical: true
        },
        {
          id: '3',
          title: 'Position latérale',
          description: 'Placez la personne sur le côté, jambe supérieure fléchie',
          warnings: ['Maintenez la tête alignée avec le corps'],
          duration: 20,
          isCritical: false
        }
      ]
    },
    {
      id: '4',
      title: 'Brûlures',
      category: 'burn',
      icon: '🔥',
      description: 'Traitement des brûlures thermiques',
      urgency: 'medium',
      language: 'fr',
      steps: [
        {
          id: '1',
          title: 'Refroidir la brûlure',
          description: 'Faites couler de l\'eau froide (pas glacée) pendant 15 minutes',
          warnings: ['Ne jamais utiliser de glace', 'Ne pas percer les cloques'],
          duration: 900, // 15 minutes
          isCritical: false
        },
        {
          id: '2',
          title: 'Retirer les vêtements',
          description: 'Enlevez les vêtements près de la brûlure (sauf collés à la peau)',
          warnings: ['Ne pas arracher les tissus collés'],
          duration: 30,
          isCritical: false
        },
        {
          id: '3',
          title: 'Protéger la zone',
          description: 'Couvrez d\'un pansement stérile ou d\'un tissu propre',
          warnings: ['Ne pas utiliser de coton qui laisse des fibres'],
          duration: 15,
          isCritical: false
        }
      ]
    }
  ];

  // Guides en Lingala
  const lingalaGuides: FirstAidGuide[] = [
    {
      id: '1-lingala',
      title: 'Motema Mpasi',
      category: 'cardiac',
      icon: '❤️',
      description: 'Botemi motema na kasi',
      urgency: 'critical',
      language: 'lingala',
      steps: [
        {
          id: '1',
          title: 'Tala ndenge',
          description: 'Kangaka maboko na loba "Oyebi biso ?"',
          warnings: ['Te tikala likolo likolo ya mutu soki ozali na bomoi'],
          duration: 10,
          isCritical: true
        },
        {
          id: '2',
          title: 'Binga ba secours',
          description: 'Binga 1515 (SAMU) to 117 (Police)',
          warnings: ['Salisa biso esika ozali'],
          duration: 30,
          isCritical: true
        },
        {
          id: '3',
          title: 'Banda mikolo',
          description: 'Pona mikolo na liboke ya mpusu',
          warnings: ['Mikolo misangisi', 'Bima elongobeli', 'Mapata ya likolo ya mikolo'],
          duration: 15,
          isCritical: true
        }
      ]
    }
  ];

  const currentGuides = language === 'fr' ? firstAidGuides : lingalaGuides;

  useEffect(() => {
    if (isPlaying && selectedGuide) {
      const interval = setInterval(() => {
        setStepTimer(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isPlaying, selectedGuide]);

  const startGuide = (guide: FirstAidGuide) => {
    setSelectedGuide(guide);
    setCurrentStep(0);
    setStepTimer(0);
    setIsPlaying(true);
  };

  const nextStep = () => {
    if (selectedGuide && currentStep < selectedGuide.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setStepTimer(0);
    } else {
      setIsPlaying(false);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setStepTimer(0);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-400 bg-red-600/20';
      case 'high': return 'text-orange-400 bg-orange-600/20';
      case 'medium': return 'text-yellow-400 bg-yellow-600/20';
      case 'low': return 'text-green-400 bg-green-600/20';
      default: return 'text-slate-400 bg-slate-600/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cardiac': return <Heart className="w-6 h-6" />;
      case 'bleeding': return <AlertTriangle className="w-6 h-6" />;
      case 'unconscious': return <Users className="w-6 h-6" />;
      case 'burn': return <Shield className="w-6 h-6" />;
      case 'fracture': return <AlertTriangle className="w-6 h-6" />;
      case 'choking': return <AlertTriangle className="w-6 h-6" />;
      default: return <Heart className="w-6 h-6" />;
    }
  };

  const downloadGuide = (guide: FirstAidGuide) => {
    const content = `
${guide.title}
${guide.description}

Étapes:
${guide.steps.map((step, index) => `
${index + 1}. ${step.title}
${step.description}
${step.warnings ? `⚠️ ${step.warnings.join(', ')}` : ''}
`).join('\n')}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guide_secours_${guide.title.replace(/\s+/g, '_')}.txt`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      {/* Header */}
      <div className="bg-slate-800/95 backdrop-blur-lg border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-red-400" />
            <h1 className="text-xl font-bold">Premiers Secours</h1>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLanguage(language === 'fr' ? 'lingala' : 'fr')}
              className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {language === 'fr' ? '🇨🇩 FR' : '🇨🇩 LINGALA'}
            </motion.button>
            
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

      <div className="p-4">
        {!selectedGuide ? (
          <div className="space-y-4">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <h2 className="text-2xl font-bold mb-2">Guides de Premiers Secours</h2>
              <p className="text-slate-400">
                Instructions détaillées accessibles hors connexion - {language === 'fr' ? 'Français' : 'Lingala'}
              </p>
            </motion.div>

            {/* Liste des guides */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentGuides.map((guide, index) => (
                <motion.div
                  key={guide.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
                  onClick={() => startGuide(guide)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{guide.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">{guide.title}</h3>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(guide.urgency)}`}>
                          {guide.urgency === 'critical' ? 'CRITIQUE' :
                           guide.urgency === 'high' ? 'URGENT' :
                           guide.urgency === 'medium' ? 'MOYEN' : 'FAIBLE'}
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-400 mb-3">{guide.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Book className="w-3 h-3" />
                          <span>{guide.steps.length} étapes</span>
                          <Clock className="w-3 h-3 ml-2" />
                          <span>{guide.steps.reduce((acc, step) => acc + step.duration, 0)}s</span>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadGuide(guide);
                          }}
                          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          /* Vue détaillée du guide */
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-4xl mx-auto"
          >
            {/* Header du guide */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{selectedGuide.icon}</div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedGuide.title}</h2>
                    <p className="text-slate-400">{selectedGuide.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedGuide(null)}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Barre de progression */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">
                  Étape {currentStep + 1} / {selectedGuide.steps.length}
                </span>
                <span className="text-sm font-medium">
                  {Math.floor(stepTimer / 60)}:{(stepTimer % 60).toString().padStart(2, '0')}
                </span>
              </div>
              
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${((currentStep + 1) / selectedGuide.steps.length) * 100}%` }}
                  className="h-full bg-gradient-to-r from-red-500 to-red-600"
                />
              </div>
              
              <div className="flex items-center gap-2 mt-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={togglePlayPause}
                  className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={previousStep}
                  disabled={currentStep === 0}
                  className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextStep}
                  disabled={currentStep === selectedGuide.steps.length - 1}
                  className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
                
                <div className="flex-1" />
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => downloadGuide(selectedGuide)}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  <Download className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Étape actuelle */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${
                  selectedGuide.steps[currentStep].isCritical ? 'bg-red-600/20' : 'bg-blue-600/20'
                }`}>
                  {getCategoryIcon(selectedGuide.category)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xl font-bold">
                      Étape {currentStep + 1}: {selectedGuide.steps[currentStep].title}
                    </h3>
                    {selectedGuide.steps[currentStep].isCritical && (
                      <div className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs font-medium">
                        CRITIQUE
                      </div>
                    )}
                  </div>
                  
                  <p className="text-lg text-slate-300 mb-4">
                    {selectedGuide.steps[currentStep].description}
                  </p>
                  
                  {/* Avertissements */}
                  {selectedGuide.steps[currentStep].warnings && (
                    <div className="bg-orange-900/20 border border-orange-800/50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-orange-400" />
                        <span className="font-semibold text-orange-400">⚠️ Avertissements</span>
                      </div>
                      <ul className="space-y-1">
                        {selectedGuide.steps[currentStep].warnings?.map((warning, index) => (
                          <li key={index} className="flex items-start gap-2 text-orange-300">
                            <span className="text-orange-400">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Timer de l'étape */}
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Durée recommandée: {selectedGuide.steps[currentStep].duration}s</span>
                    </div>
                    {isPlaying && (
                      <div className="flex items-center gap-1">
                        <Volume2 className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">En cours</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
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

export default FirstAidGuide;
