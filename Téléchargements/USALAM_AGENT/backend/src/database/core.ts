import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface DatabaseConfig {
  dataPath: string;
  backupPath: string;
  encryptionKey?: string;
  autoBackup: boolean;
  backupInterval: number; // minutes
}

export interface DatabaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export class DatabaseCore {
  private config: DatabaseConfig;
  private data: any = {};
  private backupTimer?: NodeJS.Timeout;

  constructor(config: Partial<DatabaseConfig> = {}) {
    this.config = {
      dataPath: path.join(__dirname, '../../../data/usalama.db'),
      backupPath: path.join(__dirname, '../../../data/backups'),
      autoBackup: true,
      backupInterval: 60, // 1 hour
      ...config
    };

    this.ensureDirectories();
    this.loadData();
    this.startAutoBackup();
  }

  private ensureDirectories(): void {
    const dirs = [
      path.dirname(this.config.dataPath),
      this.config.backupPath
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private loadData(): void {
    try {
      if (fs.existsSync(this.config.dataPath)) {
        const fileData = fs.readFileSync(this.config.dataPath, 'utf8');
        const decryptedData = this.config.encryptionKey 
          ? this.decrypt(fileData, this.config.encryptionKey)
          : fileData;
        
        this.data = JSON.parse(decryptedData);
        console.log('✅ Database loaded successfully');
      } else {
        this.initializeDatabase();
        this.saveData();
        console.log('✅ New database created');
      }
    } catch (error) {
      console.error('❌ Error loading database:', error);
      this.initializeDatabase();
      this.saveData();
    }
  }

  private initializeDatabase(): void {
    this.data = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      lastBackup: null,
      statistics: {
        totalUsers: 0,
        totalIncidents: 0,
        totalServices: 0,
        totalAlerts: 0
      },
      users: [],
      incidents: [],
      services: [],
      alerts: [],
      emergencyContacts: [],
      systemLogs: [],
      settings: {
        autoBackup: this.config.autoBackup,
        backupInterval: this.config.backupInterval,
        maxBackups: 30,
        encryption: !!this.config.encryptionKey
      }
    };
  }

  private saveData(): void {
    try {
      const jsonData = JSON.stringify(this.data, null, 2);
      const finalData = this.config.encryptionKey 
        ? this.encrypt(jsonData, this.config.encryptionKey)
        : jsonData;
      
      fs.writeFileSync(this.config.dataPath, finalData);
      this.updateStatistics();
    } catch (error) {
      console.error('❌ Error saving database:', error);
      throw error;
    }
  }

  private encrypt(text: string, key: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string, key: string): string {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedData = textParts.join(':');
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private updateStatistics(): void {
    this.data.statistics = {
      totalUsers: this.data.users?.length || 0,
      totalIncidents: this.data.incidents?.length || 0,
      totalServices: this.data.services?.length || 0,
      totalAlerts: this.data.alerts?.length || 0
    };
  }

  private startAutoBackup(): void {
    if (this.config.autoBackup) {
      this.backupTimer = setInterval(() => {
        this.createBackup();
      }, this.config.backupInterval * 60 * 1000);
    }
  }

  // CRUD Operations
  create(collection: string, record: any): any {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }

    const newRecord: DatabaseRecord = {
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      ...record
    };

    this.data[collection].push(newRecord);
    this.saveData();
    this.addLog('CREATE', collection, newRecord.id);
    
    return newRecord;
  }

  findById(collection: string, id: string): any {
    return this.data[collection]?.find((record: any) => record.id === id);
  }

  find(collection: string, query: any = {}): any[] {
    if (!this.data[collection]) return [];
    
    return this.data[collection].filter((record: any) => {
      return Object.keys(query).every(key => {
        const recordValue = record[key];
        const queryValue = query[key];
        
        if (typeof queryValue === 'object' && queryValue !== null) {
          return Object.keys(queryValue).every(subKey => {
            return recordValue?.[subKey] === queryValue[subKey];
          });
        }
        
        return recordValue === queryValue;
      });
    });
  }

  update(collection: string, id: string, updates: any): any {
    const recordIndex = this.data[collection]?.findIndex((record: any) => record.id === id);
    
    if (recordIndex === -1) {
      throw new Error(`Record not found in ${collection}`);
    }

    const updatedRecord = {
      ...this.data[collection][recordIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
      version: (this.data[collection][recordIndex].version || 0) + 1
    };

    this.data[collection][recordIndex] = updatedRecord;
    this.saveData();
    this.addLog('UPDATE', collection, id);
    
    return updatedRecord;
  }

  delete(collection: string, id: string): boolean {
    const recordIndex = this.data[collection]?.findIndex((record: any) => record.id === id);
    
    if (recordIndex === -1) {
      return false;
    }

    this.data[collection].splice(recordIndex, 1);
    this.saveData();
    this.addLog('DELETE', collection, id);
    
    return true;
  }

  // Search and Query
  search(collection: string, searchTerm: string, fields: string[] = []): any[] {
    if (!this.data[collection]) return [];
    
    return this.data[collection].filter((record: any) => {
      const searchFields = fields.length > 0 ? fields : Object.keys(record);
      
      return searchFields.some(field => {
        const value = record[field];
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }

  // Backup Operations
  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.config.backupPath, `backup-${timestamp}.json`);
    
    try {
      const backupData = {
        ...this.data,
        backupInfo: {
          timestamp: new Date().toISOString(),
          version: this.data.version,
          size: JSON.stringify(this.data).length
        }
      };

      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
      
      this.data.lastBackup = new Date().toISOString();
      this.saveData();
      
      console.log(`✅ Backup created: ${backupFile}`);
      this.cleanupOldBackups();
      
      return backupFile;
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    }
  }

  private cleanupOldBackups(): void {
    try {
      const backups = fs.readdirSync(this.config.backupPath)
        .filter(file => file.startsWith('backup-'))
        .map(file => ({
          name: file,
          path: path.join(this.config.backupPath, file),
          time: fs.statSync(path.join(this.config.backupPath, file)).mtime
        }))
        .sort((a, b) => b.time.getTime() - a.time.getTime());

      const maxBackups = this.data.settings?.maxBackups || 30;
      
      if (backups.length > maxBackups) {
        const toDelete = backups.slice(maxBackups);
        toDelete.forEach(backup => {
          fs.unlinkSync(backup.path);
          console.log(`🗑️ Deleted old backup: ${backup.name}`);
        });
      }
    } catch (error) {
      console.error('❌ Error cleaning up backups:', error);
    }
  }

  async restoreBackup(backupFile: string): Promise<void> {
    try {
      const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
      
      // Validate backup structure
      if (!backupData.version || !backupData.users || !backupData.incidents) {
        throw new Error('Invalid backup file structure');
      }

      // Create backup before restoring
      await this.createBackup();
      
      // Restore data
      this.data = {
        ...backupData,
        lastBackup: new Date().toISOString()
      };
      
      this.saveData();
      console.log(`✅ Database restored from: ${backupFile}`);
      
    } catch (error) {
      console.error('❌ Restore failed:', error);
      throw error;
    }
  }

  // Logging
  private addLog(action: string, collection: string, recordId: string): void {
    const logEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      action,
      collection,
      recordId,
      user: 'system' // In production, this would be the authenticated user
    };

    if (!this.data.systemLogs) {
      this.data.systemLogs = [];
    }

    this.data.systemLogs.push(logEntry);
    
    // Keep only last 1000 logs
    if (this.data.systemLogs.length > 1000) {
      this.data.systemLogs = this.data.systemLogs.slice(-1000);
    }
  }

  getLogs(limit: number = 100): any[] {
    return (this.data.systemLogs || [])
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Utilities
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getStatistics(): any {
    return {
      ...this.data.statistics,
      lastBackup: this.data.lastBackup,
      databaseSize: JSON.stringify(this.data).length,
      collections: Object.keys(this.data).filter(key => Array.isArray(this.data[key])),
      settings: this.data.settings
    };
  }

  // Migration
  async migrate(fromVersion: string, toVersion: string): Promise<void> {
    console.log(`🔄 Migrating database from ${fromVersion} to ${toVersion}`);
    
    // Create backup before migration
    await this.createBackup();
    
    // Migration logic would go here
    // For now, just update version
    this.data.version = toVersion;
    this.data.migratedAt = new Date().toISOString();
    
    this.saveData();
    console.log(`✅ Database migrated to version ${toVersion}`);
  }

  // Cleanup
  destroy(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }
  }
}

export const database = new DatabaseCore();
