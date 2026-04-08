export interface User {
  _id: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    dateOfBirth?: Date;
    address?: string;
    emergencyContacts: EmergencyContact[];
  };
  preferences: {
    language: 'fr' | 'en' | 'sw' | 'ln';
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    privacy: {
      locationSharing: boolean;
      profileVisibility: 'public' | 'friends' | 'private';
    };
  };
  security: {
    twoFactorEnabled: boolean;
    lastLogin?: Date;
    loginAttempts: number;
    lockedUntil?: Date;
  };
  subscription?: {
    plan: 'free' | 'premium' | 'enterprise';
    startDate: Date;
    endDate: Date;
    features: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isVerified: boolean;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

export interface Incident {
  _id: string;
  userId: string;
  type: 'theft' | 'assault' | 'accident' | 'missing' | 'fire' | 'medical' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
    city: string;
    country: string;
  };
  media: {
    images: string[];
    videos: string[];
    documents: string[];
  };
  witnesses: Witness[];
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
  assignedTo?: string;
  responseTeam?: string[];
  timeline: TimelineEvent[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface Witness {
  name: string;
  phone: string;
  email?: string;
  statement: string;
  contactConsent: boolean;
}

export interface TimelineEvent {
  timestamp: Date;
  type: 'created' | 'updated' | 'assigned' | 'responded' | 'resolved' | 'closed';
  description: string;
  userId?: string;
  metadata?: any;
}

export interface SafePoint {
  _id: string;
  name: string;
  type: 'hospital' | 'police' | 'shelter' | 'fire_station' | 'community_center';
  location: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  contact: {
    phone: string;
    email?: string;
    website?: string;
  };
  services: string[];
  capacity: number;
  currentOccupancy: number;
  isOpen24h: boolean;
  operatingHours?: {
    [key: string]: { open: string; close: string };
  };
  facilities: string[];
  rating: number;
  reviews: Review[];
  verified: boolean;
  lastVerified: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  helpful: number;
}

export interface EvacuationRoute {
  _id: string;
  name: string;
  description: string;
  waypoints: {
    location: {
      type: 'Point';
      coordinates: [number, number];
    };
    instruction: string;
    dangerLevel: 'low' | 'medium' | 'high';
    estimatedTime: number;
  }[];
  avoidZones: {
    location: {
      type: 'Point';
      coordinates: [number, number];
    };
    radius: number;
    type: 'protest' | 'danger' | 'construction' | 'crowd';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];
  totalDistance: number;
  estimatedTime: number;
  safetyScore: number;
  difficulty: 'easy' | 'medium' | 'hard';
  accessibility: boolean;
  createdBy: string;
  verified: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalService {
  _id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'pharmacy' | 'laboratory' | 'specialist';
  location: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  contact: {
    phone: string;
    email?: string;
    website?: string;
  };
  services: string[];
  specialties?: string[];
  emergency: boolean;
  responseTime: number;
  capacity: {
    total: number;
    available: number;
    emergency: number;
  };
  rating: number;
  reviews: Review[];
  insurance: string[];
  operatingHours: {
    [key: string]: { open: string; close: string; isAvailable: boolean };
  };
  verified: boolean;
  lastVerified: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AmbulanceService {
  _id: string;
  name: string;
  contact: {
    phone: string;
    email?: string;
    dispatch?: string;
  };
  fleet: {
    total: number;
    available: number;
    onMission: number;
    maintenance: number;
  };
  services: string[];
  coverage: {
    radius: number;
    areas: string[];
  };
  responseTime: {
    average: number;
    minimum: number;
    maximum: number;
  };
  equipment: string[];
  staff: {
    doctors: number;
    nurses: number;
    paramedics: number;
    drivers: number;
  };
  insurance: string[];
  rating: number;
  reviews: Review[];
  verified: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsuranceProvider {
  _id: string;
  name: string;
  type: 'health' | 'life' | 'accident' | 'travel';
  contact: {
    phone: string;
    email: string;
    website: string;
    address: string;
  };
  plans: InsurancePlan[];
  coverage: {
    medical: boolean;
    emergency: boolean;
    evacuation: boolean;
    repatriation: boolean;
  };
  network: {
    hospitals: string[];
    clinics: string[];
    pharmacies: string[];
  };
  claims: {
    process: string;
    timeLimit: number;
    documentation: string[];
  };
  rating: number;
  reviews: Review[];
  verified: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsurancePlan {
  name: string;
  type: 'basic' | 'standard' | 'premium' | 'enterprise';
  coverage: string[];
  limits: {
    annual: number;
    emergency: number;
    evacuation: number;
  };
  premiums: {
    monthly: number;
    annual: number;
  };
  deductible: number;
  copayment: number;
}

export interface EmergencyRequest {
  _id: string;
  userId: string;
  type: 'medical' | 'police' | 'fire' | 'evacuation' | 'rescue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  contact: {
    phone: string;
    alternativePhone?: string;
  };
  medicalInfo?: {
    conditions: string[];
    medications: string[];
    allergies: string[];
    bloodType: string;
    emergencyContact: string;
  };
  assignedService?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  timeline: TimelineEvent[];
  estimatedArrival?: Date;
  actualArrival?: Date;
  resolvedAt?: Date;
  feedback?: {
    rating: number;
    comment: string;
    resolved: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Alert {
  _id: string;
  type: 'info' | 'warning' | 'danger' | 'emergency';
  category: 'weather' | 'traffic' | 'security' | 'health' | 'infrastructure' | 'community';
  title: string;
  description: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
    radius: number;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'low' | 'medium' | 'high' | 'immediate';
  source: string;
  verified: boolean;
  active: boolean;
  expiresAt?: Date;
  affectedAreas: string[];
  recommendedActions: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityPost {
  _id: string;
  userId: string;
  type: 'help' | 'warning' | 'info' | 'discussion' | 'announcement';
  title: string;
  content: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  category: string;
  tags: string[];
  media: {
    images: string[];
    videos: string[];
    documents: string[];
  };
  anonymous: boolean;
  verified: boolean;
  status: 'active' | 'resolved' | 'closed' | 'removed';
  responses: CommunityResponse[];
  votes: {
    up: number;
    down: number;
  };
  views: number;
  shares: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface CommunityResponse {
  _id: string;
  userId: string;
  content: string;
  helpful: number;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsData {
  incidents: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byLocation: Record<string, number>;
    trends: {
      daily: Array<{ date: string; count: number }>;
      weekly: Array<{ week: string; count: number }>;
      monthly: Array<{ month: string; count: number }>;
    };
  };
  users: {
    total: number;
    active: number;
    new: number;
    retention: number;
  };
  response: {
    averageTime: number;
    byType: Record<string, number>;
    satisfaction: number;
  };
  safety: {
    score: number;
    incidents: number;
    resolved: number;
    prevention: number;
  };
}

export interface Notification {
  _id: string;
  userId: string;
  type: 'info' | 'warning' | 'alert' | 'emergency' | 'system';
  title: string;
  message: string;
  data?: any;
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  delivered: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  expiresAt?: Date;
  createdAt: Date;
  readAt?: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
