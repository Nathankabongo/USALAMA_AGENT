// services/automationShortcuts.ts - Automatisation et Raccourcis

// Types pour la reconnaissance vocale
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: SpeechGrammarList;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

interface SpeechGrammarList {
  length: number;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
  addFromString(string: string, weight?: number): void;
  addFromURI(src: string, weight?: number): void;
}

interface SpeechGrammar {
  src: string;
  weight: number;
}

export interface Shortcut {
  id: string;
  name: string;
  type: 'widget' | 'voice' | 'physical' | 'gesture';
  trigger: string;
  action: 'sos_emergency' | 'sos_discreet' | 'call_emergency' | 'share_location' | 'start_recording' | 'custom';
  customAction?: string;
  enabled: boolean;
  priority: number; // 1-10, plus élevé = plus prioritaire
}

export interface VoiceCommand {
  id: string;
  phrase: string;
  language: 'fr' | 'lingala' | 'swahili' | 'english';
  action: string;
  confidence: number;
  enabled: boolean;
}

export interface Widget {
  id: string;
  name: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  action: string;
  color: string;
  icon: string;
  enabled: boolean;
}

export interface PhysicalShortcut {
  id: string;
  combination: string; // ex: "volume_up+power", "triple_click_power"
  action: string;
  enabled: boolean;
  cooldown: number; // en ms
}

class AutomationShortcutsService {
  private shortcuts: Map<string, Shortcut> = new Map();
  private voiceCommands: Map<string, VoiceCommand> = new Map();
  private widgets: Map<string, Widget> = new Map();
  private physicalShortcuts: Map<string, PhysicalShortcut> = new Map();
  private isListening = false;
  private recognition: SpeechRecognition | null = null;
  private lastTriggerTime = new Map<string, number>();

  constructor() {
    this.initializeDefaultShortcuts();
    this.initializeVoiceCommands();
    this.initializePhysicalShortcuts();
    this.setupEventListeners();
  }

  private initializeDefaultShortcuts() {
    const defaultShortcuts: Shortcut[] = [
      {
        id: 'widget-sos-emergency',
        name: 'Widget SOS d\'urgence',
        type: 'widget',
        trigger: 'widget_click',
        action: 'sos_emergency',
        enabled: true,
        priority: 10
      },
      {
        id: 'voice-sos',
        name: 'Commande vocale SOS',
        type: 'voice',
        trigger: 'Hey USALAMA, aide-moi',
        action: 'sos_emergency',
        enabled: true,
        priority: 9
      },
      {
        id: 'voice-discreet',
        name: 'Commande vocale discrète',
        type: 'voice',
        trigger: 'USALAMA discret',
        action: 'sos_discreet',
        enabled: true,
        priority: 8
      },
      {
        id: 'physical-volume-power',
        name: 'Raccourci physique Volume + Power',
        type: 'physical',
        trigger: 'volume_up+power',
        action: 'sos_emergency',
        enabled: true,
        priority: 7
      }
    ];

    defaultShortcuts.forEach(shortcut => {
      this.shortcuts.set(shortcut.id, shortcut);
    });
  }

  private initializeVoiceCommands() {
    const commands: VoiceCommand[] = [
      // Commandes françaises
      {
        id: 'voice-help-fr',
        phrase: 'hey usalama aide moi',
        language: 'fr',
        action: 'sos_emergency',
        confidence: 0.9,
        enabled: true
      },
      {
        id: 'voice-discreet-fr',
        phrase: 'usalama discret',
        language: 'fr',
        action: 'sos_discreet',
        confidence: 0.9,
        enabled: true
      },
      {
        id: 'voice-police-fr',
        phrase: 'appelle la police',
        language: 'fr',
        action: 'call_emergency',
        confidence: 0.8,
        enabled: true
      },
      {
        id: 'voice-location-fr',
        phrase: 'partage ma position',
        language: 'fr',
        action: 'share_location',
        confidence: 0.8,
        enabled: true
      },
      // Commandes en lingala
      {
        id: 'voice-help-ln',
        phrase: 'usalama bosungi',
        language: 'lingala',
        action: 'sos_emergency',
        confidence: 0.9,
        enabled: true
      },
      {
        id: 'voice-discreet-ln',
        phrase: 'usalama kimia',
        language: 'lingala',
        action: 'sos_discreet',
        confidence: 0.9,
        enabled: true
      },
      // Commandes en swahili
      {
        id: 'voice-help-sw',
        phrase: 'usalama saidia',
        language: 'swahili',
        action: 'sos_emergency',
        confidence: 0.9,
        enabled: true
      }
    ];

    commands.forEach(command => {
      this.voiceCommands.set(command.id, command);
    });
  }

