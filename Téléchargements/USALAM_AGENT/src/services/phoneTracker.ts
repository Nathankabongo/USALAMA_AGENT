// services/phoneTracker.ts — Service de localisation par numéro de téléphone

export interface PhoneLocationResult {
  phone: string;
  name?: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  country: string;
  operator: string;
  accuracy: number; // en mètres
  lastSeen: string; // ISO timestamp
  isApproximate: boolean;
  status: 'found' | 'not_found' | 'permission_denied' | 'error';
}

// Opérateurs mobiles congolais connus
const OPERATORS: Record<string, string> = {
  '+243810': 'Vodacom Congo',
  '+243811': 'Vodacom Congo',
  '+243812': 'Vodacom Congo',
  '+243813': 'Vodacom Congo',
  '+243814': 'Vodacom Congo',
  '+243815': 'Vodacom Congo',
  '+243816': 'Vodacom Congo',
  '+243817': 'Vodacom Congo',
  '+243820': 'Airtel Congo',
  '+243821': 'Airtel Congo',
  '+243822': 'Airtel Congo',
  '+243823': 'Airtel Congo',
  '+243824': 'Airtel Congo',
  '+243825': 'Airtel Congo',
  '+243830': 'Orange RDC',
  '+243831': 'Orange RDC',
  '+243832': 'Orange RDC',
  '+243833': 'Orange RDC',
  '+243840': 'Africell',
  '+243841': 'Africell',
  '+243842': 'Africell',
  '+243850': 'Orange RDC',
  '+243851': 'Orange RDC',
  '+243890': 'Vodacom Congo',
  '+243891': 'Vodacom Congo',
  '+243897': 'Orange RDC',
  '+243898': 'Africell',
  '+243990': 'Vodacom Congo',
  '+243991': 'Vodacom Congo',
  '+243992': 'Airtel Congo',
  '+243993': 'Orange RDC',
  '+243994': 'Africell',
  '+243995': 'Africell',
  '+243996': 'Airtel Congo',
  '+243997': 'Orange RDC',
  '+243998': 'Vodacom Congo',
  '+243999': 'Vodacom Congo',
};

// Zones géographiques de Kinshasa pour la simulation
const KINSHASA_ZONES = [
  { name: 'Gombe', lat: -4.3248, lng: 15.3219, address: 'Boulevard du 30 Juin, Gombe' },
  { name: 'Lingwala', lat: -4.3117, lng: 15.3053, address: 'Avenue Mongala, Lingwala' },
  { name: 'Kintambo', lat: -4.3315, lng: 15.2777, address: 'Avenue Kintambo, Kintambo' },
  { name: 'Bandalungwa', lat: -4.3540, lng: 15.2893, address: 'Avenue Kabinda, Bandalungwa' },
  { name: 'Kalamu', lat: -4.3689, lng: 15.3151, address: 'Avenue Victoire, Kalamu' },
  { name: 'Lemba', lat: -4.3959, lng: 15.3500, address: 'Avenue Université, Lemba' },
  { name: 'Ngiri-Ngiri', lat: -4.3774, lng: 15.2987, address: 'Avenue Ngiri-Ngiri, Ngiri-Ngiri' },
  { name: 'Matête', lat: -4.4056, lng: 15.3632, address: 'Avenue Lubumbashi, Matête' },
  { name: 'Limete', lat: -4.3689, lng: 15.3913, address: 'Rond-Point Victoire, Limete' },
  { name: 'Ndjili', lat: -4.3869, lng: 15.4365, address: 'Avenue Kasangilu, Ndjili' },
  { name: 'Masina', lat: -4.3572, lng: 15.4823, address: 'Avenue Lumumba, Masina' },
  { name: 'Kimbanseke', lat: -4.3942, lng: 15.4671, address: 'Avenue Kimbanseke, Kimbanseke' },
  { name: 'Selembao', lat: -4.4215, lng: 15.2710, address: 'Avenue Selembao, Selembao' },
  { name: 'Kisenso', lat: -4.4427, lng: 15.3632, address: 'Avenue Kisenso, Kisenso' },
  { name: 'Makala', lat: -4.4011, lng: 15.2893, address: 'Avenue Makala, Makala' },
];

/**
 * Détecter l'opérateur à partir du numéro
 */
function detectOperator(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  const normalized = cleaned.startsWith('00243') 
    ? '+' + cleaned.slice(2)
    : cleaned.startsWith('0') && cleaned.length === 10
    ? '+243' + cleaned.slice(1)
    : cleaned;
  
  for (const [prefix, operator] of Object.entries(OPERATORS)) {
    if (normalized.startsWith(prefix)) return operator;
  }
  return 'Opérateur inconnu';
}

/**
 * Normaliser le numéro en format international
 */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('00243')) return '+' + cleaned.slice(2);
  if (cleaned.startsWith('0') && cleaned.length === 10) return '+243' + cleaned.slice(1);
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length === 9) return '+243' + cleaned;
  return cleaned;
}

/**
 * Localisation par numéro de téléphone
 * Note : En production, ceci appelle un service tiers (ex: API de l'opérateur)
 * Ici, on simule la réponse avec des données réalistes de Kinshasa
 */
export async function locateByPhone(phone: string): Promise<PhoneLocationResult> {
  const normalized = normalizePhone(phone);
  
  // Simulation d'un délai réseau
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1500));

  // Vérification de base du format
  const isValid = /^\+?[1-9]\d{8,14}$/.test(normalized.replace(/\D/g, ''));
  if (!isValid) {
    return {
      phone: normalized,
      lat: 0, lng: 0,
      address: '', city: '', country: '',
      operator: '',
      accuracy: 0,
      lastSeen: new Date().toISOString(),
      isApproximate: true,
      status: 'not_found'
    };
  }

  // Sélectionner une zone aléatoire de Kinshasa (simulation)
  const zone = KINSHASA_ZONES[Math.floor(Math.random() * KINSHASA_ZONES.length)];
  
  // Ajouter de la variation (GPS simulé avec précision variable)
  const accuracyMeters = 50 + Math.floor(Math.random() * 500); // 50m à 550m
  const latVariation = (Math.random() - 0.5) * 0.005;
  const lngVariation = (Math.random() - 0.5) * 0.005;

  const operator = detectOperator(normalized);
  
  // Simuler que certains numéros ne sont pas trouvés
  if (Math.random() < 0.1) {
    return {
      phone: normalized,
      lat: 0, lng: 0,
      address: '', city: 'Kinshasa', country: 'RDC',
      operator,
      accuracy: 0,
      lastSeen: new Date().toISOString(),
      isApproximate: true,
      status: 'not_found'
    };
  }

  return {
    phone: normalized,
    lat: zone.lat + latVariation,
    lng: zone.lng + lngVariation,
    address: zone.address,
    city: 'Kinshasa',
    country: 'République Démocratique du Congo',
    operator,
    accuracy: accuracyMeters,
    lastSeen: new Date(Date.now() - Math.floor(Math.random() * 300000)).toISOString(), // dernière vue il y a 0-5 min
    isApproximate: accuracyMeters > 100,
    status: 'found'
  };
}

export default { locateByPhone, normalizePhone, detectOperator };
