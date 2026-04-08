import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/analytics/dashboard - Get dashboard analytics
router.get('/dashboard', async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Dashboard analytics retrieved successfully',
      data: { analytics: null }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
