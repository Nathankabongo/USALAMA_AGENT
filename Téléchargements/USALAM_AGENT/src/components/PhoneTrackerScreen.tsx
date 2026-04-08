import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Phone, Search, MapPin, Wifi, Clock,
  AlertTriangle, CheckCircle2, Loader2, Navigation,
  RefreshCw, Shield, Eye, Info, Copy, Share2, X
} from 'lucide-react';
import { locateByPhone, normalizePhone, PhoneLocationResult } from '../services/phoneTracker';
import KinshasaMap, { MapMarker, MapCircle } from './map/KinshasaMap';

interface PhoneTrackerScreenProps {
  onBack: () => void;
}

type TrackerStep = 'input' | 'loading' | 'result' | 'error';

const PhoneTrackerScreen: React.FC<PhoneTrackerScreenProps> = ({ onBack }) => {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<TrackerStep>('input');
  const [result, setResult] = useState<PhoneLocationResult | null>(null);
  const [loadingText, setLoadingText] = useState('Connexion aux tours cellulaires...');
  const [history, setHistory] = useState<PhoneLocationResult[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadingMessages = [
    'Connexion aux tours cellulaires...',
    'Triangulation du signal en cours...',
    'Analyse des données opérateur...',
    'Calcul de la position GPS...',
    'Vérification de la précision...',
    'Finalisation des coordonnées...',
  ];

  useEffect(() => {
    if (step === 'loading') {
      let idx = 0;
      const interval = setInterval(() => {
        idx = (idx + 1) % loadingMessages.length;
        setLoadingText(loadingMessages[idx]);
      }, 600);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleSearch = async () => {
    if (!phone.trim()) return;
    const normalized = normalizePhone(phone);
    setStep('loading');
    setLoadingText(loadingMessages[0]);

    try {
      const res = await locateByPhone(normalized);
      setResult(res);
      if (res.status === 'found') {
        setHistory(prev => [res, ...prev.slice(0, 4)]);
        setStep('result');
      } else {
        setStep('error');
      }
    } catch {
      setResult(null);
      setStep('error');
    }
  };

  const handleReset = () => {
    setPhone('');
    setStep('input');
    setResult(null);
    setShowMap(false);
  };

  const copyCoords = () => {
    if (!result) return;
    navigator.clipboard.writeText(`${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatLastSeen = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'À l\'instant';
    if (mins < 60) return `Il y a ${mins} min`;
    return `Il y a ${Math.floor(mins / 60)}h`;
  };

  const getAccuracyColor = (acc: number) => {
    if (acc <= 100) return 'text-green-600 bg-green-50 border-green-200';
    if (acc <= 300) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const getAccuracyLabel = (acc: number) => {
    if (acc <= 100) return 'Très précis';
    if (acc <= 300) return 'Précis';
    return 'Approximatif';
  };

  // Marqueurs et cercles pour la carte
  const mapMarkers: MapMarker[] = result && result.status === 'found' ? [
    {
      id: 'tracked-phone',
      lat: result.lat,
      lng: result.lng,
      type: 'user' as const,
      icon: '📱',
      label: result.phone,
      color: '#ef4444',
    }
  ] : [];

  const mapCircles: MapCircle[] = result && result.status === 'found' ? [
    {
      id: 'accuracy-circle',
      lat: result.lat,
      lng: result.lng,
      radius: result.accuracy,
      color: '#ef4444',
      fillColor: '#ef4444',
      label: `Précision ±${result.accuracy}m`,
    }
  ] : [];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">

      {/* Header */}
      <div className="bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-4 py-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-white font-bold text-lg leading-none">Localiser un Numéro</h1>
          <p className="text-slate-400 text-xs mt-1">Retraçage par numéro de téléphone</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 bg-red-600/20 border border-red-500/30 px-3 py-1.5 rounded-xl">
          <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
          <span className="text-red-400 text-xs font-bold">MODE SUIVI</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ═══ ÉTAPE 1 : SAISIE DU NUMÉRO ═══ */}
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6 space-y-8"
            >
              {/* Avertissement légal */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex gap-3">
                <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-300 text-sm leading-relaxed">
                  <strong>Usage sécuritaire uniquement.</strong> Cette fonctionnalité est destinée à localiser
                  des proches avec leur consentement ou dans des situations d'urgence.
                </p>
              </div>

              {/* Illustration */}
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-24 h-24 bg-gradient-to-br from-red-600 to-red-900 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-900/50">
                  <Phone className="w-12 h-12 text-white" />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">Retracer une personne</h2>
                  <p className="text-slate-400 mt-1">Entrez le numéro de téléphone pour localiser son emplacement en temps réel</p>
                </div>
              </div>

              {/* Champ de saisie */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-slate-400 font-bold text-lg">🇨🇩</span>
                    <div className="w-px h-6 bg-white/10" />
                  </div>
                  <input
                    type="tel"
                    placeholder="+243 8xx xxx xxx"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-16 pr-14 py-5 bg-white/5 border-2 border-white/10 focus:border-red-500 rounded-2xl text-white text-xl font-mono tracking-wider focus:outline-none transition-all placeholder-slate-600"
                    maxLength={20}
                  />
                  {phone && (
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      onClick={() => setPhone('')}
                    >
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  )}
                </div>

                {/* Exemples de formats */}
                <div className="flex flex-wrap gap-2">
                  {['+243 817 015 196', '0817015196', '817015196'].map(ex => (
                    <button
                      key={ex}
                      onClick={() => setPhone(ex)}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-400 font-mono hover:bg-white/10 transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSearch}
                  disabled={phone.length < 8}
                  className={`w-full py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-xl ${
                    phone.length >= 8
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/50'
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Search className="w-6 h-6" />
                  Localiser
                </motion.button>
              </div>

              {/* Historique des recherches */}
              {history.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest px-1">Recherches récentes</p>
                  {history.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setPhone(h.phone);
                        setResult(h);
                        setStep('result');
                      }}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-3 hover:bg-white/10 transition-all text-left"
                    >
                      <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center">
                        <Phone className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-mono font-bold">{h.phone}</div>
                        <div className="text-slate-500 text-xs">{h.address}, {h.city}</div>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-slate-600 rotate-180" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ ÉTAPE 2 : CHARGEMENT ═══ */}
          {step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center space-y-8"
            >
              {/* Animation de localisation */}
              <div className="relative">
                <div className="w-36 h-36 rounded-full border-2 border-red-500/20 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full border-2 border-red-500/30 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border-2 border-red-500/50 flex items-center justify-center">
                      <div className="w-14 h-14 bg-red-600/30 rounded-full flex items-center justify-center border border-red-500">
                        <MapPin className="w-7 h-7 text-red-400" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Anneau tournant */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-t-2 border-r-2 border-red-500"
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-bold text-2xl">Localisation en cours</h3>
                <p className="text-slate-500 font-mono text-sm">{normalizePhone(phone)}</p>
              </div>

              <motion.div
                key={loadingText}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-3"
              >
                <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
                <span className="text-slate-300 text-sm">{loadingText}</span>
              </motion.div>

              <div className="flex gap-2 flex-wrap justify-center">
                {['Réseau cellulaire', 'GPS', 'WiFi'].map((src, i) => (
                  <motion.div
                    key={src}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.3 }}
                    className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full"
                  >
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-slate-400">{src}</span>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={handleReset}
                className="text-slate-500 text-sm hover:text-slate-300 transition-colors"
              >
                Annuler la recherche
              </button>
            </motion.div>
          )}

          {/* ═══ ÉTAPE 3 : RÉSULTAT ═══ */}
          {step === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* ──── CARTE INTÉGRÉE ──── */}
              <div className="relative h-72">
                <KinshasaMap
                  center={[result.lat, result.lng]}
                  zoom={15}
                  mapStyle="dark"
                  markers={mapMarkers}
                  circles={mapCircles}
                  polylines={[]}
                  userPosition={[result.lat, result.lng]}
                  userHeading={0}
                  movementTrail={[]}
                />

                {/* Overlay résultat rapide */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <div className="bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-white text-sm font-bold font-mono">{result.phone}</span>
                  </div>
                  <button
                    onClick={handleReset}
                    className="bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-xl p-2 hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Badge précision sur la carte */}
                <div className="absolute bottom-3 left-3">
                  <div className={`inline-flex items-center gap-1.5 border px-3 py-1.5 rounded-xl text-xs font-bold ${getAccuracyColor(result.accuracy)}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    {getAccuracyLabel(result.accuracy)} · ±{result.accuracy}m
                  </div>
                </div>
              </div>

              {/* ──── FICHE DE DÉTAILS ──── */}
              <div className="p-6 space-y-5">

                {/* Statut général */}
                <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-green-300 font-bold">Localisation réussie</p>
                    <p className="text-green-500 text-xs">{formatLastSeen(result.lastSeen)} · {result.operator}</p>
                  </div>
                  <button onClick={handleSearch} className="ml-auto p-2 bg-green-600/20 rounded-xl hover:bg-green-600/30 transition-colors">
                    <RefreshCw className="w-4 h-4 text-green-400" />
                  </button>
                </div>

                {/* Coordonnées */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Localisation</span>
                    <button onClick={copyCoords} className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copié !' : 'Copier'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="text-slate-500 text-xs mb-1">Latitude</div>
                      <div className="text-white font-mono font-bold">{result.lat.toFixed(6)}</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="text-slate-500 text-xs mb-1">Longitude</div>
                      <div className="text-white font-mono font-bold">{result.lng.toFixed(6)}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-t border-white/5 pt-4">
                    <MapPin className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-white text-sm font-medium">{result.address}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{result.city}, {result.country}</div>
                    </div>
                  </div>
                </div>

                {/* Infos techniques */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                    <Wifi className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                    <div className="text-white font-bold text-sm">Cellulaire</div>
                    <div className="text-slate-500 text-[10px] mt-0.5">{result.operator}</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                    <Eye className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                    <div className="text-white font-bold text-sm">±{result.accuracy}m</div>
                    <div className="text-slate-500 text-[10px] mt-0.5">Précision</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                    <Clock className="w-5 h-5 text-green-400 mx-auto mb-2" />
                    <div className="text-white font-bold text-sm">{formatLastSeen(result.lastSeen)}</div>
                    <div className="text-slate-500 text-[10px] mt-0.5">Dernière vue</div>
                  </div>
                </div>

                {/* Avertissement approximation */}
                {result.isApproximate && (
                  <div className="flex gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                    <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-300 text-sm">
                      Position approximative. La précision dépend de la densité des tours cellulaires dans la zone.
                    </p>
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="space-y-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.open(`https://maps.google.com/?q=${result.lat},${result.lng}`, '_blank')}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-red-900/40 flex items-center justify-center gap-3"
                  >
                    <Navigation className="w-6 h-6" />
                    Ouvrir dans Maps
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.href = `tel:${result.phone}`}
                    className="w-full bg-white/10 border border-white/10 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-white/15 transition-colors"
                  >
                    <Phone className="w-6 h-6" />
                    Appeler ce numéro
                  </motion.button>

                  <button
                    onClick={handleReset}
                    className="w-full text-slate-400 py-3 rounded-2xl font-medium text-sm hover:text-slate-200 transition-colors"
                  >
                    Nouvelle recherche
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ ÉTAPE 4 : ERREUR ═══ */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center space-y-6"
            >
              <div className="w-24 h-24 bg-slate-800 rounded-3xl flex items-center justify-center border border-white/10">
                <AlertTriangle className="w-12 h-12 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-2xl mb-2">Introuvable</h3>
                <p className="text-slate-400 leading-relaxed">
                  Impossible de localiser <span className="text-white font-mono">{normalizePhone(phone)}</span>.
                  Le téléphone est peut-être hors réseau ou le numéro n'existe pas.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2.5 w-full">
                <p className="text-slate-400 text-sm font-bold mb-3">Raisons possibles :</p>
                {[
                  'Le téléphone est éteint ou en mode avion',
                  'La personne est hors de portée réseau',
                  'Le numéro de téléphone est incorrect',
                  'L\'opérateur ne supporte pas la localisation',
                ].map((reason, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 bg-slate-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-slate-500 text-sm">{reason}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleSearch}
                  className="flex-1 bg-white/10 border border-white/10 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/15 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" /> Réessayer
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" /> Nouveau numéro
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default PhoneTrackerScreen;
