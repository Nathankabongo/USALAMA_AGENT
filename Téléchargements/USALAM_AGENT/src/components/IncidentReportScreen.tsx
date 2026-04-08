import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, MapPin, Camera, AlertTriangle, Shield, Zap,
  Car, Users, Flame, Eye, Package, ChevronRight,
  CheckCircle, Upload, Mic, MicOff, Clock, Send
} from 'lucide-react';
import { NavigationProps } from '../types/navigation';

interface IncidentCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

const CATEGORIES: IncidentCategory[] = [
  { id: 'braquage', label: 'Braquage / Vol', icon: '🔫', color: 'bg-red-600/20 border-red-500/50 text-red-400', urgency: 'critical' },
  { id: 'agression', label: 'Agression', icon: '👊', color: 'bg-orange-600/20 border-orange-500/50 text-orange-400', urgency: 'high' },
  { id: 'accident', label: 'Accident', icon: '🚗', color: 'bg-yellow-600/20 border-yellow-500/50 text-yellow-400', urgency: 'high' },
  { id: 'incendie', label: 'Incendie', icon: '🔥', color: 'bg-red-700/20 border-red-600/50 text-red-300', urgency: 'critical' },
  { id: 'enlèvement', label: 'Enlèvement', icon: '🚨', color: 'bg-purple-600/20 border-purple-500/50 text-purple-400', urgency: 'critical' },
  { id: 'trouble', label: 'Trouble à l\'ordre', icon: '📢', color: 'bg-orange-500/20 border-orange-400/50 text-orange-300', urgency: 'medium' },
  { id: 'route', label: 'Route dangereuse', icon: '⚠️', color: 'bg-yellow-700/20 border-yellow-500/50 text-yellow-300', urgency: 'medium' },
  { id: 'suspect', label: 'Comportement suspect', icon: '👁️', color: 'bg-blue-600/20 border-blue-500/50 text-blue-400', urgency: 'medium' },
  { id: 'inondation', label: 'Inondation', icon: '🌊', color: 'bg-cyan-600/20 border-cyan-500/50 text-cyan-400', urgency: 'high' },
  { id: 'autre', label: 'Autre', icon: '📋', color: 'bg-slate-600/20 border-slate-500/50 text-slate-400', urgency: 'low' },
];

