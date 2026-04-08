import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

export class SQLiteDatabase {
  private db: Database | null = null;
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(__dirname, '../../data/usalama.db');
    this.ensureDataDirectory();
  }

  private ensureDataDirectory(): void {
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  async connect(): Promise<void> {
    try {
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });

      console.log('✅ Connected to SQLite database successfully!');
      console.log(`📊 Database: ${this.dbPath}`);
      
      await this.createTables();
      console.log('📋 Tables created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to connect to SQLite:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    // Users table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Incidents table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'reported',
        latitude REAL,
        longitude REAL,
        address TEXT,
        city TEXT,
        country TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolvedAt DATETIME,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Emergency contacts table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        relationship TEXT NOT NULL,
        isPrimary BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Alerts table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiresAt DATETIME
      )
    `);

    // Medical services table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS medical_services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        latitude REAL,
        longitude REAL,
        responseTime INTEGER,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_incidents_userId ON incidents(userId);
      CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
      CREATE INDEX IF NOT EXISTS idx_incidents_location ON incidents(latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_emergency_contacts_userId ON emergency_contacts(userId);
      CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(isActive);
      CREATE INDEX IF NOT EXISTS idx_medical_services_location ON medical_services(latitude, longitude);
    `);
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      await this.db.close();
      console.log('✅ Disconnected from SQLite database');
    }
  }

  getDatabase(): Database {
    if (!this.db) throw new Error('Database not connected');
    return this.db;
  }

  // Helper methods for common operations
  async runQuery(sql: string, params: any[] = []): Promise<any> {
    if (!this.db) throw new Error('Database not connected');
    return await this.db.get(sql, params);
  }

  async runAll(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.db) throw new Error('Database not connected');
    return await this.db.all(sql, params);
  }

  async runExecute(sql: string, params: any[] = []): Promise<any> {
    if (!this.db) throw new Error('Database not connected');
    return await this.db.run(sql, params);
  }
}

export const sqliteDB = new SQLiteDatabase();
