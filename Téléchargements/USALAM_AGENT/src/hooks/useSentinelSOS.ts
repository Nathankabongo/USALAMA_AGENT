// hooks/useSentinelSOS.ts - Advanced SOS Hook with Stealth Mode

import { useState, useEffect, useRef, useCallback } from 'react';
import { offlineStorage } from '@/services/offlineStorage';

interface SOSState {
  isActive: boolean;
  mode: 'idle' | 'tapping' | 'long-press' | 'emergency' | 'stealth';
  recording: boolean;
  tracking: boolean;
  lastActivation: string | null;
}

interface SOSConfig {
  longPressDuration: number;
  doubleTapWindow: number;
  maxRecordingDuration: number;
  trackingInterval: number;
  stealthModeEnabled: boolean;
}

interface EmergencyAlert {
  id: string;
  type: 'stealth' | 'maximum';
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  user_id?: string;
  audio_evidence: boolean;
  synced: boolean;
}

export const useSentinelSOS = (config: Partial<SOSConfig> = {}) => {
  const defaultConfig: SOSConfig = {
    longPressDuration: 3000, // 3 seconds
    doubleTapWindow: 300,     // 300ms
    maxRecordingDuration: 10000, // 10 seconds
    trackingInterval: 2000,   // 2 seconds
    stealthModeEnabled: true,
    ...config
  };

  const [sosState, setSosState] = useState<SOSState>({
    isActive: false,
    mode: 'idle',
    recording: false,
    tracking: false,
    lastActivation: null
  });

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const tapCount = useRef(0);
  const lastTapTime = useRef(0);
  const trackingWatcher = useRef<number | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioStream = useRef<MediaStream | null>(null);


  const initializeSOSSystem = async () => {
    try {
      // Request permissions
      await requestEmergencyPermissions();
      
      // Check for stealth mode setting
      const stealthEnabled = await offlineStorage.getUserSetting('stealth_mode_enabled');
      if (typeof stealthEnabled === 'boolean') {
        defaultConfig.stealthModeEnabled = stealthEnabled;
      }
      
      console.log('🛡️ Sentinel SOS System initialized');
    } catch (error) {
      console.error('❌ Failed to initialize SOS system:', error);
    }
  };

  const requestEmergencyPermissions = async (): Promise<void> => {
    const permissions = [
      { name: 'microphone' as PermissionName },
      { name: 'camera' as PermissionName },
      { name: 'geolocation' as PermissionName }
    ];

    for (const permission of permissions) {
      try {
        if ('permissions' in navigator) {
          const result = await navigator.permissions.query({ name: permission.name });
          if (result.state === 'granted') {
            console.log(`✅ ${permission.name} permission granted`);
          } else if (result.state === 'prompt') {
            console.log(`⏳ ${permission.name} permission prompt needed`);
          }
        }
      } catch (error) {
        console.log(`⚠️ Could not check ${permission.name} permission:`, error);
      }
    }

    // Request actual media permissions
    try {
      if (navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        console.log('🎤 Microphone access granted');
        // Stop the stream immediately after getting permission
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (error) {
      console.log('⚠️ Microphone access denied:', error);
      // Don't throw error, just log it
    }
  };

  const handleSOSInteraction = useCallback(async (action: 'tap' | 'longPressStart' | 'longPressEnd') => {
    const now = Date.now();
    
    switch (action) {
      case 'tap':
        await handleTap(now);
        break;
      case 'longPressStart':
        await handleLongPressStart();
        break;
      case 'longPressEnd':
        await handleLongPressEnd();
        break;
    }
  }, []);

  const handleTap = async (timestamp: number) => {
    // Detect double tap
    if (timestamp - lastTapTime.current < defaultConfig.doubleTapWindow) {
      tapCount.current++;
      if (tapCount.current === 2) {
        await triggerEmergencyMode('maximum');
        tapCount.current = 0;
      }
    } else {
      tapCount.current = 1;
      setTimeout(async () => {
        if (tapCount.current === 1) {
          // Single tap - quick report
          await triggerQuickReport();
          tapCount.current = 0;
        }
      }, defaultConfig.doubleTapWindow);
    }
    lastTapTime.current = timestamp;
  };

  const handleLongPressStart = async () => {
    setSosState(prev => ({ ...prev, mode: 'long-press' }));
    
    // Start emergency recording
    await startEmergencyRecording();
    
    // Start long press timer
    longPressTimer.current = setTimeout(async () => {
      await triggerStealthMode();
    }, defaultConfig.longPressDuration);
  };

  const handleLongPressEnd = async () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (sosState.mode !== 'emergency' && sosState.mode !== 'stealth') {
      setSosState(prev => ({ ...prev, mode: 'idle' }));
    }
    
    // Stop recording if not in emergency mode
    if (sosState.mode !== 'emergency' && sosState.mode !== 'stealth') {
      await stopEmergencyRecording();
    }
  };

  const triggerEmergencyMode = async (priority: 'maximum' | 'high') => {
    console.log(`🚨 EMERGENCY MODE ACTIVATED - Priority: ${priority}`);
    
    setSosState(prev => ({
      ...prev,
      mode: 'emergency',
      isActive: true,
      lastActivation: new Date().toISOString()
    }));

    // Create emergency alert
    const locationResult = await getCurrentLocation();
    const alert: EmergencyAlert = {
      id: `sos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: priority === 'maximum' ? 'maximum' : 'stealth',
      timestamp: new Date().toISOString(),
      location: 'error' in locationResult ? undefined : { 
        ...locationResult, 
        accuracy: undefined 
      },
      user_id: localStorage.getItem('usalama_user_id') || undefined,
      audio_evidence: sosState.recording,
      synced: false
    };

    // Store emergency alert
    const alertId = await offlineStorage.storeEmergencyAlert(alert);
    
    // Start continuous tracking
    await startContinuousTracking();
    
    // Send to server if online (using the full alert with id)
    try {
      const response = await fetch('/api/emergency/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...alert, id: alertId })
      });
      
      if (response.ok) {
        await offlineStorage.markEmergencyAlertSynced(alertId);
        console.log('✅ Emergency alert synced to server');
      }
    } catch (error) {
      console.log('📴 Offline mode - Alert stored locally');
    }

    // Trigger emergency feedback
    triggerEmergencyFeedback(priority);
  };

  const triggerStealthMode = async () => {
    console.log('🕵️ STEALTH MODE ACTIVATED');
    
    setSosState(prev => ({
      ...prev,
      mode: 'stealth',
      isActive: true,
      lastActivation: new Date().toISOString()
    }));

    // Create stealth alert
    const locationResult = await getCurrentLocation();
    const alert: EmergencyAlert = {
      id: `stealth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'stealth',
      timestamp: new Date().toISOString(),
      location: 'error' in locationResult ? undefined : { 
        ...locationResult, 
        accuracy: undefined 
      },
      user_id: localStorage.getItem('usalama_user_id') || undefined,
      audio_evidence: sosState.recording,
      synced: false
    };

    // Store stealth alert
    const alertId = await offlineStorage.storeEmergencyAlert(alert);

    // Start background tracking
    await startBackgroundTracking();

    // Show fake interface if enabled
    if (defaultConfig.stealthModeEnabled) {
      await showFakeInterface();
    }

    // Silent feedback
    triggerStealthFeedback();
  };

  const triggerQuickReport = async () => {
    console.log('📝 Quick report triggered');
    
    // Navigate to incident report or open quick report modal
    const event = new CustomEvent('openQuickReport', { 
      detail: { timestamp: new Date().toISOString() } 
    });
    window.dispatchEvent(event);
  };

  const startEmergencyRecording = async () => {
    if (sosState.recording) return;
    
    try {
      setSosState(prev => ({ ...prev, recording: true }));
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      audioStream.current = stream;
      mediaRecorder.current = new MediaRecorder(stream);
      
      const chunks: Blob[] = [];
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await storeAudioEvidence(audioBlob);
      };
      
      mediaRecorder.current.start();
      console.log('🎙️ Emergency recording started');
      
      // Auto-stop after max duration
      setTimeout(() => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
          stopEmergencyRecording();
        }
      }, defaultConfig.maxRecordingDuration);
      
    } catch (error) {
      console.error('❌ Failed to start emergency recording:', error);
      setSosState(prev => ({ ...prev, recording: false }));
    }
  };

  const stopEmergencyRecording = async () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
    }
    
    if (audioStream.current) {
      audioStream.current.getTracks().forEach(track => track.stop());
      audioStream.current = null;
    }
    
    setSosState(prev => ({ ...prev, recording: false }));
    console.log('🔇 Emergency recording stopped');
  };

  const storeAudioEvidence = async (audioBlob: Blob): Promise<void> => {
    try {
      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        await offlineStorage.setUserSetting('last_audio_evidence', {
          data: base64Audio,
          timestamp: new Date().toISOString()
        });
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('❌ Failed to store audio evidence:', error);
    }
  };

  const startContinuousTracking = async () => {
    if (trackingWatcher.current) return;
    
    setSosState(prev => ({ ...prev, tracking: true }));
    
    trackingWatcher.current = navigator.geolocation.watchPosition(
      async (position) => {
        const point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString(),
          accuracy: position.coords.accuracy
        };
        
        await offlineStorage.storeTrackingPoint(point);
      },
      null,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );
    
    console.log('📍 Continuous GPS tracking started');
  };

  const startBackgroundTracking = async () => {
    // More subtle tracking for stealth mode
    await startContinuousTracking();
  };

  const stopTracking = () => {
    if (trackingWatcher.current) {
      navigator.geolocation.clearWatch(trackingWatcher.current);
      trackingWatcher.current = null;
    }
    
    setSosState(prev => ({ ...prev, tracking: false }));
    console.log('📍 GPS tracking stopped');
  };

  const getCurrentLocation = async (): Promise<{ lat: number; lng: number } | { error: string }> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }),
          () => resolve({ error: 'Location denied' }),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
      resolve({ error: 'Geolocation not available' });
    });
  };

  const syncEmergencyAlert = async (alert: EmergencyAlert) => {
    try {
      const response = await fetch('/api/emergency/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });
      
      if (response.ok) {
        await offlineStorage.markEmergencyAlertSynced(alert.id);
        console.log('✅ Emergency alert synced to server');
      }
    } catch (error) {
      console.log('📴 Offline mode - Alert stored locally');
    }
  };

  const showFakeInterface = async () => {
    // Instead of completely leaving the app, dispatch the decoy event
    // so the app switches to the fake weather/calc screen while staying active
    window.dispatchEvent(new CustomEvent('trigger-decoy'));
  };

  const triggerEmergencyFeedback = (priority: 'maximum' | 'high') => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      if (priority === 'maximum') {
        navigator.vibrate([200, 100, 200, 100, 200]);
      } else {
        navigator.vibrate([100, 50, 100]);
      }
    }
    
    // Sound feedback (if enabled)
    playEmergencySound(priority);
  };

  const triggerStealthFeedback = () => {
    // Minimal feedback for stealth mode
    if ('vibrate' in navigator) {
      navigator.vibrate(50); // Very short vibration
    }
  };

  const playEmergencySound = (priority: 'maximum' | 'high') => {
    try {
      const audio = new Audio();
      if (priority === 'maximum') {
        audio.src = '/sounds/emergency_max.mp3';
      } else {
        audio.src = '/sounds/emergency_high.mp3';
      }
      audio.volume = 0.7;
      audio.play().catch(() => {
        // Audio playback failed (common on mobile)
        console.log('🔇 Emergency sound playback failed');
      });
    } catch (error) {
      console.log('🔇 Could not play emergency sound:', error);
    }
  };

  const cleanupSOSSystem = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    stopTracking();
    stopEmergencyRecording();
  };

  // Initialize SOS system
  useEffect(() => {
    initializeSOSSystem();
    return () => {
      cleanupSOSSystem();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Public API
  const deactivateSOS = async () => {
    setSosState({
      isActive: false,
      mode: 'idle',
      recording: false,
      tracking: false,
      lastActivation: null
    });
    
    cleanupSOSSystem();
    console.log('🛡️ SOS system deactivated');
  };

  const SOSStatus = () => {
    return {
      ...sosState,
      config: defaultConfig,
      isLongPressActive: sosState.mode === 'long-press',
      isEmergencyActive: sosState.mode === 'emergency' || sosState.mode === 'stealth'
    };
  }

  return {
    sosState,
    handleSOSInteraction,
    deactivateSOS,
    startEmergencyRecording,
    stopEmergencyRecording,
    getCurrentLocation,
    SOSStatus
  };
};

export default useSentinelSOS;
