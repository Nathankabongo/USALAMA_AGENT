// services/offlineStorage.ts - Offline-First Storage Service

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

interface TrackingPoint {
  lat: number;
  lng: number;
  timestamp: string;
  accuracy?: number;
}

interface IncidentReport {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  timestamp: string;
  isAnonymous: boolean;
  status: 'pending' | 'verified' | 'resolved';
  synced: boolean;
}

interface UserSetting {
  key: string;
  value: unknown;
  timestamp: string;
}

class OfflineStorage {
  private dbName = 'usalama_offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Emergency alerts store
        if (!db.objectStoreNames.contains('emergency_alerts')) {
          const alertStore = db.createObjectStore('emergency_alerts', { keyPath: 'id' });
          alertStore.createIndex('timestamp', 'timestamp');
          alertStore.createIndex('synced', 'synced');
        }

        // GPS tracking store
        if (!db.objectStoreNames.contains('tracking_points')) {
          const trackingStore = db.createObjectStore('tracking_points', { keyPath: 'id', autoIncrement: true });
          trackingStore.createIndex('timestamp', 'timestamp');
        }

        // Incident reports store
        if (!db.objectStoreNames.contains('incident_reports')) {
          const reportStore = db.createObjectStore('incident_reports', { keyPath: 'id' });
          reportStore.createIndex('timestamp', 'timestamp');
          reportStore.createIndex('synced', 'synced');
          reportStore.createIndex('severity', 'severity');
        }

        // User settings store
        if (!db.objectStoreNames.contains('user_settings')) {
          db.createObjectStore('user_settings', { keyPath: 'key' });
        }
      };
    });
  }

  // Emergency Alerts
  async storeEmergencyAlert(alert: Omit<EmergencyAlert, 'id'>): Promise<string> {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullAlert: EmergencyAlert = { ...alert, id, synced: false };
    
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      
      const transaction = this.db.transaction(['emergency_alerts'], 'readwrite');
      const store = transaction.objectStore('emergency_alerts');
      const request = store.put(fullAlert);
      
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedEmergencyAlerts(): Promise<EmergencyAlert[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      
      const transaction = this.db.transaction(['emergency_alerts'], 'readonly');
      const store = transaction.objectStore('emergency_alerts');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result.filter((item: EmergencyAlert) => item.synced === false));
      request.onerror = () => reject(request.error);
    });
  }

  async markEmergencyAlertSynced(alertId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      
      const transaction = this.db.transaction(['emergency_alerts'], 'readwrite');
      const store = transaction.objectStore('emergency_alerts');
      const getRequest = store.get(alertId);
      
      getRequest.onsuccess = () => {
        const alert = getRequest.result;
        if (alert) {
          alert.synced = true;
          const updateRequest = store.put(alert);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Alert not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // GPS Tracking
  async storeTrackingPoint(point: TrackingPoint): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      
      const transaction = this.db.transaction(['tracking_points'], 'readwrite');
      const store = transaction.objectStore('tracking_points');
      const request = store.add(point);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getRecentTrackingPoints(hours: number = 24): Promise<TrackingPoint[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      
      const transaction = this.db.transaction(['tracking_points'], 'readonly');
      const store = transaction.objectStore('tracking_points');
      const index = store.index('timestamp');
      const range = IDBKeyRange.lowerBound(cutoffTime);
      const request = index.getAll(range);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async cleanupOldTrackingPoints(daysToKeep: number = 7): Promise<void> {
    const cutoffTime = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();
    
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      
      const transaction = this.db.transaction(['tracking_points'], 'readwrite');
      const store = transaction.objectStore('tracking_points');
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(cutoffTime);
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Incident Reports
  async storeIncidentReport(report: Omit<IncidentReport, 'id'>): Promise<string> {
    const id = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullReport: IncidentReport = { ...report, id, synced: false };
    
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      
      const transaction = this.db.transaction(['incident_reports'], 'readwrite');
      const store = transaction.objectStore('incident_reports');
      const request = store.put(fullReport);
      
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedIncidentReports(): Promise<IncidentReport[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      
      const transaction = this.db.transaction(['incident_reports'], 'readonly');
      const store = transaction.objectStore('incident_reports');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result.filter((item: IncidentReport) => item.synced === false));
      request.onerror = () => reject(request.error);
    });
  }

  // User Settings
  async setUserSetting(key: string, value: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      
      const transaction = this.db.transaction(['user_settings'], 'readwrite');
      const store = transaction.objectStore('user_settings');
      const request = store.put({ key, value });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUserSetting(key: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      
      const transaction = this.db.transaction(['user_settings'], 'readonly');
      const store = transaction.objectStore('user_settings');
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  // Sync Management
  async getStorageStats(): Promise<{
    emergencyAlerts: number;
    trackingPoints: number;
    incidentReports: number;
    unsyncedItems: number;
  }> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('Database not initialized'));
      
      const stats = {
        emergencyAlerts: 0,
        trackingPoints: 0,
        incidentReports: 0,
        unsyncedItems: 0
      };

      const transaction = this.db.transaction(['emergency_alerts', 'tracking_points', 'incident_reports'], 'readonly');
      
      Promise.all([
        this.countStore(transaction.objectStore('emergency_alerts')),
        this.countStore(transaction.objectStore('tracking_points')),
        this.countStore(transaction.objectStore('incident_reports'))
      ]).then(([alerts, tracking, reports]) => {
        stats.emergencyAlerts = alerts;
        stats.trackingPoints = tracking;
        stats.incidentReports = reports;
        
        // Count unsynced items
        Promise.all([
          new Promise<number>((res) => {
            const req = transaction.objectStore('emergency_alerts').getAll();
            req.onsuccess = () => res(req.result.filter((r: any) => r.synced === false).length);
          }),
          new Promise<number>((res) => {
            const req = transaction.objectStore('incident_reports').getAll();
            req.onsuccess = () => res(req.result.filter((r: any) => r.synced === false).length);
          })
        ]).then(([unsyncedAlerts, unsyncedReports]) => {
          stats.unsyncedItems = unsyncedAlerts + unsyncedReports;
          resolve(stats);
        });
      });
    });
  }

  private countStore(store: IDBObjectStore): Promise<number> {
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private countIndex(index: IDBIndex, value: string | number): Promise<number> {
    return new Promise((resolve, reject) => {
      const request = index.count(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Cleanup and maintenance
  async performMaintenance(): Promise<void> {
    try {
      // Clean up old tracking points (keep 7 days)
      await this.cleanupOldTrackingPoints(7);
      
      // Get storage stats
      const stats = await this.getStorageStats();
      console.log('📊 Offline Storage Stats:', stats);
      
      // If storage is getting full, clean up more aggressively
      if (stats.trackingPoints > 10000) {
        await this.cleanupOldTrackingPoints(3); // Keep only 3 days
      }
      
      console.log('✅ Offline storage maintenance completed');
    } catch (error) {
      console.error('❌ Offline storage maintenance failed:', error);
    }
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage();

// Initialize on app start
export const initializeOfflineStorage = async (): Promise<void> => {
  try {
    await offlineStorage.init();
    console.log('✅ Offline storage initialized');
    
    // Perform maintenance on startup
    await offlineStorage.performMaintenance();
  } catch (error) {
    console.error('❌ Failed to initialize offline storage:', error);
  }
};

export default offlineStorage;
