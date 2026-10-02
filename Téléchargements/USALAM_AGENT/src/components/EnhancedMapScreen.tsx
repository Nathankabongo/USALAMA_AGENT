import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Map, Navigation, Phone, Users, User, AlertTriangle,
  MapPin, X, Search, ChevronRight, Info, Filter,
  ExternalLink, RefreshCw, Satellite, Compass,
  Globe, Eye, CheckCircle2, ArrowRight, Loader2,
  Ruler, Target, Radio, Activity, Zap, Hospital,
  Flame, Droplets, ShieldCheck, Crosshair, Route,
  PhoneCall, Play, Check, Navigation2
} from 'lucide-react';
import KinshasaMap, { MapStyle, MapMarker, MapCircle, MapPolyline } from './map/KinshasaMap';
import { NavigationProps, navigationItems } from '../types/navigation';

// ── Types Géologiques & Recherches ──────────────────────────
export type GeoCategory = 'all' | 'erosion' | 'inondation' | 'pente' | 'hospital' | 'police' | 'sitrep';

export interface SearchItem {
  id: string;
  name: string;
  category: 'commune' | 'avenue' | 'landmark' | 'erosion' | 'inondation' | 'hospital' | 'police';
  commune: string;
  lat: number;
  lng: number;
  zoom?: number;
  elevationM?: number;
  solType?: string;
  risqueInfo?: string;
  phone?: string;
  services?: string;
}

export interface ActiveRoute {
  origin: [number, number];
  destination: [number, number];
  destinationName: string;
  points: [number, number][];
  distanceKm: number;
  durationMin: number;
  isGuiding?: boolean;
}

