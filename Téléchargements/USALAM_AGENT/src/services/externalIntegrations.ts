// services/externalIntegrations.ts - Intégrations Externes

export interface MedicalService {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'pharmacy' | 'ambulance' | 'doctor';
  contact: {
    phone: string;
    email?: string;
    website?: string;
  };
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  services: string[];
  hours: {
    [key: string]: string; // day: hours
  };
  rating: number;
  responseTime: number; // en minutes
  languages: string[];
  insurance: string[];
  emergency: boolean;
  verified: boolean;
}

export interface AmbulanceService {
  id: string;
  name: string;
  provider: string;
  contact: {
    phone: string;
    dispatch: string;
  };
  fleet: {
    total: number;
    available: number;
    types: string[];
  };
  coverage: {
    areas: string[];
    radius: number; // en km
  };
  responseTime: {
    average: number;
    minimum: number;
    maximum: number;
  };
  equipment: string[];
  pricing: {
    base: number;
    perKm: number;
    insurance: boolean;
  };
  languages: string[];
  certifications: string[];
}

export interface InsuranceProvider {
  id: string;
  name: string;
  type: 'health' | 'accident' | 'travel' | 'comprehensive';
  contact: {
    phone: string;
    email: string;
    website: string;
    claims: string;
  };
  coverage: {
    emergency: boolean;
    ambulance: boolean;
    hospital: boolean;
    medication: boolean;
    limits: {
      emergency: number;
      ambulance: number;
      hospital: number;
    };
  };
  requirements: string[];
  processTime: number; // en jours
  languages: string[];
  rating: number;
}

export interface EmergencyRequest {
  id: string;
  type: 'medical' | 'ambulance' | 'insurance';
  serviceId: string;
  userId: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  urgency: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  estimatedArrival?: Date;
  actualArrival?: Date;
  cost?: number;
  insuranceClaim?: {
    id: string;
    status: 'pending' | 'approved' | 'rejected' | 'processed';
    amount: number;
  };
}

class ExternalIntegrationsService {
  private medicalServices: Map<string, MedicalService> = new Map();
  private ambulanceServices: Map<string, AmbulanceService> = new Map();
  private insuranceProviders: Map<string, InsuranceProvider> = new Map();
  private emergencyRequests: Map<string, EmergencyRequest> = new Map();

  constructor() {
    this.initializeMedicalServices();
    this.initializeAmbulanceServices();
    this.initializeInsuranceProviders();
    this.loadEmergencyRequests();
  }

