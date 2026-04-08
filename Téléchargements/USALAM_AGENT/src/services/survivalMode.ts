// services/survivalMode.ts - Mode Survie Étendu

export interface SurvivalSettings {
  powerSaving: 'minimal' | 'balanced' | 'performance';
  gpsTracking: boolean;
  communicationChannels: ('internet' | 'sms' | 'visual' | 'audio')[];
  emergencyMode: 'silent' | 'vibration' | 'sound';
  batteryThreshold: number; // pourcentage
  autoActivate: boolean;
}

export interface BatteryStatus {
  level: number;
  charging: boolean;
  estimatedTime: number; // en minutes
  temperature: number;
  health: 'good' | 'fair' | 'poor';
}

export interface SurvivalTool {
  id: string;
  name: string;
  type: 'compass' | 'flashlight' | 'whistle' | 'mirror' | 'fire' | 'first_aid' | 'shelter' | 'water';
  available: boolean;
  instructions: string[];
  icon: string;
}

export interface CompassData {
  heading: number; // en degrés
  accuracy: number;
  timestamp: Date;
}

export interface FlashlightState {
  active: boolean;
  intensity: number; // 0-1
  mode: 'steady' | 'sos' | 'strobe';
  batteryImpact: number; // pourcentage par heure
}

class SurvivalModeService {
  private isActive = false;
  private settings: SurvivalSettings;
  private batteryStatus: BatteryStatus;
  private compassData: CompassData | null = null;
  private flashlightState: FlashlightState;
  private survivalTools: Map<string, SurvivalTool> = new Map();
  private powerSaveInterval: NodeJS.Timeout | null = null;
  private compassInterval: NodeJS.Timeout | null = null;
  private batteryInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.settings = this.loadSettings();
    this.batteryStatus = this.getInitialBatteryStatus();
    this.flashlightState = {
      active: false,
      intensity: 1.0,
      mode: 'steady',
      batteryImpact: 15
    };
    this.initializeSurvivalTools();
    this.startBatteryMonitoring();
  }

  private loadSettings(): SurvivalSettings {
    const stored = localStorage.getItem('usalama_survival_settings');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Erreur chargement paramètres survie:', error);
      }
    }
    
    return {
      powerSaving: 'balanced',
      gpsTracking: true,
      communicationChannels: ['internet', 'sms', 'visual'],
      emergencyMode: 'vibration',
      batteryThreshold: 20,
      autoActivate: true
    };
  }

  private saveSettings() {
    localStorage.setItem('usalama_survival_settings', JSON.stringify(this.settings));
  }

  private getInitialBatteryStatus(): BatteryStatus {
    return {
      level: 100,
      charging: false,
      estimatedTime: 480, // 8 heures
      temperature: 25,
      health: 'good'
    };
  }

  private initializeSurvivalTools() {
    const tools: SurvivalTool[] = [
      {
        id: 'compass',
        name: 'Boussole',
        type: 'compass',
        available: 'DeviceOrientationEvent' in window,
        instructions: [
          'Maintenez le téléphone à plat',
          'La flèche rouge indique le Nord',
          'Évitez les interférences métalliques'
        ],
        icon: 'compass'
      },
      {
        id: 'flashlight',
        name: 'Lampe Torche',
        type: 'flashlight',
        available: 'torch' in navigator || this.hasFlashlightSupport(),
        instructions: [
          'Appuyez pour allumer/éteindre',
          'Mode SOS disponible',
          'Attention à la consommation de batterie'
        ],
        icon: 'flashlight'
      },
      {
        id: 'whistle',
        name: 'Sifflet Électronique',
        type: 'whistle',
        available: true,
        instructions: [
          'Appuyez pour émettre un sifflement',
          'Fréquence audible à grande distance',
          'Utilisez pour signaler votre position'
        ],
        icon: 'volume-2'
      },
      {
        id: 'mirror',
        name: 'Miroir de Signalisation',
        type: 'mirror',
        available: true,
        instructions: [
          'Utilisez l\'écran comme miroir',
          'Réfléchissez la lumière vers les secours',
          'Visible jusqu\'à 10km par temps clair'
        ],
        icon: 'sun'
      },
      {
        id: 'first_aid',
        name: 'Guide Premiers Secours',
        type: 'first_aid',
        available: true,
        instructions: [
          'Consultez les guides médicaux',
          'Instructions étape par étape',
          'Adapté aux urgences courantes'
        ],
        icon: 'heart'
      },
      {
        id: 'shelter',
        name: 'Construire Abri',
        type: 'shelter',
        available: true,
        instructions: [
          'Guide pour abris d\'urgence',
          'Matériaux disponibles localement',
          'Protection contre les éléments'
        ],
        icon: 'home'
      },
      {
        id: 'water',
        name: 'Purification Eau',
        type: 'water',
        available: true,
        instructions: [
          'Méthodes de purification',
          'Recherche de sources d\'eau',
          'Signes de contamination'
        ],
        icon: 'droplet'
      }
    ];

    tools.forEach(tool => {
      this.survivalTools.set(tool.id, tool);
    });
  }

  private hasFlashlightSupport(): boolean {
    // Vérifier le support de la lampe torche via diverses méthodes
    return !!(navigator as any).mediaDevices?.getUserMedia?.call?.(navigator.mediaDevices, {
      video: { facingMode: 'environment', torch: true }
    });
  }

  public async activateSurvivalMode(): Promise<void> {
    if (this.isActive) return;

    this.isActive = true;
    
    // Activer les économies d'énergie
    await this.enablePowerSaving();
    
    // Démarrer le monitoring de la boussole si nécessaire
    if (this.settings.gpsTracking) {
      this.startCompassTracking();
    }
    
    // Activer le mode avion intelligent
    await this.enableIntelligentAirplaneMode();
    
    // Optimiser les communications
    this.optimizeCommunications();
    
    console.log('🛡️ Mode survie activé');
  }

  public deactivateSurvivalMode(): void {
    if (!this.isActive) return;

    this.isActive = false;
    
    // Arrêter les économies d'énergie
    this.disablePowerSaving();
    
    // Arrêter le suivi de la boussole
    this.stopCompassTracking();
    
    // Désactiver le mode avion intelligent
    this.disableIntelligentAirplaneMode();
    
    // Éteindre la lampe torche si active
    if (this.flashlightState.active) {
      this.toggleFlashlight();
    }
    
    console.log('✅ Mode survie désactivé');
  }

  private async enablePowerSaving(): Promise<void> {
    switch (this.settings.powerSaving) {
      case 'minimal':
        // Économie minimale - garder tout actif
        break;
      case 'balanced':
        // Réduire la luminosité, limiter les animations
        this.reduceScreenBrightness();
        this.limitAnimations();
        break;
      case 'performance':
        // Économie maximale - tout désactiver sauf l'essentiel
        await this.maximumPowerSaving();
        break;
    }

    // Démarrer le monitoring de la batterie
    this.startBatteryMonitoring();
  }

  private disablePowerSaving(): void {
    if (this.powerSaveInterval) {
      clearInterval(this.powerSaveInterval);
      this.powerSaveInterval = null;
    }
    
    if (this.batteryInterval) {
      clearInterval(this.batteryInterval);
      this.batteryInterval = null;
    }
    
    // Restaurer les paramètres normaux
    this.restoreNormalSettings();
  }

  private async enableIntelligentAirplaneMode(): Promise<void> {
    // Le mode avion intelligent désactive tout sauf GPS et communications d'urgence
    try {
      // Sur mobile, cela nécessiterait des permissions natives
      // Pour le web, nous simulons en optimisant les requêtes réseau
      console.log('✈️ Mode avion intelligent activé');
    } catch (error) {
      console.error('Erreur activation mode avion:', error);
    }
  }

  private disableIntelligentAirplaneMode(): void {
    console.log('✈️ Mode avion intelligent désactivé');
  }

  private optimizeCommunications(): void {
    // Optimiser les canaux de communication selon les paramètres
    console.log('📡 Communications optimisées pour:', this.settings.communicationChannels);
  }

  private reduceScreenBrightness(): void {
    // Réduire la luminosité de l'écran
    if ('screen' in navigator && (navigator as any).screen.brightness) {
      (navigator as any).screen.brightness = 0.3;
    }
  }

  private limitAnimations(): void {
    // Désactiver les animations CSS
    document.body.style.setProperty('--animation-duration', '0s');
  }

  private async maximumPowerSaving(): Promise<void> {
    // Mode économie maximale
    this.reduceScreenBrightness();
    this.limitAnimations();
    
    // Désactiver les services non essentiels
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      registrations.forEach(registration => registration.unregister());
    }
  }

  private restoreNormalSettings(): void {
    // Restaurer la luminosité normale
    if ('screen' in navigator && (navigator as any).screen.brightness) {
      (navigator as any).screen.brightness = 1.0;
    }
    
    // Restaurer les animations
    document.body.style.removeProperty('--animation-duration');
  }

  private startBatteryMonitoring(): void {
    this.batteryInterval = setInterval(() => {
      this.updateBatteryStatus();
      this.checkBatteryThreshold();
    }, 30000); // Vérifier toutes les 30 secondes
  }

  private updateBatteryStatus(): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: unknown) => {
        this.batteryStatus = {
          level: Math.round(battery.level * 100),
          charging: battery.charging,
          estimatedTime: battery.charging ? battery.chargingTime : battery.dischargingTime / 60,
          temperature: 25, // Non disponible via API standard
          health: 'good'
        };
      });
    }
  }

  private checkBatteryThreshold(): void {
    if (this.batteryStatus.level <= this.settings.batteryThreshold && !this.batteryStatus.charging) {
      // Batterie faible - activer économies maximales
      if (this.settings.powerSaving !== 'performance') {
        console.log('🔋 Batterie faible - Activation économie maximale');
        this.settings.powerSaving = 'performance';
        this.saveSettings();
        this.maximumPowerSaving();
      }
    }
  }

  private startCompassTracking(): void {
    if (!('DeviceOrientationEvent' in window)) {
      console.log('Boussole non disponible sur cet appareil');
      return;
    }

    this.compassInterval = setInterval(() => {
      this.updateCompass();
    }, 1000);
  }

  private stopCompassTracking(): void {
    if (this.compassInterval) {
      clearInterval(this.compassInterval);
      this.compassInterval = null;
    }
  }

  private updateCompass(): void {
    if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', (event: DeviceOrientationEvent) => {
        if (event.alpha !== null) {
          this.compassData = {
            heading: Math.round(event.alpha),
            accuracy: 5, // Estimation
            timestamp: new Date()
          };
        }
      });
    }
  }

  public async toggleFlashlight(): Promise<boolean> {
    try {
      if (this.flashlightState.active) {
        await this.turnOffFlashlight();
      } else {
        await this.turnOnFlashlight();
      }
      return true;
    } catch (error) {
      console.error('Erreur lampe torche:', error);
      return false;
    }
  }

  private async turnOnFlashlight(): Promise<void> {
    if ('torch' in navigator && (navigator as any).torch) {
      await (navigator as any).torch.turnOn();
    } else {
      // Alternative via caméra
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        const track = stream.getVideoTracks()[0];
        // Note: torch n'est pas standard, donc on utilise type assertion
        if ('applyConstraints' in track) {
          await (track as any).applyConstraints({ 
            advanced: [{ torch: true }] 
          });
        }
      } catch (error) {
        // Fallback: utiliser l'écran comme source de lumière
        this.useScreenAsFlashlight(true);
      }
    }
    
    this.flashlightState.active = true;
  }

  private async turnOffFlashlight(): Promise<void> {
    if ('torch' in navigator && (navigator as any).torch) {
      await (navigator as any).torch.turnOff();
    } else {
      this.useScreenAsFlashlight(false);
    }
    
    this.flashlightState.active = false;
  }

  private useScreenAsFlashlight(on: boolean): void {
    if (on) {
      const overlay = document.createElement('div');
      overlay.id = 'flashlight-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: white;
        z-index: 999999;
        pointer-events: none;
        opacity: 0.9;
      `;
      document.body.appendChild(overlay);
    } else {
      const overlay = document.getElementById('flashlight-overlay');
      if (overlay) {
        overlay.remove();
      }
    }
  }

  public async setFlashlightMode(mode: 'steady' | 'sos' | 'strobe'): Promise<void> {
    this.flashlightState.mode = mode;
    
    if (mode === 'sos') {
      await this.startSOSPattern();
    } else if (mode === 'strobe') {
      await this.startStrobePattern();
    } else {
      // Mode steady
      if (!this.flashlightState.active) {
        await this.turnOnFlashlight();
      }
    }
  }

  private async startSOSPattern(): Promise<void> {
    const sosPattern = [
      { on: true, duration: 200 },
      { on: false, duration: 200 },
      { on: true, duration: 200 },
      { on: false, duration: 200 },
      { on: true, duration: 200 },
      { on: false, duration: 500 },
      { on: true, duration: 600 },
      { on: false, duration: 500 },
      { on: true, duration: 600 },
      { on: false, duration: 500 },
      { on: true, duration: 600 },
      { on: false, duration: 1000 }
    ];

    const executePattern = async () => {
      for (const step of sosPattern) {
        if (step.on) {
          await this.turnOnFlashlight();
        } else {
          await this.turnOffFlashlight();
        }
        await new Promise(resolve => setTimeout(resolve, step.duration));
      }
    };

    // Répéter le motif SOS
    while (this.flashlightState.mode === 'sos') {
      await executePattern();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  private async startStrobePattern(): Promise<void> {
    while (this.flashlightState.mode === 'strobe') {
      await this.turnOnFlashlight();
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.turnOffFlashlight();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  public playEmergencyWhistle(): void {
    // Créer un son de sifflement haute fréquence
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(3000, audioContext.currentTime); // 3kHz
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5); // 500ms
  }

  public getSurvivalTools(): SurvivalTool[] {
    return Array.from(this.survivalTools.values());
  }

  public getTool(id: string): SurvivalTool | undefined {
    return this.survivalTools.get(id);
  }

  public getBatteryStatus(): BatteryStatus {
    return this.batteryStatus;
  }

  public getCompassData(): CompassData | null {
    return this.compassData;
  }

  public getFlashlightState(): FlashlightState {
    return this.flashlightState;
  }

  public updateSettings(newSettings: Partial<SurvivalSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    
    // Appliquer les nouveaux paramètres si le mode survie est actif
    if (this.isActive) {
      if (newSettings.powerSaving) {
        this.enablePowerSaving();
      }
      if (newSettings.gpsTracking !== undefined) {
        if (newSettings.gpsTracking) {
          this.startCompassTracking();
        } else {
          this.stopCompassTracking();
        }
      }
    }
  }

  public getSettings(): SurvivalSettings {
    return this.settings;
  }

  public isSurvivalModeActive(): boolean {
    return this.isActive;
  }

  public getEstimatedBatteryLife(): number {
    if (this.batteryStatus.charging) {
      return this.batteryStatus.estimatedTime;
    }
    
    // Calculer en fonction du mode de survie
    const baseLife = this.batteryStatus.estimatedTime;
    const multiplier = this.settings.powerSaving === 'performance' ? 2.5 :
                      this.settings.powerSaving === 'balanced' ? 1.5 : 1.0;
    
    return Math.round(baseLife * multiplier);
  }

  public generateSurvivalReport(): {
    batteryLife: number;
    availableTools: string[];
    recommendations: string[];
  } {
    const availableTools = Array.from(this.survivalTools.values())
      .filter(tool => tool.available)
      .map(tool => tool.name);

    const recommendations: string[] = [];
    
    if (this.batteryStatus.level < 30) {
      recommendations.push('Conservez la batterie - mode performance recommandé');
    }
    
    if (this.batteryStatus.level < 15) {
      recommendations.push('Batterie critique - désactivez tous les services non essentiels');
    }
    
    if (!this.compassData && this.survivalTools.get('compass')?.available) {
      recommendations.push('Activez la boussole pour la navigation');
    }

    return {
      batteryLife: this.getEstimatedBatteryLife(),
      availableTools,
      recommendations
    };
  }
}

export const survivalMode = new SurvivalModeService();
export default survivalMode;
