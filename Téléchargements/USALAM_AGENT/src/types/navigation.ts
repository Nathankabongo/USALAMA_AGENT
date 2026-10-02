export type ScreenType = 
  | 'home' 
  | 'enhanced-home' 
  | 'enhanced-map' 
  | 'contacts' 
  | 'alerts'
  | 'profile' 
  | 'sos'
  | 'guard' 
  | 'evidence' 
  | 'survival' 
  | 'firstaid' 
  | 'snig'
  | 'safepath'
  | 'incident-report'
  | 'community-chat'
  | 'phone-tracker'
  | 'permissions'
  | 'command-center'
  | 'decoy'
  | 'forensic-osint';

export interface NavigationProps {
  onNavigate?: (screen: ScreenType) => void;
}

export const navigationItems = [
  { id: 'enhanced-home' as ScreenType, label: 'Accueil', icon: 'Shield' },
  { id: 'enhanced-map' as ScreenType, label: 'Carte', icon: 'Map' },
  { id: 'sos' as ScreenType, label: 'SOS', icon: 'Phone' },
  { id: 'contacts' as ScreenType, label: 'Contacts', icon: 'Users' },
  { id: 'profile' as ScreenType, label: 'Profil', icon: 'User' }
];
