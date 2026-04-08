import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponse } from '../types';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined
    }));

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errorMessages
    } as ApiResponse);
    return;
  }

  next();
};

export const validateObjectId = (req: Request, res: Response, next: NextFunction): void => {
  const { id } = req.params;
  
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    } as ApiResponse);
    return;
  }

  next();
};

export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  if (page < 1 || limit < 1 || limit > 100) {
    res.status(400).json({
      success: false,
      error: 'Invalid pagination parameters'
    } as ApiResponse);
    return;
  }

  req.query.page = page.toString();
  req.query.limit = limit.toString();
  
  next();
};

export const validateCoordinates = (req: Request, res: Response, next: NextFunction): void => {
  const { lat, lng } = req.body;
  
  if (lat !== undefined && (typeof lat !== 'number' || lat < -90 || lat > 90)) {
    res.status(400).json({
      success: false,
      error: 'Invalid latitude. Must be between -90 and 90'
    } as ApiResponse);
    return;
  }
  
  if (lng !== undefined && (typeof lng !== 'number' || lng < -180 || lng > 180)) {
    res.status(400).json({
      success: false,
      error: 'Invalid longitude. Must be between -180 and 180'
    } as ApiResponse);
    return;
  }

  next();
};

export const validateFileUpload = (req: Request, res: Response, next: NextFunction): void => {
  const file = req.file;
  
  if (!file) {
    res.status(400).json({
      success: false,
      error: 'No file uploaded'
    } as ApiResponse);
    return;
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.mimetype)) {
    res.status(400).json({
      success: false,
      error: 'Invalid file type'
    } as ApiResponse);
    return;
  }

  if (file.size > maxSize) {
    res.status(400).json({
      success: false,
      error: 'File size too large. Maximum 10MB'
    } as ApiResponse);
    return;
  }

  next();
};
