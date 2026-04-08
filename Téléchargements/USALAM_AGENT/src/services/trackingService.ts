export interface TrackingPoint {
  id: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  batteryLevel?: number;
  signalStrength?: number;
}

export interface TrackingSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  points: TrackingPoint[];
  purpose: 'emergency' | 'navigation' | 'manual' | 'sos';
  isShared: boolean;
  sharedWith?: string[];
  metadata?: {
    destination?: string;
    route?: string;
    notes?: string;
  };
}

export interface TrackingSettings {
  interval: number; // en secondes
  accuracyThreshold: number; // en mètres
  maxPoints: number;
  autoShare: boolean;
  emergencyContacts: string[];
  stealthMode: boolean;
}

class TrackingService {
  private currentSession: TrackingSession | null = null;
  private watchId: number | null = null;
  private settings: TrackingSettings = {
    interval: 5,
    accuracyThreshold: 10,
    maxPoints: 1000,
    autoShare: false,
    emergencyContacts: [],
    stealthMode: false
  };

  // Événements
  private listeners: {
    onPositionUpdate?: (point: TrackingPoint) => void;
    onSessionStart?: (session: TrackingSession) => void;
    onSessionEnd?: (session: TrackingSession) => void;
    onEmergencyTrigger?: (point: TrackingPoint) => void;
  } = {};

  constructor() {
    this.loadSettings();
    this.loadActiveSession();
  }

  // Démarrer une session de suivi
  async startTracking(purpose: TrackingSession['purpose'] = 'manual', metadata?: any): Promise<TrackingSession> {
    if (this.currentSession) {
      await this.stopTracking();
    }

    const session: TrackingSession = {
      id: this.generateId(),
      userId: 'current-user', // À remplacer avec l'auth
      startTime: new Date(),
      points: [],
      purpose,
      isShared: false,
      metadata
    };

    this.currentSession = session;
    this.saveActiveSession();

    // Démarrer le suivi GPS
    if (navigator.geolocation) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.handlePositionUpdate(position),
        (error) => this.handlePositionError(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }

    this.notifyListeners('onSessionStart', session);
    return session;
  }

  // Arrêter le suivi
  async stopTracking(): Promise<TrackingSession | null> {
    if (!this.currentSession) return null;

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.currentSession.endTime = new Date();
    const completedSession = { ...this.currentSession };
    
    await this.saveSession(completedSession);
    this.clearActiveSession();
    this.currentSession = null;

    this.notifyListeners('onSessionEnd', completedSession);
    return completedSession;
  }

  // Gérer les mises à jour de position
  private async handlePositionUpdate(position: GeolocationPosition): Promise<void> {
    if (!this.currentSession) return;

    const point: TrackingPoint = {
      id: this.generateId(),
      timestamp: new Date(),
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      altitude: position.coords.altitude || undefined,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined,
      batteryLevel: await this.getBatteryLevel(),
      signalStrength: this.getSignalStrength()
    };

    this.currentSession.points.push(point);

    // Limiter le nombre de points
    if (this.currentSession.points.length > this.settings.maxPoints) {
      this.currentSession.points = this.currentSession.points.slice(-this.settings.maxPoints);
    }

    this.saveActiveSession();
    this.notifyListeners('onPositionUpdate', point);

    // Vérifier les conditions d'urgence
    this.checkEmergencyConditions(point);
  }

