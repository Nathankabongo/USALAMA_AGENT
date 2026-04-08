import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// POST /api/emergency/request - Create emergency request
router.post('/request', async (req, res, next) => {
  try {
    res.status(201).json({
      success: true,
      message: 'Emergency request created successfully',
      data: { request: null }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/emergency/request/:id - Get emergency request
router.get('/request/:id', async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Emergency request retrieved successfully',
      data: { request: null }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