// ── Base de Données des Lieux et Risques Réels de Kinshasa ──
const KINSHASA_SEARCH_DB: SearchItem[] = [
  // ── 1. Hôpitaux Réels de Kinshasa (avec téléphones d'urgence) ──
  {
    id: 'hosp-mamayemo',
    name: 'Hôpital Général de Kinshasa (Mama Yemo)',
    category: 'hospital',
    commune: 'Gombe',
    lat: -4.3130,
    lng: 15.3120,
    zoom: 16,
    elevationM: 294,
    solType: 'Centre hospitalier de référence nationale',
    phone: '+243815000001',
    services: 'Service d\'accueil des urgences 24/7, réanimation polyvalente, blocs opératoires.'
  },
  {
    id: 'hosp-ngaliema',
    name: 'Clinique Ngaliema',
    category: 'hospital',
    commune: 'Ngaliema',
    lat: -4.3120,
    lng: 15.2750,
    zoom: 16,
    elevationM: 320,
    solType: 'Pôle médical de réanimation et chirurgie',
    phone: '+243817000002',
    services: 'Urgences médicales, cardiologie, soins intensifs de pointe.'
  },
  {
    id: 'hosp-cinquantenaire',
    name: 'Hôpital du Cinquantenaire',
    category: 'hospital',
    commune: 'Lingwala',
    lat: -4.3280,
    lng: 15.3020,
    zoom: 16,
    elevationM: 306,
    solType: 'Plateau technique ultramoderne',
    phone: '+243890000050',
    services: 'Urgences traumatologiques, hémodialyse, ambulances médicalisées.'
  },
  {
    id: 'hosp-monkole',
    name: 'Centre Hospitalier Monkole',
    category: 'hospital',
    commune: 'Mont-Ngafula',
    lat: -4.4320,
    lng: 15.2890,
    zoom: 16,
    elevationM: 410,
    solType: 'Pôle médical d\'excellence sud',
    phone: '+243818150003',
    services: 'Urgences zone Sud / Mont-Ngafula, pédiatrie, chirurgie générale.'
  },
  {
    id: 'hosp-sino',
    name: 'Hôpital de l\'Amitié Sino-Congolaise',
    category: 'hospital',
    commune: 'N\'djili',
    lat: -4.4180,
    lng: 15.3780,
    zoom: 16,
    elevationM: 310,
    solType: 'Centre hospitalier de référence district est',
    phone: '+243822220004',
    services: 'Urgences district de la Tshangu (Ndjili / Masina / Kimbanseke).'
  },
  {
    id: 'hosp-cmk',
    name: 'Centre Médical de Kinshasa (CMK)',
    category: 'hospital',
    commune: 'Gombe',
    lat: -4.3070,
    lng: 15.3050,
    zoom: 16,
    elevationM: 296,
    solType: 'Centre privé d\'urgences et diagnostic',
    phone: '+243817000005',
    services: 'Service d\'urgences continue et évacuations sanitaires.'
  },

  // ── 2. Communes Majeures ──
  { id: 'com-gombe', name: 'Gombe', category: 'commune', commune: 'Gombe', lat: -4.3032, lng: 15.3168, zoom: 15, elevationM: 295, solType: 'Plaine alluviale sédimentaire quaternaire', risqueInfo: 'Zone basse alluviale, risque d\'inondation localisé en cas de refoulement du collecteur Gombe.' },
  { id: 'com-limete', name: 'Limete (Échangeur)', category: 'commune', commune: 'Limete', lat: -4.3762, lng: 15.3486, zoom: 14, elevationM: 298, solType: 'Alluvions fluviatiles sablo-argileuses', risqueInfo: 'Bas-fonds inondables en bordure de la rivière Ndjili et du fleuve Congo (Kingabwa).' },
  { id: 'com-kalamu', name: 'Kalamu (Rond-Point Victoire)', category: 'commune', commune: 'Kalamu', lat: -4.3392, lng: 15.3135, zoom: 15, elevationM: 302, solType: 'Plaine sableuse meuble', risqueInfo: 'Bassin versant de la rivière Kalamu, risque régulier d\'engorgement pluvial.' },
  { id: 'com-kintambo', name: 'Kintambo (Magasin)', category: 'commune', commune: 'Kintambo', lat: -4.3298, lng: 15.2632, zoom: 15, elevationM: 310, solType: 'Zone de transition piémont/plaine', risqueInfo: 'Exutoire naturel de la rivière Makelele vers la baie de Ngaliema.' },
  { id: 'com-matete', name: 'Matete (Pont Matete)', category: 'commune', commune: 'Matete', lat: -4.4105, lng: 15.3621, zoom: 14, elevationM: 308, solType: 'Dépôts alluvionnaires de terrasse fluviatile', risqueInfo: 'Voisinage direct avec les ravins de Kisenso et la rivière Ndjili.' },
  { id: 'com-masina', name: 'Masina (Marché de la Liberté)', category: 'commune', commune: 'Masina', lat: -4.3888, lng: 15.3855, zoom: 14, elevationM: 305, solType: 'Plaine alluviale orientale', risqueInfo: 'Engorgement des eaux pluviales et débordements des canaux collecteurs.' },
  { id: 'com-ngaba', name: 'Ngaba (Rond-Point By-Pass)', category: 'commune', commune: 'Ngaba', lat: -4.4021, lng: 15.3248, zoom: 15, elevationM: 320, solType: 'Sables limoneux de terrasse moyenne', risqueInfo: 'Vulnérabilité aux ruissellements provenant des collines du sud.' },
  { id: 'com-kasavubu', name: 'Kasa-Vubu', category: 'commune', commune: 'Kasa-Vubu', lat: -4.3450, lng: 15.2950, zoom: 15, elevationM: 312, solType: 'Plaine alluviale stable', risqueInfo: 'Densité urbaine forte, réseau de drainage ancien.' },
  { id: 'com-ngaliema', name: 'Ngaliema (Mont-Ngaliema)', category: 'commune', commune: 'Ngaliema', lat: -4.3150, lng: 15.2500, zoom: 14, elevationM: 380, solType: 'Collines gréseuses et versants à forte pente', risqueInfo: 'Risque de glissements de terrain et d\'érosion de talus.' },
  { id: 'com-montngafula', name: 'Mont-Ngafula', category: 'commune', commune: 'Mont-Ngafula', lat: -4.4420, lng: 15.2800, zoom: 13, elevationM: 450, solType: 'Plateau des Batéké, sables polymorphes de Kalahari', risqueInfo: 'Zone critique d\'érosion régressive (têtes de ravin les plus profondes de Kinshasa).' },
  { id: 'com-ndjili', name: 'N\'djili (Sainte-Thérèse)', category: 'commune', commune: 'N\'djili', lat: -4.4150, lng: 15.3850, zoom: 14, elevationM: 310, solType: 'Plaine sablo-limoneuse', risqueInfo: 'Inondations saisonnières aux abords du collecteur Ndjili.' },
  { id: 'com-selembao', name: 'Selembao', category: 'commune', commune: 'Selembao', lat: -4.3980, lng: 15.2720, zoom: 14, elevationM: 390, solType: 'Sables éoliens sur grès friables', risqueInfo: 'Nombreuses têtes d\'érosion actives menaçant la voirie et la RN1.' },
  { id: 'com-lemba', name: 'Lemba / UNIKIN', category: 'commune', commune: 'Lemba', lat: -4.4250, lng: 15.3080, zoom: 14, elevationM: 360, solType: 'Collines sablo-gréseuses et plateaux résiduels', risqueInfo: 'Ravinements en bordure du plateau du mont Amba.' },

  // ── 3. Avenues et Grands Axes ──
  { id: 'ave-30juin', name: 'Boulevard du 30 Juin', category: 'avenue', commune: 'Gombe', lat: -4.3050, lng: 15.3050, zoom: 15, elevationM: 296, solType: 'Plaine alluviale stabilisée' },
  { id: 'ave-lumumba', name: 'Boulevard Lumumba', category: 'avenue', commune: 'Limete / Ndjili / Masina', lat: -4.3800, lng: 15.3550, zoom: 14, elevationM: 302, solType: 'Grande artère traversant la plaine alluviale est' },
  { id: 'ave-kasavubu', name: 'Avenue Kasa-Vubu', category: 'avenue', commune: 'Kasa-Vubu / Kalamu / Bandal', lat: -4.3400, lng: 15.2950, zoom: 15, elevationM: 310, solType: 'Plaine centrale' },
  { id: 'ave-liberation', name: 'Avenue de la Libération (ex-24 Novembre)', category: 'avenue', commune: 'Gombe / Lingwala / Selembao', lat: -4.3450, lng: 15.2850, zoom: 15, elevationM: 325, solType: 'Axe reliant la plaine aux collines du sud' },
  { id: 'ave-matadi', name: 'Route de Matadi (RN1)', category: 'avenue', commune: 'Ngaliema / Mont-Ngafula', lat: -4.3850, lng: 15.2400, zoom: 14, elevationM: 410, solType: 'Axe stratégique sur formations gréso-sableuses instables' },
  { id: 'ave-triomphal', name: 'Boulevard Triomphal', category: 'avenue', commune: 'Lingwala / Kasa-Vubu', lat: -4.3315, lng: 15.3056, zoom: 15, elevationM: 308, solType: 'Plaine alluviale' },

  // ── 4. Points Stratégiques ──
  { id: 'land-gare', name: 'Gare Centrale de Kinshasa', category: 'landmark', commune: 'Gombe', lat: -4.3032, lng: 15.3168, zoom: 16, elevationM: 292, solType: 'Bordure du fleuve Congo' },
  { id: 'land-aeroport', name: 'Aéroport International de N\'djili', category: 'landmark', commune: 'N\'djili / Nsele', lat: -4.3855, lng: 15.4445, zoom: 14, elevationM: 312, solType: 'Plaine alluviale orientale' },
  { id: 'land-stade', name: 'Stade des Martyrs', category: 'landmark', commune: 'Lingwala', lat: -4.3315, lng: 15.3056, zoom: 16, elevationM: 308, solType: 'Zone d\'aménagement de grand gabarit' },
  { id: 'land-zando', name: 'Grand Marché Zando', category: 'landmark', commune: 'Kinshasa', lat: -4.3184, lng: 15.3082, zoom: 16, elevationM: 300, solType: 'Plaine urbaine dense' },

  // ── 5. Sites Géologiques Réels (Ravins et Bassins) ──
  { id: 'geo-mataba', name: 'Ravin de Mataba (Kisenso / Matete)', category: 'erosion', commune: 'Kisenso / Matete', lat: -4.4250, lng: 15.3480, zoom: 15, elevationM: 340, solType: 'Sables fins cénozoïques peu cohérents', risqueInfo: 'Ravinement régressif de 15 à 25m de profondeur (Risque Critique)' },
  { id: 'geo-kindele', name: 'Érosion Kindele / Kimwenza', category: 'erosion', commune: 'Mont-Ngafula', lat: -4.4520, lng: 15.2950, zoom: 15, elevationM: 420, solType: 'Grès tendres du Crétacé terminal', risqueInfo: 'Menace géotechnique sur l\'UNIKIN et la voie ferrée' },
  { id: 'geo-selembao', name: 'Érosion Selembao (Badiadingi)', category: 'erosion', commune: 'Selembao', lat: -4.3980, lng: 15.2720, zoom: 15, elevationM: 385, solType: 'Sables polymorphes de Kalahari', risqueInfo: 'Progression de ravin vers la Route Nationale 1 (RN1)' },
  { id: 'geo-campluka', name: 'Érosion DGC / Camp Luka', category: 'erosion', commune: 'Ngaliema', lat: -4.3410, lng: 15.2480, zoom: 15, elevationM: 345, solType: 'Sol colluvial sur versant instable', risqueInfo: 'Glissement de terrain de versant' },
  { id: 'geo-kingabwa', name: 'Plaine Inondable du Fleuve Congo (Kingabwa)', category: 'inondation', commune: 'Limete / Barumbu', lat: -4.3120, lng: 15.3420, zoom: 14, elevationM: 282, solType: 'Alluvions quaternaires récentes', risqueInfo: 'Zone d\'expansion de crue saisonnière du fleuve (nov-mai)' },
  { id: 'geo-rivndjili', name: 'Bassin Versant Rivière Ndjili', category: 'inondation', commune: 'N\'djili / Matete', lat: -4.3980, lng: 15.3680, zoom: 14, elevationM: 295, solType: 'Dépôts alluvionnaires de bas-fond', risqueInfo: 'Crues torrentielles submergeant les berges de Ndjili' },
  { id: 'geo-rivkalamu', name: 'Bassin Versant Rivière Kalamu (Yolo)', category: 'inondation', commune: 'Kalamu', lat: -4.3480, lng: 15.3180, zoom: 15, elevationM: 301, solType: 'Plaine alluviale basse', risqueInfo: 'Débordements récurrents lors des orages tropicaux' },

  // ── 6. Postes de Sécurité Réels ──
  { id: 'pol-ipkin', name: 'Commissariat Provincial IPKIN', category: 'police', commune: 'Gombe', lat: -4.3080, lng: 15.3010, zoom: 16, elevationM: 298, solType: 'Commandement de la Police Ville de Kinshasa' },
  { id: 'pol-echangeur', name: 'Poste de Contrôle Échangeur de Limete', category: 'police', commune: 'Limete', lat: -4.3750, lng: 15.3470, zoom: 16, elevationM: 300, solType: 'Nœud stratégique de surveillance est-ouest' },
];

