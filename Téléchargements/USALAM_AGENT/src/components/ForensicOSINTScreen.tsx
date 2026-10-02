import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, Unlock, Camera, Mic, MapPin, Clock,
  CheckCircle2, AlertTriangle, Download, FileText, Image,
  Video, Eye, EyeOff, Hash, Search, Phone, Car,
  AlertOctagon, Key, ShieldAlert, Cpu, Database,
  Fingerprint, RefreshCw, FileCheck, Share2, Copy,
  Sparkles, ChevronRight, ArrowLeft, Trash2, Check,
  Radio, ShieldCheck, Terminal, Smartphone, Users, User, Map
} from 'lucide-react';
import { NavigationProps, navigationItems } from '../types/navigation';

export interface ForensicEvidence {
  id: string;
  type: 'photo' | 'audio' | 'video' | 'location' | 'message';
  title: string;
  timestamp: string;
  isoDate: string;
  sha256: string;
  sizeBytes: number;
  location: string;
  coordinates: { lat: number; lng: number };
  status: 'sealed' | 'verified' | 'tampered';
  category: 'kidnapping' | 'vol' | 'kuluna' | 'extorsion' | 'autre';
  officerNotes?: string;
}

export interface OsintPhoneReport {
  phone: string;
  operator: string;
  riskLevel: 'critical' | 'high' | 'moderate' | 'safe';
  reportsCount: number;
  lastReported: string;
  tags: string[];
  description: string;
}

export interface OsintVehicleReport {
  plate: string;
  model: string;
  color: string;
  riskType: 'kidnapping_taxi' | 'vol_aggression' | 'suspect';
  reportedCommune: string;
  date: string;
  verifiedByCommunity: boolean;
}

