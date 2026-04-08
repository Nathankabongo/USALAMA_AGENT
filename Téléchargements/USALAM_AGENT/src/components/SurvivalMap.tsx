import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, MapPin, Navigation, Shield, Users, Heart, Phone,
  Volume2, VolumeX, X, Star, Activity, Bell, User,
  Wifi, Zap, Eye, EyeOff
} from 'lucide-react';
import KinshasaMap, { MapStyle, MapMarker, MapPolyline } from './map/KinshasaMap';
import { NavigationProps } from '../types/navigation';

interface SafePoint {
  id: string;
  name: string;
  type: 'hospital' | 'police' | 'church' | 'supermarket' | 'community';
  coordinates: { lat: number; lng: number };
  distance: number;
  isOpen24h: boolean;
  hasSecurity: boolean;
  rating: number;
  phone?: string;
}

interface StreetVitality {
  id: string;
  name: string;
  vitalityScore: number;
  status: 'active' | 'quiet' | 'deserted';
  userCount: number;
  lightLevel: number;
  points: [number, number][];
}

const SAFE_POINTS: SafePoint[] = [
  {
    id: '1',
    name: 'Hôpital Général de Kinshasa',
    type: 'hospital',
    coordinates: { lat: -4.435, lng: 15.27 },
    distance: 0.5,
    isOpen24h: true,
    hasSecurity: true,
    rating: 4.5,
    phone: '123',
  },
  {
    id: '2',
    name: 'Commissariat de Gombe',
    type: 'police',
    coordinates: { lat: -4.4447, lng: 15.267 },
    distance: 1.2,
    isOpen24h: true,
    hasSecurity: true,
    rating: 4.2,
    phone: '117',
  },
  {
    id: '3',
    name: 'Église Sainte Anne',
    type: 'church',
    coordinates: { lat: -4.4431, lng: 15.2685 },
    distance: 0.8,
    isOpen24h: false,
    hasSecurity: false,
    rating: 4.0,
  },
  {
    id: '4',
    name: 'Supermarché Kin Mart',
    type: 'supermarket',
    coordinates: { lat: -4.445, lng: 15.269 },
    distance: 1.5,
    isOpen24h: false,
    hasSecurity: true,
    rating: 3.8,
  },
  {
    id: '5',
    name: 'Centre Communautaire USALAMA',
    type: 'community',
    coordinates: { lat: -4.4425, lng: 15.2675 },
    distance: 0.3,
    isOpen24h: true,
    hasSecurity: true,
    rating: 5.0,
  },
  {
    id: '6',
    name: 'Commissariat de Limete',
    type: 'police',
    coordinates: { lat: -4.396, lng: 15.315 },
    distance: 4.1,
    isOpen24h: true,
    hasSecurity: true,
    rating: 3.7,
    phone: '117',
  },
];

const STREET_VITALITY: StreetVitality[] = [
  {
    id: '1',
    name: 'Avenue Kasa-Vubu',
    vitalityScore: 85,
    status: 'active',
    userCount: 150,
    lightLevel: 80,
    points: [[-4.4419, 15.2600], [-4.4419, 15.2663], [-4.4419, 15.272]],
  },
  {
    id: '2',
    name: 'Boulevard du 30 Juin',
    vitalityScore: 92,
    status: 'active',
    userCount: 280,
    lightLevel: 95,
    points: [[-4.426, 15.275], [-4.426, 15.285], [-4.426, 15.295]],
  },
  {
    id: '3',
    name: 'Rue de la Justice',
    vitalityScore: 35,
    status: 'quiet',
    userCount: 20,
    lightLevel: 40,
    points: [[-4.440, 15.265], [-4.440, 15.270], [-4.440, 15.275]],
  },
  {
    id: '4',
    name: 'Avenue des Aviateurs',
    vitalityScore: 15,
    status: 'deserted',
    userCount: 5,
    lightLevel: 20,
    points: [[-4.450, 15.258], [-4.450, 15.263], [-4.450, 15.268]],
  },
];

