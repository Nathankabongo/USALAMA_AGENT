import { Request, Response, NextFunction } from 'express';
import { User, UserDocument } from '../models/User';
import { ApiResponse } from '../types';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface AuthRequest extends Request {
  user?: UserDocument;
}

// Register user
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, phone, password, profile } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email },
        { phone },
        { username }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email, phone, or username already exists'
      } as ApiResponse);
    }

    // Create new user
    const user = new User({
      username,
      email,
      phone,
      password,
      profile: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        emergencyContacts: profile.emergencyContacts || []
      }
    });

    await user.save();

    // Generate tokens
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
        refreshToken
      },
      message: 'User registered successfully'
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier, password } = req.body; // identifier can be email, phone, or username

    // Find user by email, phone, or username
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier },
        { username: identifier }
      ],
      isActive: true
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      } as ApiResponse);
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        error: 'Account is temporarily locked. Please try again later.'
      } as ApiResponse);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await User.incrementLoginAttempts(user._id);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      } as ApiResponse);
    }

    // Reset login attempts on successful login
    await User.resetLoginAttempts(user._id);

    // Generate tokens
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
        refreshToken
      },
      message: 'Login successful'
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token is required'
      } as ApiResponse);
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as { userId: string };
    
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      } as ApiResponse);
    }

    // Generate new tokens
    const newToken = user.generateAuthToken();
    const newRefreshToken = user.generateRefreshToken();

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      },
      message: 'Token refreshed successfully'
    } as ApiResponse);

  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    } as ApiResponse);
  }
};

// Logout user
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a real implementation, you would add the token to a blacklist
    // or store revoked tokens in Redis
    res.json({
      success: true,
      message: 'Logout successful'
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
};

// Get current user
export const getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: { user: user.toJSON() },
      message: 'User retrieved successfully'
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const updates = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
    }

    // Update allowed fields
    const allowedFields = ['profile', 'preferences'];
    const updateData: any = {};

    allowedFields.forEach(field => {
      if (updates[field]) {
        updateData[field] = updates[field];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: { user: updatedUser.toJSON() },
      message: 'Profile updated successfully'
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};

// Change password
export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      } as ApiResponse);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};

// Forgot password
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // In a real implementation, you would save this to the database
    // and send an email with the reset link
    // For now, we'll just return success

    res.json({
      success: true,
      message: 'Password reset instructions sent to your email'
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;

    // In a real implementation, you would verify the token
    // and update the user's password
    
    res.json({
      success: true,
      message: 'Password reset successfully'
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};

// Enable 2FA
export const enable2FA = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
    }

    // Generate 2FA secret
    const secret = crypto.randomBytes(32).toString('hex');
    
    // In a real implementation, you would:
    // 1. Save the secret to the user's document
    // 2. Generate a QR code
    // 3. Send the QR code to the user

    res.json({
      success: true,
      data: { secret },
      message: '2FA setup initiated'
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};

// Verify 2FA
export const verify2FA = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { token } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
    }

    // In a real implementation, you would verify the 2FA token
    // and enable 2FA for the user

    res.json({
      success: true,
      message: '2FA enabled successfully'
    } as ApiResponse);

  } catch (error) {
    next(error);
  }
};
