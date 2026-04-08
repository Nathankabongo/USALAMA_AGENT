import mongoose, { Schema, Document } from 'mongoose';
import { Incident as IIncident, Witness, TimelineEvent } from '../types';

interface IncidentDocument extends Omit<IIncident, '_id'>, Document {
  duration?: number;
  isOverdue?: boolean;
}

const WitnessSchema = new Schema<Witness>({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, match: /^\+?[1-9]\d{1,14}$/ },
  email: { type: String, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  statement: { type: String, required: true, trim: true },
  contactConsent: { type: Boolean, default: false }
}, { _id: false });

const TimelineEventSchema = new Schema<TimelineEvent>({
  timestamp: { type: Date, required: true },
  type: { 
    type: String, 
    enum: ['created', 'updated', 'assigned', 'responded', 'resolved', 'closed'], 
    required: true 
  },
  description: { type: String, required: true, trim: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: Schema.Types.Mixed }
}, { _id: false });

const LocationSchema = new Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], required: true },
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true }
}, { _id: false });

const MediaSchema = new Schema({
  images: [{ type: String }],
  videos: [{ type: String }],
  documents: [{ type: String }]
}, { _id: false });

const IncidentSchema = new Schema<IncidentDocument>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  } as any,
  type: { 
    type: String, 
    enum: ['theft', 'assault', 'accident', 'missing', 'fire', 'medical', 'other'], 
    required: true,
    index: true
  },
  severity: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    required: true,
    index: true
  },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  location: { type: LocationSchema, required: true, index: '2dsphere' },
  media: MediaSchema,
  witnesses: [WitnessSchema],
  status: { 
    type: String, 
    enum: ['reported', 'investigating', 'resolved', 'closed'], 
    default: 'reported',
    index: true
  },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' } as any,
  responseTeam: [{ type: Schema.Types.ObjectId, ref: 'User' } as any],
  timeline: [TimelineEventSchema],
  resolvedAt: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
IncidentSchema.index({ userId: 1, createdAt: -1 });
IncidentSchema.index({ type: 1, severity: 1 });
IncidentSchema.index({ status: 1, createdAt: -1 });
IncidentSchema.index({ 'location.coordinates': '2dsphere' });
IncidentSchema.index({ createdAt: -1 });

// Virtuals
IncidentSchema.virtual('duration').get(function(this: IncidentDocument): number {
  const start = this.createdAt;
  const end = this.resolvedAt || new Date();
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
});

IncidentSchema.virtual('isOverdue').get(function(this: IncidentDocument): boolean {
  if (this.status === 'resolved' || this.status === 'closed') return false;
  
  const overdueThresholds: Record<string, number> = {
    'critical': 30 * 60 * 1000,    // 30 minutes
    'high': 2 * 60 * 60 * 1000,   // 2 hours
    'medium': 6 * 60 * 60 * 1000,  // 6 hours
    'low': 24 * 60 * 60 * 1000     // 24 hours
  };
  
  const threshold = overdueThresholds[this.severity];
  return (Date.now() - this.createdAt.getTime()) > threshold;
});

// Pre-save middleware
IncidentSchema.pre('save', async function(this: IncidentDocument, next: any) {
  if (this.isModified('status') && (this.status === 'resolved' || this.status === 'closed')) {
    this.resolvedAt = new Date();
    
    // Add timeline event
    this.timeline.push({
      timestamp: new Date(),
      type: 'resolved',
      description: `Incident marked as ${this.status}`,
      userId: this.assignedTo
    });
  }
  
  next();
});

// Static methods
IncidentSchema.statics.findByUser = function(userId: string, limit = 10, skip = 0) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('assignedTo', 'username profile.firstName profile.lastName');
};

IncidentSchema.statics.findByLocation = function(lat: number, lng: number, radiusKm = 10) {
  return this.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radiusKm * 1000
      }
    }
  }).sort({ createdAt: -1 });
};

IncidentSchema.statics.getStatistics = function(startDate?: Date, endDate?: Date) {
  const matchStage: any = {};
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byType: {
          $push: {
            type: '$type',
            count: 1
          }
        },
        bySeverity: {
          $push: {
            severity: '$severity',
            count: 1
          }
        },
        byStatus: {
          $push: {
            status: '$status',
            count: 1
          }
        },
        averageResolutionTime: {
          $avg: {
            $cond: {
              if: { $ne: ['$resolvedAt', null] },
              then: { $subtract: ['$resolvedAt', '$createdAt'] },
              else: null
            }
          }
        },
        resolvedCount: {
          $sum: {
            $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0]
          }
        }
      }
    }
  ]);
};

IncidentSchema.statics.getTrends = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 },
        bySeverity: {
          $push: {
            severity: '$severity',
            count: 1
          }
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
};

export const Incident = mongoose.model<IncidentDocument>('Incident', IncidentSchema);
export type { IncidentDocument };
