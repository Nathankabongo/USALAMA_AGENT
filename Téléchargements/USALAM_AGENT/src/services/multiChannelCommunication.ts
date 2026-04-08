// services/multiChannelCommunication.ts - Communication Multi-canaux

// Types pour les APIs expérimentales
declare global {
  interface Navigator {
    torch?: {
      turnOn(): Promise<void>;
      turnOff(): Promise<void>;
    };
  }
  
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export interface PreRecordedMessage {
  id: string;
  language: 'fr' | 'lingala' | 'swahili' | 'english';
  category: 'emergency' | 'medical' | 'security' | 'evacuation';
  text: string;
  audioUrl?: string;
  duration: number; // en secondes
}

export interface SMSMessage {
  id: string;
  to: string;
  message: string;
  timestamp: Date;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  retries: number;
}

export interface VisualCode {
  id: string;
  pattern: 'sos' | 'help' | 'danger' | 'safe';
  description: string;
  flashSequence: Array<{ duration: number; intensity: number }>; // en ms
}

export interface CommunicationChannel {
  type: 'internet' | 'sms' | 'visual' | 'audio';
  available: boolean;
  quality: 'excellent' | 'good' | 'poor' | 'unavailable';
  lastUsed: Date;
}

class MultiChannelCommunicationService {
  private channels: Map<string, CommunicationChannel> = new Map();
  private messageQueue: SMSMessage[] = [];
  private visualCodes: Map<string, VisualCode> = new Map();
  private audioContext: AudioContext | null = null;
  private isFlashActive = false;

  constructor() {
    this.initializeChannels();
    this.initializePreRecordedMessages();
    this.initializeVisualCodes();
    this.monitorConnectivity();
  }

  private initializeChannels() {
    this.channels.set('internet', {
      type: 'internet',
      available: navigator.onLine,
      quality: navigator.onLine ? 'good' : 'unavailable',
      lastUsed: new Date()
    });

    this.channels.set('sms', {
      type: 'sms',
      available: true, // SMS généralement disponible
      quality: 'good',
      lastUsed: new Date()
    });

    this.channels.set('visual', {
      type: 'visual',
      available: true, // Flash toujours disponible
      quality: 'excellent',
      lastUsed: new Date()
    });

    this.channels.set('audio', {
      type: 'audio',
      available: true, // Haut-parleur toujours disponible
      quality: 'good',
      lastUsed: new Date()
    });
  }

  private initializePreRecordedMessages() {
    const messages: PreRecordedMessage[] = [
      // Messages en français
      {
        id: 'emergency-fr',
        language: 'fr',
        category: 'emergency',
        text: 'URGENCE - J\'ai besoin d\'aide immédiatement. Ma position est envoyée. Merci de contacter les secours.',
        duration: 8
      },
      {
        id: 'medical-fr',
        language: 'fr',
        category: 'medical',
        text: 'URGENCE MÉDICALE - Besoin d\'assistance médicale immédiate. Allergie connue : [à compléter]',
        duration: 7
      },
      {
        id: 'security-fr',
        language: 'fr',
        category: 'security',
        text: 'DANGER - Je me sens en danger. Ne m\'appelez pas, envoyez de l\'aide discrètement.',
        duration: 6
      },
      {
        id: 'evacuation-fr',
        language: 'fr',
        category: 'evacuation',
        text: 'ÉVACUATION - J\'évacue vers le point de sécurité le plus proche. Suivez ma position.',
        duration: 7
      },
      // Messages en lingala
      {
        id: 'emergency-lingala',
        language: 'lingala',
        category: 'emergency',
        text: 'LIKAMBO YA LIBWA - Nakolingaka bosungi mbala moko. Esika na ngai ekotisami. Bosungi bongo.',
        duration: 8
      },
      {
        id: 'medical-lingala',
        language: 'lingala',
        category: 'medical',
        text: 'LIKAMBO YA MOTO - Nakolingaka bosungi ya moto mbala moko. Allergie : [à compléter]',
        duration: 7
      },
      {
        id: 'security-lingala',
        language: 'lingala',
        category: 'security',
        text: 'MONUNGU - Nazali na monungi. Osengeli kokunda ngai te, tinda bosungi te.',
        duration: 6
      },
      // Messages en swahili
      {
        id: 'emergency-sw',
        language: 'swahili',
        category: 'emergency',
        text: 'DharURA - Nahitaji msaada wa haraka. Mahali pangu imetumwa. Tafadhali wasiliana na huduma ya dharura.',
        duration: 9
      },
      // Messages en anglais
      {
        id: 'emergency-en',
        language: 'english',
        category: 'emergency',
        text: 'EMERGENCY - I need immediate help. My location is being sent. Please contact emergency services.',
        duration: 8
      }
    ];

    messages.forEach(msg => {
      localStorage.setItem(`message-${msg.id}`, JSON.stringify(msg));
    });
  }

  private initializeVisualCodes() {
    const codes: VisualCode[] = [
      {
        id: 'sos',
        pattern: 'sos',
        description: 'Code SOS international (3 courts, 3 longs, 3 courts)',
        flashSequence: [
          { duration: 200, intensity: 1 },  // Court
          { duration: 200, intensity: 0 },
          { duration: 200, intensity: 1 },
          { duration: 200, intensity: 0 },
          { duration: 200, intensity: 1 },
          { duration: 200, intensity: 0 },
          { duration: 600, intensity: 1 },  // Long
          { duration: 200, intensity: 0 },
          { duration: 600, intensity: 1 },
          { duration: 200, intensity: 0 },
          { duration: 600, intensity: 1 },
          { duration: 200, intensity: 0 },
          { duration: 200, intensity: 1 },  // Court
          { duration: 200, intensity: 0 },
          { duration: 200, intensity: 1 },
          { duration: 200, intensity: 0 },
          { duration: 200, intensity: 1 },
          { duration: 1000, intensity: 0 } // Pause
        ]
      },
      {
        id: 'help',
        pattern: 'help',
        description: 'Signal d\'aide (clignotement rapide continu)',
        flashSequence: [
          { duration: 300, intensity: 1 },
          { duration: 300, intensity: 0 }
        ].flatMap(seq => Array(10).fill(seq)).concat([{ duration: 2000, intensity: 0 }])
      },
      {
        id: 'danger',
        pattern: 'danger',
        description: 'Signal de danger (clignotement erratique)',
        flashSequence: [
          { duration: 150, intensity: 1 },
          { duration: 100, intensity: 0 },
          { duration: 300, intensity: 1 },
          { duration: 50, intensity: 0 },
          { duration: 200, intensity: 1 },
          { duration: 400, intensity: 0 },
          { duration: 100, intensity: 1 },
          { duration: 500, intensity: 0 }
        ].flatMap(seq => Array(5).fill(seq)).concat([{ duration: 2000, intensity: 0 }])
      },
      {
        id: 'safe',
        pattern: 'safe',
        description: 'Signal de sécurité (lumière continue)',
        flashSequence: [
          { duration: 5000, intensity: 0.5 },
          { duration: 1000, intensity: 0 }
        ]
      }
    ];

    codes.forEach(code => {
      this.visualCodes.set(code.id, code);
    });
  }

  private monitorConnectivity() {
    window.addEventListener('online', () => {
      const channel = this.channels.get('internet');
      if (channel) {
        channel.available = true;
        channel.quality = 'good';
        channel.lastUsed = new Date();
      }
      this.processMessageQueue();
    });

    window.addEventListener('offline', () => {
      const channel = this.channels.get('internet');
      if (channel) {
        channel.available = false;
        channel.quality = 'unavailable';
      }
    });
  }

  public async sendPreRecordedMessage(
    messageId: string,
    contacts: string[],
    priorityChannels: ('internet' | 'sms' | 'visual' | 'audio')[] = ['internet', 'sms']
  ): Promise<{ success: boolean; channels: string[]; failedContacts: string[] }> {
    const messageData = localStorage.getItem(`message-${messageId}`);
    if (!messageData) {
      return { success: false, channels: [], failedContacts: contacts };
    }

    const message: PreRecordedMessage = JSON.parse(messageData);
    const successfulChannels: string[] = [];
    const failedContacts: string[] = [];

    // Essayer chaque canal par ordre de priorité
    for (const channelType of priorityChannels) {
      const channel = this.channels.get(channelType);
      if (!channel?.available) continue;

      try {
        switch (channelType) {
          case 'internet':
            await this.sendViaInternet(message, contacts);
            successfulChannels.push('internet');
            break;
          case 'sms':
            await this.sendViaSMS(message, contacts);
            successfulChannels.push('sms');
            break;
          case 'visual':
            await this.sendViaVisual('sos');
            successfulChannels.push('visual');
            break;
          case 'audio':
            await this.sendViaAudio(message);
            successfulChannels.push('audio');
            break;
        }
        channel.lastUsed = new Date();
      } catch (error) {
        console.error(`Erreur canal ${channelType}:`, error);
      }
    }

    return {
      success: successfulChannels.length > 0,
      channels: successfulChannels,
      failedContacts
    };
  }

  private async sendViaInternet(message: PreRecordedMessage, contacts: string[]): Promise<void> {
    // Simulation d'envoi via API internet
    const payload = {
      message: message.text,
      language: message.language,
      category: message.category,
      contacts,
      timestamp: new Date().toISOString(),
      location: await this.getCurrentLocation()
    };

    try {
      const response = await fetch('/api/emergency/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      // Si internet échoue, mettre en file d'attente SMS
      contacts.forEach(contact => {
        this.queueSMS(contact, message.text);
      });
      throw error;
    }
  }

  private async sendViaSMS(message: PreRecordedMessage, contacts: string[]): Promise<void> {
    for (const contact of contacts) {
      this.queueSMS(contact, message.text);
    }
    await this.processMessageQueue();
  }

  private queueSMS(to: string, message: string): void {
    const smsMessage: SMSMessage = {
      id: `sms-${Date.now()}-${Math.random()}`,
      to,
      message,
      timestamp: new Date(),
      status: 'pending',
      retries: 0
    };
    this.messageQueue.push(smsMessage);
  }

  private async processMessageQueue(): Promise<void> {
    const pendingMessages = this.messageQueue.filter(msg => msg.status === 'pending');
    
    for (const sms of pendingMessages) {
      try {
        // Simulation d'envoi SMS
        await this.simulateSMSSend(sms);
        sms.status = 'sent';
        
        // Simuler la confirmation de livraison après 2 secondes
        setTimeout(() => {
          sms.status = Math.random() > 0.1 ? 'delivered' : 'failed';
          if (sms.status === 'failed' && sms.retries < 3) {
            sms.retries++;
            sms.status = 'pending';
          }
        }, 2000);
      } catch (error) {
        sms.status = 'failed';
        sms.retries++;
      }
    }
  }

  private async simulateSMSSend(sms: SMSMessage): Promise<void> {
    // Simuler un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simuler un taux d'échec de 10%
    if (Math.random() < 0.1) {
      throw new Error('SMS send failed');
    }
  }

  private async sendViaVisual(codeId: string): Promise<void> {
    const code = this.visualCodes.get(codeId);
    if (!code || this.isFlashActive) return;

    this.isFlashActive = true;
    
    try {
      // Utiliser l'API Torch si disponible
      if (navigator.torch) {
        for (const step of code.flashSequence) {
          if (step.intensity > 0) {
            await navigator.torch.turnOn();
          } else {
            await navigator.torch.turnOff();
          }
          await new Promise(resolve => setTimeout(resolve, step.duration));
        }
        await navigator.torch.turnOff();
      } else {
        // Alternative : utiliser l'écran avec flash blanc
        await this.flashScreen(code);
      }
    } catch (error) {
      console.error('Erreur flash visuel:', error);
    } finally {
      this.isFlashActive = false;
    }
  }

  private async flashScreen(code: VisualCode): Promise<void> {
    // Créer un overlay plein écran pour simuler le flash
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: white;
      z-index: 999999;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.1s;
    `;
    document.body.appendChild(overlay);

    try {
      for (const step of code.flashSequence) {
        overlay.style.opacity = step.intensity.toString();
        await new Promise(resolve => setTimeout(resolve, step.duration));
      }
    } finally {
      document.body.removeChild(overlay);
    }
  }

  private async sendViaAudio(message: PreRecordedMessage): Promise<void> {
    try {
      // Utiliser l'API Web Speech pour la synthèse vocale
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(message.text);
        utterance.lang = message.language === 'fr' ? 'fr-FR' : 
                        message.language === 'lingala' ? 'ln-CD' :
                        message.language === 'swahili' ? 'sw-CD' : 'en-US';
        utterance.rate = 0.9;
        utterance.volume = 1.0;
        
        speechSynthesis.speak(utterance);
      } else {
        // Alternative : jouer un son d'urgence prédéfini
        await this.playEmergencySound();
      }
    } catch (error) {
      console.error('Erreur audio:', error);
    }
  }

  private async playEmergencySound(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 2);
  }

  private async getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => ({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }),
        () => null,
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  }

  public getChannelStatus(): CommunicationChannel[] {
    return Array.from(this.channels.values());
  }

  public getAvailableMessages(language?: 'fr' | 'lingala' | 'swahili' | 'english'): PreRecordedMessage[] {
    const messages: PreRecordedMessage[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('message-')) {
        const messageData = localStorage.getItem(key);
        if (messageData) {
          const message: PreRecordedMessage = JSON.parse(messageData);
          if (!language || message.language === language) {
            messages.push(message);
          }
        }
      }
    }
    
    return messages;
  }

  public getMessageQueueStatus(): { pending: number; sent: number; failed: number } {
    const pending = this.messageQueue.filter(m => m.status === 'pending').length;
    const sent = this.messageQueue.filter(m => m.status === 'sent').length;
    const failed = this.messageQueue.filter(m => m.status === 'failed').length;
    
    return { pending, sent, failed };
  }

  public async triggerEmergencyVisualCode(codeId: 'sos' | 'help' | 'danger' | 'safe'): Promise<void> {
    await this.sendViaVisual(codeId);
  }

  public createCustomMessage(
    language: 'fr' | 'lingala' | 'swahili' | 'english',
    category: 'emergency' | 'medical' | 'security' | 'evacuation',
    text: string
  ): string {
    const message: PreRecordedMessage = {
      id: `custom-${Date.now()}`,
      language,
      category,
      text,
      duration: Math.ceil(text.split(' ').length * 0.5) // Estimation
    };
    
    localStorage.setItem(`message-${message.id}`, JSON.stringify(message));
    return message.id;
  }
}

export const multiChannelCommunication = new MultiChannelCommunicationService();
export default multiChannelCommunication;