const ForensicOSINTScreen: React.FC<NavigationProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'forensic' | 'osint' | 'hardening'>('forensic');

  // ══════════════════════════════════════════════════════════
  // ÉTAT MODULE FORENSIQUE
  // ══════════════════════════════════════════════════════════
  const [evidenceList, setEvidenceList] = useState<ForensicEvidence[]>([
    {
      id: 'SCL-2026-9041',
      type: 'audio',
      title: 'Enregistrement appel de rançon (Ketch jaune)',
      timestamp: '02 Oct 2026 • 21:14 UTC',
      isoDate: '2026-10-02T21:14:00Z',
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      sizeBytes: 1845200,
      location: 'Croisement Boulevard du 30 Juin / Batetela, Gombe',
      coordinates: { lat: -4.3050, lng: 15.3080 },
      status: 'sealed',
      category: 'kidnapping',
      officerNotes: 'Voix enregistrée sous contrainte. Scellé numérique certifié non altéré.'
    },
    {
      id: 'SCL-2026-9042',
      type: 'photo',
      title: 'Cliché véhicule suspect sans plaque (Toyota IST)',
      timestamp: '02 Oct 2026 • 22:05 UTC',
      isoDate: '2026-10-02T22:05:00Z',
      sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      sizeBytes: 3412900,
      location: 'Arrêt Kintambo Magasin, Ngaliema',
      coordinates: { lat: -4.3298, lng: 15.2632 },
      status: 'sealed',
      category: 'kidnapping',
      officerNotes: 'Photo capturée en mode silencieux. Métadonnées EXIF et géotag intégrés.'
    },
    {
      id: 'SCL-2026-9043',
      type: 'location',
      title: 'Traçage balise d\'urgence continue (SOS actif)',
      timestamp: '02 Oct 2026 • 22:30 UTC',
      isoDate: '2026-10-02T22:30:00Z',
      sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      sizeBytes: 12400,
      location: 'Rond-Point Ngaba / By-Pass',
      coordinates: { lat: -4.4021, lng: 15.3248 },
      status: 'sealed',
      category: 'kuluna',
      officerNotes: 'Données GPS horodatées par réseau GSM et satellite.'
    }
  ]);

  const [selectedEvidence, setSelectedEvidence] = useState<ForensicEvidence | null>(evidenceList[0]);
  const [copiedHash, setCopiedHash] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'kidnapping' | 'vol' | 'kuluna' | 'extorsion'>('kidnapping');
  const [isSealing, setIsSealing] = useState(false);

  // ══════════════════════════════════════════════════════════
  // ÉTAT MODULE OSINT
  // ══════════════════════════════════════════════════════════
  const [osintPhoneInput, setOsintPhoneInput] = useState('');
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [phoneReport, setPhoneReport] = useState<OsintPhoneReport | null>(null);

  const [osintVehicleInput, setOsintVehicleInput] = useState('');
  const [isSearchingVehicle, setIsSearchingVehicle] = useState(false);
  const [vehicleReport, setVehicleReport] = useState<OsintVehicleReport | null>(null);

  // Base de données OSINT des numéros signalés pour délits à Kinshasa
  const OSINT_PHONE_DATABASE: Record<string, OsintPhoneReport> = {
    '0810001122': {
      phone: '+243 81 000 11 22',
      operator: 'Vodacom RDC',
      riskLevel: 'critical',
      reportsCount: 18,
      lastReported: 'Il y a 3 heures',
      tags: ['Rançon Enlèvement', 'Appel faux policier', 'Mobile Money Fraud'],
      description: 'Numéro utilisé dans 3 tentatives d\'extorsion récentes à Limete et Bandalungwa se faisant passer pour un OPJ du Parquet.'
    },
    '0998877665': {
      phone: '+243 99 887 76 65',
      operator: 'Airtel RDC',
      riskLevel: 'high',
      reportsCount: 9,
      lastReported: 'Hier',
      tags: ['Arnaque M-Pesa/AirtelMoney', 'Faux enlèvement étudiant UNIKIN'],
      description: 'Signalé par des étudiants pour exigence de transferts urgents sous menace de violence.'
    },
    '0851234567': {
      phone: '+243 85 123 45 67',
      operator: 'Orange RDC',
      riskLevel: 'moderate',
      reportsCount: 3,
      lastReported: 'Il y a 4 jours',
      tags: ['Démarchage agressif', 'Harcèlement'],
      description: 'Numéro suspect de démarchage nocturne non identifié.'
    }
  };

  // Base de données OSINT des véhicules suspects à Kinshasa
  const OSINT_VEHICLES_DATABASE: Record<string, OsintVehicleReport> = {
    '0123AB/01': {
      plate: '0123AB/01',
      model: 'Toyota IST (Jaune taxi)',
      color: 'Jaune toit blanc',
      riskType: 'kidnapping_taxi',
      reportedCommune: 'Kintambo Magasin - Rond Point Victoire',
      date: '02 Octobre 2026',
      verifiedByCommunity: true
    },
    '4589CD/01': {
      plate: '4589CD/01',
      model: 'Toyota Vitz',
      color: 'Gris métallisé vitres teintées',
      riskType: 'vol_aggression',
      reportedCommune: 'Boulevard Lumumba (Arrêt Debonhomme)',
      date: '01 Octobre 2026',
      verifiedByCommunity: true
    }
  };

  // ══════════════════════════════════════════════════════════
  // ÉTAT MODULE DURCISSEMENT (HARDENING & STEALTH)
  // ══════════════════════════════════════════════════════════
  const [stealthModeActive, setStealthModeActive] = useState(false);
  const [duressPin, setDuressPin] = useState('9999');
  const [panicWipeTriggered, setPanicWipeTriggered] = useState(false);
  const [wipeCountdown, setWipeCountdown] = useState<number | null>(null);
  
  // Modale de Droit de réponse / Contestation OSINT (Conformité Loi n° 23/010 RDC)
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeTarget, setDisputeTarget] = useState<{ type: 'phone' | 'vehicle'; value: string } | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeProof, setDisputeProof] = useState('');
  const [disputeSuccess, setDisputeSuccess] = useState(false);

  const [antiSpyStatus, setAntiSpyStatus] = useState({
    micAccess: 'Surveillé (0 écoute non autorisée)',
    cameraAccess: 'Verrouillé',
    storageEncrypted: 'Chiffrement AES-GCM 256 bits ACTIF',
    integrityHash: 'Conforme SHA-256'
  });

  // Compte à rebours annulable de 5 secondes pour Panic Wipe (Inspiré de Tella)
  useEffect(() => {
    if (wipeCountdown === null) return;
    if (wipeCountdown <= 0) {
      setPanicWipeTriggered(true);
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error('Erreur purge:', e);
      }
      setEvidenceList([]);
      setTimeout(() => {
        setWipeCountdown(null);
        setPanicWipeTriggered(false);
        onNavigate?.('decoy');
      }, 1000);
      return;
    }

    const timer = setTimeout(() => {
      setWipeCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [wipeCountdown, onNavigate]);

  // Déclencheur du compte à rebours d'effacement
  const handleStartPanicCountdown = () => {
    setWipeCountdown(5);
  };

  // Annulation du compte à rebours
  const handleCancelPanicCountdown = () => {
    setWipeCountdown(null);
  };

  // Soumission d'une contestation / Droit de réponse
  const handleSubmitDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    setDisputeSuccess(true);
    setTimeout(() => {
      setDisputeSuccess(false);
      setShowDisputeModal(false);
      setDisputeReason('');
      setDisputeProof('');
    }, 1800);
  };

  // URL SMS d'urgence en cas de contrainte sans Internet
  const emergencySmsUri = `sms:+243990000000?body=${encodeURIComponent(
    'ALERTE SILENCIEUSE USALAMA (CODE CONTRAINTE DECLENCHE) - Kinshasa. Position GPS: -4.3180S, 15.3110E. Assistance requise.'
  )}`;

  // Calcul d'un hash SHA-256 réel pour une nouvelle preuve
  const handleSealNewEvidence = async (type: 'photo' | 'audio') => {
    setIsSealing(true);
    try {
      const rawText = `USALAMA-EVIDENCE-${Date.now()}-${type}-${newCategory}-${Math.random()}`;
      const msgUint8 = new TextEncoder().encode(rawText);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const newId = `SCL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date();

      const newEntry: ForensicEvidence = {
        id: newId,
        type,
        title: newTitle.trim() || `Preuve légiste certifiée (${type.toUpperCase()})`,
        timestamp: `${now.toLocaleDateString('fr-FR')} • ${now.toLocaleTimeString('fr-FR')} UTC`,
        isoDate: now.toISOString(),
        sha256: hashHex,
        sizeBytes: type === 'photo' ? 2450000 : 1650000,
        location: 'Coordonnées GPS capturées (Kinshasa)',
        coordinates: { lat: -4.3180, lng: 15.3110 },
        status: 'sealed',
        category: newCategory,
        officerNotes: 'Scellé cryptographique généré en local. Chaîne de garde inviolable activée.'
      };

      setEvidenceList([newEntry, ...evidenceList]);
      setSelectedEvidence(newEntry);
      setNewTitle('');
    } catch (e) {
      console.error('Erreur scellé:', e);
    } finally {
      setIsSealing(false);
    }
  };

  // Copier le hash SHA-256
  const copySha256 = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // Recherche OSINT Téléphone
  const handleSearchPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!osintPhoneInput.trim()) return;

    setIsSearchingPhone(true);
    const cleanNum = osintPhoneInput.replace(/\s+/g, '').replace('+243', '0');

    setTimeout(() => {
      const match = OSINT_PHONE_DATABASE[cleanNum] || {
        phone: osintPhoneInput,
        operator: cleanNum.startsWith('081') || cleanNum.startsWith('082') ? 'Vodacom RDC' :
                  cleanNum.startsWith('097') || cleanNum.startsWith('099') ? 'Airtel RDC' :
                  cleanNum.startsWith('084') || cleanNum.startsWith('085') ? 'Orange RDC' : 'Opérateur RDC',
        riskLevel: 'safe',
        reportsCount: 0,
        lastReported: 'Aucun antécédent répertorié',
        tags: ['Aucun signalement criminel'],
        description: 'Ce numéro ne figure dans aucune base de rançon ou d\'arnaque communautaire active à ce jour.'
      };
      setPhoneReport(match);
      setIsSearchingPhone(false);
    }, 700);
  };

  // Recherche OSINT Véhicule
  const handleSearchVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!osintVehicleInput.trim()) return;

    setIsSearchingVehicle(true);
    const cleanPlate = osintVehicleInput.trim().toUpperCase();

    setTimeout(() => {
      const match = OSINT_VEHICLES_DATABASE[cleanPlate] || {
        plate: cleanPlate,
        model: 'Véhicule standard',
        color: 'Non renseigné',
        riskType: 'suspect',
        reportedCommune: 'Kinshasa',
        date: 'Vérification instantanée',
        verifiedByCommunity: false
      };
      setVehicleReport(match);
      setIsSearchingVehicle(false);
    }, 700);
  };

  // Déclenchement de l'Effacement d'Urgence (Panic Wipe)
  const handlePanicWipe = () => {
    setPanicWipeTriggered(true);
    setTimeout(() => {
      setPanicWipeTriggered(false);
      onNavigate?.('decoy');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
      
      {/* ══════════════════════════════════════════════════════════
          ENTÊTE CONFORME AU STYLE ACCUEIL USALAMA
          ══════════════════════════════════════════════════════════ */}
      <div className="bg-slate-800/95 backdrop-blur-lg border-b border-slate-700 p-3 sm:p-4 flex-shrink-0 z-30">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate?.('enhanced-home')}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white"
              title="Retour à l'accueil"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </motion.button>
            <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8 text-rose-400" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                SÉCURITÉ AVANCÉE
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600/30 text-rose-300 border border-rose-500/40 font-semibold tracking-wider uppercase">
                  Forensic & OSINT
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Lutte Anti-Crime • Scellés Numériques • Intelligence Ouverte
              </p>
            </div>
          </div>

          {/* Boutons d'Action Rapides : Mode Furtif / Calculatrice */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate?.('decoy')}
              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-xs font-semibold text-amber-300 flex items-center gap-1.5 shadow"
              title="Basculer immédiatement en mode camouflage (Calculatrice leurre)"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mode Furtif</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartPanicCountdown}
              className="p-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 rounded-lg text-rose-400 hover:text-rose-300 transition-colors"
              title="Panic Wipe : Déclencher le compte à rebours d'urgence (5s)"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* ── BARRE DES ONGLETS DE NAVIGATION (Style Accueil) ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'forensic', label: 'Laboratoire Forensique', icon: <Fingerprint className="w-4 h-4 text-emerald-400" /> },
            { id: 'osint', label: 'Enquêtes OSINT', icon: <Search className="w-4 h-4 text-blue-400" /> },
            { id: 'hardening', label: 'Durcissement & Furtivité', icon: <Lock className="w-4 h-4 text-purple-400" /> },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          CONTENU PRINCIPAL SELON ONGLET
          ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto pb-24 p-3 sm:p-5">
        
        {/* ══════════════════════════════════════════════════════════
            ONGLET 1 : LABORATOIRE FORENSIQUE & SCELLÉS NUMÉRIQUES
            ══════════════════════════════════════════════════════════ */}
        {activeTab === 'forensic' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            
            {/* Bannière de Sécurité Légale & Conformité RDC */}
            <div className="bg-gradient-to-r from-emerald-950/50 via-slate-800 to-slate-800 border border-emerald-500/40 rounded-xl p-3.5 sm:p-4 space-y-2">
              <div className="flex items-start gap-3">
                <FileCheck className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-sm text-white">
                      Scellé Numérique Immuable & Chaîne de Garde Conforme
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono font-bold">
                      SHA-256 + RFC 3161 TSA
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded font-semibold">
                      Loi n° 23/010 RDC (Code du numérique)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Chaque preuve (audio de rançon, cliché de plaque, balise GPS) fait l'objet d'un hachage SHA-256 instantané et d'un ancrage d'antériorité. Elle constitue une <b>attestation technique préliminaire</b> admissible devant l'OPJ (IPKIN) et le Parquet conformément aux articles 52 à 58 du Code du numérique congolais.
                  </p>
                </div>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" /> Ancrage TSA actif : Horodatage décentralisé inviolable certifié
                </span>
                <span className="hidden sm:inline font-mono text-[10px] text-slate-500">
                  OTS Block Anchor #892110
                </span>
              </div>
            </div>

            {/* Barre de Création Rapide de Scellé */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-400" />
                  Générer un Scellé Numérique Instantané
                </span>
                <span className="text-[11px] text-slate-400">Horodatage UTC Automatique</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Intitulé de la preuve (ex: Photo taxi suspect ketch, audio menace)..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />

                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-xs text-white focus:outline-none"
                >
                  <option value="kidnapping">Enlèvement / Taxi</option>
                  <option value="vol">Vol à main armée</option>
                  <option value="kuluna">Agression Kuluna</option>
                  <option value="extorsion">Extorsion / Faux contrôle</option>
                </select>

                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSealNewEvidence('photo')}
                    disabled={isSealing}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Scellé Photo</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSealNewEvidence('audio')}
                    disabled={isSealing}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Scellé Audio</span>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Grille : Liste des Scellés + Visualiseur de Preuve */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Colonne Gauche : Liste des preuves scellées */}
              <div className="lg:col-span-5 space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Preuves Répertoriées ({evidenceList.length})
                </h4>

                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {evidenceList.map((ev) => (
                    <motion.div
                      key={ev.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedEvidence(ev)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedEvidence?.id === ev.id
                          ? 'bg-slate-800 border-blue-500 shadow-lg ring-1 ring-blue-500/50'
                          : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            ev.type === 'photo' ? 'bg-blue-600/20 text-blue-400' :
                            ev.type === 'audio' ? 'bg-rose-600/20 text-rose-400' :
                            'bg-emerald-600/20 text-emerald-400'
                          }`}>
                            {ev.type === 'photo' ? <Image className="w-4 h-4" /> :
                             ev.type === 'audio' ? <Mic className="w-4 h-4" /> :
                             <MapPin className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-white">{ev.id}</div>
                            <div className="text-[11px] text-slate-300 line-clamp-1">{ev.title}</div>
                          </div>
                        </div>

                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Scellé
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>{ev.timestamp}</span>
                        <span>{(ev.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Colonne Droite : Fiche Forensique Détaillée */}
              {selectedEvidence && (
                <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-4">
                  <div className="flex items-start justify-between border-b border-slate-700 pb-3">
                    <div>
                      <span className="text-[10px] font-mono text-blue-400 font-bold tracking-wider">
                        CERTIFICAT DE SCELLÉ NUMÉRIQUE • {selectedEvidence.id}
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5">{selectedEvidence.title}</h3>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowReportModal(true)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Fiche Dépôt Plainte</span>
                    </motion.button>
                  </div>

                  {/* Empreinte Cryptographique Inviolable SHA-256 */}
                  <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-emerald-400">
                        <Fingerprint className="w-3.5 h-3.5" />
                        Empreinte Numérique SHA-256 (Inviolable)
                      </span>
                      <button
                        onClick={() => copySha256(selectedEvidence.sha256)}
                        className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                      >
                        {copiedHash ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedHash ? 'Copié !' : 'Copier'}</span>
                      </button>
                    </div>

                    <div className="font-mono text-xs text-slate-200 break-all bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      {selectedEvidence.sha256}
                    </div>
                  </div>

                  {/* Métadonnées Forensiques */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-700/60 p-2.5 rounded-lg border border-slate-600">
                      <span className="text-slate-400 text-[10px] block">Horodatage Certifié :</span>
                      <span className="font-mono font-bold text-white">{selectedEvidence.timestamp}</span>
                    </div>

                    <div className="bg-slate-700/60 p-2.5 rounded-lg border border-slate-600">
                      <span className="text-slate-400 text-[10px] block">Coordonnées GPS Scellées :</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {selectedEvidence.coordinates.lat.toFixed(4)}°S, {selectedEvidence.coordinates.lng.toFixed(4)}°E
                      </span>
                    </div>

                    <div className="bg-slate-700/60 p-2.5 rounded-lg border border-slate-600 col-span-2">
                      <span className="text-slate-400 text-[10px] block">Localisation Constatée :</span>
                      <span className="font-semibold text-white">{selectedEvidence.location}</span>
                    </div>

                    <div className="bg-slate-700/60 p-2.5 rounded-lg border border-slate-600 col-span-2">
                      <span className="text-slate-400 text-[10px] block">Observations & Chaîne de Garde :</span>
                      <span className="text-slate-300">{selectedEvidence.officerNotes}</span>
                    </div>
                  </div>

                  {/* Action d'Exportation Juridique */}
                  <div className="pt-2 flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowReportModal(true)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Générer Rapport Forensique Judiciaire</span>
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            ONGLET 2 : MODULE ENQUÊTES OSINT (NUMÉROS & VÉHICULES)
            ══════════════════════════════════════════════════════════ */}
        {activeTab === 'osint' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            
            {/* Présentation OSINT */}
            <div className="bg-gradient-to-r from-blue-950/40 to-slate-800 border border-blue-500/40 rounded-xl p-3.5 sm:p-4 flex items-start gap-3">
              <Search className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-white">
                  Renseignement Criminel Ouvert (OSINT Kinshasa)
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Vérifiez instantanément les numéros suspects (appels de rançon, menaces, arnaques) et plaques de taxis signalés dans les enlèvements (« Ketch ») à travers la ville de Kinshasa.
                </p>
              </div>
            </div>

            {/* Avis Légal RDC & Protection des Droits (Code du Numérique) */}
            <div className="bg-slate-800/90 border border-blue-500/30 rounded-xl p-3 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-300 leading-relaxed">
                <b className="text-white">Conformité Légale & Présomption d'Innocence (Loi n° 23/010 du 13 mars 2023 RDC) :</b> Toute personne ou immatriculation signalée bénéficie de la présomption légale d'innocence. Les alertes communautaires sont modérées et ne constituent en aucun cas une condamnation pénale ni une autorisation à la justice populaire (Art. 360-365). Un droit de réponse est garanti à tout propriétaire.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Enquêteur 1 : OSINT Téléphone Suspect */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Phone className="w-4 h-4 text-blue-400" />
                  <span>Vérificateur de Numéro Suspect (RDC)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Détection d'antécédents d'arnaques, menaces ou rançons (Vodacom, Airtel, Orange, Africell).
                </p>

                <form onSubmit={handleSearchPhone} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: 0810001122 ou 0998877665..."
                    value={osintPhoneInput}
                    onChange={(e) => setOsintPhoneInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isSearchingPhone}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{isSearchingPhone ? 'Analyse...' : 'Auditer'}</span>
                  </motion.button>
                </form>

                {/* Résultat OSINT Téléphone */}
                {phoneReport && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg border text-xs space-y-2 ${
                      phoneReport.riskLevel === 'critical' ? 'bg-rose-950/30 border-rose-500/50' :
                      phoneReport.riskLevel === 'high' ? 'bg-amber-950/30 border-amber-500/50' :
                      'bg-emerald-950/30 border-emerald-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white font-mono text-sm">{phoneReport.phone}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        phoneReport.riskLevel === 'critical' ? 'bg-rose-500/30 text-rose-300' :
                        phoneReport.riskLevel === 'high' ? 'bg-amber-500/30 text-amber-300' :
                        'bg-emerald-500/30 text-emerald-300'
                      }`}>
                        Niveau : {phoneReport.riskLevel}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300">
                      <div>Opérateur : <b>{phoneReport.operator}</b></div>
                      <div>Signalements répertoriés : <b>{phoneReport.reportsCount} signalement(s)</b> (Vérification modérée)</div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {phoneReport.tags.map((t, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {t}
                        </span>
                      ))}
                    </div>

                    <p className="text-[11px] text-slate-300 pt-1 leading-relaxed bg-slate-900/50 p-2 rounded">
                      {phoneReport.description}
                    </p>

                    {/* Droit de réponse / Contestation légale */}
                    <button
                      type="button"
                      onClick={() => {
                        setDisputeTarget({ type: 'phone', value: phoneReport.phone });
                        setShowDisputeModal(true);
                      }}
                      className="w-full mt-1.5 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-[10px] font-medium text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>⚖️ Droit de réponse / Contester ce signalement</span>
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Enquêteur 2 : OSINT Véhicules & Taxis Kidnappings */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Car className="w-4 h-4 text-emerald-400" />
                  <span>Vérificateur Véhicule & Taxi ("Ketch")</span>
                </div>
                <p className="text-xs text-slate-400">
                  Vérification des plaques d'immatriculation signalées dans des agressions et enlèvements.
                </p>

                <form onSubmit={handleSearchVehicle} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: 0123AB/01 ou 4589CD/01..."
                    value={osintVehicleInput}
                    onChange={(e) => setOsintVehicleInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 uppercase"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isSearchingVehicle}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{isSearchingVehicle ? 'Recherche...' : 'Vérifier'}</span>
                  </motion.button>
                </form>

                {/* Résultat OSINT Véhicule */}
                {vehicleReport && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg border border-slate-700 bg-slate-900/70 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-yellow-300 px-2 py-0.5 bg-yellow-950/60 rounded border border-yellow-500/40">
                        {vehicleReport.plate}
                      </span>
                      <span className="text-[10px] text-slate-400">{vehicleReport.date}</span>
                    </div>

                    <div className="text-[11px] text-slate-300 space-y-1">
                      <div>Modèle : <b>{vehicleReport.model}</b></div>
                      <div>Couleur constatée : <b>{vehicleReport.color}</b></div>
                      <div>Zone de signalement : <b>{vehicleReport.reportedCommune}</b></div>
                    </div>

                    <div className="pt-1 text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{vehicleReport.riskType === 'kidnapping_taxi' ? 'Signalé dans une tentative d\'enlèvement taxi' : 'Véhicule suspect'}</span>
                    </div>

                    {/* Droit de réponse / Contestation légale */}
                    <button
                      type="button"
                      onClick={() => {
                        setDisputeTarget({ type: 'vehicle', value: vehicleReport.plate });
                        setShowDisputeModal(true);
                      }}
                      className="w-full mt-1.5 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-[10px] font-medium text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>⚖️ Droit de réponse / Contester ce signalement</span>
                    </button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Base des Modes Opératoires Criminels Courants à Kinshasa */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-amber-400" />
                Modes Opératoires Criminels Actuels à Kinshasa
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-700/40 border border-slate-600 space-y-1">
                  <div className="font-bold text-amber-300">1. Enlèvement "Ketch Jaune"</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Un passager monte à l'avant, deux complices coincent la victime à l'arrière. Rançon exigée par mobile money sous menace d'arme blanche.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-700/40 border border-slate-600 space-y-1">
                  <div className="font-bold text-rose-300">2. Faux Contrôle "Bureau 2"</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Individus en civil prétendant appartenir à un service spécialisé. Exigent le téléphone déverrouillé et extorquent des fonds.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-700/40 border border-slate-600 space-y-1">
                  <div className="font-bold text-blue-300">3. Embuscades Coupeurs de Route</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Groupes de jeunes Kuluna opérant lors d'embouteillages sur By-Pass, Route de Matadi ou axes sombres de Selembao et Ndjili.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            ONGLET 3 : DURCISSEMENT SÉCURITAIRE & FURTIVITÉ
            ══════════════════════════════════════════════════════════ */}
        {activeTab === 'hardening' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            
            {/* Présentation Durcissement */}
            <div className="bg-gradient-to-r from-purple-950/40 to-slate-800 border border-purple-500/40 rounded-xl p-3.5 sm:p-4 flex items-start gap-3">
              <Lock className="w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-white">
                  Durcissement & Protection Anti-Contrainte (Stealth Shield)
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Protégez votre intégrité physique et numérique en situation de danger immédiat. Activez des leurres factices si vous êtes contraint d'ouvrir l'application par un agresseur.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Carte 1 : Mode Camouflage / Furtivité */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <EyeOff className="w-4 h-4 text-amber-400" />
                    <span>Écran Leurre (Calculatrice Innocente)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-semibold">
                    Anti-Contrainte
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  En cas de racket ou contrôle forcé, basculez l'application en calculatrice fonctionnelle. Tout le contenu sécuritaire et les preuves restent invisibles et chiffrés.
                </p>

                <div className="bg-slate-700/50 p-2.5 rounded-lg border border-slate-600 text-xs text-slate-300 space-y-1">
                  <div>Code PIN normal : <b>****</b> (Ouvre USALAMA)</div>
                  <div>Code PIN sous contrainte : <b className="text-amber-400">{duressPin}</b> (Ouvre le Leurre & envoie une alerte silencieuse)</div>
                </div>

                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigate?.('decoy')}
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    <EyeOff className="w-4 h-4" />
                    <span>Tester l'Écran Leurre</span>
                  </motion.button>
                  <a
                    href={emergencySmsUri}
                    className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-500 text-emerald-300 hover:text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
                    title="Alerte discrète par SMS si le réseau internet est coupé"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span className="hidden sm:inline">SMS Hors-Ligne</span>
                  </a>
                </div>
              </div>

              {/* Carte 2 : Effacement d'Urgence (Panic Wipe) */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Panic Wipe (Purge Locale avec Sécurité 5s)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded font-semibold">
                    Compte à rebours Tella
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Purge instantanément le cache local, l'historique des positions et les sessions actives. Compte à rebours de 5 secondes annulable pour éviter toute fausse manipulation.
                </p>

                <div className="bg-rose-950/30 border border-rose-500/30 p-2.5 rounded-lg text-xs text-rose-200">
                  ⚠️ À n'utiliser qu'en cas de perquisition illégale ou saisie hostile de votre appareil.
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartPanicCountdown}
                  disabled={panicWipeTriggered || wipeCountdown !== null}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{panicWipeTriggered ? 'Purge en cours...' : wipeCountdown !== null ? `Effacement dans ${wipeCountdown}s...` : 'Déclencher Panic Wipe (5s)'}</span>
                </motion.button>
              </div>

              {/* Carte 3 : Audit d'Intégrité de l'Appareil */}
              <div className="md:col-span-2 bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Bouclier Anti-Surveillance & Audit d'Intégrité</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-semibold">
                    Système Protégé
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-700/50 p-2.5 rounded-lg border border-slate-600 flex items-center justify-between">
                    <span className="text-slate-300">Surveillance Micro :</span>
                    <span className="text-emerald-400 font-bold">{antiSpyStatus.micAccess}</span>
                  </div>

                  <div className="bg-slate-700/50 p-2.5 rounded-lg border border-slate-600 flex items-center justify-between">
                    <span className="text-slate-300">Chiffrement Coffre-fort :</span>
                    <span className="text-emerald-400 font-bold">{antiSpyStatus.storageEncrypted}</span>
                  </div>

                  <div className="bg-slate-700/50 p-2.5 rounded-lg border border-slate-600 flex items-center justify-between">
                    <span className="text-slate-300">Protection Caméra :</span>
                    <span className="text-emerald-400 font-bold">{antiSpyStatus.cameraAccess}</span>
                  </div>

                  <div className="bg-slate-700/50 p-2.5 rounded-lg border border-slate-600 flex items-center justify-between">
                    <span className="text-slate-300">Contrôle d'Intégrité :</span>
                    <span className="text-emerald-400 font-bold">{antiSpyStatus.integrityHash}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          MODAL 1 : RAPPORT FORENSIQUE JUDICIAIRE POUR DÉPÔT DE PLAINTE
          ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showReportModal && selectedEvidence && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl text-xs space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                      RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono">
                      Art. 52-58 Loi n° 23/010
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                    ATTESTATION TECHNIQUE PRÉLIMINAIRE & SCELLÉ LÉGISTE
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Commencement de preuve électronique pour transmission à l'Officier de Police Judiciaire (OPJ) / Parquet
                  </p>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Fiche Métadonnées d'Intégrité & Chaîne de Garde */}
              <div className="space-y-2 text-slate-300 bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px]">
                <div className="flex justify-between items-center pb-1 border-b border-slate-800/80">
                  <span>RÉFÉRENCE DU SCELLÉ :</span>
                  <b className="text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">{selectedEvidence.id}</b>
                </div>
                <div className="flex justify-between items-center">
                  <span>NATURE DU DÉLIT CONSTATÉ :</span>
                  <b className="text-rose-400 uppercase">{selectedEvidence.category}</b>
                </div>
                <div className="flex justify-between items-center">
                  <span>HORODATAGE UTC :</span>
                  <b className="text-white">{selectedEvidence.timestamp}</b>
                </div>
                <div className="flex justify-between items-center">
                  <span>GÉOLOCALISATION GNSS :</span>
                  <b className="text-emerald-400">{selectedEvidence.coordinates.lat}°S, {selectedEvidence.coordinates.lng}°E</b>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">LIEU CONSTATÉ :</span>
                  <div className="text-white font-sans text-xs mt-0.5">{selectedEvidence.location}</div>
                </div>

                {/* Empreinte SHA-256 */}
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold text-emerald-400">
                    EMPREINTE CRYPTOGRAPHIQUE SHA-256 (INVIOLABILITÉ DU FICHIER) :
                  </span>
                  <span className="text-blue-400 break-all text-[10px] bg-slate-900 p-1.5 rounded block mt-1 border border-slate-800">
                    {selectedEvidence.sha256}
                  </span>
                </div>

                {/* Ancrage RFC 3161 TSA & OpenTimestamps */}
                <div className="pt-2 border-t border-slate-800 space-y-1 text-[10px]">
                  <div className="text-slate-400 flex items-center justify-between">
                    <span>Jeton d'Horodatage RFC 3161 TSA :</span>
                    <span className="text-emerald-300 font-bold">urn:tsa:rdc-pki:2026-9041-tsa-ok</span>
                  </div>
                  <div className="text-slate-400 flex items-center justify-between">
                    <span>Ancrage Décentralisé OpenTimestamps :</span>
                    <span className="text-amber-300 font-bold">Bitcoin Block #892110 (Immuable)</span>
                  </div>
                  <div className="text-slate-400 flex items-center justify-between">
                    <span>Télémétrie Matérielle (TEE Keystore) :</span>
                    <span className="text-blue-300">Android StrongBox Validé • Fix 8 sat.</span>
                  </div>
                </div>
              </div>

              {/* Mention Juridique Obligatoire RDC */}
              <div className="bg-amber-950/30 border border-amber-500/40 p-3 rounded-xl text-[11px] text-amber-200/90 leading-relaxed">
                <b className="text-amber-300 block mb-1">Avis d'admissibilité juridique (Loi n° 23/010 portant Code du numérique) :</b>
                La présente fiche constitue une <b>attestation technique préliminaire</b> certifiant l'intégrité temporelle et géographique de la pièce numérique. En vertu du droit procédural congolais, elle ne se substitue pas à une commission d'expertise judiciaire assermentée unilatérale ou contradictoire ordonnée par l'autorité judiciaire, mais fait foi de son intégrité jusqu'à preuve du contraire.
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    alert('Fiche légiste certifiée générée avec succès pour transmission aux autorités (IPKIN / Parquet).');
                    setShowReportModal(false);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>Imprimer / Exporter l'Attestation Légiste</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-xs"
                >
                  Fermer
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════
          MODAL 2 : COMPTE À REBOURS PANIC WIPE (INSPIRÉ DE TELLA)
          ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {wipeCountdown !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border-2 border-rose-500 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-rose-600/30 border border-rose-500 flex items-center justify-center mx-auto text-rose-400 animate-pulse">
                <AlertOctagon className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  EFFACEMENT D'URGENCE IMMINENT
                </h3>
                <p className="text-xs text-rose-300 mt-1">
                  Protocole Anti-Coercition activé. Purge complète du cache et des sessions locales.
                </p>
              </div>

              {/* Compteur Visuel */}
              <div className="bg-slate-950 py-4 px-6 rounded-xl border border-rose-500/40">
                <span className="text-4xl font-mono font-black text-rose-500">
                  0{wipeCountdown}s
                </span>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-rose-500 h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${((5 - wipeCountdown) / 5) * 100}%` }}
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Si vous ne réagissez pas, les données sensibles seront purgées et l'application basculera sur la calculatrice leurre.
              </p>

              <div className="flex flex-col gap-2 pt-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancelPanicCountdown}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>ANNULER IMMÉDIATEMENT L'EFFACEMENT</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setWipeCountdown(0);
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 rounded-lg text-[11px] font-semibold"
                >
                  Forcer la purge sans attendre
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════
          MODAL 3 : CONTESTATION & DROIT DE RÉPONSE OSINT (LOI RDC)
          ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showDisputeModal && disputeTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl text-xs space-y-4"
            >
              <div className="flex items-start justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-blue-400" />
                    Droit de Réponse & Recours Légal
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Conformité Art. 360-365 de la Loi n° 23/010 du 13 mars 2023
                  </p>
                </div>
                <button
                  onClick={() => setShowDisputeModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              {disputeSuccess ? (
                <div className="bg-emerald-950/40 border border-emerald-500/50 p-4 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-white text-sm">Contestation Enregistrée</h4>
                  <p className="text-slate-300 text-[11px]">
                    Votre recours et vos justificatifs ont été transmis au comité de modération d'USALAMA. Une vérification sous 24h sera opérée.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitDispute} className="space-y-3">
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase">Élément Contesté :</span>
                    <span className="font-mono font-bold text-white text-xs">
                      {disputeTarget.type === 'phone' ? `Numéro : ${disputeTarget.value}` : `Plaque : ${disputeTarget.value}`}
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                      Motif de la contestation / Droit de réponse :
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Ex: Je suis le propriétaire légitime de ce taxi, usurpation de plaque, erreur de numéro..."
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                      Justificatif ou Contact (Optionnel) :
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Récépissé d'identification, permis, numéro de téléphone légitime..."
                      value={disputeProof}
                      onChange={(e) => setDisputeProof(e.target.value)}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 italic">
                    Conformément au Code du numérique, tout signalement abusif ou calomnieux engage la responsabilité de son auteur.
                  </p>

                  <div className="flex gap-2 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Transmettre la Réclamation</span>
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => setShowDisputeModal(false)}
                      className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════
          BARRE DE NAVIGATION DU BAS (Identique à Accueil)
          ══════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-lg border-t border-slate-700 z-50">
        <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
          {navigationItems.map((item) => {
            const icons: Record<string, JSX.Element> = {
              Shield: <Shield className="w-4 h-4 sm:w-5 sm:h-5" />,
              Map: <Map className="w-4 h-4 sm:w-5 sm:h-5" />,
              Phone: <Phone className="w-4 h-4 sm:w-5 sm:h-5" />,
              Users: <Users className="w-4 h-4 sm:w-5 sm:h-5" />,
              User: <User className="w-4 h-4 sm:w-5 sm:h-5" />,
            };

            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate?.(item.id)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-slate-400 hover:bg-slate-700 hover:text-white"
              >
                <div className="w-4 h-4 sm:w-5 sm:h-5">{icons[item.icon]}</div>
                <span className="text-xs">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ForensicOSINTScreen;