const SAFE_POINT_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  hospital: { icon: '🏥', color: '#ef4444', label: 'Hôpital' },
  police: { icon: '🚔', color: '#3b82f6', label: 'Police' },
  church: { icon: '⛪', color: '#a855f7', label: 'Église' },
  supermarket: { icon: '🏪', color: '#22c55e', label: 'Marché' },
  community: { icon: '🛡️', color: '#f59e0b', label: 'Communauté' },
};

const SurvivalMap = ({ onNavigate }: NavigationProps) => {
  const [selectedPoint, setSelectedPoint] = useState<SafePoint | null>(null);
  const [userPosition] = useState<[number, number]>([-4.4419, 15.2663]);
  const [mapStyle, setMapStyle] = useState<MapStyle>('dark');
  const [showVitality, setShowVitality] = useState(true);
  const [showSafePoints, setShowSafePoints] = useState(true);
  const [voiceCommandActive, setVoiceCommandActive] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-4.4419, 15.2663]);
  const [mapZoom, setMapZoom] = useState(14);
  const [activeTab, setActiveTab] = useState<'points' | 'vitality'>('points');
  const [navigatingTo, setNavigatingTo] = useState<SafePoint | null>(null);

  const getSafePointIcon = (type: string) => SAFE_POINT_CONFIG[type]?.icon || '📍';
  const getSafePointColor = (type: string) => SAFE_POINT_CONFIG[type]?.color || '#94a3b8';

  const getVitalityColor = (score: number) => {
    if (score >= 70) return '#22c55e';
    if (score >= 40) return '#eab308';
    return '#ef4444';
  };

  const getVitalityStatus = (status: string) => {
    switch (status) {
      case 'active': return { text: 'Animée', color: 'text-green-400', bg: 'bg-green-600/20 border-green-600/30' };
      case 'quiet': return { text: 'Calme', color: 'text-yellow-400', bg: 'bg-yellow-600/20 border-yellow-600/30' };
      case 'deserted': return { text: 'Déserte', color: 'text-red-400', bg: 'bg-red-600/20 border-red-600/30' };
      default: return { text: 'Inconnue', color: 'text-slate-400', bg: 'bg-slate-600/20 border-slate-600/30' };
    }
  };

  const callSafePoint = (point: SafePoint) => {
    if (point.phone) window.location.href = `tel:${point.phone}`;
  };

  const navigateTo = (point: SafePoint) => {
    setNavigatingTo(point);
    setSelectedPoint(null);
    setMapCenter([point.coordinates.lat, point.coordinates.lng]);
    setMapZoom(15);
  };

  const focusOnPoint = (point: SafePoint) => {
    setSelectedPoint(point);
    setMapCenter([point.coordinates.lat, point.coordinates.lng]);
    setMapZoom(16);
  };

  // Marqueurs pour la carte
  const mapMarkers: MapMarker[] = [
    ...(showSafePoints ? SAFE_POINTS.map(p => ({
      id: p.id,
      lat: p.coordinates.lat,
      lng: p.coordinates.lng,
      type: 'safe' as const,
      icon: getSafePointIcon(p.type),
      color: getSafePointColor(p.type),
      label: p.name,
    })) : []),
    ...(navigatingTo ? [{
      id: 'nav-dest',
      lat: navigatingTo.coordinates.lat,
      lng: navigatingTo.coordinates.lng,
      type: 'destination' as const,
      icon: '🎯',
      label: navigatingTo.name,
      color: '#22c55e',
    }] : []),
  ];

  // Polylines de vitalité des rues
  const mapPolylines: MapPolyline[] = showVitality ? STREET_VITALITY.map(street => ({
    id: street.id,
    points: street.points,
    color: getVitalityColor(street.vitalityScore),
    weight: 6,
  })) : [];

  // Itinéraire vers destination sélectionnée
  if (navigatingTo) {
    mapPolylines.push({
      id: 'nav-route',
      points: [
        userPosition,
        [
          (userPosition[0] + navigatingTo.coordinates.lat) / 2,
          (userPosition[1] + navigatingTo.coordinates.lng) / 2,
        ],
        [navigatingTo.coordinates.lat, navigatingTo.coordinates.lng],
      ],
      color: '#22c55e',
      weight: 4,
      dashArray: '8, 4',
    });
  }

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden">

      {/* ═══ CARTE ═══ */}
      <div className="absolute inset-0">
        <KinshasaMap
          center={mapCenter}
          zoom={mapZoom}
          mapStyle={mapStyle}
          markers={mapMarkers}
          polylines={mapPolylines}
          userPosition={userPosition}
        />
      </div>

      {/* ═══ HEADER ═══ */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-slate-900/90 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate?.('enhanced-home')}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div>
              <h1 className="text-white font-bold text-sm">Cartographie de Survie</h1>
              <p className="text-green-400 text-xs">Kinshasa — {SAFE_POINTS.length} points sûrs</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Style de carte */}
            <div className="flex bg-white/10 rounded-xl p-0.5 gap-0.5">
              {([
                { value: 'dark', label: '🌙' },
                { value: 'standard', label: '🗺️' },
                { value: 'satellite', label: '🛰️' },
              ] as { value: MapStyle; label: string }[]).map(s => (
                <button
                  key={s.value}
                  onClick={() => setMapStyle(s.value)}
                  className={`w-8 h-7 rounded-lg text-sm transition-all ${
                    mapStyle === s.value ? 'bg-blue-600 shadow-lg' : 'hover:bg-white/10'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Voix */}
            <button
              onClick={() => setVoiceCommandActive(!voiceCommandActive)}
              className={`p-2 rounded-xl transition-colors ${voiceCommandActive ? 'bg-red-600' : 'bg-white/10 hover:bg-white/20'}`}
            >
              {voiceCommandActive ? <Volume2 className="w-4 h-4 text-white" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setActiveTab('points')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'points' ? 'bg-green-600 text-white' : 'bg-white/10 text-slate-400 hover:text-white'
            }`}
          >
            🛡️ Points sûrs
          </button>
          <button
            onClick={() => setActiveTab('vitality')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'vitality' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-400 hover:text-white'
            }`}
          >
            📊 Vitalité des rues
          </button>
          <button
            onClick={() => setShowVitality(!showVitality)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              showVitality ? 'bg-teal-600 text-white' : 'bg-white/10 text-slate-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ═══ PANNEAU INFÉRIEUR SCROLLABLE ═══ */}
      <div className="absolute bottom-16 left-0 right-0 z-[800] max-h-[45vh] overflow-hidden">
        <div className="bg-slate-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl">
          {/* Poignée */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>

          <div className="px-4 pb-4 overflow-y-auto max-h-[35vh]">

            {activeTab === 'points' && (
              <div className="space-y-2">
                {SAFE_POINTS.map((point, index) => (
                  <motion.div
                    key={point.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => focusOnPoint(point)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-3 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: `${getSafePointColor(point.type)}25`, border: `1px solid ${getSafePointColor(point.type)}40` }}
                        >
                          {getSafePointIcon(point.type)}
                        </div>
                        <div>
                          <div className="text-white text-sm font-semibold leading-tight">{point.name}</div>
                          <div className="text-slate-400 text-xs mt-0.5 flex items-center gap-2">
                            <span>{point.distance} km</span>
                            {point.isOpen24h && <span className="text-green-400">• 24h/24</span>}
                            {point.hasSecurity && <span className="text-blue-400">• Gardé</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400" />
                          <span className="text-white text-xs font-medium">{point.rating}</span>
                        </div>
                        <div className="flex gap-1">
                          {point.phone && (
                            <button
                              onClick={(e) => { e.stopPropagation(); callSafePoint(point); }}
                              className="p-1.5 bg-green-600/80 hover:bg-green-600 rounded-lg transition-colors"
                            >
                              <Phone className="w-3 h-3 text-white" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); navigateTo(point); }}
                            className="p-1.5 bg-blue-600/80 hover:bg-blue-600 rounded-lg transition-colors"
                          >
                            <Navigation className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'vitality' && (
              <div className="space-y-2">
                <div className="text-slate-400 text-xs mb-3 text-center">
                  Les lignes colorées sur la carte indiquent l'activité des rues
                </div>
                {STREET_VITALITY.map((street, index) => {
                  const statusInfo = getVitalityStatus(street.status);
                  return (
                    <motion.div
                      key={street.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border rounded-2xl p-3 ${statusInfo.bg}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-sm font-semibold">{street.name}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-black/20 ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                        <span>👥 {street.userCount} personnes</span>
                        <span>💡 Éclairage {street.lightLevel}%</span>
                      </div>
                      <div className="w-full bg-black/30 rounded-full h-1.5">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${street.vitalityScore}%`,
                            backgroundColor: getVitalityColor(street.vitalityScore),
                          }}
                        />
                      </div>
                      <div className="text-right mt-1" style={{ color: getVitalityColor(street.vitalityScore), fontSize: '11px', fontWeight: 600 }}>
                        {street.vitalityScore}% vitalité
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ MODAL POINT SÛR ═══ */}
      <AnimatePresence>
        {selectedPoint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-end justify-center"
            onClick={() => setSelectedPoint(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-slate-900 border border-white/10 rounded-t-3xl p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              {/* Icône et nom */}
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: `${getSafePointColor(selectedPoint.type)}20`, border: `2px solid ${getSafePointColor(selectedPoint.type)}40` }}
                >
                  {getSafePointIcon(selectedPoint.type)}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">{selectedPoint.name}</h3>
                  <p className="text-slate-400 text-sm">{SAFE_POINT_CONFIG[selectedPoint.type]?.label}</p>
                </div>
              </div>

              {/* Infos */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: 'Distance', value: `${selectedPoint.distance} km`, color: 'text-blue-400' },
                  { label: 'Ouverture', value: selectedPoint.isOpen24h ? '24h/24' : 'Horaires limités', color: selectedPoint.isOpen24h ? 'text-green-400' : 'text-yellow-400' },
                  { label: 'Sécurité', value: selectedPoint.hasSecurity ? '✓ Présente' : '✗ Aucune', color: selectedPoint.hasSecurity ? 'text-green-400' : 'text-red-400' },
                  { label: 'Note', value: `⭐ ${selectedPoint.rating}/5`, color: 'text-yellow-400' },
                ].map(info => (
                  <div key={info.label} className="bg-white/5 rounded-xl p-3">
                    <div className="text-slate-400 text-xs mb-1">{info.label}</div>
                    <div className={`font-semibold text-sm ${info.color}`}>{info.value}</div>
                  </div>
                ))}
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3">
                {selectedPoint.phone && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => callSafePoint(selectedPoint)}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-600/25"
                  >
                    <Phone className="w-4 h-4" />
                    Appeler
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigateTo(selectedPoint)}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-600/25"
                >
                  <Navigation className="w-4 h-4" />
                  S'y rendre
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation active */}
      <AnimatePresence>
        {navigatingTo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-[130px] left-4 right-4 z-[900] bg-green-900/90 backdrop-blur-xl border border-green-500/40 rounded-2xl px-4 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <div>
                <div className="text-green-300 text-xs">Navigation vers</div>
                <div className="text-white text-sm font-semibold">{navigatingTo.name}</div>
              </div>
            </div>
            <button
              onClick={() => setNavigatingTo(null)}
              className="bg-white/10 hover:bg-white/20 rounded-xl p-1.5 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ NAVIGATION BAS ═══ */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-slate-900/95 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-center justify-around py-2 px-4">
          {[
            { id: 'enhanced-home', label: 'Accueil', icon: <Shield className="w-5 h-5" /> },
            { id: 'enhanced-map', label: 'Carte', icon: <Map className="w-5 h-5" /> },
            { id: 'sos', label: 'SOS', icon: <Phone className="w-5 h-5" />, sos: true },
            { id: 'alerts', label: 'Alertes', icon: <Bell className="w-5 h-5" /> },
            { id: 'profile', label: 'Profil', icon: <User className="w-5 h-5" /> },
          ].map(item => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onNavigate?.(item.id as any)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors ${
                item.id === 'survival'
                  ? 'text-green-400'
                  : item.sos
                  ? 'text-red-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SurvivalMap;
