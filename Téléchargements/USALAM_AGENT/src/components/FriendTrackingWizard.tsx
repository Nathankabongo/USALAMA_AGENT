import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Search, QrCode, UserPlus, Shield, 
  MapPin, CheckCircle2, MessageSquare, Share2, Copy 
} from 'lucide-react';
import { friendService, Friend } from '../services/friendService';

interface FriendTrackingWizardProps {
  onBack: () => void;
  onComplete: (friend: Friend) => void;
}

const FriendTrackingWizard: React.FC<FriendTrackingWizardProps> = ({ onBack, onComplete }) => {
  const [step, setStep] = useState(1);
  const [code, setCode] = useState('');
  const [foundFriend, setFoundFriend] = useState<Friend | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleNext = () => setStep(step + 1);
  
  const handleFindFriend = async () => {
    setIsSearching(true);
    // Simulation de recherche
    setTimeout(async () => {
      const friend = await friendService.addFriendByCode(code);
      if (friend) {
        setFoundFriend(friend);
        setStep(3);
      } else {
        alert('Code invalide. Veuillez réessayer.');
      }
      setIsSearching(false);
    }, 1500);
  };

  const renderStep1 = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="text-center space-y-4">
        <h3 className="text-green-600 font-bold text-xl">Étape 1/3</h3>
        <p className="text-slate-800 text-lg font-medium leading-relaxed px-4">
          Demandez à votre ami de vous envoyer son code ou QR
        </p>
      </div>

      {/* Illustration Chat (Matches Image 4) */}
      <div className="max-w-xs mx-auto bg-slate-50 rounded-[40px] p-4 border-8 border-slate-200 shadow-2xl relative">
        <div className="bg-blue-500 text-white rounded-2xl rounded-tr-none p-3 ml-8 text-sm shadow-sm">
          Send me your location code 😉
        </div>
        <div className="mt-4 bg-white border border-slate-100 rounded-2xl rounded-tl-none p-3 mr-8 text-xs font-mono text-blue-600 shadow-sm flex items-center justify-between">
          <span>{friendService.getUserCode().toLowerCase()}</span>
          <Copy className="w-3 h-3 text-slate-300" />
        </div>
        <div className="mt-8 flex justify-end">
           <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">OK</div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3">
        <InfoIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          Rappel amical : Les autres doivent télécharger l'application pour l'utiliser
        </p>
      </div>

      <button
        onClick={handleNext}
        className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-green-200"
      >
        Suivant
      </button>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="text-center space-y-4">
        <h3 className="text-green-600 font-bold text-xl">Étape 2/3</h3>
        <p className="text-slate-800 text-lg font-medium leading-relaxed px-4">
          Entrez le code de votre ami et confirmez le partage de localisation
        </p>
      </div>

      {/* Tabs placeholder from Image 3 */}
      <div className="flex bg-slate-100 p-1 rounded-2xl">
        <button className="flex-1 bg-white py-3 rounded-xl shadow-sm text-green-600 font-bold text-sm flex items-center justify-center gap-2">
           Enter Code
        </button>
        <button className="flex-1 py-3 text-slate-400 font-medium text-sm flex items-center justify-center gap-2">
           <QrCode className="w-4 h-4" /> Scan QR
        </button>
      </div>

      {/* Illustration Map from Image 3 */}
      <div className="flex justify-center -my-4">
        <div className="relative">
           <div className="w-32 h-20 bg-green-100 rounded-2xl rotate-12 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
              <div className="w-full h-full bg-cover opacity-50" style={{ backgroundImage: 'url(https://www.google.com/maps/vt/pb=!1m4!1m3!1i10!2i512!3i512!2m3!1e0!2sm!3i635079601!3m8!2sen!3suk!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!1f2!6m8!1e12!2i2!26m1!4b1!27i0)' }}></div>
              <MapPin className="absolute w-6 h-6 text-red-500" />
           </div>
           <div className="absolute -bottom-2 -right-4 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-green-500">
              <Search className="w-6 h-6 text-green-500" />
           </div>
        </div>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Entrez le code de votre ami"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg font-mono focus:border-green-500 focus:outline-none transition-all text-center tracking-widest"
          maxLength={16}
        />
        
        <button
          onClick={handleFindFriend}
          disabled={code.length < 16 || isSearching}
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-2 transition-all ${
            code.length >= 16 
              ? 'bg-green-600 text-white shadow-green-200' 
              : 'bg-slate-200 text-slate-400'
          }`}
        >
          {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          {isSearching ? 'Recherche...' : 'Trouver'}
        </button>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="text-center space-y-4">
        <h3 className="text-green-600 font-bold text-xl">Étape 3/3</h3>
        <p className="text-slate-800 text-lg font-medium leading-relaxed px-4">
          Ajoutez-vous mutuellement comme amis et commencez le suivi
        </p>
      </div>

      {/* Profile Card from Image 2 */}
      <div className="bg-white rounded-[40px] border-8 border-slate-100 p-8 shadow-2xl space-y-6 text-center">
        <div className="relative inline-block mx-auto">
          <div className="w-24 h-24 bg-slate-200 rounded-full overflow-hidden flex items-center justify-center border-4 border-white shadow-md">
            {foundFriend?.photoUrl ? (
              <img src={foundFriend.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                <span className="text-3xl font-bold text-blue-400">
                  {foundFriend?.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="absolute bottom-0 right-0 bg-green-500 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white">
            <UserPlus className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-2xl text-slate-800">{foundFriend?.name}</h4>
          <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-green-600 font-mono text-sm tracking-widest break-all">
            {foundFriend?.code}
          </div>
        </div>

        <button
          onClick={() => foundFriend && onComplete(foundFriend)}
          className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-green-200 flex items-center justify-center gap-2"
        >
          Ajouter cet ami
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3">
        <InfoIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <p className="text-xs text-blue-700">
           Votre ami recevra une demande de suivi. Dès qu'il l'accepte, vous pourrez voir sa position.
        </p>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-6 h-6 text-slate-800" />
          <span className="font-bold text-slate-800">Voir la localisation de l'ami</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <AnimatePresence mode="wait">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </AnimatePresence>
      </div>
    </div>
  );
};

const InfoIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const RefreshCw = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

export default FriendTrackingWizard;