  private initializePhysicalShortcuts() {
    const shortcuts: PhysicalShortcut[] = [
      {
        id: 'volume-up-power',
        combination: 'volume_up+power',
        action: 'sos_emergency',
        enabled: true,
        cooldown: 3000
      },
      {
        id: 'triple-power',
        combination: 'triple_click_power',
        action: 'sos_discreet',
        enabled: true,
        cooldown: 2000
      },
      {
        id: 'long-volume-down',
        combination: 'long_press_volume_down',
        action: 'call_emergency',
        enabled: true,
        cooldown: 5000
      }
    ];

    shortcuts.forEach(shortcut => {
      this.physicalShortcuts.set(shortcut.id, shortcut);
    });
  }

  private setupEventListeners() {
    // Écouter les événements physiques
    this.setupPhysicalListeners();
    
    // Démarrer l'écoute vocale si disponible
    this.startVoiceListening();
  }

  private setupPhysicalListeners() {
    let powerPressCount = 0;
    let volumeUpPressed = false;
    let volumeDownPressed = false;
    let volumeDownPressStart = 0;

    // Simuler les événements physiques (sur mobile, ces seraient des événements natifs)
    document.addEventListener('keydown', (e) => {
      const now = Date.now();

      // Gérer Volume Up + Power
      if (e.key === 'ArrowUp' || e.key === 'VolumeUp') {
        volumeUpPressed = true;
      }

      // Gérer appui long sur Volume Down
      if (e.key === 'ArrowDown' || e.key === 'VolumeDown') {
        if (!volumeDownPressed) {
          volumeDownPressed = true;
          volumeDownPressStart = now;
        }
      }

      // Gérer Power button
      if (e.key === 'Power' || e.key === 'Meta') {
        powerPressCount++;
        
        if (volumeUpPressed) {
          this.triggerPhysicalShortcut('volume-up-power');
          volumeUpPressed = false;
        }

        setTimeout(() => {
          if (powerPressCount === 3) {
            this.triggerPhysicalShortcut('triple-power');
          }
          powerPressCount = 0;
        }, 500);
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'VolumeUp') {
        volumeUpPressed = false;
      }

      if (e.key === 'ArrowDown' || e.key === 'VolumeDown') {
        if (volumeDownPressed) {
          const pressDuration = Date.now() - volumeDownPressStart;
          if (pressDuration > 2000) { // 2 secondes
            this.triggerPhysicalShortcut('long-volume-down');
          }
          volumeDownPressed = false;
          volumeDownPressStart = 0;
        }
      }
    });
  }

