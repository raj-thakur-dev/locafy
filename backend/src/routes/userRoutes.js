const express = require('express');
const router = express.Router();

const { getFavourites, addFavourite, removeFavourite } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken(false));

router.get('/favourites', getFavourites);
router.post('/favourites/:businessId', addFavourite);
router.delete('/favourites/:businessId', removeFavourite);

module.exports = router;
