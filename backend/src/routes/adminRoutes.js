const express = require('express');
const router = express.Router();

const {
  getAdminBusinesses,
  approveBusiness,
  rejectBusiness,
  toggleVerifyBusiness,
  getAdminStats,
  getAdminUsers
} = require('../controllers/adminController');

const { authenticateToken, requireRole } = require('../middleware/auth');

// All admin routes require admin role
router.use(authenticateToken(false));
router.use(requireRole('admin'));

router.get('/businesses', getAdminBusinesses);
router.patch('/businesses/:id/approve', approveBusiness);
router.patch('/businesses/:id/reject', rejectBusiness);
router.patch('/businesses/:id/verify', toggleVerifyBusiness);
router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);

module.exports = router;
