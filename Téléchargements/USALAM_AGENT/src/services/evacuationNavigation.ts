// services/evacuationNavigation.ts - Navigation d'Évacuation Intelligente

export interface EvacuationRoute {
  id: string;
  name: string;
  distance: number; // en mètres
  estimatedTime: number; // en secondes
  safetyScore: number; // 0-100
  waypoints: Array<{
    lat: number;
    lng: number;
    instruction: string;
    dangerLevel: 'low' | 'medium' | 'high';
  }>;
  avoidZones: Array<{
    lat: number;
    lng: number;
    radius: number;
    type: 'protest' | 'danger' | 'construction' | 'crowd';
    description: string;
  }>;
}

export interface SafePoint {
  id: string;
  name: string;
  type: 'hospital' | 'police' | 'shelter' | 'fire_station' | 'community_center';
  lat: number;
  lng: number;
  distance: number;
  capacity: number;
  currentOccupancy: number;
  contact: string;
  services: string[];
  isOpen24h: boolean;
  lastVerified: Date;
}

export interface DangerZone {
  id: string;
  type: 'protest' | 'violence' | 'accident' | 'natural_disaster' | 'construction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  lat: number;
  lng: number;
  radius: number;
  description: string;
  reportedAt: Date;
  verified: boolean;
  estimatedClearTime?: Date;
}

class EvacuationNavigationService {
  private dangerZones: Map<string, DangerZone> = new Map();
  private safePoints: Map<string, SafePoint> = new Map();
  private currentRoute: EvacuationRoute | null = null;
  private listeners: Array<(routes: EvacuationRoute[]) => void> = [];

  constructor() {
    this.initializeSafePoints();
    this.loadDangerZones();
    this.startRealTimeUpdates();
  }

  private initializeSafePoints() {
    // Points de rassemblement sûrs par défaut (Kinshasa)
    const defaultSafePoints: SafePoint[] = [
      {
        id: 'hopital-kinshasa',
        name: 'Hôpital Général de Kinshasa',
        type: 'hospital',
        lat: -4.4419,
        lng: 15.2663,
        distance: 0,
        capacity: 500,
        currentOccupancy: 245,
        contact: '+243 12 345 678',
        services: ['urgence', 'chirurgie', 'pédiatrie'],
        isOpen24h: true,
        lastVerified: new Date()
      },
      {
        id: 'commissariat-central',
        name: 'Commissariat Central',
        type: 'police',
        lat: -4.4325,
        lng: 15.2714,
        distance: 0,
        capacity: 100,
        currentOccupancy: 45,
        contact: '+243 12 234 567',
        services: ['police', 'secours', 'rapport'],
        isOpen24h: true,
        lastVerified: new Date()
      },
      {
        id: 'centre-communal',
        name: 'Centre Communautaire Matonge',
        type: 'community_center',
        lat: -4.4450,
        lng: 15.2690,
        distance: 0,
        capacity: 200,
        currentOccupancy: 80,
        contact: '+243 12 345 679',
        services: ['abri', 'nourriture', 'communication'],
        isOpen24h: false,
        lastVerified: new Date()
      }
    ];

    defaultSafePoints.forEach(point => {
      this.safePoints.set(point.id, point);
    });
  }

  private loadDangerZones() {
    // Charger les zones de danger depuis le stockage local ou l'API
    const stored = localStorage.getItem('usalama_danger_zones');
    if (stored) {
      try {
        const zones = JSON.parse(stored);
        zones.forEach((zone: DangerZone) => {
          this.dangerZones.set(zone.id, zone);
        });
      } catch (error) {
        console.error('Erreur chargement zones de danger:', error);
      }
    }
  }

  private startRealTimeUpdates() {
    // Mettre à jour les zones de danger toutes les 30 secondes
    setInterval(() => {
      this.fetchDangerZones();
    }, 30000);
  }

