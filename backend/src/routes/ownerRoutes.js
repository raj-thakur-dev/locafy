const express = require('express');
const router = express.Router();

const {
  getOwnerBusinesses,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  uploadBusinessImage,
  getBusinessAnalytics,
  getOwnerMessages,
  markMessageRead
} = require('../controllers/ownerController');

const { authenticateToken, requireRole } = require('../middleware/auth');
const { handleUpload } = require('../middleware/upload');
const { validate, businessCreateSchema } = require('../middleware/validation');

// All owner routes require authenticated business owner or admin
router.use(authenticateToken(false));
router.use(requireRole('business', 'admin'));

router.get('/businesses', getOwnerBusinesses);
router.post('/businesses', validate(businessCreateSchema), createBusiness);
router.put('/businesses/:id', updateBusiness);
router.delete('/businesses/:id', deleteBusiness);
router.post('/businesses/:id/images', handleUpload, uploadBusinessImage);
router.get('/businesses/:id/analytics', getBusinessAnalytics);

router.get('/messages', getOwnerMessages);
router.patch('/messages/:id/read', markMessageRead);

module.exports = router;
