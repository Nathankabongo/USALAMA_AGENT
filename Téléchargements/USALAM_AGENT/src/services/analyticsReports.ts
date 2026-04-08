// services/analyticsReports.ts - Analyse et Rapports

export interface IncidentReport {
  id: string;
  timestamp: Date;
  type: 'sos_emergency' | 'sos_discreet' | 'medical' | 'security' | 'accident' | 'theft';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  duration: number; // en secondes
  outcome: 'resolved' | 'cancelled' | 'escalated' | 'pending';
  responseTime: number; // temps de réponse en secondes
  contactsNotified: string[];
  evidenceCollected: {
    audio: boolean;
    video: boolean;
    photos: number;
    location: boolean;
  };
  weatherConditions?: {
    temperature: number;
    humidity: number;
    condition: string;
  };
  userFeedback?: {
    rating: number; // 1-5
    comment: string;
  };
}

export interface SafetyStatistics {
  totalIncidents: number;
  incidentsByType: Record<string, number>;
  incidentsBySeverity: Record<string, number>;
  incidentsByHour: Record<number, number>;
  averageResponseTime: number;
  resolvedIncidents: number;
  escalationRate: number;
  userSatisfactionScore: number;
  monthlyTrend: Array<{
    month: string;
    incidents: number;
    resolved: number;
  }>;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number; // 0-1
  type: string;
  timestamp: Date;
}

export interface PersonalSafetyMetrics {
  personalScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  safeZones: Array<{
    name: string;
    lat: number;
    lng: number;
    visits: number;
  }>;
  dangerZones: Array<{
    name: string;
    lat: number;
    lng: number;
    incidents: number;
  }>;
  responseTimeHistory: number[];
  emergencyContacts: {
    total: number;
    frequent: string[];
    responseRate: number;
  };
}

class AnalyticsReportsService {
  private reports: Map<string, IncidentReport> = new Map();
  private heatmapData: HeatmapPoint[] = [];
  private statistics: SafetyStatistics | null = null;
  private personalMetrics: PersonalSafetyMetrics | null = null;

  constructor() {
    this.loadReports();
    this.loadHeatmapData();
    this.calculateStatistics();
    this.calculatePersonalMetrics();
  }

