import { useState, useEffect, useRef, useCallback } from 'react';

interface ClapDetectionConfig {
  threshold: number;      // Seuil de puissance sonore
  cooldown: number;       // Temps d'attente entre deux détections (ms)
  sensitivity: number;    // Sensibilité au pic soudain
}

export const useClapDetection = (
  onClap: () => void,
  isActive: boolean = false,
  config: Partial<ClapDetectionConfig> = {}
) => {
  const settings = {
    threshold: -15,       // dB
    cooldown: 800,        // 800ms
    sensitivity: 25,      // Différence de volume minimale pour un pic
    ...config
  };

  const [isListening, setIsListening] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastClapTime = useRef<number>(0);
  const lastVolume = useRef<number>(-100);

  const startListening = useCallback(async () => {
    if (isListening) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsListening(true);
      processAudio();
    } catch (error) {
      console.error('Erreur démarrage détection clap:', error);
      setIsListening(false);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
  }, []);

  const processAudio = () => {
    if (!analyserRef.current || !isListening) return;

    const dataArray = new Float32Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getFloatTimeDomainData(dataArray);

    // Calculer le volume RMS (Root Mean Square)
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);
    const db = 20 * Math.log10(rms);

    const now = Date.now();
    
    // Détection de pic soudain (Clap)
    if (db > settings.threshold && (db - lastVolume.current) > settings.sensitivity) {
      if (now - lastClapTime.current > settings.cooldown) {
        console.log('👏 Applaudissement détecté ! Volume:', db.toFixed(2), 'dB');
        onClap();
        lastClapTime.current = now;
      }
    }

    lastVolume.current = db;

    if (isListening) {
      requestAnimationFrame(processAudio);
    }
  };

  useEffect(() => {
    if (isActive) {
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [isActive, startListening, stopListening]);

  return { isListening, startListening, stopListening };
};

export default useClapDetection;