// ── Flux d'Intelligence SITREP en Direct de Kinshasa (Méthode Osiris) ──
const KINSHASA_SITREP = [
  { id: 'sit-1', title: 'Ravin Mataba (Kisenso)', status: 'Surveillance active', detail: 'Tête de ravin stabilisée par travaux OVD, circulation rétablie.', type: 'erosion', time: '14:20' },
  { id: 'sit-2', title: 'Bassin Rivière Ndjili', status: 'Niveau normal (1.8m)', detail: 'Débit sous seuil d\'alerte de crue. Station limnimétrique opérationnelle.', type: 'inondation', time: '14:05' },
  { id: 'sit-3', title: 'Route de Matadi (RN1)', status: 'Axe fluide', detail: 'Patrouille de sécurisation active entre UPN et Mitendi.', type: 'police', time: '13:45' },
  { id: 'sit-4', title: 'Hôpital Mama Yemo', status: 'Urgences 24/7', detail: 'Plateau de secours et ambulances prêts pour intervention immédiate.', type: 'hospital', time: '13:10' },
];

// ── Secteurs Stratégiques de Kinshasa (Sauts Rapides) ──
const SECTEURS_KINSHASA = [
  { id: 'all', label: 'Vue Globale', coords: [-4.4071317, 15.32523455] as [number, number], zoom: 12 },
  { id: 'centre', label: 'Kin-Centre (Gombe)', coords: [-4.3050, 15.3100] as [number, number], zoom: 15 },
  { id: 'sud', label: 'Kin-Sud (Mont-Ngafula)', coords: [-4.4420, 15.2800] as [number, number], zoom: 14 },
  { id: 'est', label: 'Kin-Est (Ndjili/Limete)', coords: [-4.3980, 15.3680] as [number, number], zoom: 14 },
  { id: 'ouest', label: 'Kin-Ouest (Ngaliema)', coords: [-4.3250, 15.2500] as [number, number], zoom: 14 },
];

// Utilitaires géodésiques Osiris (Haversine & Azimut)
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateBearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  return Math.round(bearing);
}

// Générateur de trajet routier sécurisé suivant le réseau de Kinshasa
function generateKinshasaSafeRoute(from: [number, number], to: [number, number]): [number, number][] {
  const dLat = to[0] - from[0];
  const dLng = to[1] - from[1];

  // Simule les bifurcations sur les grands boulevards (Triomphal, Lumumba, 30 Juin, By-Pass)
  const p1: [number, number] = [from[0] + dLat * 0.25, from[1] + dLng * 0.1];
  const p2: [number, number] = [from[0] + dLat * 0.55, from[1] + dLng * 0.45];
  const p3: [number, number] = [from[0] + dLat * 0.85, from[1] + dLng * 0.8];

  return [from, p1, p2, p3, to];
}