  public createIncidentReport(incident: Omit<IncidentReport, 'id'>): string {
    const report: IncidentReport = {
      ...incident,
      id: `incident-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.reports.set(report.id, report);
    this.addHeatmapPoint(report.location.lat, report.location.lng, report.type, report.severity);
    this.saveReports();
    this.calculateStatistics();
    this.calculatePersonalMetrics();

    // Envoyer le rapport au serveur si disponible
    this.syncReport(report);

    return report.id;
  }

  public updateIncidentReport(id: string, updates: Partial<IncidentReport>): boolean {
    const report = this.reports.get(id);
    if (!report) return false;

    const updatedReport = { ...report, ...updates };
    this.reports.set(id, updatedReport);
    this.saveReports();
    this.calculateStatistics();
    return true;
  }

  public getIncidentReports(limit?: number): IncidentReport[] {
    const reports = Array.from(this.reports.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? reports.slice(0, limit) : reports;
  }

  public getIncidentsByDateRange(startDate: Date, endDate: Date): IncidentReport[] {
    return Array.from(this.reports.values()).filter(report => 
      report.timestamp >= startDate && report.timestamp <= endDate
    );
  }

  public getIncidentsByType(type: string): IncidentReport[] {
    return Array.from(this.reports.values()).filter(report => report.type === type);
  }

  public getIncidentsByLocation(lat: number, lng: number, radius: number): IncidentReport[] {
    return Array.from(this.reports.values()).filter(report => {
      const distance = this.calculateDistance(lat, lng, report.location.lat, report.location.lng);
      return distance <= radius;
    });
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private addHeatmapPoint(lat: number, lng: number, type: string, severity: string) {
    const intensity = severity === 'critical' ? 1.0 :
                    severity === 'high' ? 0.8 :
                    severity === 'medium' ? 0.6 : 0.4;

    const point: HeatmapPoint = {
      lat,
      lng,
      intensity,
      type,
      timestamp: new Date()
    };

    this.heatmapData.push(point);
    
    // Garder seulement les 1000 derniers points
    if (this.heatmapData.length > 1000) {
      this.heatmapData = this.heatmapData.slice(-1000);
    }
    
    this.saveHeatmapData();
  }

  public getHeatmapData(centerLat?: number, centerLng?: number, radius?: number): HeatmapPoint[] {
    if (!centerLat || !centerLng || !radius) {
      return this.heatmapData;
    }

    return this.heatmapData.filter(point => {
      const distance = this.calculateDistance(centerLat, centerLng, point.lat, point.lng);
      return distance <= radius;
    });
  }

  private calculateStatistics() {
    const reports = Array.from(this.reports.values());
    
    if (reports.length === 0) {
      this.statistics = null;
      return;
    }

    const incidentsByType: Record<string, number> = {};
    const incidentsBySeverity: Record<string, number> = {};
    const incidentsByHour: Record<number, number> = {};
    let totalResponseTime = 0;
    let resolvedIncidents = 0;
    let escalatedIncidents = 0;
    let totalSatisfaction = 0;
    let satisfactionCount = 0;

    // Calculer les tendances mensuelles (6 derniers mois)
    const monthlyTrend = this.calculateMonthlyTrend(reports);

    reports.forEach(report => {
      // Par type
      incidentsByType[report.type] = (incidentsByType[report.type] || 0) + 1;
      
      // Par sévérité
      incidentsBySeverity[report.severity] = (incidentsBySeverity[report.severity] || 0) + 1;
      
      // Par heure
      const hour = report.timestamp.getHours();
      incidentsByHour[hour] = (incidentsByHour[hour] || 0) + 1;
      
      // Temps de réponse
      totalResponseTime += report.responseTime;
      
      // Résolution
      if (report.outcome === 'resolved') {
        resolvedIncidents++;
      } else if (report.outcome === 'escalated') {
        escalatedIncidents++;
      }
      
      // Satisfaction utilisateur
      if (report.userFeedback) {
        totalSatisfaction += report.userFeedback.rating;
        satisfactionCount++;
      }
    });

    this.statistics = {
      totalIncidents: reports.length,
      incidentsByType,
      incidentsBySeverity,
      incidentsByHour,
      averageResponseTime: totalResponseTime / reports.length,
      resolvedIncidents,
      escalationRate: (escalatedIncidents / reports.length) * 100,
      userSatisfactionScore: satisfactionCount > 0 ? totalSatisfaction / satisfactionCount : 0,
      monthlyTrend
    };
  }

  private calculateMonthlyTrend(reports: IncidentReport[]) {
    const monthlyData: Record<string, { incidents: number; resolved: number }> = {};
    const now = new Date();
    
    // Initialiser les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = { incidents: 0, resolved: 0 };
    }
    
    // Compter les incidents par mois
    reports.forEach(report => {
      const key = `${report.timestamp.getFullYear()}-${String(report.timestamp.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key]) {
        monthlyData[key].incidents++;
        if (report.outcome === 'resolved') {
          monthlyData[key].resolved++;
        }
      }
    });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data
    }));
  }

  private calculatePersonalMetrics() {
    const reports = Array.from(this.reports.values());
    
    if (reports.length === 0) {
      this.personalMetrics = null;
      return;
    }

    // Calculer le score de sécurité personnel
    const baseScore = 100;
    const incidentPenalty = reports.length * 2;
    const severityPenalty = reports.filter(r => r.severity === 'critical').length * 10;
    const resolutionBonus = reports.filter(r => r.outcome === 'resolved').length * 3;
    
    const personalScore = Math.max(0, Math.min(100, baseScore - incidentPenalty - severityPenalty + resolutionBonus));
    
    // Déterminer le niveau de risque
    const riskLevel = personalScore >= 80 ? 'low' :
                    personalScore >= 60 ? 'medium' : 'high';

    // Analyser les zones fréquentées
    const locationCounts: Record<string, { lat: number; lng: number; count: number; type: string }> = {};
    
    reports.forEach(report => {
      const key = `${report.location.lat.toFixed(4)},${report.location.lng.toFixed(4)}`;
      if (!locationCounts[key]) {
        locationCounts[key] = {
          lat: report.location.lat,
          lng: report.location.lng,
          count: 0,
          type: report.type
        };
      }
      locationCounts[key].count++;
    });

    const safeZones = Object.values(locationCounts)
      .filter(loc => loc.count <= 2) // Zones avec peu d'incidents
      .slice(0, 5)
      .map(loc => ({
        name: `Zone ${loc.lat.toFixed(2)},${loc.lng.toFixed(2)}`,
        lat: loc.lat,
        lng: loc.lng,
        visits: loc.count
      }));

    const dangerZones = Object.values(locationCounts)
      .filter(loc => loc.count > 3) // Zones avec plusieurs incidents
      .slice(0, 5)
      .map(loc => ({
        name: `Zone à risque ${loc.lat.toFixed(2)},${loc.lng.toFixed(2)}`,
        lat: loc.lat,
        lng: loc.lng,
        incidents: loc.count
      }));

    // Historique des temps de réponse
    const responseTimeHistory = reports
      .slice(-20) // 20 derniers incidents
      .map(r => r.responseTime);

    // Analyse des contacts d'urgence
    const allContacts = reports.flatMap(r => r.contactsNotified);
    const contactCounts: Record<string, number> = {};
    allContacts.forEach(contact => {
      contactCounts[contact] = (contactCounts[contact] || 0) + 1;
    });
    
    const frequent = Object.entries(contactCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([contact]) => contact);

    this.personalMetrics = {
      personalScore,
      riskLevel,
      safeZones,
      dangerZones,
      responseTimeHistory,
      emergencyContacts: {
        total: Object.keys(contactCounts).length,
        frequent,
        responseRate: (reports.filter(r => r.contactsNotified.length > 0).length / reports.length) * 100
      }
    };
  }

  public getStatistics(): SafetyStatistics | null {
    return this.statistics;
  }

  public getPersonalMetrics(): PersonalSafetyMetrics | null {
    return this.personalMetrics;
  }

  public generateIncidentReportPDF(incidentId: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const report = this.reports.get(incidentId);
      if (!report) {
        reject(new Error('Rapport non trouvé'));
        return;
      }

      // Créer un contenu HTML pour le PDF
      const html = `
        <html>
          <head>
            <title>Rapport d'Incident USALAMA</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; border-bottom: 2px solid #ef4444; padding-bottom: 10px; }
              .section { margin: 20px 0; }
              .field { margin: 10px 0; }
              .label { font-weight: bold; }
              .critical { color: #dc2626; }
              .high { color: #f59e0b; }
              .medium { color: #3b82f6; }
              .low { color: #10b981; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Rapport d'Incident USALAMA</h1>
              <p>ID: ${report.id}</p>
            </div>
            
            <div class="section">
              <h2>Informations Générales</h2>
              <div class="field">
                <span class="label">Date et Heure:</span> ${report.timestamp.toLocaleString('fr-FR')}
              </div>
              <div class="field">
                <span class="label">Type:</span> ${report.type}
              </div>
              <div class="field">
                <span class="label">Sévérité:</span> <span class="${report.severity}">${report.severity}</span>
              </div>
              <div class="field">
                <span class="label">Durée:</span> ${Math.floor(report.duration / 60)}m ${report.duration % 60}s
              </div>
              <div class="field">
                <span class="label">Temps de Réponse:</span> ${Math.floor(report.responseTime / 60)}m ${report.responseTime % 60}s
              </div>
            </div>
            
            <div class="section">
              <h2>Localisation</h2>
              <div class="field">
                <span class="label">Coordonnées:</span> ${report.location.lat.toFixed(6)}, ${report.location.lng.toFixed(6)}
              </div>
              ${report.location.address ? `
                <div class="field">
                  <span class="label">Adresse:</span> ${report.location.address}
                </div>
              ` : ''}
            </div>
            
            <div class="section">
              <h2>Résultat</h2>
              <div class="field">
                <span class="label">Issue:</span> ${report.outcome}
              </div>
              <div class="field">
                <span class="label">Contacts Notifiés:</span> ${report.contactsNotified.join(', ')}
              </div>
            </div>
            
            <div class="section">
              <h2>Preuves Collectées</h2>
              <div class="field">
                <span class="label">Audio:</span> ${report.evidenceCollected.audio ? '✓' : '✗'}
              </div>
              <div class="field">
                <span class="label">Vidéo:</span> ${report.evidenceCollected.video ? '✓' : '✗'}
              </div>
              <div class="field">
                <span class="label">Photos:</span> ${report.evidenceCollected.photos}
              </div>
              <div class="field">
                <span class="label">Localisation:</span> ${report.evidenceCollected.location ? '✓' : '✗'}
              </div>
            </div>
            
            ${report.userFeedback ? `
              <div class="section">
                <h2>Feedback Utilisateur</h2>
                <div class="field">
                  <span class="label">Note:</span> ${'★'.repeat(report.userFeedback.rating)}${'☆'.repeat(5 - report.userFeedback.rating)}
                </div>
                <div class="field">
                  <span class="label">Commentaire:</span> ${report.userFeedback.comment}
                </div>
              </div>
            ` : ''}
            
            <div class="section">
              <p style="text-align: center; color: #666; font-size: 12px;">
                Généré par USALAMA le ${new Date().toLocaleString('fr-FR')}
              </p>
            </div>
          </body>
        </html>
      `;

      // Utiliser html2canvas ou jsPDF pour générer le PDF
      // Pour l'instant, simuler la création d'un blob
      const blob = new Blob([html], { type: 'text/html' });
      resolve(blob);
    });
  }

  private async syncReport(report: IncidentReport) {
    try {
      const response = await fetch('/api/analytics/incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      
      if (response.ok) {
        console.log('Rapport synchronisé avec le serveur');
      }
    } catch (error) {
      console.log('Mode hors ligne - Rapport stocké localement');
    }
  }

  private saveReports() {
    const reports = Array.from(this.reports.values());
    localStorage.setItem('usalama_incident_reports', JSON.stringify(reports));
  }

  private loadReports() {
    const stored = localStorage.getItem('usalama_incident_reports');
    if (stored) {
      try {
        const reports = JSON.parse(stored);
        reports.forEach((report: IncidentReport) => {
          report.timestamp = new Date(report.timestamp);
          this.reports.set(report.id, report);
        });
      } catch (error) {
        console.error('Erreur chargement rapports:', error);
      }
    }
  }

  private saveHeatmapData() {
    localStorage.setItem('usalama_heatmap_data', JSON.stringify(this.heatmapData));
  }

  private loadHeatmapData() {
    const stored = localStorage.getItem('usalama_heatmap_data');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.heatmapData = data.map((point: unknown) => ({
          ...point,
          timestamp: new Date(point.timestamp)
        }));
      } catch (error) {
        console.error('Erreur chargement heatmap:', error);
      }
    }
  }

  public exportData(): { reports: IncidentReport[]; heatmap: HeatmapPoint[] } {
    return {
      reports: Array.from(this.reports.values()),
      heatmap: this.heatmapData
    };
  }

  public importData(data: { reports?: IncidentReport[]; heatmap?: HeatmapPoint[] }): void {
    if (data.reports) {
      data.reports.forEach(report => {
        report.timestamp = new Date(report.timestamp);
        this.reports.set(report.id, report);
      });
      this.saveReports();
    }
    
    if (data.heatmap) {
      this.heatmapData = data.heatmap.map(point => ({
        ...point,
        timestamp: new Date(point.timestamp)
      }));
      this.saveHeatmapData();
    }
    
    this.calculateStatistics();
    this.calculatePersonalMetrics();
  }
}

export const analyticsReports = new AnalyticsReportsService();
export default analyticsReports;