  private initializeMedicalServices() {
    const services: MedicalService[] = [
      {
        id: 'hopital-kinshasa-general',
        name: 'Hôpital Général de Kinshasa',
        type: 'hospital',
        contact: {
          phone: '+243 12 345 678',
          email: 'info@hgk.cd',
          website: 'www.hgk.cd'
        },
        location: {
          lat: -4.4419,
          lng: 15.2663,
          address: 'Avenue de la Démocratie, Kinshasa'
        },
        services: ['urgence', 'chirurgie', 'pédiatrie', 'maternité', 'radiologie'],
        hours: {
          lundi: '00:00-24:00',
          mardi: '00:00-24:00',
          mercredi: '00:00-24:00',
          jeudi: '00:00-24:00',
          vendredi: '00:00-24:00',
          samedi: '00:00-24:00',
          dimanche: '00:00-24:00'
        },
        rating: 4.2,
        responseTime: 15,
        languages: ['fr', 'lingala'],
        insurance: ['mutuelle', 'privee', 'cnss'],
        emergency: true,
        verified: true
      },
      {
        id: 'clinique-malebo',
        name: 'Clinique Médicale Malebo',
        type: 'clinic',
        contact: {
          phone: '+243 12 234 567',
          email: 'contact@malebo.cd'
        },
        location: {
          lat: -4.4325,
          lng: 15.2714,
          address: 'Boulevard du 30 Juin, Kinshasa'
        },
        services: ['consultation', 'laboratoire', 'vaccination', 'urgence légère'],
        hours: {
          lundi: '08:00-18:00',
          mardi: '08:00-18:00',
          mercredi: '08:00-18:00',
          jeudi: '08:00-18:00',
          vendredi: '08:00-18:00',
          samedi: '09:00-14:00',
          dimanche: 'fermé'
        },
        rating: 4.0,
        responseTime: 30,
        languages: ['fr', 'lingala'],
        insurance: ['mutuelle', 'privee'],
        emergency: false,
        verified: true
      },
      {
        id: 'pharmacie-centrale',
        name: 'Pharmacie Centrale',
        type: 'pharmacy',
        contact: {
          phone: '+243 12 345 679'
        },
        location: {
          lat: -4.4450,
          lng: 15.2690,
          address: 'Avenue des Aviateurs, Kinshasa'
        },
        services: ['médicaments', 'produits médicaux', 'conseils'],
        hours: {
          lundi: '07:00-22:00',
          mardi: '07:00-22:00',
          mercredi: '07:00-22:00',
          jeudi: '07:00-22:00',
          vendredi: '07:00-22:00',
          samedi: '08:00-20:00',
          dimanche: '09:00-18:00'
        },
        rating: 3.8,
        responseTime: 5,
        languages: ['fr', 'lingala'],
        insurance: ['privee'],
        emergency: false,
        verified: true
      }
    ];

    services.forEach(service => {
      this.medicalServices.set(service.id, service);
    });
  }

  private initializeAmbulanceServices() {
    const services: AmbulanceService[] = [
      {
        id: 'ambulance-rapide-kin',
        name: 'Ambulance Rapide Kinshasa',
        provider: 'SOS Médical RDC',
        contact: {
          phone: '+243 999 123 456',
          dispatch: '+243 999 123 455'
        },
        fleet: {
          total: 15,
          available: 8,
          types: ['basic', 'advanced', 'neonatal']
        },
        coverage: {
          areas: ['Kinshasa', 'Lukanga', 'Mont-Ngafula'],
          radius: 50
        },
        responseTime: {
          average: 12,
          minimum: 5,
          maximum: 25
        },
        equipment: ['defibrillator', 'oxygen', 'stretcher', 'first_aid_kit'],
        pricing: {
          base: 50,
          perKm: 2,
          insurance: true
        },
        languages: ['fr', 'lingala'],
        certifications: ['ISO', 'Ministry of Health']
      },
      {
        id: 'medical-express',
        name: 'Medical Express',
        provider: 'Medical Express SA',
        contact: {
          phone: '+243 999 987 654',
          dispatch: '+243 999 987 653'
        },
        fleet: {
          total: 10,
          available: 4,
          types: ['basic', 'advanced']
        },
        coverage: {
          areas: ['Kinshasa-ville', 'Gombe', 'Limete'],
          radius: 30
        },
        responseTime: {
          average: 18,
          minimum: 8,
          maximum: 30
        },
        equipment: ['oxygen', 'stretcher', 'first_aid_kit'],
        pricing: {
          base: 40,
          perKm: 1.5,
          insurance: true
        },
        languages: ['fr', 'lingala', 'english'],
        certifications: ['Ministry of Health']
      }
    ];

    services.forEach(service => {
      this.ambulanceServices.set(service.id, service);
    });
  }

