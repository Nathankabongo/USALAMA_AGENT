export interface NavigationInstruction {
  id: string;
  type: 'turn' | 'straight' | 'roundabout' | 'exit' | 'arrived' | 'danger' | 'warning';
  direction: 'left' | 'right' | 'straight' | 'slight_left' | 'slight_right' | 'sharp_left' | 'sharp_right' | 'u_turn';
  distance: number; // en mètres
  text: string;
  voiceText: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  instruction?: string;
  distanceFromStart?: number;
}

export interface NavigationRoute {
  id: string;
  name: string;
  points: RoutePoint[];
  instructions: NavigationInstruction[];
  totalDistance: number;
  estimatedTime: number; // en secondes
  safetyScore: number; // 0-100
  dangerZones: Array<{
    latitude: number;
    longitude: number;
    radius: number;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

export interface VoiceSettings {
  enabled: boolean;
  language: 'fr' | 'lingala' | 'swahili';
  speed: number; // 0.5 - 2.0
  volume: number; // 0 - 1
  voice: string; // nom de la voix
  alertDistance: number; // distance pour les alertes
  repeatInstructions: boolean;
  emergencyMode: boolean;
}

class VoiceNavigationService {
  private currentRoute: NavigationRoute | null = null;
  private currentPosition: { lat: number; lng: number } | null = null;
  private nextInstructionIndex = 0;
  private isNavigating = false;
  private speechSynthesis: SpeechSynthesis;
  private settings: VoiceSettings = {
    enabled: true,
    language: 'fr',
    speed: 1.0,
    volume: 0.8,
    voice: '',
    alertDistance: 200,
    repeatInstructions: true,
    emergencyMode: false
  };

  // Écouteurs d'événements
  private listeners: {
    onInstruction?: (instruction: NavigationInstruction) => void;
    onRouteUpdate?: (route: NavigationRoute) => void;
    onArrival?: () => void;
    onDangerAlert?: (danger: any) => void;
  } = {};

  constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.loadSettings();
    this.loadVoices();
  }

  // Initialiser les voix disponibles
  private loadVoices(): void {
    const loadVoices = () => {
      const voices = this.speechSynthesis.getVoices();
      const frenchVoice = voices.find(voice => 
        voice.lang.startsWith('fr') && voice.localService
      );
      
      if (frenchVoice && !this.settings.voice) {
        this.settings.voice = frenchVoice.name;
      }
    };

    loadVoices();
    
    if (this.speechSynthesis.onvoiceschanged !== undefined) {
      this.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  // Démarrer la navigation
  async startNavigation(route: NavigationRoute): Promise<boolean> {
    try {
      this.currentRoute = route;
      this.nextInstructionIndex = 0;
      this.isNavigating = true;

      // Annoncer le début de la navigation
      if (this.settings.enabled) {
        await this.speak(`Navigation vers ${route.name} démarrée. Distance totale: ${Math.round(route.totalDistance)} mètres. Temps estimé: ${Math.round(route.estimatedTime / 60)} minutes.`);
      }

      // Donner la première instruction
      if (route.instructions.length > 0) {
        this.giveInstruction(route.instructions[0]);
      }

      this.notifyListeners('onRouteUpdate', route);
      return true;
    } catch (error) {
      console.error('Erreur lors du démarrage de la navigation:', error);
      return false;
    }
  }

  // Arrêter la navigation
  stopNavigation(): void {
    this.isNavigating = false;
    this.currentRoute = null;
    this.nextInstructionIndex = 0;
    this.speechSynthesis.cancel();
  }

  // Mettre à jour la position
  updatePosition(latitude: number, longitude: number): void {
    this.currentPosition = { lat: latitude, lng: longitude };

    if (!this.isNavigating || !this.currentRoute) return;

    // Vérifier les instructions
    this.checkInstructions();
    
    // Vérifier les zones de danger
    this.checkDangerZones();
    
    // Vérifier si on est arrivé
    this.checkArrival();
  }

  // Vérifier et donner les instructions
  private checkInstructions(): void {
    if (!this.currentRoute || !this.currentPosition) return;

    const remainingInstructions = this.currentRoute.instructions.slice(this.nextInstructionIndex);
    
    for (let i = 0; i < remainingInstructions.length; i++) {
      const instruction = remainingInstructions[i];
      const instructionPoint = this.currentRoute.points.find(p => p.instruction === instruction.text);
      
      if (instructionPoint) {
        const distance = this.calculateDistance(
          this.currentPosition,
          { lat: instructionPoint.latitude, lng: instructionPoint.longitude }
        );

        // Donner l'instruction si on est assez proche
        if (distance <= instruction.distance) {
          this.giveInstruction(instruction);
          this.nextInstructionIndex++;
        }
      }
    }
  }

  // Vérifier les zones de danger
  private checkDangerZones(): void {
    if (!this.currentRoute || !this.currentPosition || !this.settings.emergencyMode) return;

    for (const danger of this.currentRoute.dangerZones) {
      const distance = this.calculateDistance(
        this.currentPosition,
        { lat: danger.latitude, lng: danger.longitude }
      );

      if (distance <= danger.radius) {
        this.handleDangerAlert(danger, distance);
      }
    }
  }

  // Gérer les alertes de danger
  private handleDangerAlert(danger: any, distance: number): void {
    const alertMessage = this.getDangerAlertMessage(danger, distance);
    
    if (this.settings.enabled) {
      this.speak(alertMessage, 'critical');
    }

    this.notifyListeners('onDangerAlert', { danger, distance, message: alertMessage });
  }

  // Obtenir le message d'alerte de danger
  private getDangerAlertMessage(danger: any, distance: number): string {
    const messages = {
      fr: {
        low: `Attention: zone ${danger.type} dans ${Math.round(distance)} mètres.`,
        medium: `Alerte: zone à risque ${danger.type} à ${Math.round(distance)} mètres. Soyez prudent.`,
        high: `DANGER! Zone critique ${danger.type} à ${Math.round(distance)} mètres. Préparez-vous à dévier.`,
        critical: `ALERTE MAXIMALE! Zone extrêmement dangereuse ${danger.type} à ${Math.round(distance)} mètres. Arrêtez-vous ou déviez immédiatement!`
      },
      lingala: {
        low: `Sungula: eteni ya ${danger.type} na mitindo ${Math.round(distance)}.`,
        medium: `Limbisa: eteni ya risiki ${danger.type} na ${Math.round(distance)}. Bo tambola malamu.`,
        high: `MONKOLI! Eteni ya makasi mingi ${danger.type} na ${Math.round(distance)}. Kokoma kokoma te.`,
        critical: `LIBENGA YA MOKILI! Eteni ya mpasi mingi ${danger.type} na ${Math.round(distance)}. Yoka to sima!`
      }
    };

    return messages[this.settings.language][danger.severity];
  }

  // Vérifier si on est arrivé à destination
  private checkArrival(): void {
    if (!this.currentRoute || !this.currentPosition) return;

    const lastPoint = this.currentRoute.points[this.currentRoute.points.length - 1];
    const distance = this.calculateDistance(
      this.currentPosition,
      { lat: lastPoint.latitude, lng: lastPoint.longitude }
    );

    if (distance <= 20) { // 20 mètres pour considérer l'arrivée
      this.handleArrival();
    }
  }

  // Gérer l'arrivée
  private handleArrival(): void {
    if (this.settings.enabled) {
      this.speak('Vous êtes arrivé à destination.', 'high');
    }

    this.notifyListeners('onArrival');
    this.stopNavigation();
  }

  // Donner une instruction
  private giveInstruction(instruction: NavigationInstruction): void {
    if (this.settings.enabled) {
      this.speak(instruction.voiceText, instruction.urgency);
    }

    this.notifyListeners('onInstruction', instruction);
  }

  // Synthèse vocale
  private async speak(text: string, urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<void> {
    if (!this.speechSynthesis) return;

    // Annuler les annonces précédentes en cas d'urgence critique
    if (urgency === 'critical') {
      this.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configuration de la voix
    const voices = this.speechSynthesis.getVoices();
    if (this.settings.voice) {
      const selectedVoice = voices.find(voice => voice.name === this.settings.voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    } else {
      const frenchVoice = voices.find(voice => voice.lang.startsWith('fr'));
      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }
    }

    utterance.rate = this.settings.speed;
    utterance.volume = this.settings.volume;
    utterance.pitch = urgency === 'critical' ? 1.2 : 1.0;

    // Ajouter des sons pour les urgences
    if (urgency === 'high' || urgency === 'critical') {
      await this.playAlertSound(urgency);
    }

    return new Promise((resolve) => {
      utterance.onend = () => resolve();
      this.speechSynthesis.speak(utterance);
    });
  }

  // Jouer un son d'alerte
  private async playAlertSound(urgency: 'high' | 'critical'): Promise<void> {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      if (urgency === 'critical') {
        // Son d'urgence critique (plus rapide et plus aigu)
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      } else {
        // Son d'urgence haute
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      }

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Erreur lors de la lecture du son d\'alerte:', error);
    }
  }

  // Calculer la distance entre deux points
  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance en mètres
  }

  // Générer des instructions pour une route
  generateInstructions(points: RoutePoint[]): NavigationInstruction[] {
    const instructions: NavigationInstruction[] = [];

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const current = points[i];
      const next = points[i + 1];

      const bearing1 = this.calculateBearing(prev, current);
      const bearing2 = this.calculateBearing(current, next);
      const turnAngle = this.getTurnAngle(bearing1, bearing2);

      const instruction = this.createInstruction(turnAngle, current, i);
      if (instruction) {
        instructions.push(instruction);
      }
    }

    // Ajouter l'instruction d'arrivée
    if (points.length > 1) {
      instructions.push({
        id: this.generateId(),
        type: 'arrived',
        direction: 'straight',
        distance: 50,
        text: 'Vous êtes arrivé à destination',
        voiceText: 'Vous êtes arrivé à destination',
        urgency: 'medium',
        timestamp: new Date()
      });
    }

    return instructions;
  }

  // Calculer le cap entre deux points
  private calculateBearing(from: RoutePoint, to: RoutePoint): number {
    const φ1 = from.latitude * Math.PI / 180;
    const φ2 = to.latitude * Math.PI / 180;
    const Δλ = (to.longitude - from.longitude) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }

  // Calculer l'angle de virage
  private getTurnAngle(bearing1: number, bearing2: number): number {
    let angle = bearing2 - bearing1;
    if (angle > 180) angle -= 360;
    if (angle < -180) angle += 360;
    return angle;
  }

  // Créer une instruction basée sur l'angle de virage
  private createInstruction(turnAngle: number, point: RoutePoint, index: number): NavigationInstruction | null {
    let direction: NavigationInstruction['direction'];
    let text: string;
    let voiceText: string;
    let urgency: NavigationInstruction['urgency'] = 'medium';

    if (Math.abs(turnAngle) < 10) {
      return null; // Pas de virage significatif
    }

    if (turnAngle > 165) {
      direction = 'u_turn';
      text = 'Faites demi-tour';
      voiceText = 'Faites demi-tour dès que possible';
      urgency = 'high';
    } else if (turnAngle > 45) {
      direction = 'sharp_right';
      text = 'Tournez à droite';
      voiceText = 'Tournez fermement à droite';
    } else if (turnAngle > 10) {
      direction = 'slight_right';
      text = 'Tournez légèrement à droite';
      voiceText = 'Tournez légèrement à droite';
    } else if (turnAngle < -165) {
      direction = 'u_turn';
      text = 'Faites demi-tour';
      voiceText = 'Faites demi-tour dès que possible';
      urgency = 'high';
    } else if (turnAngle < -45) {
      direction = 'sharp_left';
      text = 'Tournez à gauche';
      voiceText = 'Tournez fermement à gauche';
    } else {
      direction = 'slight_left';
      text = 'Tournez légèrement à gauche';
      voiceText = 'Tournez légèrement à gauche';
    }

    return {
      id: this.generateId(),
      type: 'turn',
      direction,
      distance: 100, // Distance par défaut, à calculer selon la vitesse
      text,
      voiceText,
      urgency,
      timestamp: new Date()
    };
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

  // Paramètres
  updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  private saveSettings(): void {
    localStorage.setItem('usalama_voice_settings', JSON.stringify(this.settings));
  }

  private loadSettings(): void {
    const stored = localStorage.getItem('usalama_voice_settings');
    if (stored) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      } catch (e) {
        console.error('Erreur lors du chargement des paramètres vocaux:', e);
      }
    }
  }

  // Utilitaires
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // État actuel
  getCurrentRoute(): NavigationRoute | null {
    return this.currentRoute;
  }

  isCurrentlyNavigating(): boolean {
    return this.isNavigating;
  }

  getCurrentPosition(): { lat: number; lng: number } | null {
    return this.currentPosition;
  }

  // Obtenir les voix disponibles
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.speechSynthesis.getVoices();
  }

  // Test vocal
  async testVoice(): Promise<void> {
    await this.speak('Test du système de navigation vocale. Tout fonctionne correctement.');
  }
}

export const voiceNavigationService = new VoiceNavigationService();
export default voiceNavigationService;
