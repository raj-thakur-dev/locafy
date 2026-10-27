const express = require('express');
const router = express.Router();

const {
  getBusinesses,
  getTrending,
  getTopByCategory,
  getBusinessById,
  getBusinessReviews,
  createReview,
  trackLead,
  sendMessage
} = require('../controllers/businessController');

const { authenticateToken } = require('../middleware/auth');
const { validate, reviewSchema, trackSchema, messageSchema } = require('../middleware/validation');

// Public endpoints
router.get('/', getBusinesses);
router.get('/trending', getTrending);
router.get('/top-by-category', getTopByCategory);

// Business detail (optional auth to personalize 'is_favourited' & user lead tracking)
router.get('/:id', authenticateToken(true), getBusinessById);

// Reviews
router.get('/:id/reviews', getBusinessReviews);
router.post('/:id/reviews', authenticateToken(false), validate(reviewSchema), createReview);

// Tracking & messaging
router.post('/:id/track', authenticateToken(true), validate(trackSchema), trackLead);
router.post('/:id/message', authenticateToken(true), validate(messageSchema), sendMessage);

module.exports = router;