  private initializeInsuranceProviders() {
    const providers: InsuranceProvider[] = [
      {
        id: 'assurance-mutuelle-nationale',
        name: 'Mutuelle Nationale de Santé',
        type: 'health',
        contact: {
          phone: '+243 12 345 680',
          email: 'contact@mutuelle.cd',
          website: 'www.mutuelle.cd',
          claims: 'claims@mutuelle.cd'
        },
        coverage: {
          emergency: true,
          ambulance: true,
          hospital: true,
          medication: true,
          limits: {
            emergency: 1000,
            ambulance: 500,
            hospital: 5000
          }
        },
        requirements: ['carte_mutuelle', 'piece_identite'],
        processTime: 7,
        languages: ['fr', 'lingala'],
        rating: 3.5
      },
      {
        id: 'assurance-privilege',
        name: 'Assurance Privilege',
        type: 'comprehensive',
        contact: {
          phone: '+243 12 234 680',
          email: 'info@privilege.cd',
          website: 'www.privilege.cd',
          claims: 'claims@privilege.cd'
        },
        coverage: {
          emergency: true,
          ambulance: true,
          hospital: true,
          medication: true,
          limits: {
            emergency: 2000,
            ambulance: 1000,
            hospital: 10000
          }
        },
        requirements: ['contrat_assurance', 'piece_identite'],
        processTime: 3,
        languages: ['fr', 'english'],
        rating: 4.3
      }
    ];

    providers.forEach(provider => {
      this.insuranceProviders.set(provider.id, provider);
    });
  }

  public async requestAmbulance(
    serviceId: string,
    location: { lat: number; lng: number; address?: string },
    urgency: 'low' | 'medium' | 'high' | 'critical',
    description: string
  ): Promise<string> {
    const service = this.ambulanceServices.get(serviceId);
    if (!service) {
      throw new Error('Service d\'ambulance non trouvé');
    }

    const request: EmergencyRequest = {
      id: `ambulance-${Date.now()}`,
      type: 'ambulance',
      serviceId,
      userId: localStorage.getItem('usalama_user_id') || 'anonymous',
      location,
      urgency,
      description,
      timestamp: new Date(),
      status: 'pending'
    };

    // Calculer l'heure d'arrivée estimée
    const responseTime = urgency === 'critical' ? service.responseTime.minimum :
                       urgency === 'high' ? service.responseTime.average :
                       service.responseTime.maximum;
    
    request.estimatedArrival = new Date(Date.now() + responseTime * 60 * 1000);

    this.emergencyRequests.set(request.id, request);
    this.saveEmergencyRequests();

    // Envoyer la demande au service
    await this.sendAmbulanceRequest(request, service);

    return request.id;
  }

  public async requestMedicalConsultation(
    serviceId: string,
    location: { lat: number; lng: number; address?: string },
    urgency: 'low' | 'medium' | 'high' | 'critical',
    description: string
  ): Promise<string> {
    const service = this.medicalServices.get(serviceId);
    if (!service) {
      throw new Error('Service médical non trouvé');
    }

    const request: EmergencyRequest = {
      id: `medical-${Date.now()}`,
      type: 'medical',
      serviceId,
      userId: localStorage.getItem('usalama_user_id') || 'anonymous',
      location,
      urgency,
      description,
      timestamp: new Date(),
      status: 'pending'
    };

    this.emergencyRequests.set(request.id, request);
    this.saveEmergencyRequests();

    await this.sendMedicalRequest(request, service);

    return request.id;
  }

  public async fileInsuranceClaim(
    requestId: string,
    providerId: string,
    documents: string[]
  ): Promise<string> {
    const request = this.emergencyRequests.get(requestId);
    const provider = this.insuranceProviders.get(providerId);

    if (!request || !provider) {
      throw new Error('Demande ou fournisseur non trouvé');
    }

    const claimId = `claim-${Date.now()}`;
    request.insuranceClaim = {
      id: claimId,
      status: 'pending',
      amount: this.calculateClaimAmount(request)
    };

    this.emergencyRequests.set(requestId, request);
    this.saveEmergencyRequests();

    await this.submitInsuranceClaim(request, provider, documents);

    return claimId;
  }

  private calculateClaimAmount(request: EmergencyRequest): number {
    // Calculer le montant de la réclamation basé sur le type de service
    if (request.type === 'ambulance') {
      const service = this.ambulanceServices.get(request.serviceId);
      return service ? service.pricing.base : 50;
    } else if (request.type === 'medical') {
      return 200; // Estimation moyenne consultation
    }
    return 0;
  }

