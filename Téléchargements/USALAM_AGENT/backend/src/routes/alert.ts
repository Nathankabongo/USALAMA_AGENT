import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// GET /api/alerts - Get public alerts (no auth required)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Alerts retrieved successfully',
      data: { alerts: [] }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/alerts - Create alert (auth required)
router.post('/', authenticate, async (req, res, next) => {
  try {
    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: { alert: null }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
