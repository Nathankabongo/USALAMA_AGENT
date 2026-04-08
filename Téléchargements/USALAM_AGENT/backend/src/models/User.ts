import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User as IUser, EmergencyContact } from '../types';

interface UserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  generateRefreshToken(): string;
  toJSON(): IUser;
  isLocked: boolean; // Virtual property
}

interface UserModel extends mongoose.Model<UserDocument> {
  findByEmail(email: string): Promise<UserDocument | null>;
  findByPhone(phone: string): Promise<UserDocument | null>;
  findByUsername(username: string): Promise<UserDocument | null>;
  incrementLoginAttempts(userId: string): Promise<UserDocument | null>;
  resetLoginAttempts(userId: string): Promise<UserDocument | null>;
}

const EmergencyContactSchema = new Schema<EmergencyContact>({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relationship: { type: String, required: true },
  isPrimary: { type: Boolean, default: false }
});

const UserProfileSchema = new Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  avatar: { type: String },
  dateOfBirth: { type: Date },
  address: { type: String, trim: true },
  emergencyContacts: [EmergencyContactSchema]
}, { _id: false });

const UserPreferencesSchema = new Schema({
  language: { type: String, enum: ['fr', 'en', 'sw', 'ln'], default: 'fr' },
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    push: { type: Boolean, default: true }
  },
  privacy: {
    locationSharing: { type: Boolean, default: true },
    profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' }
  }
}, { _id: false });

const UserSecuritySchema = new Schema({
  twoFactorEnabled: { type: Boolean, default: false },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date }
}, { _id: false });

const UserSubscriptionSchema = new Schema({
  plan: { type: String, enum: ['free', 'premium', 'enterprise'], default: 'free' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  features: [{ type: String }]
}, { _id: false });

const UserSchema = new Schema<UserDocument>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^\+?[1-9]\d{1,14}$/
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  profile: UserProfileSchema,
  preferences: UserPreferencesSchema,
  security: UserSecuritySchema,
  subscription: UserSubscriptionSchema,
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ 'profile.emergencyContacts.phone': 1 });
UserSchema.index({ createdAt: -1 });

// Virtuals
UserSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

UserSchema.virtual('isLocked').get(function(this: UserDocument): boolean {
  return !!(this.security.lockedUntil && this.security.lockedUntil.getTime() > Date.now());
});

// Pre-save middleware
UserSchema.pre('save', async function(this: UserDocument, next: any) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'));
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.generateAuthToken = function(): string {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { 
      userId: this._id, 
      email: this.email,
      username: this.username,
      plan: this.subscription?.plan || 'free'
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

UserSchema.methods.generateRefreshToken = function(): string {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
};

UserSchema.methods.toJSON = function(): IUser {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.security.loginAttempts;
  delete userObject.security.lockedUntil;
  return userObject;
};

// Static methods
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email, isActive: true });
};

UserSchema.statics.findByPhone = function(phone: string) {
  return this.findOne({ phone, isActive: true });
};

UserSchema.statics.findByUsername = function(username: string) {
  return this.findOne({ username, isActive: true });
};

UserSchema.statics.incrementLoginAttempts = async function(userId: string) {
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours

  return this.findByIdAndUpdate(userId, {
    $inc: { 'security.loginAttempts': 1 },
    $set: { 
      'security.lockedUntil': new Date(Date.now() + lockTime)
    }
  });
};

UserSchema.statics.resetLoginAttempts = function(userId: string) {
  return this.findByIdAndUpdate(userId, {
    $set: { 
      'security.loginAttempts': 0,
      'security.lockedUntil': undefined,
      'security.lastLogin': new Date()
    }
  });
};

export const User = mongoose.model<UserDocument, UserModel>('User', UserSchema);
export type { UserDocument, UserModel };