  private async sendAmbulanceRequest(request: EmergencyRequest, service: AmbulanceService) {
    try {
      const response = await fetch(`/api/external/ambulance/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request,
          service
        })
      });

      if (response.ok) {
        request.status = 'accepted';
        this.emergencyRequests.set(request.id, request);
      }
    } catch (error) {
      console.error('Erreur demande ambulance:', error);
      // En cas d'erreur, appeler directement
      this.makeEmergencyCall(service.contact.dispatch);
    }
  }

  private async sendMedicalRequest(request: EmergencyRequest, service: MedicalService) {
    try {
      const response = await fetch(`/api/external/medical/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request,
          service
        })
      });

      if (response.ok) {
        request.status = 'accepted';
        this.emergencyRequests.set(request.id, request);
      }
    } catch (error) {
      console.error('Erreur demande médicale:', error);
      this.makeEmergencyCall(service.contact.phone);
    }
  }

  private async submitInsuranceClaim(
    request: EmergencyRequest,
    provider: InsuranceProvider,
    documents: string[]
  ) {
    try {
      const response = await fetch(`/api/external/insurance/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim: request.insuranceClaim,
          provider,
          documents,
          request
        })
      });

      if (response.ok) {
        console.log('Réclamation assurance soumise avec succès');
      }
    } catch (error) {
      console.error('Erreur soumission réclamation:', error);
    }
  }

  private makeEmergencyCall(phone: string) {
    window.location.href = `tel:${phone}`;
  }

  public getNearbyMedicalServices(
    lat: number,
    lng: number,
    radius: number = 5000
  ): (MedicalService & { distance: number })[] {
    const services: (MedicalService & { distance: number })[] = [];

    this.medicalServices.forEach((service: MedicalService) => {
      const distance = this.calculateDistance(lat, lng, service.location.lat, service.location.lng);
      if (distance <= radius) {
        // Créer une copie avec la propriété distance ajoutée
        const serviceWithDistance = {
          ...service,
          distance
        };
        services.push(serviceWithDistance);
      }
    });

    return services.sort((a, b) => a.distance - b.distance);
  }

  public getAvailableAmbulances(
    lat: number,
    lng: number,
    radius: number = 10000
  ): AmbulanceService[] {
    const services: AmbulanceService[] = [];

    this.ambulanceServices.forEach(service => {
      if (service.fleet.available > 0) {
        // Vérifier si le service couvre cette zone
        for (const area of service.coverage.areas) {
          // Simplification: on suppose que la zone est dans le rayon
          const distance = this.calculateDistance(lat, lng, service.coverage.radius, service.coverage.radius);
          if (distance <= radius) {
            services.push(service);
            break;
          }
        }
      }
    });

    return services;
  }

  public getInsuranceProviders(): InsuranceProvider[] {
    return Array.from(this.insuranceProviders.values());
  }

  public getEmergencyRequest(requestId: string): EmergencyRequest | undefined {
    return this.emergencyRequests.get(requestId);
  }

  public getEmergencyRequests(): EmergencyRequest[] {
    return Array.from(this.emergencyRequests.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public updateRequestStatus(requestId: string, status: EmergencyRequest['status']): boolean {
    const request = this.emergencyRequests.get(requestId);
    if (!request) return false;

    request.status = status;
    if (status === 'in_progress') {
      request.actualArrival = new Date();
    }
    
    this.emergencyRequests.set(requestId, request);
    this.saveEmergencyRequests();
    return true;
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

  private saveEmergencyRequests() {
    const requests = Array.from(this.emergencyRequests.values());
    localStorage.setItem('usalama_emergency_requests', JSON.stringify(requests));
  }

  private loadEmergencyRequests() {
    const stored = localStorage.getItem('usalama_emergency_requests');
    if (stored) {
      try {
        const requests = JSON.parse(stored);
        requests.forEach((request: EmergencyRequest) => {
          request.timestamp = new Date(request.timestamp);
          if (request.estimatedArrival) {
            request.estimatedArrival = new Date(request.estimatedArrival);
          }
          if (request.actualArrival) {
            request.actualArrival = new Date(request.actualArrival);
          }
          this.emergencyRequests.set(request.id, request);
        });
      } catch (error) {
        console.error('Erreur chargement demandes d\'urgence:', error);
      }
    }
  }

  public async trackAmbulance(requestId: string): Promise<{ lat: number; lng: number; eta: Date } | null> {
    const request = this.emergencyRequests.get(requestId);
    if (!request || request.type !== 'ambulance' || request.status !== 'in_progress') {
      return null;
    }

    try {
      const response = await fetch(`/api/external/ambulance/track/${requestId}`);
      if (response.ok) {
        const data = await response.json();
        return {
          lat: data.lat,
          lng: data.lng,
          eta: new Date(data.eta)
        };
      }
    } catch (error) {
      console.error('Erreur suivi ambulance:', error);
    }

    return null;
  }

  public generateEmergencyReport(requestId: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const request = this.emergencyRequests.get(requestId);
      if (!request) {
        reject(new Error('Demande non trouvée'));
        return;
      }

      const html = `
        <html>
          <head>
            <title>Rapport d'Urgence USALAMA</title>
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
              <h1>Rapport d'Urgence USALAMA</h1>
              <p>ID: ${request.id}</p>
            </div>
            
            <div class="section">
              <h2>Informations de la Demande</h2>
              <div class="field">
                <span class="label">Type:</span> ${request.type}
              </div>
              <div class="field">
                <span class="label">Urgence:</span> <span class="${request.urgency}">${request.urgency}</span>
              </div>
              <div class="field">
                <span class="label">Date et Heure:</span> ${request.timestamp.toLocaleString('fr-FR')}
              </div>
              <div class="field">
                <span class="label">Statut:</span> ${request.status}
              </div>
              <div class="field">
                <span class="label">Description:</span> ${request.description}
              </div>
            </div>
            
            <div class="section">
              <h2>Localisation</h2>
              <div class="field">
                <span class="label">Coordonnées:</span> ${request.location.lat.toFixed(6)}, ${request.location.lng.toFixed(6)}
              </div>
              ${request.location.address ? `
                <div class="field">
                  <span class="label">Adresse:</span> ${request.location.address}
                </div>
              ` : ''}
            </div>
            
            ${request.estimatedArrival ? `
              <div class="section">
                <h2>Arrivée Estimée</h2>
                <div class="field">
                  <span class="label">Heure:</span> ${request.estimatedArrival.toLocaleString('fr-FR')}
                </div>
              </div>
            ` : ''}
            
            ${request.actualArrival ? `
              <div class="section">
                <h2>Arrivée Réelle</h2>
                <div class="field">
                  <span class="label">Heure:</span> ${request.actualArrival.toLocaleString('fr-FR')}
                </div>
              </div>
            ` : ''}
            
            ${request.cost ? `
              <div class="section">
                <h2>Coût</h2>
                <div class="field">
                  <span class="label">Montant:</span> $${request.cost}
                </div>
              </div>
            ` : ''}
            
            ${request.insuranceClaim ? `
              <div class="section">
                <h2>Réclamation Assurance</h2>
                <div class="field">
                  <span class="label">ID:</span> ${request.insuranceClaim.id}
                </div>
                <div class="field">
                  <span class="label">Statut:</span> ${request.insuranceClaim.status}
                </div>
                <div class="field">
                  <span class="label">Montant:</span> $${request.insuranceClaim.amount}
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

      const blob = new Blob([html], { type: 'text/html' });
      resolve(blob);
    });
  }
}

export const externalIntegrations = new ExternalIntegrationsService();
export default externalIntegrations;