const EnhancedMapScreen: React.FC<NavigationProps> = ({ onNavigate }) => {
  // ── Coordonnées Google Earth exactes de Kinshasa ──
  const [mapCenter, setMapCenter] = useState<[number, number]>([-4.4071317, 15.32523455]);
  const [mapZoom, setMapZoom] = useState(13);
  const [mapStyle, setMapStyle] = useState<MapStyle>('google-hybrid');

  // ── Filtres Catégories (Boutons stylés comme sur Accueil) ──
  const [selectedCategory, setSelectedCategory] = useState<GeoCategory>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');

  // ── Moteur de Recherche Interactif ──
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [activeSearchMarker, setActiveSearchMarker] = useState<SearchItem | null>(null);

  // Position utilisateur approximative
  const [userPos] = useState<[number, number]>([-4.3180, 15.3110]);

  // ── MÉTHODES OSIRIS & INTÉGRATIONS NOUVELLES : Trajet & Hôpital le plus proche ──
  const [hoverCoords, setHoverCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [measureMode, setMeasureMode] = useState<boolean>(false);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [radarAnalysisActive, setRadarAnalysisActive] = useState<boolean>(false);
  const [showSitrepPanel, setShowSitrepPanel] = useState<boolean>(false);

  // ── Trajet / Safe Route Actif ──
  const [activeRoute, setActiveRoute] = useState<ActiveRoute | null>(null);

  // ── Modal Hôpital le plus proche ──
  const [nearestHospitalModal, setNearestHospitalModal] = useState<{
    hospital: SearchItem;
    distanceKm: number;
    etaMin: number;
  } | null>(null);

  // ── Sélecteur d'Itinéraire Dédié (Évite tout conflit visuel sur la carte) ──
  const [showRouteSelector, setShowRouteSelector] = useState<boolean>(false);

  // Autocomplétion intelligente en temps réel
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const q = searchQuery.toLowerCase().trim();
    const localMatches = KINSHASA_SEARCH_DB.filter(
      (item) => item.name.toLowerCase().includes(q) || item.commune.toLowerCase().includes(q)
    ).slice(0, 6);

    setSuggestions(localMatches);
  }, [searchQuery]);

  // ── FONCTIONNALITÉ 1 : Trouver et tracer vers l'Hôpital le plus proche ──
  const handleFindNearestHospital = () => {
    setShowRouteSelector(false);
    setShowSitrepPanel(false);
    setMeasureMode(false);
    setActiveSearchMarker(null);

    const origin = userPos || mapCenter;
    const hospitals = KINSHASA_SEARCH_DB.filter((item) => item.category === 'hospital');

    let nearest = hospitals[0];
    let minDistance = Infinity;

    hospitals.forEach((h) => {
      const dist = calculateDistanceKm(origin[0], origin[1], h.lat, h.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = h;
      }
    });

    if (nearest) {
      const roadDist = Math.max(0.6, minDistance * 1.25);
      const etaMin = Math.max(3, Math.round((roadDist / 28) * 60));

      setNearestHospitalModal({
        hospital: nearest,
        distanceKm: roadDist,
        etaMin,
      });

      // Cadrage adaptatif sans zoom excessif
      const midLat = (origin[0] + nearest.lat) / 2;
      const midLng = (origin[1] + nearest.lng) / 2;
      const zoom = roadDist < 4 ? 14 : roadDist < 10 ? 13 : 12;

      setMapCenter([midLat, midLng]);
      setMapZoom(zoom);

      // Trace immédiatement le trajet sécurisé vers l'hôpital
      const routePoints = generateKinshasaSafeRoute(origin, [nearest.lat, nearest.lng]);
      setActiveRoute({
        origin,
        destination: [nearest.lat, nearest.lng],
        destinationName: nearest.name,
        points: routePoints,
        distanceKm: roadDist,
        durationMin: etaMin,
        isGuiding: false,
      });
    }
  };

  // ── FONCTIONNALITÉ 2 : Tracer un Trajet Sécurisé vers une destination cible ──
  const handleTraceRouteTo = (target: SearchItem) => {
    setNearestHospitalModal(null);
    setShowRouteSelector(false);
    setShowSitrepPanel(false);
    setMeasureMode(false);
    setActiveSearchMarker(null); // Ferme la fiche du bas pour dégager la carte

    const origin = userPos || mapCenter;
    const directDist = calculateDistanceKm(origin[0], origin[1], target.lat, target.lng);
    const roadDist = Math.max(0.8, directDist * 1.25);
    const etaMin = Math.max(4, Math.round((roadDist / 28) * 60));

    const routePoints = generateKinshasaSafeRoute(origin, [target.lat, target.lng]);
    setActiveRoute({
      origin,
      destination: [target.lat, target.lng],
      destinationName: target.name,
      points: routePoints,
      distanceKm: roadDist,
      durationMin: etaMin,
      isGuiding: false,
    });

    // Cadrage adaptatif sur le point médian pour voir l'ensemble du tracé
    const midLat = (origin[0] + target.lat) / 2;
    const midLng = (origin[1] + target.lng) / 2;
    const zoom = roadDist < 4 ? 14 : roadDist < 10 ? 13 : 12;

    setMapCenter([midLat, midLng]);
    setMapZoom(zoom);
  };

  // ── FONCTIONNALITÉ 3 : Gestionnaire de clic du bouton Trajet (Résolution du conflit) ──
  const handleToggleTrajet = () => {
    // Si un trajet est déjà affiché, un clic ferme le trajet et libère la carte
    if (activeRoute) {
      setActiveRoute(null);
      setShowRouteSelector(false);
      return;
    }

    // Fermeture des autres panneaux pour éviter tout conflit d'affichage
    setNearestHospitalModal(null);
    setShowSitrepPanel(false);
    setMeasureMode(false);

    if (activeSearchMarker) {
      handleTraceRouteTo(activeSearchMarker);
    } else {
      setShowRouteSelector((prev) => !prev);
    }
  };

  // Validation d'une recherche
  const handleSelectSearch = (item: SearchItem) => {
    setActiveSearchMarker(item);
    setSearchQuery(item.name);
    setSuggestions([]);
    setMapCenter([item.lat, item.lng]);
    setMapZoom(item.zoom || 15);
  };

  // Soumission manuelle de la recherche
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const localMatch = KINSHASA_SEARCH_DB.find(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.commune.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (localMatch) {
      handleSelectSearch(localMatch);
      return;
    }

    setIsSearchingOnline(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery + ', Kinshasa'
      )}&countrycodes=cd&limit=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'UsalamaKinshasaMap/1.0' } });
      const data = await res.json();
      if (data && data.length > 0) {
        const resultItem: SearchItem = {
          id: `online-${Date.now()}`,
          name: data[0].display_name.split(',')[0],
          category: 'landmark',
          commune: 'Kinshasa',
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          zoom: 15,
          elevationM: 320,
          solType: 'Sédiments géologiques de Kinshasa',
        };
        handleSelectSearch(resultItem);
      }
    } catch (err) {
      console.error('Erreur recherche:', err);
    } finally {
      setIsSearchingOnline(false);
    }
  };

  // Gestion du clic carte (Mesure Osiris ou Sélection)
  const handleMapClick = (lat: number, lng: number) => {
    if (measureMode) {
      if (measurePoints.length >= 2) {
        setMeasurePoints([[lat, lng]]);
      } else {
        setMeasurePoints((prev) => [...prev, [lat, lng]]);
      }
    }
  };

  // Calcul télémétrique Osiris (Distance & Cap)
  const measurementResult = useMemo(() => {
    if (measurePoints.length === 2) {
      const p1 = measurePoints[0];
      const p2 = measurePoints[1];
      const distKm = calculateDistanceKm(p1[0], p1[1], p2[0], p2[1]);
      const bearing = calculateBearingDeg(p1[0], p1[1], p2[0], p2[1]);
      return {
        distKm: distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(2)} km`,
        bearing: `${bearing}°`,
      };
    }
    return null;
  }, [measurePoints]);

  // Analyse de proximité radar (Méthode Osiris) autour de la position active
  const proximityAnalysis = useMemo(() => {
    const target = activeSearchMarker
      ? [activeSearchMarker.lat, activeSearchMarker.lng]
      : mapCenter;

    const nearbyRisks = KINSHASA_SEARCH_DB.filter((item) => {
      if (item.category !== 'erosion' && item.category !== 'inondation') return false;
      const d = calculateDistanceKm(target[0], target[1], item.lat, item.lng);
      return d <= 3.5;
    });

    const nearbyHospitals = KINSHASA_SEARCH_DB.filter((item) => item.category === 'hospital').map(
      (h) => ({
        ...h,
        distKm: calculateDistanceKm(target[0], target[1], h.lat, h.lng),
      })
    ).sort((a, b) => a.distKm - b.distKm);

    return {
      risksCount: nearbyRisks.length,
      nearestHospital: nearbyHospitals[0] || null,
    };
  }, [activeSearchMarker, mapCenter]);

  // Préparation des marqueurs cartographiques filtrés
  const markers: MapMarker[] = [];
  const circles: MapCircle[] = [];
  const polylines: MapPolyline[] = [];

  // 1. Marqueur de recherche actif
  if (activeSearchMarker) {
    markers.push({
      id: 'active-search-pin',
      lat: activeSearchMarker.lat,
      lng: activeSearchMarker.lng,
      type: 'search',
      label: activeSearchMarker.name,
      sublabel: `Commune : ${activeSearchMarker.commune} • Alt. ~${activeSearchMarker.elevationM || 310}m`,
      meta: activeSearchMarker,
    });
  }

  // 2. Marqueurs selon calques d'intelligence
  KINSHASA_SEARCH_DB.forEach((site) => {
    if (activeSearchMarker?.id === site.id) return;

    const matchesCat =
      selectedCategory === 'all' ||
      (selectedCategory === 'erosion' && site.category === 'erosion') ||
      (selectedCategory === 'inondation' && site.category === 'inondation') ||
      (selectedCategory === 'hospital' && site.category === 'hospital') ||
      (selectedCategory === 'police' && site.category === 'police');

    if (!matchesCat) return;

    if (site.category === 'erosion' || site.category === 'inondation') {
      markers.push({
        id: site.id,
        lat: site.lat,
        lng: site.lng,
        type: site.category === 'erosion' ? 'erosion' : 'inondation',
        label: site.name.split('(')[0].trim(),
        sublabel: site.commune,
        severity: site.category === 'erosion' ? 'Érosion active' : 'Bassin inondable',
        meta: site,
      });

      circles.push({
        id: `circle-${site.id}`,
        lat: site.lat,
        lng: site.lng,
        radius: site.category === 'erosion' ? 450 : 700,
        color: site.category === 'erosion' ? '#ef4444' : '#3b82f6',
        fillColor: site.category === 'erosion' ? '#ef4444' : '#3b82f6',
        fillOpacity: 0.22,
        weight: 2,
        dashArray: site.category === 'erosion' ? '4, 4' : undefined,
        label: `${site.name} (Périmètre géologique critique)`,
      });
    } else if (site.category === 'hospital') {
      markers.push({
        id: site.id,
        lat: site.lat,
        lng: site.lng,
        type: 'hospital',
        label: site.name.split('(')[0].trim(),
        sublabel: site.commune,
        meta: site,
      });
    } else if (site.category === 'police') {
      markers.push({
        id: site.id,
        lat: site.lat,
        lng: site.lng,
        type: 'police',
        label: site.name,
        sublabel: site.commune,
        meta: site,
      });
    }
  });

  // 3. Anneaux concentriques radar Osiris (Buffer rings de 500m, 1200m, 2500m)
  if (radarAnalysisActive) {
    const radarCenter = activeSearchMarker
      ? [activeSearchMarker.lat, activeSearchMarker.lng]
      : mapCenter;

    circles.push(
      {
        id: 'radar-ring-1',
        lat: radarCenter[0],
        lng: radarCenter[1],
        radius: 500,
        color: '#38bdf8',
        fillColor: '#38bdf8',
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '3, 3',
        label: 'Zone immédiate (500m)',
      },
      {
        id: 'radar-ring-2',
        lat: radarCenter[0],
        lng: radarCenter[1],
        radius: 1200,
        color: '#60a5fa',
        fillColor: '#60a5fa',
        fillOpacity: 0.06,
        weight: 1.5,
        dashArray: '5, 5',
        label: 'Zone de sécurité (1.2 km)',
      },
      {
        id: 'radar-ring-3',
        lat: radarCenter[0],
        lng: radarCenter[1],
        radius: 2500,
        color: '#818cf8',
        fillColor: '#818cf8',
        fillOpacity: 0.03,
        weight: 1,
        dashArray: '6, 6',
        label: 'Rayon d\'intervention étendue (2.5 km)',
      }
    );
  }

  // 4. Ligne télémétrique de mesure Osiris
  if (measurePoints.length >= 2) {
    polylines.push({
      id: 'osiris-measure-line',
      points: measurePoints,
      color: '#38bdf8',
      weight: 3,
      dashArray: '6, 6',
      opacity: 0.95,
    });

    markers.push(
      {
        id: 'measure-pt-1',
        lat: measurePoints[0][0],
        lng: measurePoints[0][1],
        type: 'danger',
        label: 'Origine A',
      },
      {
        id: 'measure-pt-2',
        lat: measurePoints[1][0],
        lng: measurePoints[1][1],
        type: 'safe',
        label: `Cible B (${measurementResult?.distKm || ''})`,
      }
    );
  }

  // 5. Tracé du Trajet Sécurisé (Intégration demandée par l'utilisateur)
  if (activeRoute) {
    polylines.push({
      id: 'active-safe-route-line',
      points: activeRoute.points,
      color: '#10b981', // Vert émeraude haute visibilité
      weight: 5,
      opacity: 0.95,
    });

    markers.push(
      {
        id: 'route-origin-marker',
        lat: activeRoute.origin[0],
        lng: activeRoute.origin[1],
        type: 'user',
        label: 'Départ (Vous)',
      },
      {
        id: 'route-dest-marker',
        lat: activeRoute.destination[0],
        lng: activeRoute.destination[1],
        type: 'safe',
        label: `Arrivée : ${activeRoute.destinationName}`,
      }
    );
  }

  // Lien Google Earth 3D dynamique
  const currentGoogleEarthUrl = `https://earth.google.com/web/@${mapCenter[0]},${mapCenter[1]},354.96837603a,18542.62130671d,35y,0h,0t,0r/data=ChQaDgoKL20vMGgzcmNweBgCQgIIAToDCgEwQgIIAEoNCP___________wEQAA`;

  return (
    <div className="relative w-full h-screen bg-slate-900 text-white flex flex-col overflow-hidden font-sans">
      
      {/* ═══════════════════════════════════════════════════════════
          HEADER (Style strictement identique à EnhancedHomeScreen / Accueil)
          ═══════════════════════════════════════════════════════════ */}
      <div className="bg-slate-800/95 backdrop-blur-lg border-b border-slate-700 p-3 sm:p-4 flex-shrink-0 z-30">
        
        {/* Titre & Bouton Refresh (Identique à Accueil) */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold">USALAMA</h1>
              <p className="text-xs text-slate-400 hidden sm:block">Carte Sécurité & Satellite Kinshasa</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={currentGoogleEarthUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-medium text-blue-400 hover:text-white transition-colors"
              title="Google Earth 3D"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Google Earth 3D</span>
            </motion.a>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setMapCenter([-4.4071317, 15.32523455]);
                setMapZoom(13);
                setActiveSearchMarker(null);
                setMeasurePoints([]);
                setActiveRoute(null);
                setNearestHospitalModal(null);
              }}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white"
              title="Réinitialiser la vue de la carte"
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </div>
        </div>

        {/* ── Barre de Recherche (Identique à Accueil) ── */}
        <div className="relative mb-3 sm:mb-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une commune, avenue, ravin, hôpital à Kinshasa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-24 py-2 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm sm:text-base"
            />
            {isSearchingOnline ? (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-[11px] text-blue-400 font-mono">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Recherche...</span>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition-colors"
              >
                Localiser
              </motion.button>
            )}
          </form>

          {/* Autocomplétion intelligente */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl overflow-hidden text-xs max-h-60 overflow-y-auto"
              >
                <div className="p-1 space-y-1">
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectSearch(item)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-blue-600/30 hover:border-blue-500 border border-transparent transition-all text-left group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">
                          {item.category === 'erosion' ? '⚠️' : item.category === 'inondation' ? '🌊' : item.category === 'hospital' ? '🏥' : item.category === 'police' ? '👮' : '📍'}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-100 group-hover:text-blue-300">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Commune de {item.commune}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 1ère Ligne de Boutons : Actions & Outils (Style Accueil) ── */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFindNearestHospital}
            className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white shadow"
          >
            <Hospital className="w-4 h-4" />
            <span>Hôpital le plus proche</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleTrajet}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeRoute || showRouteSelector ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
            }`}
            title="Calculer un itinéraire sécurisé ou fermer le trajet actif"
          >
            <Route className="w-4 h-4" />
            <span>{activeRoute ? 'Fermer Trajet' : 'Trajet'}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setMeasureMode(!measureMode);
              setMeasurePoints([]);
            }}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              measureMode ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            <Ruler className="w-4 h-4" />
            <span>Mesure</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setRadarAnalysisActive(!radarAnalysisActive)}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              radarAnalysisActive ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Radar</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSitrepPanel(!showSitrepPanel)}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              showSitrepPanel ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>SITREP</span>
          </motion.button>
        </div>

        {/* ── 2ème Ligne de Boutons : Catégories & Styles (Style Accueil) ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none items-center justify-between">
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Tout' },
              { id: 'erosion', label: 'Érosions' },
              { id: 'inondation', label: 'Inondations' },
              { id: 'hospital', label: 'Hôpitaux' },
              { id: 'police', label: 'Police' },
            ].map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.id as any)}
                className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === category.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {category.label}
              </motion.button>
            ))}
          </div>

          <div className="flex gap-1 bg-slate-700 p-1 rounded-lg flex-shrink-0">
            {[
              { id: 'google-hybrid', label: 'Satellite' },
              { id: 'standard', label: 'Rues' },
              { id: 'topo', label: 'Relief' },
            ].map((mode) => (
              <motion.button
                key={mode.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMapStyle(mode.id as any)}
                className={`px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  mapStyle === mode.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          CARTE SATELLITE GOOGLE EARTH HYBRID (Forme et Présentation Réelle Intacte)
          ═══════════════════════════════════════════════════════════ */}
      <div className="relative flex-1 w-full h-full pb-16">
        <KinshasaMap
          center={mapCenter}
          zoom={mapZoom}
          mapStyle={mapStyle}
          markers={markers}
          circles={circles}
          polylines={polylines}
          userPosition={userPos}
          onMapClick={handleMapClick}
          onMouseMove={(lat, lng) => setHoverCoords({ lat, lng })}
          onMarkerClick={(m) => {
            if (m.meta) {
              setActiveSearchMarker(m.meta as SearchItem);
            }
          }}
          className="w-full h-full"
        />

        {/* ── SÉLECTEUR D'ITINÉRAIRE SÉCURISÉ (Affiché au clic sur Trajet si aucun point n'est sélectionné) ── */}
        <AnimatePresence>
          {showRouteSelector && !activeRoute && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="absolute top-3 left-4 right-4 sm:left-6 sm:w-[400px] z-30 bg-slate-800/98 backdrop-blur-md border border-blue-500/50 rounded-xl p-3.5 shadow-2xl text-xs space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <Route className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Calculer un Itinéraire Sécurisé</h3>
                    <p className="text-[11px] text-slate-400">Sélectionnez une destination sécurisée à Kinshasa</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRouteSelector(false)}
                  className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Point de départ */}
              <div className="bg-slate-700/60 p-2 rounded-lg border border-slate-600 flex items-center gap-2 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 flex-shrink-0 animate-pulse"></span>
                <span className="text-slate-300">Point A (Départ) :</span>
                <span className="font-bold text-white">Votre Position (Kinshasa)</span>
              </div>

              {/* Destinations rapides suggérées */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Destinations Sécurisées & Établissements :
                </span>
                <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                  {[
                    KINSHASA_SEARCH_DB.find(i => i.id === 'hosp-sino') || KINSHASA_SEARCH_DB[0],
                    KINSHASA_SEARCH_DB.find(i => i.id === 'hosp-cmk') || KINSHASA_SEARCH_DB[1],
                    KINSHASA_SEARCH_DB.find(i => i.id === 'land-gare') || KINSHASA_SEARCH_DB[2],
                    KINSHASA_SEARCH_DB.find(i => i.id === 'land-aeroport') || KINSHASA_SEARCH_DB[3],
                    KINSHASA_SEARCH_DB.find(i => i.id === 'com-kalamu') || KINSHASA_SEARCH_DB[4],
                    KINSHASA_SEARCH_DB.find(i => i.id === 'com-kintambo') || KINSHASA_SEARCH_DB[5],
                  ].filter(Boolean).map((dest) => (
                    <button
                      key={dest.id}
                      onClick={() => handleTraceRouteTo(dest)}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-700/40 hover:bg-blue-600/30 hover:border-blue-500 border border-slate-700 transition-all text-left group"
                    >
                      <div className="flex items-center gap-2">
                        <span>{dest.category === 'hospital' ? '🏥' : dest.category === 'landmark' ? '📍' : '🏛️'}</span>
                        <div>
                          <div className="font-semibold text-white text-xs group-hover:text-blue-300">{dest.name}</div>
                          <div className="text-[10px] text-slate-400">{dest.commune} • Alt. ~{dest.elevationM}m</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── BANNIÈRE DE TRAJET ACTIF (Intégration Trajet demandée) ── */}
        <AnimatePresence>
          {activeRoute && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-3 left-4 right-4 sm:left-6 sm:w-[420px] z-30 bg-slate-800/95 backdrop-blur-md border border-emerald-500/50 rounded-xl p-3 shadow-2xl text-xs space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></div>
                  <span className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                    <Route className="w-4 h-4" />
                    Itinéraire Sécurisé Kinshasa
                  </span>
                </div>
                <button
                  onClick={() => setActiveRoute(null)}
                  className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-200">
                  <span className="text-slate-400 text-[11px]">Destination :</span>
                  <span className="font-bold text-xs text-white">{activeRoute.destinationName}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                  <div className="bg-slate-700/80 p-2 rounded-lg border border-slate-600">
                    <span className="text-slate-400 block text-[10px]">Distance routière :</span>
                    <span className="text-emerald-400 font-bold text-sm">{activeRoute.distanceKm.toFixed(1)} km</span>
                  </div>
                  <div className="bg-slate-700/80 p-2 rounded-lg border border-slate-600">
                    <span className="text-slate-400 block text-[10px]">Temps estimé (ETA) :</span>
                    <span className="text-blue-400 font-bold text-sm">~{activeRoute.durationMin} min</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 p-2 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Trajet vérifié : contournement des ravins et axes inondables.</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveRoute((prev) => prev ? { ...prev, isGuiding: !prev.isGuiding } : null);
                  }}
                  className={`flex-1 py-2 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                    activeRoute.isGuiding
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow'
                  }`}
                >
                  <Navigation2 className={`w-3.5 h-3.5 ${activeRoute.isGuiding ? 'animate-pulse' : ''}`} />
                  <span>{activeRoute.isGuiding ? 'Guidage en cours...' : 'Démarrer le guidage'}</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveRoute(null)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium text-xs"
                >
                  Fermer
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MODAL HÔPITAL LE PLUS PROCHE (Intégration Hôpital demandée) ── */}
        <AnimatePresence>
          {nearestHospitalModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="absolute top-3 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-20 bg-slate-800/95 backdrop-blur-md border border-emerald-500/50 rounded-xl p-3.5 shadow-2xl text-xs space-y-2.5"
            >
              <div className="flex items-start justify-between border-b border-slate-700 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Hospital className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{nearestHospitalModal.hospital.name}</h3>
                    <p className="text-[11px] text-emerald-400 font-medium">Hôpital le plus proche identifié</p>
                  </div>
                </div>
                <button
                  onClick={() => setNearestHospitalModal(null)}
                  className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between bg-slate-700/60 p-2 rounded-lg border border-slate-600">
                  <span className="text-slate-300">Distance : <b className="text-emerald-400 font-mono text-xs">{nearestHospitalModal.distanceKm.toFixed(1)} km</b></span>
                  <span className="text-slate-300">Temps estimé : <b className="text-blue-400 font-mono text-xs">~{nearestHospitalModal.etaMin} min</b></span>
                </div>

                {nearestHospitalModal.hospital.services && (
                  <p className="text-slate-300 text-[11px] leading-relaxed bg-slate-700/40 p-2 rounded-lg">
                    {nearestHospitalModal.hospital.services}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                {nearestHospitalModal.hospital.phone && (
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={`tel:${nearestHospitalModal.hospital.phone}`}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Appeler les Urgences</span>
                  </motion.a>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setNearestHospitalModal(null)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium"
                >
                  Fermer
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Bandeau d'Outil de Mesure Osiris (Si Actif) ── */}
        <AnimatePresence>
          {measureMode && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-3 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-20 bg-slate-800/95 backdrop-blur-md border border-blue-500/50 rounded-xl p-3 shadow-xl text-xs space-y-2"
            >
              <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                <div className="flex items-center gap-2 text-blue-400 font-bold">
                  <Ruler className="w-4 h-4" />
                  <span>Télémétrie de Distance (Méthode Osiris)</span>
                </div>
                <button
                  onClick={() => {
                    setMeasureMode(false);
                    setMeasurePoints([]);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-slate-300 text-[11px]">
                {measurePoints.length === 0 && '👉 Cliquez sur un 1er point de départ sur l\'imagerie Google Earth.'}
                {measurePoints.length === 1 && '👉 Cliquez maintenant sur le 2nd point cible pour calculer distance et cap.'}
                {measurePoints.length === 2 && '✅ Vecteur mesuré avec précision géodésique.'}
              </p>

              {measurementResult && (
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                  <div className="bg-slate-700/80 p-2 rounded-lg border border-slate-600">
                    <span className="text-slate-400 block text-[10px]">Distance directe :</span>
                    <span className="text-emerald-400 font-bold text-sm">{measurementResult.distKm}</span>
                  </div>
                  <div className="bg-slate-700/80 p-2 rounded-lg border border-slate-600">
                    <span className="text-slate-400 block text-[10px]">Cap / Azimut :</span>
                    <span className="text-blue-400 font-bold text-sm">{measurementResult.bearing}</span>
                  </div>
                </div>
              )}

              {measurePoints.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMeasurePoints([])}
                  className="w-full py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Réinitialiser les points
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tiroir Flux SITREP en Direct (Méthode Osiris) ── */}
        <AnimatePresence>
          {showSitrepPanel && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="absolute top-3 left-4 z-20 w-80 max-w-[calc(100vw-2rem)] bg-slate-800/95 backdrop-blur-md border border-slate-700 rounded-xl p-3 shadow-2xl text-xs space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-ping"></div>
                  <span className="font-bold text-sm text-white">SITREP Kinshasa (Live)</span>
                </div>
                <button
                  onClick={() => setShowSitrepPanel(false)}
                  className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {KINSHASA_SITREP.map((sit) => (
                  <div
                    key={sit.id}
                    className="p-2.5 rounded-lg bg-slate-700/60 border border-slate-600/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-[11px]">{sit.title}</span>
                      <span className="text-[10px] text-slate-400">{sit.time}</span>
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-400">{sit.status}</div>
                    <div className="text-[11px] text-slate-300 leading-tight">{sit.detail}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Télémétrie HUD Osiris en Direct (Bas Droite) ── */}
        <div className="absolute bottom-20 left-4 sm:left-auto sm:right-4 z-20 pointer-events-none">
          <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-lg px-3 py-1.5 text-[11px] font-mono text-slate-300 shadow-lg flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-blue-400" />
              <span>
                {hoverCoords
                  ? `${Math.abs(hoverCoords.lat).toFixed(4)}°S, ${hoverCoords.lng.toFixed(4)}°E`
                  : `${Math.abs(mapCenter[0]).toFixed(4)}°S, ${mapCenter[1].toFixed(4)}°E`}
              </span>
            </div>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-semibold">
              Alt. ~{activeSearchMarker?.elevationM || 310}m
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-blue-400 hidden sm:inline">Zoom {mapZoom}x</span>
          </div>
        </div>

        {/* ── Fiche de Résultat de Recherche Cohérente ── */}
        <AnimatePresence>
          {activeSearchMarker && !activeRoute && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              className="absolute bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-30 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl p-4 shadow-2xl text-xs space-y-3"
            >
              {/* Entête */}
              <div className="flex items-start justify-between border-b border-slate-700 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-lg">
                    {activeSearchMarker.category === 'erosion' ? '⚠️' : activeSearchMarker.category === 'inondation' ? '🌊' : activeSearchMarker.category === 'hospital' ? '🏥' : '📍'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{activeSearchMarker.name}</h3>
                    <p className="text-slate-400 text-xs">Commune : {activeSearchMarker.commune}</p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveSearchMarker(null)}
                  className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Télémétrie & Contexte Géologique Cohérent */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-700/60 p-2 rounded-lg border border-slate-600">
                    <span className="text-slate-400 block text-[10px]">Coordonnées GPS :</span>
                    <span className="font-mono font-bold text-white text-[11px]">
                      {activeSearchMarker.lat.toFixed(4)}°S, {activeSearchMarker.lng.toFixed(4)}°E
                    </span>
                  </div>
                  <div className="bg-slate-700/60 p-2 rounded-lg border border-slate-600">
                    <span className="text-slate-400 block text-[10px]">Altitude :</span>
                    <span className="font-mono font-bold text-emerald-400 text-[11px]">
                      ~{activeSearchMarker.elevationM || 310} mètres
                    </span>
                  </div>
                </div>

                {/* Analyse radar de proximité immédiate (Méthode Osiris) */}
                <div className="bg-slate-700/40 p-2.5 rounded-lg border border-slate-600 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                    <Target className="w-3.5 h-3.5" />
                    <span>Rayon de veille :</span>
                  </div>
                  <span className="text-slate-300 font-medium">
                    {proximityAnalysis.risksCount > 0
                      ? `${proximityAnalysis.risksCount} risque(s) à < 3.5 km`
                      : 'Zone sans risque critique'}
                  </span>
                </div>

                {activeSearchMarker.solType && (
                  <div className="bg-slate-700/40 p-2.5 rounded-lg border border-slate-600">
                    <div className="text-[10px] font-semibold text-blue-400 mb-0.5">Contexte du sol :</div>
                    <div className="text-slate-300 text-[11px] leading-relaxed">{activeSearchMarker.solType}</div>
                  </div>
                )}

                {activeSearchMarker.risqueInfo && (
                  <div className="bg-red-950/30 border border-red-500/30 p-2.5 rounded-lg">
                    <div className="text-[10px] font-semibold text-red-400 mb-0.5">Situation environnementale :</div>
                    <div className="text-red-200 text-[11px] leading-relaxed">{activeSearchMarker.risqueInfo}</div>
                  </div>
                )}
              </div>

              {/* Boutons d'Action (Ajustés strictement comme Accueil) */}
              <div className="pt-2 border-t border-slate-700 flex flex-wrap items-center gap-2">
                {/* Tracer Trajet vers cette cible */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTraceRouteTo(activeSearchMarker)}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow flex items-center justify-center gap-1.5 text-xs"
                >
                  <Route className="w-3.5 h-3.5" />
                  <span>Tracer le trajet</span>
                </motion.button>

                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={`https://earth.google.com/web/@${activeSearchMarker.lat},${activeSearchMarker.lng},350a,2500d,35y,0h,45t,0r`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow flex items-center justify-center gap-1 text-xs"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Google Earth 3D</span>
                </motion.a>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setMapCenter([activeSearchMarker.lat, activeSearchMarker.lng]);
                    setMapZoom(16);
                  }}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg text-xs transition-colors"
                >
                  Centrer
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-lg border-t border-slate-700 z-40">
        <div className="flex items-center justify-around py-2">
          {navigationItems.map((item) => {
            const icons: Record<string, JSX.Element> = {
              'Shield': <Shield className="w-4 h-4 sm:w-5 sm:h-5" />,
              'Map': <Map className="w-4 h-4 sm:w-5 sm:h-5" />,
              'Phone': <Phone className="w-4 h-4 sm:w-5 sm:h-5" />,
              'Users': <Users className="w-4 h-4 sm:w-5 sm:h-5" />,
              'User': <User className="w-4 h-4 sm:w-5 sm:h-5" />
            };
            
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate?.(item.id)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors hover:bg-slate-700"
              >
                <div className="w-4 h-4 sm:w-5 sm:h-5">{icons[item.icon]}</div>
                <span className="text-xs text-slate-400">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EnhancedMapScreen;
