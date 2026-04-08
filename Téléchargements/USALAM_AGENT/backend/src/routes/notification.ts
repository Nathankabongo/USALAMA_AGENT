import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/notifications - Get user notifications
router.get('/', async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: { notifications: [] }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/notifications/send - Send notification
router.post('/send', async (req, res, next) => {
  try {
    res.status(201).json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
