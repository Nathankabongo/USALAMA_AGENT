import fs from 'fs';
import path from 'path';

export class JSONDatabase {
  private dataPath: string;
  private data: any = {
    users: [],
    incidents: [],
    emergency_contacts: [],
    alerts: [],
    medical_services: []
  };

  constructor() {
    this.dataPath = path.join(__dirname, '../../data/usalama.json');
    this.ensureDataDirectory();
    this.loadData();
  }

  private ensureDataDirectory(): void {
    const dataDir = path.dirname(this.dataPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  private loadData(): void {
    try {
      if (fs.existsSync(this.dataPath)) {
        const fileData = fs.readFileSync(this.dataPath, 'utf8');
        this.data = JSON.parse(fileData);
        console.log('✅ Loaded data from JSON file');
      } else {
        this.initializeData();
        this.saveData();
        console.log('✅ Created new JSON database');
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
      this.initializeData();
      this.saveData();
    }
  }

  private initializeData(): void {
    this.data = {
      users: [],
      incidents: [],
      emergency_contacts: [],
      alerts: [],
      medical_services: [
        {
          id: 1,
          name: "Hôpital Général de Kinshasa",
          type: "hospital",
          phone: "+243123456789",
          address: "Avenue de la Paix, Kinshasa",
          latitude: -4.3275,
          longitude: 15.3136,
          responseTime: 15,
          isActive: true
        },
        {
          id: 2,
          name: "Centre Médical Ngaliema",
          type: "clinic",
          phone: "+243987654321",
          address: "Boulevard Ngaliema, Kinshasa",
          latitude: -4.3026,
          longitude: 15.2682,
          responseTime: 10,
          isActive: true
        },
        {
          id: 3,
          name: "Service d'Ambulance USALAMA",
          type: "ambulance",
          phone: "+243112233445",
          address: "Disponible 24/7",
          latitude: -4.3275,
          longitude: 15.3136,
          responseTime: 8,
          isActive: true
        }
      ]
    };
  }

  private saveData(): void {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('❌ Error saving data:', error);
    }
  }

  // User operations
  async findUserByEmail(email: string): Promise<any> {
    return this.data.users.find((user: any) => user.email === email);
  }

  async findUserByUsername(username: string): Promise<any> {
    return this.data.users.find((user: any) => user.username === username);
  }

  async createUser(userData: any): Promise<any> {
    const newUser = {
      id: Date.now(),
      ...userData,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.data.users.push(newUser);
    this.saveData();
    return newUser;
  }

  // Incident operations
  async createIncident(incidentData: any): Promise<any> {
    const newIncident = {
      id: Date.now(),
      ...incidentData,
      status: 'reported',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.data.incidents.push(newIncident);
    this.saveData();
    return newIncident;
  }

  async getIncidents(userId?: number): Promise<any[]> {
    if (userId) {
      return this.data.incidents.filter((incident: any) => incident.userId === userId);
    }
    return this.data.incidents;
  }

  // Alert operations
  async createAlert(alertData: any): Promise<any> {
    const newAlert = {
      id: Date.now(),
      ...alertData,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    this.data.alerts.push(newAlert);
    this.saveData();
    return newAlert;
  }

  async getActiveAlerts(): Promise<any[]> {
    return this.data.alerts.filter((alert: any) => alert.isActive);
  }

  // Medical services operations
  async getMedicalServices(): Promise<any[]> {
    return this.data.medical_services.filter((service: any) => service.isActive);
  }

  async getNearbyMedicalServices(lat: number, lng: number, radius: number = 5): Promise<any[]> {
    const services = this.data.medical_services.filter((service: any) => service.isActive);
    
    return services.map((service: any) => {
      const distance = this.calculateDistance(lat, lng, service.latitude, service.longitude);
      return { ...service, distance };
    }).filter((service: any) => service.distance <= radius)
      .sort((a: any, b: any) => a.distance - b.distance);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance en km
  }

  // Emergency contact operations
  async createEmergencyContact(userId: number, contactData: any): Promise<any> {
    const newContact = {
      id: Date.now(),
      userId,
      ...contactData,
      createdAt: new Date().toISOString()
    };
    
    this.data.emergency_contacts.push(newContact);
    this.saveData();
    return newContact;
  }

  async getEmergencyContacts(userId: number): Promise<any[]> {
    return this.data.emergency_contacts.filter((contact: any) => contact.userId === userId);
  }

  // Statistics
  async getStatistics(): Promise<any> {
    const incidents = this.data.incidents;
    const users = this.data.users;
    
    return {
      totalUsers: users.length,
      totalIncidents: incidents.length,
      incidentsByType: this.groupBy(incidents, 'type'),
      incidentsBySeverity: this.groupBy(incidents, 'severity'),
      incidentsByStatus: this.groupBy(incidents, 'status'),
      activeAlerts: this.data.alerts.filter((alert: any) => alert.isActive).length,
      medicalServices: this.data.medical_services.filter((service: any) => service.isActive).length
    };
  }

  private groupBy(array: any[], key: string): any {
    return array.reduce((result, item) => {
      const group = item[key];
      result[group] = (result[group] || 0) + 1;
      return result;
    }, {});
  }

  // Backup and restore
  async backup(backupPath?: string): Promise<void> {
    const backupFile = backupPath || path.join(__dirname, '../../data/backup.json');
    fs.writeFileSync(backupFile, JSON.stringify(this.data, null, 2));
    console.log(`✅ Backup created: ${backupFile}`);
  }

  async restore(backupPath: string): Promise<void> {
    try {
      const backupData = fs.readFileSync(backupPath, 'utf8');
      this.data = JSON.parse(backupData);
      this.saveData();
      console.log(`✅ Data restored from: ${backupPath}`);
    } catch (error) {
      console.error('❌ Error restoring data:', error);
      throw error;
    }
  }
}

export const jsonDB = new JSONDatabase();
