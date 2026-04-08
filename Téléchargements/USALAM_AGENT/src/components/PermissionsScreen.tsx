import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Mic, RefreshCw, Bell, Info, ShieldCheck } from 'lucide-react';

interface PermissionsScreenProps {
  onBack: () => void;
  onGrantAll?: () => void;
}

const PermissionsScreen: React.FC<PermissionsScreenProps> = ({ onBack, onGrantAll }) => {
  const permissions = [
    {
      id: 'mic',
      title: 'Microphone',
      description: 'Pour enregistrer les sons et activer la fonction d\'alerte lorsque des applaudissements sont détectés.',
      icon: <Mic className="w-6 h-6 text-green-500" />
    },
    {
      id: 'bg',
      title: 'Exécution en arrière-plan',
      description: 'Pour fonctionner en arrière-plan et activer la fonction d\'alerte lorsque des applaudissements sont détectés.',
      icon: <RefreshCw className="w-6 h-6 text-green-500" />
    },
    {
      id: 'notif',
      title: 'Poster des notifications',
      description: 'Pour aider l\'application à fonctionner de manière stable en arrière-plan.',
      icon: <Bell className="w-6 h-6 text-green-500" />
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <div className="p-4 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-slate-800" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <h3 className="text-green-600 font-bold text-lg">Question :</h3>
            <p className="text-slate-800 text-xl font-medium leading-relaxed">
              Quelles autorisations sont nécessaires pour cette application ?
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-green-600 font-bold text-lg">Réponse :</h3>
            <p className="text-slate-700 text-lg">
              Cette application nécessite les autorisations suivantes :
            </p>
          </div>

          {/* Placeholder Ad (Matches Image Style) */}
          <div className="bg-white border rounded-3xl p-4 shadow-sm border-slate-100 flex items-center gap-4 relative overflow-hidden">
             <div className="absolute top-0 left-0 bg-yellow-500 text-[10px] text-white px-2 py-0.5 rounded-br-lg font-bold">Ad</div>
             <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
               <ShieldCheck className="w-8 h-8 text-blue-500" />
             </div>
             <div className="flex-1">
               <h4 className="font-bold text-slate-800">Mobile Number Locator</h4>
               <p className="text-xs text-slate-400 line-clamp-2">Mobile Number Locator helps you understand unknown numbers...</p>
             </div>
             <button className="bg-green-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg shadow-green-200">
               INSTALL
             </button>
          </div>

          {/* Permissions List */}
          <div className="space-y-8 pt-4">
            {permissions.map((perm, index) => (
              <motion.div 
                key={perm.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0 pt-1">
                  <span className="text-slate-400 font-bold text-lg">{index + 1}.</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-green-600 font-bold text-lg">{perm.title} :</h4>
                  <p className="text-slate-600 leading-relaxed text-lg">
                    {perm.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="pt-6">
            <p className="text-slate-500 text-base italic">
              Veuillez noter que ces autorisations sont essentielles pour assurer votre sécurité en temps réel.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer Grant Button */}
      <div className="p-6 border-t border-slate-100 bg-white/80 backdrop-blur-md sticky bottom-0">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGrantAll}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-green-200 transition-all flex items-center justify-center gap-2"
        >
          Accorder les autorisations
        </motion.button>
      </div>
    </div>
  );
};

export default PermissionsScreen;
