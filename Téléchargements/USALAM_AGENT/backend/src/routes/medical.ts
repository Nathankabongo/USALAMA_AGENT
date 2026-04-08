import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// GET /api/medical/services - Get medical services
router.get('/services', optionalAuth, async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Medical services retrieved successfully',
      data: { services: [] }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/medical/ambulances - Get ambulance services
router.get('/ambulances', optionalAuth, async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Ambulance services retrieved successfully',
      data: { ambulances: [] }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
