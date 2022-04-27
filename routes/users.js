const router = require('express').Router();
const usersController = require('../app/controllers/UsersController');
const authMiddleware = require('../middleware/auth');

router.get('/account', authMiddleware.verifyUserToken, usersController.getUserData);
router.post('/account', usersController.submitUserData);
router.put('/account', authMiddleware.verifyUserToken, usersController.updateUserData);
router.get('/reviews', authMiddleware.verifyUserToken, usersController.getUserReviews);
router.put('/wishlist/:productId', authMiddleware.verifyUserToken, usersController.addToWishlist);
router.put('/address/:addressId', authMiddleware.verifyUserToken, usersController.updateAddress);

module.exports = router;