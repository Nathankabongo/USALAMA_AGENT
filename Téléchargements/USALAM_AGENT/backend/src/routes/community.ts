import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// GET /api/community/posts - Get community posts
router.get('/posts', optionalAuth, async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Community posts retrieved successfully',
      data: { posts: [] }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/community/posts - Create community post
router.post('/posts', authenticate, async (req, res, next) => {
  try {
    res.status(201).json({
      success: true,
      message: 'Community post created successfully',
      data: { post: null }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