  private startVoiceListening() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('Reconnaissance vocale non disponible');
      return;
    }

    const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognitionConstructor();

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'fr-FR';

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript.toLowerCase().trim();

      if (event.results[last].isFinal) {
        this.processVoiceCommand(transcript);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Erreur reconnaissance vocale:', event.error);
      if (event.error === 'no-speech') {
        // Redémarrer l'écoute après une pause
        setTimeout(() => {
          if (this.isListening) {
            this.recognition?.start();
          }
        }, 1000);
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        // Redémarrer l'écoute
        setTimeout(() => {
          this.recognition?.start();
        }, 100);
      }
    };
  }

  private processVoiceCommand(transcript: string) {
    const commands = Array.from(this.voiceCommands.values())
      .filter(cmd => cmd.enabled);

    for (const command of commands) {
      if (transcript.includes(command.phrase)) {
        this.executeAction(command.action, 'voice', command.id);
        break;
      }
    }
  }

  private triggerPhysicalShortcut(shortcutId: string) {
    const shortcut = this.physicalShortcuts.get(shortcutId);
    if (!shortcut || !shortcut.enabled) return;

    const now = Date.now();
    const lastTrigger = this.lastTriggerTime.get(shortcutId) || 0;

    if (now - lastTrigger < shortcut.cooldown) {
      return; // En cooldown
    }

    this.lastTriggerTime.set(shortcutId, now);
    this.executeAction(shortcut.action, 'physical', shortcutId);
  }

  public executeAction(action: string, triggerType: string, triggerId: string) {
    console.log(`Action déclenchée: ${action} par ${triggerType} (${triggerId})`);

    // Émettre un événement personnalisé pour que l'UI puisse réagir
    const event = new CustomEvent('shortcutTriggered', {
      detail: {
        action,
        triggerType,
        triggerId,
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(event);

    // Vibration pour confirmer l'action
    if ('vibrate' in navigator) {
      switch (action) {
        case 'sos_emergency':
          navigator.vibrate([200, 100, 200]);
          break;
        case 'sos_discreet':
          navigator.vibrate(50);
          break;
        default:
          navigator.vibrate(100);
      }
    }
  }

  public createWidget(config: Partial<Widget>): Widget {
    const widget: Widget = {
      id: `widget-${Date.now()}`,
      name: config.name || 'Nouveau Widget',
      size: config.size || 'medium',
      position: config.position || { x: 0, y: 0 },
      action: config.action || 'sos_emergency',
      color: config.color || '#ef4444',
      icon: config.icon || 'alert-triangle',
      enabled: config.enabled !== false
    };

    this.widgets.set(widget.id, widget);
    this.saveWidgets();
    return widget;
  }

  public updateWidget(widgetId: string, updates: Partial<Widget>): boolean {
    const widget = this.widgets.get(widgetId);
    if (!widget) return false;

    const updatedWidget = { ...widget, ...updates };
    this.widgets.set(widgetId, updatedWidget);
    this.saveWidgets();
    return true;
  }

  public deleteWidget(widgetId: string): boolean {
    const deleted = this.widgets.delete(widgetId);
    if (deleted) {
      this.saveWidgets();
    }
    return deleted;
  }

  private saveWidgets() {
    const widgets = Array.from(this.widgets.values());
    localStorage.setItem('usalama_widgets', JSON.stringify(widgets));
  }

  public stopVoiceListening(): boolean {
    if (!this.recognition) {
      return false;
    }

    try {
      this.isListening = false;
      this.recognition.stop();
      return true;
    } catch (error) {
      console.error('Erreur arrêt écoute vocale:', error);
      return false;
    }
  }

  public getWidgets(): Widget[] {
    return Array.from(this.widgets.values());
  }

  public getShortcuts(): Shortcut[] {
    return Array.from(this.shortcuts.values());
  }

  public getVoiceCommands(): VoiceCommand[] {
    return Array.from(this.voiceCommands.values());
  }

  public getPhysicalShortcuts(): PhysicalShortcut[] {
    return Array.from(this.physicalShortcuts.values());
  }

  public enableShortcut(shortcutId: string): boolean {
    const shortcut = this.shortcuts.get(shortcutId);
    if (shortcut) {
      shortcut.enabled = true;
      return true;
    }
    return false;
  }

  public disableShortcut(shortcutId: string): boolean {
    const shortcut = this.shortcuts.get(shortcutId);
    if (shortcut) {
      shortcut.enabled = false;
      return true;
    }
    return false;
  }

  public addVoiceCommand(command: VoiceCommand): void {
    this.voiceCommands.set(command.id, command);
  }

  public testVoiceCommand(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Reconnaissance vocale non disponible'));
        return;
      }

      const testRecognition = new ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)();
      testRecognition.lang = 'fr-FR';
      testRecognition.maxAlternatives = 1;

      testRecognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      testRecognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        reject(new Error(event.error));
      };

      testRecognition.onend = () => {
        testRecognition.stop();
      };

      testRecognition.start();
    });
  }

  public createCustomShortcut(
    name: string,
    trigger: string,
    action: string,
    type: 'widget' | 'voice' | 'physical' | 'gesture'
  ): Shortcut {
    const shortcut: Shortcut = {
      id: `custom-${Date.now()}`,
      name,
      type,
      trigger,
      action: action as any,
      enabled: true,
      priority: 5
    };

    this.shortcuts.set(shortcut.id, shortcut);
    return shortcut;
  }
}

export const automationShortcuts = new AutomationShortcutsService();
export default automationShortcuts;