  private async fetchDangerZones() {
    try {
      // Simuler un appel API pour obtenir les zones de danger en temps réel
      // Dans un vrai projet, ce serait un appel à votre backend
      const mockDangerZones: DangerZone[] = [
        {
          id: 'manifestation-gombe',
          type: 'protest',
          severity: 'medium',
          lat: -4.4250,
          lng: 15.2720,
          radius: 500,
          description: 'Manifestation en cours - Éviter le secteur',
          reportedAt: new Date(),
          verified: true,
          estimatedClearTime: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2h
        },
        {
          id: 'accident-boulevard',
          type: 'accident',
          severity: 'high',
          lat: -4.4380,
          lng: 15.2680,
          radius: 200,
          description: 'Accident de circulation - Route bloquée',
          reportedAt: new Date(),
          verified: true,
          estimatedClearTime: new Date(Date.now() + 45 * 60 * 1000) // 45min
        }
      ];

      mockDangerZones.forEach(zone => {
        this.dangerZones.set(zone.id, zone);
      });

      this.saveDangerZones();
      this.notifyListeners();
    } catch (error) {
      console.error('Erreur mise à jour zones de danger:', error);
    }
  }

  private saveDangerZones() {
    const zones = Array.from(this.dangerZones.values());
    localStorage.setItem('usalama_danger_zones', JSON.stringify(zones));
  }

  private notifyListeners() {
    if (this.currentRoute) {
      this.listeners.forEach(listener => listener([this.currentRoute]));
    }
  }

  public async calculateSafeRoutes(fromLat: number, fromLng: number): Promise<EvacuationRoute[]> {
    const routes: EvacuationRoute[] = [];
    const safePointsArray = Array.from(this.safePoints.values());

    for (const safePoint of safePointsArray) {
      // Calculer la distance jusqu'au point de sécurité
      const distance = this.calculateDistance(fromLat, fromLng, safePoint.lat, safePoint.lng);
      
      // Vérifier si le point est accessible (capacité disponible)
      if (safePoint.currentOccupancy >= safePoint.capacity) {
        continue;
      }

      // Calculer un itinéraire qui évite les zones de danger
      const route = await this.calculateOptimalRoute(fromLat, fromLng, safePoint.lat, safePoint.lng);
      
      if (route) {
        routes.push({
          id: `route-${safePoint.id}`,
          name: `Vers ${safePoint.name}`,
          distance,
          estimatedTime: Math.round((distance / 1.4) * 3.6), // Conversion en temps de marche
          safetyScore: this.calculateSafetyScore(route),
          waypoints: route.waypoints,
          avoidZones: route.avoidZones
        });
      }
    }

    // Trier par score de sécurité puis par distance
    routes.sort((a, b) => {
      if (b.safetyScore !== a.safetyScore) {
        return b.safetyScore - a.safetyScore;
      }
      return a.distance - b.distance;
    });

    this.currentRoute = routes[0] || null;
    return routes;
  }

  private async calculateOptimalRoute(
    fromLat: number, 
    fromLng: number, 
    toLat: number, 
    toLng: number
  ): Promise<EvacuationRoute | null> {
    const waypoints = [];
    const avoidZones: EvacuationRoute['avoidZones'] = [];
    
    // Point de départ
    waypoints.push({
      lat: fromLat,
      lng: fromLng,
      instruction: 'Votre position',
      dangerLevel: 'low'
    });

    // Vérifier les zones de danger sur le chemin
    const dangerZonesArray = Array.from(this.dangerZones.values());
    
    for (const danger of dangerZonesArray) {
      if (this.isPointOnPath(fromLat, fromLng, toLat, toLng, danger.lat, danger.lng, danger.radius)) {
        avoidZones.push({
          lat: danger.lat,
          lng: danger.lng,
          radius: danger.radius,
          type: danger.type === 'protest' ? 'protest' : 'danger',
          description: danger.description
        });
      }
    }

    // Si des zones de danger sont détectées, calculer des points de contournement
    if (avoidZones.length > 0) {
      const bypassPoints = this.calculateBypassPoints(fromLat, fromLng, toLat, toLng, avoidZones);
      bypassPoints.forEach(point => {
        waypoints.push({
          lat: point.lat,
          lng: point.lng,
          instruction: point.instruction,
          dangerLevel: 'low'
        });
      });
    }

    // Point d'arrivée
    waypoints.push({
      lat: toLat,
      lng: toLng,
      instruction: 'Point de sécurité atteint',
      dangerLevel: 'low'
    });

    return {
      id: '',
      name: '',
      distance: this.calculateDistance(fromLat, fromLng, toLat, toLng),
      estimatedTime: 0,
      safetyScore: 0,
      waypoints,
      avoidZones
    };
  }