  // Gérer les erreurs de position
  private handlePositionError(error: GeolocationPositionError): void {
    console.error('Erreur de géolocalisation:', error);
    
    if (error.code === 3) { // TIMEOUT
      // Essayer avec une précision plus faible
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => this.handlePositionUpdate(position),
          () => {},
          { enableHighAccuracy: false, timeout: 5000 }
        );
      }
    }
  }

  // Vérifier les conditions d'urgence
  private checkEmergencyConditions(point: TrackingPoint): void {
    // Vitesse anormale
    if (point.speed && point.speed > 50) { // > 180 km/h
      this.notifyListeners('onEmergencyTrigger', point);
      return;
    }

    // Précision très faible (possible brouillage)
    if (point.accuracy > 100) {
      this.notifyListeners('onEmergencyTrigger', point);
      return;
    }

    // Changement brusque de direction
    if (this.currentSession && this.currentSession.points.length > 2) {
      const recentPoints = this.currentSession.points.slice(-3);
      const headingChange = Math.abs(
        (recentPoints[2].heading || 0) - (recentPoints[0].heading || 0)
      );
      
      if (headingChange > 135) { // Changement de direction > 135°
        this.notifyListeners('onEmergencyTrigger', point);
      }
    }
  }

  // Partager la session
  async shareSession(sessionId: string, contacts: string[]): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) return false;

      session.isShared = true;
      session.sharedWith = contacts;
      
      // Simuler l'envoi aux contacts
      await this.saveSession(session);
      
      // Notifier les contacts (simulation)
      contacts.forEach(contact => {
        console.log(`Partage de la session ${sessionId} avec ${contact}`);
      });

      return true;
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      return false;
    }
  }

  // Obtenir la position actuelle
  async getCurrentPosition(): Promise<TrackingPoint | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const point: TrackingPoint = {
            id: this.generateId(),
            timestamp: new Date(),
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude || undefined,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
            batteryLevel: await this.getBatteryLevel(),
            signalStrength: this.getSignalStrength()
          };
          resolve(point);
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  // Calculer la distance totale d'une session
  calculateTotalDistance(session: TrackingSession): number {
    if (session.points.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < session.points.length; i++) {
      totalDistance += this.calculateDistance(
        session.points[i - 1],
        session.points[i]
      );
    }

    return totalDistance;
  }

  // Calculer la distance entre deux points
  private calculateDistance(point1: TrackingPoint, point2: TrackingPoint): number {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance en mètres
  }

  // Obtenir les statistiques d'une session
  getSessionStats(session: TrackingSession): any {
    if (session.points.length === 0) return null;

    const distances = [];
    for (let i = 1; i < session.points.length; i++) {
      distances.push(this.calculateDistance(session.points[i - 1], session.points[i]));
    }

    const speeds = session.points
      .filter(p => p.speed !== undefined)
      .map(p => p.speed!);

    return {
      totalDistance: this.calculateTotalDistance(session),
      averageSpeed: speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0,
      maxSpeed: speeds.length > 0 ? Math.max(...speeds) : 0,
      duration: session.endTime 
        ? session.endTime.getTime() - session.startTime.getTime()
        : Date.now() - session.startTime.getTime(),
      pointCount: session.points.length,
      averageAccuracy: session.points.reduce((sum, p) => sum + p.accuracy, 0) / session.points.length
    };
  }

  // Utilitaires
  private async getBatteryLevel(): Promise<number> {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        return battery.level * 100;
      } catch (e) {
        return 100;
      }
    }
    return 100;
  }

  private getSignalStrength(): number {
    // Simuler la force du signal (à remplacer avec une vraie détection)
    return Math.floor(Math.random() * 5) + 1;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Gestion des listeners
  addListener(event: keyof typeof this.listeners, callback: any): void {
    this.listeners[event] = callback;
  }

  private notifyListeners(event: keyof typeof this.listeners, data: any): void {
    if (this.listeners[event]) {
      this.listeners[event]!(data);
    }
  }

  // Persistance
  private async saveSession(session: TrackingSession): Promise<void> {
    const sessions = this.getAllSessions();
    sessions.push(session);
    localStorage.setItem('usalama_tracking_sessions', JSON.stringify(sessions));
  }

  private getAllSessions(): TrackingSession[] {
    const stored = localStorage.getItem('usalama_tracking_sessions');
    return stored ? JSON.parse(stored) : [];
  }

  private async getSession(sessionId: string): Promise<TrackingSession | null> {
    const sessions = this.getAllSessions();
    return sessions.find(s => s.id === sessionId) || null;
  }

  private saveActiveSession(): void {
    if (this.currentSession) {
      localStorage.setItem('usalama_active_session', JSON.stringify(this.currentSession));
    }
  }

  private loadActiveSession(): void {
    const stored = localStorage.getItem('usalama_active_session');
    if (stored) {
      try {
        this.currentSession = JSON.parse(stored);
        // Reprendre le suivi si la session est active
        if (this.currentSession && !this.currentSession.endTime) {
          this.startTracking(this.currentSession.purpose, this.currentSession.metadata);
        }
      } catch (e) {
        console.error('Erreur lors du chargement de la session active:', e);
      }
    }
  }

  private clearActiveSession(): void {
    localStorage.removeItem('usalama_active_session');
  }

  private loadSettings(): void {
    const stored = localStorage.getItem('usalama_tracking_settings');
    if (stored) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      } catch (e) {
        console.error('Erreur lors du chargement des paramètres:', e);
      }
    }
  }

  updateSettings(newSettings: Partial<TrackingSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem('usalama_tracking_settings', JSON.stringify(this.settings));
  }

  getSettings(): TrackingSettings {
    return { ...this.settings };
  }

  getCurrentSession(): TrackingSession | null {
    return this.currentSession;
  }
}

export const trackingService = new TrackingService();
export default trackingService;