const IncidentReportScreen = ({ onNavigate }: NavigationProps) => {
  const [step, setStep] = useState<'category' | 'details' | 'confirm' | 'sent'>('category');
  const [selectedCategory, setSelectedCategory] = useState<IncidentCategory | null>(null);
  const [description, setDescription] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const URGENCY_LABELS = {
    low: { label: 'Faible', color: 'bg-green-600', icon: '🟢' },
    medium: { label: 'Moyen', color: 'bg-yellow-600', icon: '🟡' },
    high: { label: 'Élevé', color: 'bg-orange-600', icon: '🟠' },
    critical: { label: 'Critique', color: 'bg-red-600', icon: '🔴' },
  };

  const handleCategorySelect = (cat: IncidentCategory) => {
    setSelectedCategory(cat);
    setUrgencyLevel(cat.urgency);
    setStep('details');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setStep('sent');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => step === 'category' ? onNavigate?.('enhanced-home') : setStep(step === 'details' ? 'category' : 'details')}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-white">Signaler un Incident</h1>
          <p className="text-xs text-orange-400">Kinshasa • Temps réel</p>
        </div>
        {/* Étapes */}
        <div className="flex items-center gap-1">
          {['category', 'details', 'confirm'].map((s, i) => (
            <div key={s} className={`w-2 h-2 rounded-full transition-colors ${
              step === s ? 'bg-orange-500' :
              ['category', 'details', 'confirm', 'sent'].indexOf(step) > i ? 'bg-green-500' : 'bg-white/20'
            }`} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        <AnimatePresence mode="wait">

          {/* ÉTAPE 1 : Catégorie */}
          {step === 'category' && (
            <motion.div
              key="category"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="p-4"
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">Quel type d'incident ?</h2>
                <p className="text-slate-400 text-sm">Sélectionnez la catégorie la plus proche</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <motion.button
                    key={cat.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleCategorySelect(cat)}
                    className={`border rounded-2xl p-4 text-left transition-all ${cat.color}`}
                  >
                    <div className="text-3xl mb-2">{cat.icon}</div>
                    <div className="font-semibold text-sm leading-tight">{cat.label}</div>
                    <div className="text-xs mt-1 opacity-70 capitalize">{URGENCY_LABELS[cat.urgency].icon} {URGENCY_LABELS[cat.urgency].label}</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ÉTAPE 2 : Détails */}
          {step === 'details' && selectedCategory && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="p-4 space-y-4"
            >
              {/* Catégorie sélectionnée */}
              <div className={`border rounded-2xl p-4 flex items-center gap-3 ${selectedCategory.color}`}>
                <span className="text-3xl">{selectedCategory.icon}</span>
                <div>
                  <div className="font-bold">{selectedCategory.label}</div>
                  <div className="text-xs opacity-70">Catégorie sélectionnée</div>
                </div>
              </div>

              {/* Niveau d'urgence */}
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Niveau d'urgence</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.entries(URGENCY_LABELS) as [string, any][]).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setUrgencyLevel(key as any)}
                      className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all text-center border ${
                        urgencyLevel === key
                          ? `${val.color} text-white border-transparent`
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {val.icon} {val.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Description</label>
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Décrivez ce qui se passe... (nombre de personnes, véhicules impliqués, direction de fuite...)"
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 resize-none text-sm"
                  />
                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    className={`absolute bottom-3 right-3 p-2 rounded-xl transition-colors ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
                {isRecording && (
                  <p className="text-red-400 text-xs mt-1 animate-pulse">🎙️ Enregistrement vocal en cours...</p>
                )}
              </div>

              {/* Photo */}
              <div>
                <label className="text-slate-300 text-sm font-medium mb-2 block">Photo / Preuve (optionnel)</label>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                {photoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden">
                    <img src={photoPreview} alt="Preuve" className="w-full h-40 object-cover" />
                    <button
                      onClick={() => setPhotoPreview(null)}
                      className="absolute top-2 right-2 bg-black/60 rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-white/20 hover:border-orange-500/50 rounded-2xl py-8 flex flex-col items-center gap-2 text-slate-400 hover:text-orange-400 transition-all"
                  >
                    <Camera className="w-8 h-8" />
                    <span className="text-sm">Appuyer pour prendre une photo</span>
                  </button>
                )}
              </div>

              {/* Localisation */}
              <div className="flex items-center gap-3 bg-blue-600/10 border border-blue-500/30 rounded-2xl p-4">
                <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">Position GPS détectée</div>
                  <div className="text-slate-400 text-xs">Gombe, Kinshasa • -4.4419, 15.2663</div>
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>

              {/* Anonymat */}
              <button
                onClick={() => setIsAnonymous(!isAnonymous)}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl px-4 py-3 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300 text-sm">Signalement anonyme</span>
                </div>
                <div className={`w-10 h-5 rounded-full transition-colors ${isAnonymous ? 'bg-blue-600' : 'bg-slate-600'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${isAnonymous ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep('confirm')}
                disabled={!description.trim()}
                className={`w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                  description.trim()
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 shadow-lg shadow-orange-600/25'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
                Continuer
              </motion.button>
            </motion.div>
          )}

          {/* ÉTAPE 3 : Confirmation */}
          {step === 'confirm' && selectedCategory && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="p-4 space-y-4"
            >
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white mb-1">Confirmer le signalement</h2>
                <p className="text-slate-400 text-sm">Vérifiez les informations avant d'envoyer</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Type</span>
                  <span className="text-white font-medium">{selectedCategory.icon} {selectedCategory.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Urgence</span>
                  <span className={`font-medium ${
                    urgencyLevel === 'critical' ? 'text-red-400' :
                    urgencyLevel === 'high' ? 'text-orange-400' :
                    urgencyLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'
                  }`}>{URGENCY_LABELS[urgencyLevel].icon} {URGENCY_LABELS[urgencyLevel].label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Position</span>
                  <span className="text-white text-sm">Gombe, Kinshasa</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Mode</span>
                  <span className="text-white text-sm">{isAnonymous ? '🕵️ Anonyme' : '👤 Identifié'}</span>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <span className="text-slate-400 text-sm block mb-1">Description</span>
                  <p className="text-white text-sm">{description}</p>
                </div>
                {photoPreview && (
                  <img src={photoPreview} alt="Preuve" className="w-full h-32 object-cover rounded-xl" />
                )}
              </div>

              <div className="bg-orange-600/10 border border-orange-500/30 rounded-2xl p-4 text-sm text-orange-300">
                ⚠️ Ce signalement sera transmis à la communauté USALAMA et aux autorités compétentes dans votre zone.
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-red-600 to-orange-600 shadow-lg shadow-red-600/25 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Envoyer le signalement
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* ÉTAPE 4 : Envoyé */}
          {step === 'sent' && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-24 h-24 bg-green-600/20 border-2 border-green-500 rounded-full flex items-center justify-center mb-6"
              >
                <CheckCircle className="w-12 h-12 text-green-400" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Signalement envoyé !</h2>
              <p className="text-slate-400 mb-2">Votre incident a été transmis à la communauté USALAMA</p>
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 mb-8">
                <span className="text-slate-400 text-sm">Référence : </span>
                <span className="text-blue-400 font-mono text-sm">INC-{Date.now().toString().slice(-6)}</span>
              </div>
              <div className="space-y-3 w-full">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => onNavigate?.('enhanced-map')}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" /> Voir sur la carte
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => onNavigate?.('enhanced-home')}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold"
                >
                  Retour à l'accueil
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default IncidentReportScreen;