  private calculateBypassPoints(
    fromLat: number, 
    fromLng: number, 
    toLat: number, 
    toLng: number,
    avoidZones: EvacuationRoute['avoidZones']
  ) {
    const bypassPoints = [];
    
    // Logique simple de contournement : ajouter des points latéraux
    for (const zone of avoidZones) {
      const latOffset = zone.radius * 0.00001; // Conversion approximative
      const lngOffset = zone.radius * 0.00001;
      
      bypassPoints.push({
        lat: zone.lat + latOffset,
        lng: zone.lng,
        instruction: `Contourner : ${zone.description}`
      });
    }
    
    return bypassPoints;
  }

  private isPointOnPath(
    fromLat: number, 
    fromLng: number, 
    toLat: number, 
    toLng: number,
    pointLat: number, 
    pointLng: number, 
    radius: number
  ): boolean {
    const distance = this.calculateDistance(fromLat, fromLng, pointLat, pointLng);
    const distanceToEnd = this.calculateDistance(pointLat, pointLng, toLat, toLng);
    const totalDistance = this.calculateDistance(fromLat, fromLng, toLat, toLng);
    
    // Vérifier si le point est sur le chemin approximatif
    return Math.abs(distance + distanceToEnd - totalDistance) < radius && distance < totalDistance;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private calculateSafetyScore(route: EvacuationRoute): number {
    let score = 100;
    
    // Pénaliser les zones de danger sur le chemin
    route.avoidZones.forEach(zone => {
      switch (zone.type) {
        case 'protest':
          score -= 20;
          break;
        case 'danger':
          score -= 30;
          break;
        default:
          score -= 10;
      }
    });
    
    // Bonus pour les routes plus courtes
    if (route.distance < 1000) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  public getNearbySafePoints(lat: number, lng: number, radius: number = 2000): SafePoint[] {
    const nearby: SafePoint[] = [];
    
    this.safePoints.forEach(point => {
      const distance = this.calculateDistance(lat, lng, point.lat, point.lng);
      if (distance <= radius) {
        nearby.push({
          ...point,
          distance
        });
      }
    });
    
    return nearby.sort((a, b) => a.distance - b.distance);
  }

  public getDangerZones(lat: number, lng: number, radius: number = 5000): DangerZone[] {
    const nearby: DangerZone[] = [];
    
    this.dangerZones.forEach(zone => {
      const distance = this.calculateDistance(lat, lng, zone.lat, zone.lng);
      if (distance <= radius) {
        nearby.push(zone);
      }
    });
    
    return nearby.sort((a, b) => {
      // Trier par sévérité puis par distance
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aSeverity = severityOrder[a.severity];
      const bSeverity = severityOrder[b.severity];
      
      if (aSeverity !== bSeverity) {
        return bSeverity - aSeverity;
      }
      
      const aDistance = this.calculateDistance(lat, lng, a.lat, a.lng);
      const bDistance = this.calculateDistance(lat, lng, b.lat, b.lng);
      return aDistance - bDistance;
    });
  }

  public reportDangerZone(zone: Omit<DangerZone, 'id' | 'reportedAt'>): void {
    const newZone: DangerZone = {
      ...zone,
      id: `danger-${Date.now()}`,
      reportedAt: new Date()
    };
    
    this.dangerZones.set(newZone.id, newZone);
    this.saveDangerZones();
    this.notifyListeners();
  }

  public subscribeToRouteUpdates(callback: (routes: EvacuationRoute[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getCurrentRoute(): EvacuationRoute | null {
    return this.currentRoute;
  }

  public async updateSafePointStatus(pointId: string, occupancy: number): Promise<void> {
    const point = this.safePoints.get(pointId);
    if (point) {
      point.currentOccupancy = occupancy;
      point.lastVerified = new Date();
      this.safePoints.set(pointId, point);
    }
  }
}

export const evacuationNavigation = new EvacuationNavigationService();
export default evacuationNavigation;
